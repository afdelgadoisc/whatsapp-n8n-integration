// index.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

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
      "--disable-gpu"
    ]
  }
});

client.on("qr", (qr) => {
  console.log("[QR RECEIVED]");
  qrcode.generate(qr, { small: true });
});
client.on("authenticated", () => console.log("[AUTHENTICATED]"));
client.on("auth_failure", (msg) => console.error("[AUTH FAILURE]", msg));
client.on("disconnected", (reason) => console.log("[DISCONNECTED]", reason));

client.on("ready", () => {
  console.log("[CLIENT IS READY]");
  // NOTE: we can already attach message handler here
  client.on("message", handleMessageSafely);
});

/**
 * Detects the Puppeteer Page object on the running client instance.
 * Depending on Whatsapp-Web.js version, it might be under:
 *   - client.page
 *   - client.pupPage       (in some v2.x builds)
 *   - client.puppeteer.page
 */
function getPuppeteerPage(client) {
  if (client.page) return client.page;                    // some versions expose directly
  if (client.pupPage) return client.pupPage;              // other versions call it pupPage
  if (client.puppeteer && client.puppeteer.page) {
    return client.puppeteer.page;                         // classic “puppeteer.page”
  }
  return null;
}

/**
 * Evaluates inside the browser: “Is window.WWebJS defined?”
 */
async function wwebjsReady(client) {
  const page = getPuppeteerPage(client);
  if (!page) return false;

  try {
    return await page.evaluate(() => {
      return typeof window.WWebJS !== "undefined";
    });
  } catch (e) {
    // If evaluate throws (e.g. page isn’t loaded yet), assume not ready
    return false;
  }
}

// A wrapper around the real message handler that waits for WWebJS
async function handleMessageSafely(message) {
  if (!message.from || !message.body) {
    console.warn("[WARN] Missing from/body, skipping.");
    return;
  }

  console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

  // Poll for WWebJS availability (max 20 tries × 250ms = 5 seconds)
  let tries = 0;
  const maxTries = 20;
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
      `[ERROR] window.WWebJS never became available after ${maxTries * delayMs}ms. Skipping reply.`
    );
    return;
  }

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

client.initialize();