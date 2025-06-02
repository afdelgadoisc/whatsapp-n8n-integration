// 1) Load the entire Baileys module as one object
const baileys = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// 2) Extract the default export (makeWASocket) and the named exports
const makeWASocket = baileys.default;                         // ← this was missing
const { useMultiFileAuthState, DisconnectReason } = baileys;  // named exports

// 3) Read where to store your multi-file auth state from ENV
//    (set this in docker-compose.yml as AUTH_STATE_DIR=/usr/src/app/baileys-data/auth)
const AUTH_STATE_DIR = process.env.AUTH_STATE_DIR || './baileys-data/auth';

async function startWhatsApp() {
  // 4) Ensure the auth directory exists
  if (!fs.existsSync(AUTH_STATE_DIR)) {
    fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  }

  // 5) Call the multi-file auth hook (returns { state, saveCreds })
  //    - state: in-memory creds loaded from individual JSON files under AUTH_STATE_DIR
  //    - saveCreds: write back any updates (keys, tokens) into those files
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_STATE_DIR);

  // 6) Create a new WhatsApp socket using the "default" export
  //    (printQRInTerminal will show a QR code in your container’s logs)
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    // (optional) If you want to lock to a specific WA-Web version, uncomment:
    // version: [2, 2312, 10]
  });

  // 7) Whenever Baileys updates credentials, persist them to disk
  sock.ev.on('creds.update', saveCreds);

  // 8) Handle connection updates (open, close, QR)
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 8a) If you need to scan a new QR, this block will fire
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('📱 Scan this QR with your WhatsApp phone app.');
    }

    // 8b) If the connection closes, inspect the reason
    if (connection === 'close') {
      const statusCode = lastDisconnect.error?.output?.statusCode;
      console.log('❌ Connection closed, statusCode:', statusCode);

      // If it wasn’t a “logged out” event, try reconnecting after 5s
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnecting in 5 seconds…');
        setTimeout(startWhatsApp, 5000);
      } else {
        console.log('⏹ You are logged out. Delete the auth folder to re-auth.');
      }
    }

    // 8c) When the connection opens successfully
    if (connection === 'open') {
      console.log('✅ Connection opened, ready to send/receive messages.');
    }
  });

  // 9) Example: echo any incoming “notify” messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (const msg of messages) {
        if (!msg.key.fromMe && msg.message) {
          const text = msg.message.conversation || '';
          const from = msg.key.remoteJid;
          console.log(`📥 Received from ${from}: ${text}`);
          await sock.sendMessage(from, { text: 'Echo: ' + text });
        }
      }
    }
  });
}

// 10) Kick everything off
startWhatsApp().catch((err) => {
  console.error('⚠️ Failed to start WhatsApp:', err);
  process.exit(1);
});
