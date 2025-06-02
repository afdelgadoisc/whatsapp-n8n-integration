// index.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

/**
 * Detects the Puppeteer Page object on the running client instance.
 * Depending on whatsapp-web.js version, it might be under:
 *   - client.page
 *   - client.pupPage       (in some v2.x builds)
 *   - client.puppeteer.page
 */
function getPuppeteerPage(client) {
  if (client.page) return client.page;
  if (client.pupPage) return client.pupPage;
  if (client.puppeteer && client.puppeteer.page) {
    return client.puppeteer.page;
  }
  return null;
}

/**
 * Evaluates inside the browser:
 *   “Is window.WWebJS.sendMessage defined (and therefore ready)?”
 * We only return true once both:
 *   1. window.WWebJS exists, and
 *   2. window.WWebJS.sendMessage is a function.
 */
async function wwebjsReady(client) {
  const page = getPuppeteerPage(client);
  if (!page) return false;

  try {
    return await page.evaluate(() => {
      return (
        typeof window.WWebJS !== "undefined" &&
        typeof window.WWebJS.sendMessage === "function"
      );
    });
  } catch (e) {
    return false;
  }
}

// Create the WhatsApp‐Web.js client
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "bot" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

// === Standard event handlers for QR + auth ===

client.on("qr", (qr) => {
  console.log("[QR RECEIVED]");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => console.log("[AUTHENTICATED]"));
client.on("auth_failure", (msg) => console.error("[AUTH FAILURE]", msg));
client.on("disconnected", (reason) => console.log("[DISCONNECTED]", reason));

// === When the client is “ready,” set up the message listener ===

client.on("ready", () => {
  console.log("[CLIENT IS READY]");
  // Attach the message handler now; it will wait internally before replying
  client.on("message", handleMessageSafely);
});

async function handleMessageSafely(message) {
  if (!message.from || !message.body) {
    console.warn("[WARN] Missing from/body, skipping.");
    return;
  }

  console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

  // Poll up to ~5 seconds for sendMessage to show up
  let tries = 0;
  const maxTries = 20;   // 20 × 250ms = 5000ms total
  const delayMs = 250;
  let ready = false;

  while (tries < maxTries) {
    ready = await wwebjsReady(client);
    if (ready) break;
    await new Promise((r) => setTimeout(r, delayMs));
    tries++;
  }

  if (!ready) {
    console.error(
      `[ERROR] window.WWebJS.sendMessage never became available after ${
        maxTries * delayMs
      }ms. Skipping reply.`
    );
    return;
  }

  // ───────────── DIAGNOSTIC LOG HERE ─────────────
  // Before we actually call reply(), grab some info from the page:
  try {
    const page = getPuppeteerPage(client);
    if (page) {
      const info = await page.evaluate(() => {
        const w = window.WWebJS || {};
        return {
          hasWWebJS: typeof window.WWebJS !== "undefined",
          sendMessageType: typeof window.WWebJS.sendMessage,
          wwebKeys: Object.keys(window.WWebJS || {}),
          // If sendMessage exists, is it really a function?
          sendMessageIsFunc: typeof window.WWebJS.sendMessage === "function"
        };
      });
      console.log("[BROWSER CONTEXT] WWebJS check →", info);
    } else {
      console.log("[BROWSER CONTEXT] Could not find a Puppeteer Page object.");
    }
  } catch (diagErr) {
    console.error("[DIAGNOSTIC ERROR] Could not evaluate in page:", diagErr);
  }
  // ───────────────────────────────────────────────────

  // Insert a longer pause (1 s instead of 300 ms)
  await new Promise((r) => setTimeout(r, 1000));

  // Now call reply()
  if (message.body.trim().toLowerCase() === "hi") {
    console.log(`[REPLYING] to ${message.from} → "Hello!"`);
    try {
      await message.reply("Hello!");
      console.log("[REPLIED] Success.");
    } catch (e) {
      console.error("[ERROR sending reply]", e);
    }
  }
}
// Start Puppeteer + WhatsApp-Web.js
client.initialize();
