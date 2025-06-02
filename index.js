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

  // 1) Poll for sendMessage up to ~5 seconds
  let tries = 0,
    maxTries = 20,
    delayMs = 250;
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

  // 2) EXTRA PAUSE: wait a full second for WAPI internals
  await new Promise((r) => setTimeout(r, 1000));

  // 3) DEBUG: log arguments before sending
  console.log("[DEBUG] About to send:", {
    chatId: message.from,
    text: "Hello!",
    chatIdType: typeof message.from,
    textType: typeof "Hello!",
    textLength: "Hello!".length,
  });

  // 4) Now finally send
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
