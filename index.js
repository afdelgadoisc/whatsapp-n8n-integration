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

/**
 * A wrapper around the real message handler that waits for WWebJS.sendMessage
 * and then inserts a small extra delay before actually sending.
 */
async function handleMessageSafely(message) {
  // 1) Skip if chat ID or text is missing
  if (!message.from || !message.body) {
    console.warn("[WARN] Missing from/body, skipping.");
    return;
  }

  console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

  // 2) Poll for up to ~5 seconds (20 tries × 250ms) waiting for sendMessage
  let tries = 0;
  const maxTries = 20; // 20 × 250ms = 5000ms total
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

  // 3) EXTRA PAUSE: wait an additional 300ms to ensure internals are fully ready
  await new Promise((r) => setTimeout(r, 300));

  // 4) Now that sendMessage is definitely ready, we can safely reply:
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
