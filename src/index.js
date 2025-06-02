const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Read from ENV or fallback
const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || './baileys-auth.json';

const { state, saveState } = useSingleFileAuthState(AUTH_FILE_PATH);

async function startWhatsApp() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Scan this QR with your WhatsApp phone app.');
    }
    if (connection === 'close') {
      const reason = (lastDisconnect.error || {}).output?.statusCode;
      console.log('Connection closed, reason:', reason);
      if (reason !== DisconnectReason.loggedOut) {
        startWhatsApp();
      } else {
        console.log('Logged out. Delete baileys-auth.json to re-authenticate manually.');
      }
    }
    if (connection === 'open') {
      console.log('✅ connection opened, ready to send/receive messages.');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      for (let msg of messages) {
        if (!msg.key.fromMe && msg.message) {
          const incomingText = msg.message.conversation || '';
          const from = msg.key.remoteJid;
          console.log(`Received from ${from}: ${incomingText}`);
          await sock.sendMessage(from, { text: 'Echo: ' + incomingText });
        }
      }
    }
  });
}

function ensureAuthFile() {
  const dir = path.dirname(AUTH_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
ensureAuthFile();
startWhatsApp();
