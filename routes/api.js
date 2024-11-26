const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const session = require("express-session");

const app = express();
const router = express.Router();

const userFilePath = path.join(__dirname, "../database/user-account.json");
// Middleware untuk memastikan file database ada
const ensureFileExists = async (filePath, defaultData) => {
  try {
    await fs.access(filePath);
  } catch (error) {
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), "utf8");
  }
};

// Middleware untuk memeriksa autentikasi
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isLoggedIn && req.session.userId) {
    return next();
  }
  res.status(401).send("Unauthorized: Silakan login.");
};

// Konfigurasi session
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Ubah ke true jika menggunakan HTTPS
  })
);

// Middleware body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fungsi untuk membaca data dari file JSON
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error.message);
    throw new Error("Failed to read file");
  }
};

// Fungsi untuk menulis data ke file JSON
const writeFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing file at ${filePath}:`, error.message);
    throw new Error("Failed to write file");
  }
};

// Fungsi untuk memastikan data pengguna valid
const ensureValidUserData = async (filePath) => {
  const users = await readFile(filePath);
  let isUpdated = false;

  Object.keys(users).forEach((userId) => {
    if (!Array.isArray(users[userId].numbers)) {
      users[userId].numbers = [];
      isUpdated = true;
    }
  });

  if (isUpdated) {
    await writeFile(filePath, users);
  }
};

// Panggil fungsi ini sebelum aplikasi mulai menerima request
ensureValidUserData(userFilePath).catch(console.error);

// Endpoint login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await readFile(userFilePath);
    const user = Object.values(users).find((u) => u.email === email);

    if (user && user.password === password) {
      req.session.isLoggedIn = true;
      req.session.userId = Object.keys(users).find((id) => users[id] === user);
      res.redirect("/dashboard");
    } else {
      res.status(403).send("Email atau password salah, akses ditolak.");
    }
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).send("Internal server error.");
  }
});

// Endpoint signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password harus diisi." });
  }

  try {
    const users = await readFile(userFilePath);

    if (Object.values(users).some((user) => user.email === email)) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    const newUserId = `user${Object.keys(users).length + 1}`;
    users[newUserId] = { email, password, numbers: [] };

    await writeFile(userFilePath, users);
    res.status(201).json({ message: "Pendaftaran berhasil.", userId: newUserId });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Endpoint tambah nomor
router.post("/add", isAuthenticated, async (req, res) => {
  const { nomor } = req.body;
  const userId = req.session.userId;

  try {
    if (!nomor) {
      return res.status(400).send("Nomor harus diisi.");
    }

    const users = await readFile(userFilePath);
    const user = users[userId];

    if (!user) {
      return res.status(404).send("User tidak ditemukan.");
    }

    // Validasi jika `numbers` tidak ada atau bukan array
    if (!Array.isArray(user.numbers)) {
      user.numbers = [];
    }

    // Cek duplikasi nomor
    if (user.numbers.includes(nomor)) {
      return res.status(400).send("Nomor sudah ada.");
    }

    user.numbers.push(nomor);
    await writeFile(userFilePath, users);
    res.send(`Nomor ${nomor} berhasil ditambahkan.`);
  } catch (error) {
    console.error("Error saat menambahkan nomor:", error.message);
    res.status(500).send("Gagal menambahkan nomor.");
  }
});

// Endpoint hapus nomor
router.post("/del", isAuthenticated, async (req, res) => {
  const { nomor } = req.body;
  const userId = req.session.userId;

  try {
    if (!nomor) {
      return res.status(400).send("Nomor harus diisi.");
    }

    const users = await readFile(userFilePath);
    const user = users[userId];

    if (!user) {
      return res.status(404).send("User tidak ditemukan.");
    }

    // Validasi jika `numbers` tidak ada atau bukan array
    if (!Array.isArray(user.numbers)) {
      user.numbers = [];
    }

    const index = user.numbers.indexOf(nomor);
    if (index === -1) {
      return res.status(404).send("Nomor tidak ditemukan.");
    }

    user.numbers.splice(index, 1);
    await writeFile(userFilePath, users);
    res.send(`Nomor ${nomor} berhasil dihapus.`);
  } catch (error) {
    console.error("Error saat menghapus nomor:", error.message);
    res.status(500).send("Gagal menghapus nomor.");
  }
});

// Endpoint list nomor
router.get("/list", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const users = await readFile(userFilePath);
    const user = users[userId];

    if (!user) {
      return res.status(404).send("User tidak ditemukan.");
    }

    const numbers = user.numbers || [];
    res.json({ numbers });
  } catch (error) {
    console.error("Error saat membaca data nomor:", error.message);
    res.status(500).json({ message: "Gagal membaca data." });
  }
});

module.exports = router;
