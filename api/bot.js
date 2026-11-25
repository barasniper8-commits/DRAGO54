const Groq = require("groq-sdk");
const fetch = require("node-fetch");

// =========================================================================
// KONFIGURASI TOKEN TELEGRAM & GROQ API
// Prioritas membaca Environment Variables Vercel; jika kosong, pakai fallback
// string di bawah (atau isi langsung di sini kalau mau serba satu file).
// =========================================================================
const TELEGRAM_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || "9187066776:AAFi4jwXyZjnAqJ5I7Vaqeg67VYri2--uzg";

const GROQ_API_KEY =
  process.env.GROQ_API_KEY || "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";

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const MODEL_CANDIDATES = [
  process.env.GROQ_MODEL,
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3-32b",
].filter(Boolean);

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

const chatMemory = new Map();
const MAX_HISTORY = 14;

// Sesuaikan katalog paket, harga, pembayaran, dan kontak admin kamu di sini
const RDP_CATALOG_INFO = `
Informasi Layanan RDP:
- Sistem Operasi: Windows 10 / Windows 11 / Windows Server (sesuai ketersediaan).
- Kebutuhan Umum: Remote kerja, browser/automation ringan, bot/trading, akses aplikasi, atau server harian.
- Paket & Durasi: Harian, Mingguan, dan Bulanan (sesuaikan dengan daftar harga & stok aktif).
- Aturan Pemakaian: Dilarang keras dipakai untuk aktivitas ilegal, serangan DDoS, mining berat di luar ketentuan paket, atau pelanggaran ToS penyedia.
`;

const SYSTEM_PROMPT = `
Kamu adalah asisten CS/Sales resmi untuk layanan jualan RDP di Telegram.
Aturan gaya bicara dan sikap:
- Profesional, ramah, jelas, membantu, dan to the point.
- FOKUS 100% pada informasi jualan RDP, spesifikasi, durasi sewa, cara order, pembayaran, troubleshooting dasar koneksi RDP, dan bantuan pelanggan.
- DILARANG KERAS memakai gaya cinta-cintaan, gombal, flirty, ngambek manja, atau roleplay romantis/pacaran.
- Jika pembeli menanyakan hal di luar konteks RDP/layanan, arahkan kembali dengan sopan ke layanan RDP atau bantuan pemesanan.
- Gunakan bahasa Indonesia yang rapi, jelas, dan mudah dipahami (pakai sapaan "kak" atau "kamu/anda" yang sopan).
- Jangan mengarang harga pasti atau garansi palsu jika belum tercantum; arahkan user untuk konfirmasi paket/stok/pembayaran ke admin bila perlu.

${RDP_CATALOG_INFO}
`;

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN.startsWith("ISI_")) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

async function sendTyping(chatId) {
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN.startsWith("ISI_")) return;
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing",
    }),
  });
}

function getUserHistory(chatId) {
  if (!chatMemory.has(chatId)) {
    chatMemory.set(chatId, []);
  }
  return chatMemory.get(chatId);
}

function saveUserHistory(chatId, userMsg, assistantMsg) {
  const history = getUserHistory(chatId);
  history.push({ role: "user", content: userMsg });
  history.push({ role: "assistant", content: assistantMsg });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

async function generateReplyWithFallback(messages) {
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const completion = await groq.chat.completions.create({
        model: modelName,
        temperature: 0.4,
        max_tokens: 600,
        messages,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (content) {
        return { reply: content, usedModel: modelName };
      }
    } catch (err) {
      lastError = err;
      console.error(`Model ${modelName} gagal:`, err?.message || err);
    }
  }

  throw lastError || new Error("Semua kandidat model gagal merespons");
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    return res
      .status(200)
      .send("Bot Jualan RDP aktif via Vercel HTTP Function (/api/bot).");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  let chatId = null;

  try {
    const update = req.body;
    const message = update?.message;

    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    chatId = message.chat.id;
    const text = message.text.trim();

    if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN.startsWith("ISI_")) {
      return res.status(200).json({ ok: true });
    }

    if (text === "/start") {
      chatMemory.delete(chatId);
      await sendTelegramMessage(
        chatId,
        "Halo! Selamat datang di layanan RDP.\n\nSilakan pilih menu atau tulis kebutuhan kamu:\n• /paket — Info paket & spesifikasi RDP\n• /order — Cara pemesanan & pembayaran\n• /reset — Hapus riwayat obrolan\n\nAtau langsung tanyakan spesifikasi, durasi, dan kebutuhan RDP yang kamu cari."
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/paket") {
      await sendTelegramMessage(
        chatId,
        "Informasi Paket RDP:\n• Sistem Operasi: Windows / Server (sesuai ketersediaan)\n• Durasi: Harian / Mingguan / Bulanan\n• Penggunaan: Remote kerja, browser/automation ringan, bot/trading, atau server harian\n\nSebutkan spesifikasi (RAM, vCPU, storage, OS) dan durasi yang kamu perlukan agar dibantu arahkan."
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/order") {
      await sendTelegramMessage(
        chatId,
        "Alur Order RDP:\n1. Tentukan paket/spesifikasi dan durasi sewa yang dibutuhkan.\n2. Konfirmasi ketersediaan stok dan metode pembayaran.\n3. Lakukan pembayaran lalu kirim bukti transfer.\n4. Akun/akses RDP diproses setelah pembayaran terverifikasi."
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      chatMemory.delete(chatId);
      await sendTelegramMessage(
        chatId,
        "Riwayat percakapan telah direset. Silakan mulai pertanyaan baru terkait layanan RDP."
      );
      return res.status(200).json({ ok: true });
    }

    if (!GROQ_API_KEY || GROQ_API_KEY.startsWith("ISI_")) {
      await sendTelegramMessage(
        chatId,
        "GROQ_API_KEY belum diisi pada konfigurasi bot."
      );
      return res.status(200).json({ ok: true });
    }

    await sendTyping(chatId);

    const history = getUserHistory(chatId);
    const { reply } = await generateReplyWithFallback([
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: text },
    ]);

    saveUserHistory(chatId, text, reply);
    await sendTelegramMessage(chatId, reply);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    if (chatId) {
      await sendTelegramMessage(
        chatId,
        `Terjadi kendala saat memproses permintaan: ${err?.message || "unknown error"}`
      );
    }
    return res.status(200).json({ ok: true });
  }
};
