const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Ganti URL di bawah dengan gambar banner landscape (16:9) yang sudah ada blok visualnya
const BANNER = {
  UTAMA: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
  KATEGORI: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1280&auto=format&fit=crop',
  FITUR: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1280&auto=format&fit=crop',
  INFO: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1280&auto=format&fit=crop'
};

// ==========================================
// 1. MENU UTAMA (/start)
// Blok tombol dipisah per bagian: Blok Kategori & Blok Fitur
// ==========================================
const getMenuUtama = (namaUser) => {
  const caption =
    `⚡ <b>SYSTEM PANEL • 24/7 ONLINE</b>\n` +
    `Halo <b>${namaUser}</b>, pilih blok di bawah untuk membuka menu:`;

  const keyboard = Markup.inlineKeyboard([
    // Blok Tombol Kategori
    [
      Markup.button.callback('📦 Kategori 01', 'kat_01'),
      Markup.button.callback('💎 Kategori 02', 'kat_02'),
      Markup.button.callback('🎯 Kategori 03', 'kat_03')
    ],
    // Blok Tombol Fitur
    [
      Markup.button.callback('⚙️ Fitur Cepat', 'fitur_cepat'),
      Markup.button.callback('📡 Cek Status', 'fitur_status')
    ],
    // Blok Tombol Aksi / Link
    [
      Markup.button.url('💬 Hubungi Admin', 'https://t.me/username_kamu')
    ]
  ]);

  return { caption, keyboard };
};

bot.start(async (ctx) => {
  const nama = ctx.from.first_name || 'User';
  const { caption, keyboard } = getMenuUtama(nama);

  await ctx.replyWithPhoto(BANNER.UTAMA, {
    caption,
    parse_mode: 'HTML',
    ...keyboard
  });
});

// Kembali ke Menu Utama
bot.action('menu_utama', async (ctx) => {
  await ctx.answerCbQuery();
  const nama = ctx.from.first_name || 'User';
  const { caption, keyboard } = getMenuUtama(nama);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.UTAMA,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 2. BLOK KATEGORI (01, 02, 03)
// ==========================================
bot.action(['kat_01', 'kat_02', 'kat_03'], async (ctx) => {
  await ctx.answerCbQuery();
  const kode = ctx.match[0];

  const dataKategori = {
    kat_01: {
      judul: 'KATEGORI 01',
      sub: 'Layanan & Paket Utama',
      aksiA: ['🔹 Paket A', 'detail_a'],
      aksiB: ['🔸 Paket B', 'detail_b']
    },
    kat_02: {
      judul: 'KATEGORI 02',
      sub: 'Akses & Modul Khusus',
      aksiA: ['🚀 Modul 1', 'detail_m1'],
      aksiB: ['🔥 Modul 2', 'detail_m2']
    },
    kat_03: {
      judul: 'KATEGORI 03',
      sub: 'Layanan Tambahan & Custom',
      aksiA: ['🧩 Custom Order', 'detail_custom'],
      aksiB: ['📌 Panduan', 'detail_panduan']
    }
  };

  const item = dataKategori[kode];
  const caption =
    `📂 <b>${item.judul}</b>\n` +
    `<i>${item.sub}</i>\n\n` +
    `Silakan pilih tombol di bawah:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(item.aksiA[0], item.aksiA[1]),
      Markup.button.callback(item.aksiB[0], item.aksiB[1])
    ],
    [
      Markup.button.callback('⬅️ Kembali', 'menu_utama')
    ]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.KATEGORI,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 3. BLOK FITUR
// ==========================================
bot.action('fitur_cepat', async (ctx) => {
  await ctx.answerCbQuery();
  const caption =
    `⚙️ <b>PANEL FITUR</b>\n` +
    `Pilih fitur yang ingin dijalankan:`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('⚡ Ping Server', 'aksi_ping'),
      Markup.button.callback('🆔 ID Telegram', 'aksi_id')
    ],
    [
      Markup.button.callback('⬅️ Kembali', 'menu_utama')
    ]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.FITUR,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

bot.action('fitur_status', async (ctx) => {
  await ctx.answerCbQuery();
  const jamWIB = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const caption =
    `📡 <b>STATUS SISTEM</b>\n` +
    `Status: <b>AKTIF (24/7)</b>\n` +
    `Mode: <b>Vercel Webhook</b>\n` +
    `Waktu: <code>${jamWIB} WIB</code>`;

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🔄 Refresh', 'fitur_status'),
      Markup.button.callback('⬅️ Kembali', 'menu_utama')
    ]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.INFO,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 4. NOTIFIKASI POP-UP TOMBOL
// ==========================================
bot.action('aksi_ping', async (ctx) => {
  await ctx.answerCbQuery('⚡ Respon server normal via Vercel Webhook!', { show_alert: true });
});

bot.action('aksi_id', async (ctx) => {
  await ctx.answerCbQuery(`🆔 ID Telegram kamu: ${ctx.from.id}`, { show_alert: true });
});

bot.action(['detail_a', 'detail_b', 'detail_m1', 'detail_m2', 'detail_custom', 'detail_panduan'], async (ctx) => {
  await ctx.answerCbQuery(`✅ Pilihan (${ctx.match[0]}) dipilih. Hubungi admin untuk info lanjut.`, { show_alert: true });
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
      res.status(200).send('Bot Telegram Aktif 24 Jam di Vercel!');
    }
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Internal Server Error');
  }
};
