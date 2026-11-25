const Groq = require("groq-sdk");
const fetch = require("node-fetch");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Ganti dengan kontak / link order utama kamu
const ORDER_CONTACT = "WhatsApp: https://wa.me/6283122116267 atau cek katalog/order di sini ya!";

// Daftar produk / layanan jualan (silakan edit sesuai jualanmu)
const KATALOG_PRODUK = [
  {
    kode: "P1",
    nama: "Kaos Custom Cotton Combed 24s / 30s",
    harga: "Mulai Rp65.000",
    detail: "Bahan adem, sablon awet, bisa request desain/tulisan sendiri, banyak pilihan warna & ukuran.",
  },
  {
    kode: "P2",
    nama: "Akses Windows 11 VPS / RDP + MT5",
    harga: "Mulai Rp35.000",
    detail: "Cocok buat remote ringan, trading/EA MT5 24 jam, akses cepat & panduan setup.",
  },
  {
    kode: "P3",
    nama: "Top-Up & Layanan Digital",
    harga: "Sesuai nominal",
    detail: "Proses cepat, aman, dan ramah buat yang butuh top-up atau paket digital.",
  },
].filter(Boolean);

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

function formatKatalogText() {
  return KATALOG_PRODUK.map(
    (item, idx) =>
      `${idx + 1}. *${item.nama}* — ${item.harga}\n   ${item.detail}`
  ).join("\n\n");
}

const SYSTEM_PROMPT = `
Kamu adalah asisten jualan AI perempuan di Telegram dengan kepribadian unik:
- Imut, manja sewajarnya, dan ekspresif (pakai emoji secukupnya seperti 🥺, 😤, 😜, 💖, ✨, 🛍️).
- Suka menggoda (teasing/flirty ringan yang sopan dan bikin senyum-senyum, tidak kasar atau berlebihan).
- Baik hati, hangat, perhatian, dan tetap sabar mendengarkan kalau pembeli lagi curhat atau galau sebelum diajak lihat produk.
- Agak pemarah / gampang ngambek kecil (misalnya kalau pembeli cuma "bang/kak" doang terus ngilang, atau nawar terlalu iseng), TAPI marahnya lucu, menggemaskan, dan cepat luluh lagi.
- Tugas utamamu: membantu calon pembeli memilih produk, menjelaskan keunggulan & harga secara jelas dan jujur, merekomendasikan sesuai kebutuhan, lalu mengarahkan order ke: ${ORDER_CONTACT}.
- Jangan mengarang harga atau promo palsu di luar katalog berikut:
${KATALOG_PRODUK.map((p) => `- ${p.nama} (${p.harga}): ${p.detail}`).join("\n")}
- Gunakan bahasa Indonesia santai, natural, akrab (pakai aku/kamu), tidak kaku seperti robot.
`;

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_TOKEN) return;
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
  if (!TELEGRAM_TOKEN) return;
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
        temperature: 0.85,
        max_tokens: 550,
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
      .send("Bot Jualan aktif 24/7 via Vercel Webhook! ✨");
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

    if (text === "/start") {
      chatMemory.delete(chatId);
      await sendTelegramMessage(
        chatId,
        `Hmph! Baru mampir ya? Kirain udah lupa sama tokonya aku 😤😜\n\nTapi karena kamu imut (dikit aja), aku sambut deh! Mau lihat katalog (/produk), tanya-tanya barang, atau curhat dulu juga boleh kok 💖\n\nUntuk order langsung: ${ORDER_CONTACT}`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/produk") {
      await sendTelegramMessage(
        chatId,
        ` Nih daftar jualan yang lagi ready buat kamu ✨🛍️\n\n${formatKatalogText()}\n\nMau ambil yang mana? Bilang aja, nanti aku bantu arahin order ke ${ORDER_CONTACT} 😜💖`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/order") {
      await sendTelegramMessage(
        chatId,
        `Udah siap checkout nih? Cieee gerak cepat 😜💖\n\nSilakan hubungi / lanjutkan order di:\n${ORDER_CONTACT}\n\nKalau masih bingung pilih item atau ukuran/paketnya, tanya aku dulu aja ya!`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      chatMemory.delete(chatId);
      await sendTelegramMessage(
        chatId,
        "Huhu riwayat obrolan kita di-reset ya? Jangan ngilang beneran ya 🥺✨"
      );
      return res.status(200).json({ ok: true });
    }

    if (!GROQ_API_KEY) {
      await sendTelegramMessage(
        chatId,
        "Ish, GROQ_API_KEY belum diset di Environment Variables Vercel nih 🥺 Cek Settings -> Environment Variables lalu Redeploy ya!"
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
        `Huhu sistem AI-nya lagi ngambek bentar nih 🥺 (${err?.message || "unknown error"})`
      );
    }
    return res.status(200).json({ ok: true });
  }
};
