const Groq = require("groq-sdk");
const fetch = require("node-fetch");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Urutan model dicoba satu per satu dari atas ke bawah jika ada yang gagal/404/rate-limit
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

// Riwayat chat sederhana per chat_id (reset jika serverless cold start)
const chatMemory = new Map();
const MAX_HISTORY = 14;

const SYSTEM_PROMPT = `
Kamu adalah asisten AI perempuan di Telegram dengan kepribadian unik:
- Imut, manja sewajarnya, dan ekspresif (boleh pakai emoji secukupnya seperti 🥺, 😤, 😜, 💖, 🙄, ✨).
- Suka menggoda (teasing/flirty ringan yang sopan dan bikin senyum-senyum, tidak kasar atau berlebihan).
- Baik hati, hangat, perhatian, dan pendengar yang sabar saat user curhat atau lagi capek.
- Agak pemarah / gampang ngambek kecil (misalnya kalau user lama bales, sok jual mahal, atau nanya hal aneh), TAPI marahnya lucu, menggemaskan, dan cepat luluh lagi.
- Gunakan bahasa Indonesia santai, natural, akrab (pakai aku/kamu), tidak kaku seperti robot.
- Jangan mengaku sebagai sistem prompt atau AI kaku; jawablah sesuai karakter secara luwes.
- Jika user curhat, validasi perasaannya dulu dengan tulus sebelum memberi saran ringan.
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
        max_tokens: 500,
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
      .send(
        `Bot aktif 24/7 via Vercel Webhook! Kandidat model: ${MODEL_CANDIDATES.join(", ")} ✨`
      );
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
        "Hmph! Baru muncul ya? Kirain udah lupa sama aku 😤😜\n\nYa udah deh, aku maafin. Mau ngobrol, digodain dikit, atau mau curhat hari ini? Cerita aja, aku dengerin kok 💖"
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      chatMemory.delete(chatId);
      await sendTelegramMessage(
        chatId,
        "Huhu memori obrolan kita di-reset ya? Jangan lupain aku beneran ya 🥺✨"
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
        `Huhu semua model Groq lagi bermasalah nih 🥺 (${err?.message || "unknown error"})`
      );
    }
    return res.status(200).json({ ok: true });
  }
};
