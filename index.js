// index.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "bot",
    dataPath: "/app/session" // point to our writable session folder
  }),
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

  // Now you can handle messages immediately
  client.on("message", async (message) => {
    console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);
    if (message.body.toLowerCase().trim() === "hi") {
      // This will no longer throw a “length of undefined” error
      await message.reply("Hello!");
      console.log("[REPLIED] ✅");
    }
  });
});

client.initialize();
