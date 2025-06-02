// src/index.js

const baileys = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Pull out the named exports we need:
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = baileys;

// Read the auth-directory from environment (set by docker-compose)
const AUTH_STATE_DIR = process.env.AUTH_STATE_DIR || './baileys-data/auth';

async function startWhatsApp() {
  // 1. Ensure the auth directory exists
  if (!fs.existsSync(AUTH_STATE_DIR)) {
    fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  }

  // 2. Call useMultiFileAuthState, which returns { state, saveCreds }:
  //    - state: the in-memory credentials loaded from files under AUTH_STATE_DIR
  //    - saveCreds: a function to write back any changes into those files
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_STATE_DIR);

  // 3. Create the socket
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    // (optional) force a specific WA-Web version if needed:
    // version: [2, 2312, 10]
  });

  // 4. Whenever Baileys updates credentials, write them to individual files
  sock.ev.on('creds.update', saveCreds);

  // 5. Listen for connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Print QR in terminal (so we can scan from Docker logs)
      qrcode.generate(qr, { small: true });
      console.log('📱 Scan this QR with your WhatsApp phone app.');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect.error?.output?.statusCode;
      console.log('❌ Connection closed, statusCode:', statusCode);

      // If it wasn’t a “logged out” event, try reconnecting after 5s
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnecting in 5s...');
        setTimeout(startWhatsApp, 5000);
      } else {
        console.log('⏹ You are logged out. Delete the auth folder to re-generate QR.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Connection opened, ready to send/receive messages.');
    }
  });

  // 6. Example: echo any incoming “notify” messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (let msg of messages) {
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

// Kick off the connection:
startWhatsApp().catch((err) => {
  console.error('⚠️ Failed to start WhatsApp:', err);
  process.exit(1);
});
