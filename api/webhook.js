const Groq = require("groq-sdk");
const fetch = require("node-fetch");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

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

module.exports = async (req, res) => {
  if (req.method === "GET") {
    return res
      .status(200)
      .send(`Bot aktif 24/7 via Vercel Webhook! Model: ${GROQ_MODEL} ✨`);
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
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.85,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: text },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Ish, aku lagi nge-blank dikit nih 🥺 Coba ulangi lagi dong!";

    saveUserHistory(chatId, text, reply);
    await sendTelegramMessage(chatId, reply);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    if (chatId) {
      await sendTelegramMessage(
        chatId,
        `Huhu ada error pas manggil Groq (${GROQ_MODEL}): ${err?.message || "unknown error"} 🥺`
      );
    }
    return res.status(200).json({ ok: true });
  }
};
