const { Telegraf, Markup } = require('telegraf');
const zlib = require('zlib');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ==========================================
// GENERATOR GAMBAR PNG BLOK LANDSCAPE (MURNI KODE)
// Ukuran: 800 x 360 px (Landscape) dengan 3 Blok Visual
// ==========================================
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

function buatBannerBlokPNG({ levelBaterai = 85 }) {
  const width = 800;
  const height = 360;
  const raw = Buffer.alloc((width * 3 + 1) * height);

  const setPx = (x, y, r, g, b) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * (width * 3 + 1) + 1 + x * 3;
    raw[idx] = r;
    raw[idx + 1] = g;
    raw[idx + 2] = b;
  };

  const fillRect = (x0, y0, w, h, r, g, b) => {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        setPx(x, y, r, g, b);
      }
    }
  };

  const drawBorder = (x0, y0, w, h, t, r, g, b) => {
    fillRect(x0, y0, w, t, r, g, b);
    fillRect(x0, y0 + h - t, w, t, r, g, b);
    fillRect(x0, y0, t, h, r, g, b);
    fillRect(x0 + w - t, y0, t, h, r, g, b);
  };

  // Latar belakang gelap (blok utama)
  fillRect(0, 0, width, height, 15, 20, 32);

  // Blok 1: INFO AKUN (Kiri) - Cyan
  fillRect(30, 50, 230, 260, 24, 34, 52);
  drawBorder(30, 50, 230, 260, 3, 0, 229, 255);
  fillRect(45, 70, 200, 12, 0, 229, 255); // Header bar
  fillRect(45, 100, 150, 8, 148, 163, 184);
  fillRect(45, 120, 180, 8, 148, 163, 184);

  // Blok 2: NAMA & PROFIL (Tengah) - Magenta/Ungu
  fillRect(285, 50, 230, 260, 24, 34, 52);
  drawBorder(285, 50, 230, 260, 3, 236, 72, 153);
  fillRect(300, 70, 200, 12, 236, 72, 153); // Header bar
  fillRect(300, 100, 165, 8, 148, 163, 184);
  fillRect(300, 120, 130, 8, 148, 163, 184);

  // Blok 3: BATERAI / POWER (Kanan) - Hijau/Kuning sesuai level
  fillRect(540, 50, 230, 260, 24, 34, 52);
  const batColor = levelBaterai >= 50 ? [34, 197, 94] : levelBaterai >= 20 ? [250, 204, 21] : [239, 68, 68];
  drawBorder(540, 50, 230, 260, 3, batColor[0], batColor[1], batColor[2]);
  fillRect(555, 70, 200, 12, batColor[0], batColor[1], batColor[2]);

  // Indikator bar baterai di dalam Blok 3
  drawBorder(565, 115, 180, 50, 3, 226, 232, 240);
  fillRect(745, 130, 10, 20, 226, 232, 240); // Kepala baterai
  const barWidth = Math.max(8, Math.round((170 * Math.min(100, Math.max(0, levelBaterai))) / 100));
  fillRect(570, 120, barWidth, 40, batColor[0], batColor[1], batColor[2]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ==========================================
// DATA BLOK KONTEN (INFO AKUN, NAMA, BATERAI, DLL)
// ==========================================
function getBlokData(ctx, baterai = 85) {
  const nama = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'Pengguna';
  const username = ctx.from.username ? `@${ctx.from.username}` : 'Tidak ada username';
  const userId = ctx.from.id;
  const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const blokInfoAkun =
    `🔹 <b>[BLOK 1 • INFO AKUN]</b>\n` +
    `• ID Akun: <code>${userId}</code>\n` +
    `• Username: <code>${username}</code>\n` +
    `• Mode: <code>Vercel Webhook 24/7</code>`;

  const blokNama =
    `🔹 <b>[BLOK 2 • NAMA & PROFIL]</b>\n` +
    `• Nama: <b>${nama}</b>\n` +
    `• Bahasa: <code>${ctx.from.language_code || 'id'}</code>`;

  const blokBaterai =
    `🔹 <b>[BLOK 3 • BATERAI & STATUS]</b>\n` +
    `• Baterai: <b>${baterai}%</b> ${baterai >= 50 ? '🔋' : baterai >= 20 ? '🪫' : '⚠️'}\n` +
    `• Update: <code>${waktu} WIB</code>`;

  const caption = `${blokInfoAkun}\n\n${blokNama}\n\n${blokBaterai}`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('👤 Blok Info Akun', 'fokus_akun'),
      Markup.button.callback('🏷️ Blok Nama', 'fokus_nama'),
      Markup.button.callback('🔋 Blok Baterai', 'fokus_baterai')
    ],
    [
      Markup.button.callback('⚡ Simulasi Baterai -20%', 'sim_kurang'),
      Markup.button.callback('🔌 Charge Baterai 100%', 'sim_charge')
    ],
    [
      Markup.button.callback('📋 Tampilkan Semua Blok', 'semua_blok')
    ]
  ]);

  return { caption, keyboard, blokInfoAkun, blokNama, blokBaterai };
}

// Simpan level baterai simulasi per chatId di memori proses
const stateBaterai = new Map();
const getBaterai = (chatId) => (stateBaterai.has(chatId) ? stateBaterai.get(chatId) : 85);

// ==========================================
// /start -> KIRIM BANNER BLOK PNG + SEMUA BLOK
// ==========================================
bot.start(async (ctx) => {
  const bat = getBaterai(ctx.chat.id);
  const { caption, keyboard } = getBlokData(ctx, bat);
  const imgBuffer = buatBannerBlokPNG({ levelBaterai: bat });

  await ctx.replyWithPhoto(
    { source: imgBuffer, filename: 'blok-panel.png' },
    { caption, parse_mode: 'HTML', ...keyboard }
  );
});

// Fokus ke salah satu blok saja (meng-edit foto & caption di pesan yang sama)
bot.action(['fokus_akun', 'fokus_nama', 'fokus_baterai', 'semua_blok'], async (ctx) => {
  await ctx.answerCbQuery();
  const bat = getBaterai(ctx.chat.id);
  const data = getBlokData(ctx, bat);
  const imgBuffer = buatBannerBlokPNG({ levelBaterai: bat });

  let captionBaru = data.caption;
  if (ctx.match[0] === 'fokus_akun') captionBaru = data.blokInfoAkun;
  if (ctx.match[0] === 'fokus_nama') captionBaru = data.blokNama;
  if (ctx.match[0] === 'fokus_baterai') captionBaru = data.blokBaterai;

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: { source: imgBuffer, filename: 'blok-panel.png' },
      caption: captionBaru,
      parse_mode: 'HTML'
    },
    data.keyboard
  );
});

// Simulasi ubah level baterai (memperbarui bar baterai di gambar PNG & teks)
bot.action(['sim_kurang', 'sim_charge'], async (ctx) => {
  await ctx.answerCbQuery();
  const current = getBaterai(ctx.chat.id);
  const nextBat = ctx.match[0] === 'sim_charge' ? 100 : Math.max(5, current - 20);
  stateBaterai.set(ctx.chat.id, nextBat);

  const { caption, keyboard } = getBlokData(ctx, nextBat);
  const imgBuffer = buatBannerBlokPNG({ levelBaterai: nextBat });

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: { source: imgBuffer, filename: 'blok-panel.png' },
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// EXPORT WEBHOOK UNTUK VERCEL
// ==========================================
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } else {
      res.status(200).send('Bot Blok Dinamis Aktif 24 Jam di Vercel!');
    }
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Internal Server Error');
  }
};
