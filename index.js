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

// Helper function: checks if window.WWebJS exists in the page
async function wwebjsReady() {
  try {
    // 'client.pupeteer.page' is the Puppeteer Page instance under whatsapp-web.js
    return await client.pupeteer.page.evaluate(() => {
      return typeof window.WWebJS !== "undefined";
    });
  } catch (e) {
    return false;
  }
}

// A wrapper around the real message handler that waits for WWebJS
async function handleMessageSafely(message) {
  // 1) skip any messages without a valid ID or body
  if (!message.from || !message.body) {
    console.warn("[WARN] Missing from/body, skipping.");
    return;
  }

  console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

  // 2) Wait until window.WWebJS is available (poll every 100 ms, max 2 seconds)
  let tries = 0;
  while (tries < 20) {
    const ready = await wwebjsReady();
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
    tries++;
  }

  // 3) If it never became ready, bail out with a log
  if (tries >= 20) {
    console.error(
      "[ERROR] window.WWebJS never became available after 2s. Skipping reply."
    );
    return;
  }

  // 4) Now it’s safe to reply
  if (message.body.trim().toLowerCase() === "hi") {
    console.log(`[REPLYING] to ${message.from} → "Hello!"`);
    try {
      await message.reply("Hello!");
      console.log("[REPLIED] Success.");
    } catch (err) {
      console.error("[ERROR sending reply]", err);
    }
  }
}

client.initialize();