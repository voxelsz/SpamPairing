const { Worker } = require('worker_threads');
const fs = require("fs");

// Fungsi untuk menjalankan worker
function startWorker(file, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(file, { workerData: data });

    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}

// Membaca data dari file JSON
fs.readFile('./database/user-account.json', 'utf8', async (err, data) => {
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
        // Menjalankan worker untuk setiap nomor
        for (const nomor of userData.numbers) {
          await startWorker('./spam.js', { nomor });
        }
      } else {
        console.log(`[INFO] Tidak ada nomor untuk user ${user}`);
      }
    }
  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
});
