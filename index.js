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

// 1) QR, authenticated, etc., exactly as before:
client.on("qr", (qr) => {
  console.log("[QR RECEIVED]");
  qrcode.generate(qr, { small: true });
});
client.on("authenticated", () => console.log("[AUTHENTICATED]"));
client.on("auth_failure", (msg) => console.error("[AUTH FAILURE]", msg));
client.on("disconnected", (reason) => console.log("[DISCONNECTED]", reason));

// 2) On “ready”, wait 500ms before allowing any message replies:
client.on("ready", () => {
  console.log("[CLIENT IS READY]");
  console.log("→ Waiting 500ms to let WWebJS finish injecting…");

  // Only after 500ms do we allow the bot to process messages.
  setTimeout(() => {
    console.log("→ Now message handler is active.");
    client.on("message", handleMessage);
  }, 500);
});

// 3) Extracted message handler:
async function handleMessage(message) {
  try {
    // Safety check: skip if missing chat ID or text
    if (!message.from || !message.body) {
      console.warn("[WARN] message.from or message.body undefined, skipping.");
      return;
    }

    console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

    if (message.body.trim().toLowerCase() === "hi") {
      console.log(`[REPLYING] to ${message.from} → "Hello!"`);
      await message.reply("Hello!");
      console.log(`[REPLIED] Success.`);
    }

    // …any other commands…
  } catch (err) {
    console.error("[ERROR in message handler]", err);
  }
}

client.initialize();