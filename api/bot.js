const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Gambar landscape (16:9) untuk masing-masing blok
const BANNER = {
  UTAMA: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
  KATEGORI: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1280&auto=format&fit=crop',
  FITUR: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1280&auto=format&fit=crop'
};

// Script generator blok pesan (mengembalikan objek { text, buttons })
const blokPesan = {
  utama(nama) {
    return {
      photo: BANNER.UTAMA,
      caption:
        `⚡ <b>PANEL UTAMA • 24/7 ONLINE</b>\n` +
        `Halo <b>${nama}</b>, pilih blok di bawah ini:`,
      keyboard: Markup.inlineKeyboard([
        // Blok 1: Tombol Kategori
        [
          Markup.button.callback('📦 Kategori A', 'buka_kat_a'),
          Markup.button.callback('💎 Kategori B', 'buka_kat_b')
        ],
        // Blok 2: Tombol Fitur
        [
          Markup.button.callback('⚙️ Blok Fitur', 'buka_fitur'),
          Markup.button.callback('📡 Status Bot', 'buka_status')
        ],
        // Blok 3: Aksi Eksternal
        [
          Markup.button.url('💬 Admin', 'https://t.me/username_kamu')
        ]
      ])
    };
  },

  kategoriA() {
    return {
      photo: BANNER.KATEGORI,
      caption:
        `📦 <b>BLOK KATEGORI A</b>\n` +
        `• Item A1 — Layanan standar\n` +
        `• Item A2 — Layanan lanjutan`,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback('Pilih A1', 'pilih_a1'),
          Markup.button.callback('Pilih A2', 'pilih_a2')
        ],
        [Markup.button.callback('⬅️ Kembali', 'buka_utama')]
      ])
    };
  },

  kategoriB() {
    return {
      photo: BANNER.KATEGORI,
      caption:
        `💎 <b>BLOK KATEGORI B</b>\n` +
        `• Item B1 — Modul khusus\n` +
        `• Item B2 — Paket custom`,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback('Pilih B1', 'pilih_b1'),
          Markup.button.callback('Pilih B2', 'pilih_b2')
        ],
        [Markup.button.callback('⬅️ Kembali', 'buka_utama')]
      ])
    };
  },

  fitur() {
    return {
      photo: BANNER.FITUR,
      caption:
        `⚙️ <b>BLOK FITUR AKTIF</b>\n` +
        `• Cek Ping Server\n` +
        `• Cek ID Telegram`,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback('⚡ Ping', 'aksi_ping'),
          Markup.button.callback('🆔 Cek ID', 'aksi_id')
        ],
        [Markup.button.callback('⬅️ Kembali', 'buka_utama')]
      ])
    };
  },

  status() {
    const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return {
      photo: BANNER.FITUR,
      caption:
        `📡 <b>BLOK STATUS SERVER</b>\n` +
        `Status: <b>AKTIF (24/7)</b>\n` +
        `Hosting: <b>Vercel Webhook</b>\n` +
        `Waktu: <code>${waktu} WIB</code>`,
      keyboard: Markup.inlineKeyboard([
        [
          Markup.button.callback('🔄 Refresh', 'buka_status'),
          Markup.button.callback('⬅️ Kembali', 'buka_utama')
        ]
      ])
    };
  }
};

// Helper untuk merender blok ke pesan yang sedang aktif
async function renderBlok(ctx, dataBlok) {
  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: dataBlok.photo,
      caption: dataBlok.caption,
      parse_mode: 'HTML'
    },
    dataBlok.keyboard
  );
}

// Perintah /start
bot.start(async (ctx) => {
  const nama = ctx.from.first_name || 'User';
  const awal = blokPesan.utama(nama);
  await ctx.replyWithPhoto(awal.photo, {
    caption: awal.caption,
    parse_mode: 'HTML',
    ...awal.keyboard
  });
});

// Navigasi antar blok
bot.action('buka_utama', async (ctx) => {
  await ctx.answerCbQuery();
  await renderBlok(ctx, blokPesan.utama(ctx.from.first_name || 'User'));
});

bot.action('buka_kat_a', async (ctx) => {
  await ctx.answerCbQuery();
  await renderBlok(ctx, blokPesan.kategoriA());
});

bot.action('buka_kat_b', async (ctx) => {
  await ctx.answerCbQuery();
  await renderBlok(ctx, blokPesan.kategoriB());
});

bot.action('buka_fitur', async (ctx) => {
  await ctx.answerCbQuery();
  await renderBlok(ctx, blokPesan.fitur());
});

bot.action('buka_status', async (ctx) => {
  await ctx.answerCbQuery();
  await renderBlok(ctx, blokPesan.status());
});

// Aksi tombol
bot.action('aksi_ping', async (ctx) => {
  await ctx.answerCbQuery('⚡ Pong! Webhook Vercel merespons normal.', { show_alert: true });
});

bot.action('aksi_id', async (ctx) => {
  await ctx.answerCbQuery(`🆔 ID Telegram kamu: ${ctx.from.id}`, { show_alert: true });
});

bot.action(['pilih_a1', 'pilih_a2', 'pilih_b1', 'pilih_b2'], async (ctx) => {
  await ctx.answerCbQuery(`✅ Kamu memilih: ${ctx.match[0].toUpperCase()}`, { show_alert: true });
});

// Export untuk Vercel Webhook
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
