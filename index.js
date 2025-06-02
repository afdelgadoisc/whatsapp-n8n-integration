const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Usamos LocalAuth para que el token de sesión se guarde en ./session-data
const client = new Client({
  puppeteer: {
    headless: true,
    executablePath: '/usr/bin/chromium-browser', // o la ruta a Chrome en tu sistema
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  },
  authStrategy: new LocalAuth({ clientId: "mi-bot" })
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Escanea este QR con WhatsApp para iniciar sesión.');
});

client.on('ready', () => {
  console.log('✅ Cliente listo!');
});

client.on('message', msg => {
  console.log(`Mensaje de ${msg.from}: ${msg.body}`);
  if (msg.body.toLowerCase() === 'hola') {
    msg.reply('¡Hola! ¿En qué puedo ayudarte?');
  }
});

client.initialize();
