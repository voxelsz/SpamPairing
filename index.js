const express = require('express');
const { spam } = require('./spam');
const app = express();

const activeSpams = new Map();

app.get('/api/start', async (req, res) => {
    const nomor = req.query.nomor;

    if (!nomor) {
        return res.status(400).json({
            status: { status: "gagal", code: 400 },
            message: { pesan: "Nomor tidak disertakan dalam query." }
        });
    }

    if (activeSpams.has(nomor)) {
        return res.json({
            status: { status: "sukses", code: 200 },
            message: { pesan: `Proses ping untuk nomor ${nomor} sudah berjalan.` }
        });
    }

    try {
        const intervalId = await spam(nomor);
        activeSpams.set(nomor, intervalId);

        res.json({
            status: { status: "sukses", code: 200 },
            message: { pesan: `Proses ping untuk nomor ${nomor} sedang berjalan.` }
        });
    } catch (err) {
        console.error(`Terjadi kesalahan saat memulai ping untuk nomor ${nomor}:`, err);
        res.status(500).json({
            status: { status: "gagal", code: 500 },
            message: { pesan: "Gagal memulai proses ping." }
        });
    }
});

app.get('/api/stop', (req, res) => {
    const nomor = req.query.nomor;

    if (!nomor) {
        return res.status(400).json({
            status: { status: "gagal", code: 400 },
            message: { pesan: "Nomor tidak disertakan dalam query." }
        });
    }

    const intervalId = activeSpams.get(nomor);

    if (!intervalId) {
        return res.json({
            status: { status: "sukses", code: 200 },
            message: { pesan: `Proses ping untuk nomor ${nomor} tidak ditemukan.` }
        });
    }

    clearInterval(intervalId);
    activeSpams.delete(nomor);

    res.json({
        status: { status: "sukses", code: 200 },
        message: { pesan: `Proses ping untuk nomor ${nomor} telah dihentikan.` }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});