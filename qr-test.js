// qr-test.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('📲 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp is ready!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  console.log('❌ Client was logged out:', reason);
});

client.initialize();
