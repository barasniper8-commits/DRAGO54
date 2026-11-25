const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Gambar Banner Landscape (16:9)
const BANNER = {
  UTAMA: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
  KATEGORI: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1280&auto=format&fit=crop',
  FITUR: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1280&auto=format&fit=crop',
  INFO: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1280&auto=format&fit=crop'
};

// Helper pembuat blok script (<pre>) di dalam caption pesan Telegram
const buatPesanBlokScript = ({ header, bahasa = 'yaml', isiBlock, catatan }) => {
  return (
    `⚡ <b>${header}</b>\n\n` +
    `<pre><code class="language-${bahasa}">${isiBlock}</code></pre>\n\n` +
    `<i>${catatan}</i>`
  );
};

// ==========================================
// 1. MENU UTAMA (/start)
// ==========================================
const getMenuUtama = (namaUser) => {
  const caption = buatPesanBlokScript({
    header: `SYSTEM PANEL • ${namaUser}`,
    bahasa: 'yaml',
    isiBlock: [
      'status: ONLINE (24/7)',
      'host: vercel-webhook',
      'kategori:',
      '  - [01] Layanan & Paket',
      '  - [02] Fitur & Tools',
      '  - [03] Info & Server'
    ].join('\n'),
    catatan: 'Pilih blok kategori atau fitur di bawah.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 Blok 01', 'kat_01'),
      Markup.button.callback('💎 Blok 02', 'kat_02'),
      Markup.button.callback('🎯 Blok 03', 'kat_03')
    ],
    [
      Markup.button.callback('⚙️ Fitur', 'fitur_cepat'),
      Markup.button.callback('📡 Status', 'fitur_status')
    ],
    [
      Markup.button.url('💬 Admin', 'https://t.me/username_kamu')
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
      header: 'BLOK KATEGORI 01 • LAYANAN',
      bahasa: 'json',
      isiBlock: JSON.stringify(
        {
          kategori: 'Layanan Utama',
          item_a: 'Paket Standar (Ready)',
          item_b: 'Paket Prioritas (Ready)'
        },
        null,
        2
      ),
      aksiA: ['🔹 Paket A', 'detail_a'],
      aksiB: ['🔸 Paket B', 'detail_b']
    },
    kat_02: {
      header: 'BLOK KATEGORI 02 • MODUL',
      bahasa: 'json',
      isiBlock: JSON.stringify(
        {
          kategori: 'Modul & Akses',
          modul_1: 'Akses Cepat (Aktif)',
          modul_2: 'Akses Lanjutan (Aktif)'
        },
        null,
        2
      ),
      aksiA: ['🚀 Modul 1', 'detail_m1'],
      aksiB: ['🔥 Modul 2', 'detail_m2']
    },
    kat_03: {
      header: 'BLOK KATEGORI 03 • CUSTOM',
      bahasa: 'json',
      isiBlock: JSON.stringify(
        {
          kategori: 'Custom & Panduan',
          custom: 'Request Khusus (Open)',
          guide: 'Dokumentasi (Ready)'
        },
        null,
        2
      ),
      aksiA: ['🧩 Custom', 'detail_custom'],
      aksiB: ['📌 Panduan', 'detail_panduan']
    }
  };

  const item = dataKategori[kode];
  const caption = buatPesanBlokScript({
    header: item.header,
    bahasa: item.bahasa,
    isiBlock: item.isiBlock,
    catatan: 'Ketuk tombol di bawah untuk detail.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(item.aksiA[0], item.aksiA[1]),
      Markup.button.callback(item.aksiB[0], item.aksiB[1])
    ],
    [Markup.button.callback('⬅️ Kembali', 'menu_utama')]
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
// 3. BLOK FITUR & STATUS
// ==========================================
bot.action('fitur_cepat', async (ctx) => {
  await ctx.answerCbQuery();
  const caption = buatPesanBlokScript({
    header: 'BLOK FITUR CEPAT',
    bahasa: 'sh',
    isiBlock: [
      'ping_webhook --status ok',
      'user_id --show-current'
    ].join('\n'),
    catatan: 'Jalankan perintah lewat tombol di bawah.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('⚡ Tes Ping', 'aksi_ping'),
      Markup.button.callback('🆔 Cek ID', 'aksi_id')
    ],
    [Markup.button.callback('⬅️ Kembali', 'menu_utama')]
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

  const caption = buatPesanBlokScript({
    header: 'BLOK STATUS SERVER',
    bahasa: 'yaml',
    isiBlock: [
      'service: running',
      'transport: webhook',
      `timestamp: "${jamWIB} WIB"`
    ].join('\n'),
    catatan: 'Tekan Refresh untuk memperbarui waktu server.'
  });

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
// 4. NOTIFIKASI POP-UP
// ==========================================
bot.action('aksi_ping', async (ctx) => {
  await ctx.answerCbQuery('⚡ Respon server normal via Vercel Webhook!', { show_alert: true });
});

bot.action('aksi_id', async (ctx) => {
  await ctx.answerCbQuery(`🆔 ID Telegram kamu: ${ctx.from.id}`, { show_alert: true });
});

bot.action(['detail_a', 'detail_b', 'detail_m1', 'detail_m2', 'detail_custom', 'detail_panduan'], async (ctx) => {
  await ctx.answerCbQuery(`✅ Pilihan (${ctx.match[0]}) dipilih.`, { show_alert: true });
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
