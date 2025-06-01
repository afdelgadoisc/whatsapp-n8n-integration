// index.js
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// 1) Create a client that uses LocalAuth. 
//    `clientId: "bot"` means sessions live in `.wwebjs_auth/client.bot/`
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "bot" }),
  puppeteer: {
    headless: true,                 // run in headless mode
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

// 2) When the loading screen is shown in WhatsApp Web
client.on("loading_screen", (percent, message) => {
  console.log(`[LOADING_SCREEN] ${percent}% - ${message}`);
});

// 3) When the QR is generated, print it in the terminal
client.on("qr", (qr) => {
  console.log("[QR RECEIVED]");
  qrcode.generate(qr, { small: true });
});

// 4) When whatsapp-web.js has authenticated successfully
client.on("authenticated", () => {
  console.log("[AUTHENTICATED]");
});

// 5) If authentication fails (e.g., invalid session), you'll get this event
client.on("auth_failure", (message) => {
  console.error("[AUTH FAILURE]", message);
  // If it fails, you might delete `./session` and restart the container
});

// 6) Right before the client is ready to send/receive messages
client.on("ready", () => {
  console.log("[CLIENT IS READY]");
  // Only now do we start listening for `message` events
});

// 7) A catch-all event for when the page crashes or Puppeteer context is lost
client.on("disconnected", (reason) => {
  console.log("[DISCONNECTED]", reason);
});

// 8) The “message” event will only fire once “ready” has been emitted
client.on("message", async (message) => {
  try {
    // Log everything we received
    console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

    // ➔ SAFETY CHECK: ensure both from & body are defined
    if (!message.from || !message.body) {
      console.warn("[WARN] message.from or message.body was undefined");
      return;
    }

    // Sample logic: if someone writes “hi” (case-insensitive), reply “Hello!”
    if (message.body.trim().toLowerCase() === "hi") {
      console.log(`[REPLYING] to ${message.from} → "Hello!"`);
      await message.reply("Hello!");
      console.log(`[REPLIED] ✅`);
    }

    // You can add more logic here (e.g. check `message.body.startsWith('!echo ')`, etc.)

  } catch (err) {
    // If sendMessage fails, log the full error stack so you know exactly why
    console.error("[ERROR in message handler]", err);
  }
});

// 9) Finally, start the client
client.initialize();