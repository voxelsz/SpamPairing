const { spawn } = require("child_process");
const path = require("path");
require("./server")

function start() {
  const args = [path.join(__dirname, "spam.js"), ...process.argv.slice(2)];
  let processInterval;

  const p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });

  p.on("message", (data) => {
    if (data === "reset") {
      clearInterval(processInterval);
      p.kill();
    }
  });

  p.on("exit", (code) => {
    clearInterval(processInterval);
    if (code === 130) {
      console.log("[INFO] Proses dihentikan dengan sinyal SIGINT.");
      process.exit(0); // Keluar dengan status normal
    } else {
      console.log("[INFO] Proses keluar. Memulai ulang...");
      start(); // Restart proses
    }
  });

  processInterval = setInterval(() => {
    p.kill();
  }, 20_000);
}

// Penanganan SIGINT dan SIGTERM
process.on("SIGINT", () => {
  console.log("[INFO] Mendapatkan SIGINT. Menghentikan server...");
  process.exit(0);
  start()
});

process.on("SIGTERM", () => {
  console.log("[INFO] Mendapatkan SIGTERM. Menghentikan server...");
  process.exit(0);
  start()
});

start();
