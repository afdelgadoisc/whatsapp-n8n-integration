// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Use LocalAuth so that Whatsapp-Web.js handles session persistence automatically
const client = new Client({
  authStrategy: new LocalAuth({ clientId: "bot" }),
  puppeteer: {
    // Optimize headless mode
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

// Whenever a QR code is received, display it in terminal
client.on('qr', (qr) => {
  console.log('[QR RECEIVED]');
  qrcode.generate(qr, { small: true });
});

// Once authenticated and ready
client.on('ready', () => {
  console.log('[CLIENT IS READY]');
});

// Sample message handler
client.on('message', async (message) => {
  console.log(`[MSG RECEIVED] ${message.from}: ${message.body}`);

  // Example: reply “Hello!” if someone says “hi”
  if (message.body.toLowerCase() === 'hi') {
    await message.reply('Hello!');
  }
});

client.initialize();
