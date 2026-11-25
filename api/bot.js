const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Gambar Banner Landscape (Rasio 16:9 - ganti dengan URL gambar banner milikmu sendiri)
const BANNER = {
  UTAMA: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
  KAT_A: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1280&auto=format&fit=crop',
  KAT_B: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1280&auto=format&fit=crop',
  KAT_C: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1280&auto=format&fit=crop'
};

// Helper pembuat blok kategori agar tampil lebar, rapi, dan mudah dibaca di layar HP
const buatBlokKategori = ({ judul, badge, ringkasan, daftarBlok, footer }) => {
  const isiBlok = daftarBlok
    .map(
      (item, idx) =>
        `┌──────────────────────────┐\n` +
        `│ <b>[0${idx + 1}] ${item.nama}</b>\n` +
        `├──────────────────────────┤\n` +
        `│ ${item.detail}\n` +
        `│ <i>Status: ${item.status}</i>\n` +
        `└──────────────────────────┘`
    )
    .join('\n');

  return (
    `⚡ <b>${judul}</b>\n` +
    `🏷️ <code>${badge}</code>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${ringkasan}\n\n` +
    `${isiBlok}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 <i>${footer}</i>`
  );
};

// ==========================================
// 1. MENU UTAMA + BLOK KATEGORI (/start)
// ==========================================
const getMenuUtama = (namaUser) => {
  const caption = buatBlokKategori({
    judul: 'PUSAT KATEGORI & LAYANAN',
    badge: 'SYSTEM ONLINE • 24/7 VERCEL',
    ringkasan: `Halo <b>${namaUser}</b>! Pilih blok kategori di bawah untuk melihat rincian layanan & fitur:`,
    daftarBlok: [
      {
        nama: 'KATEGORI 01 • LAYANAN & PRODUK',
        detail: 'Daftar paket, layanan utama & akses cepat',
        status: 'Tersedia'
      },
      {
        nama: 'KATEGORI 02 • FITUR & TOOLS',
        detail: 'Utilitas otomatis, cek info & kontrol bot',
        status: 'Aktif'
      },
      {
        nama: 'KATEGORI 03 • INFO & BANTUAN',
        detail: 'Status server, panduan & kontak langsung',
        status: 'Siap Bantu'
      }
    ],
    footer: 'Tampilan otomatis diperbarui di satu layar tanpa spam.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 Blok 01: Layanan', 'blok_01'),
      Markup.button.callback('🛠️ Blok 02: Fitur', 'blok_02')
    ],
    [
      Markup.button.callback('📡 Blok 03: Info & Status', 'blok_03'),
      Markup.button.callback('🔄 Refresh', 'blok_home')
    ],
    [
      Markup.button.url('💬 Chat Admin', 'https://t.me/username_kamu')
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
bot.action('blok_home', async (ctx) => {
  await ctx.answerCbQuery('Memuat menu utama...');
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
// 2. DETAIL BLOK KATEGORI 01 (LAYANAN)
// ==========================================
bot.action('blok_01', async (ctx) => {
  await ctx.answerCbQuery();
  const caption = buatBlokKategori({
    judul: 'BLOK KATEGORI 01 • LAYANAN',
    badge: 'KATALOG UTAMA',
    ringkasan: 'Pilih item di bawah untuk melihat informasi lengkap:',
    daftarBlok: [
      {
        nama: 'Paket Standar',
        detail: 'Akses dasar dengan respon cepat & stabil',
        status: 'Ready'
      },
      {
        nama: 'Paket Prioritas',
        detail: 'Akses penuh dengan dukungan lanjutan',
        status: 'Ready'
      }
    ],
    footer: 'Klik tombol di bawah untuk detail item atau kembali.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🔹 Detail Standar', 'info_standar'),
      Markup.button.callback('🔸 Detail Prioritas', 'info_prioritas')
    ],
    [Markup.button.callback('⬅️ Kembali ke Semua Blok', 'blok_home')]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.KAT_A,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 3. DETAIL BLOK KATEGORI 02 (FITUR)
// ==========================================
bot.action('blok_02', async (ctx) => {
  await ctx.answerCbQuery();
  const caption = buatBlokKategori({
    judul: 'BLOK KATEGORI 02 • FITUR',
    badge: 'AUTOMATION & TOOLS',
    ringkasan: 'Fitur aktif yang bisa langsung kamu coba:',
    daftarBlok: [
      {
        nama: 'Cek Latensi / Ping',
        detail: 'Menguji respon webhook & koneksi server',
        status: 'Online'
      },
      {
        nama: 'Cek Profil & ID',
        detail: 'Menampilkan ID akun Telegram & waktu server',
        status: 'Online'
      }
    ],
    footer: 'Hasil pengecekan akan muncul sebagai notifikasi pop-up.'
  });

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('⚡ Tes Ping', 'tes_ping'),
      Markup.button.callback('🆔 Cek ID Saya', 'cek_id')
    ],
    [Markup.button.callback('⬅️ Kembali ke Semua Blok', 'blok_home')]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.KAT_B,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 4. DETAIL BLOK KATEGORI 03 (INFO & STATUS)
// ==========================================
bot.action('blok_03', async (ctx) => {
  await ctx.answerCbQuery();
  const waktuWIB = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const caption = buatBlokKategori({
    judul: 'BLOK KATEGORI 03 • INFO SERVER',
    badge: 'DIAGNOSTICS & HELP',
    ringkasan: 'Informasi operasional bot saat ini:',
    daftarBlok: [
      {
        nama: 'Status Layanan',
        detail: 'Webhook Vercel aktif & menerima update',
        status: '24/7 Aktif'
      },
      {
        nama: 'Waktu Server',
        detail: `${waktuWIB} WIB`,
        status: 'Sinkron'
      }
    ],
    footer: 'Jika butuh bantuan khusus, gunakan tombol Chat Admin.'
  });

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Perbarui Status', 'blok_03')],
    [Markup.button.callback('⬅️ Kembali ke Semua Blok', 'blok_home')]
  ]);

  await ctx.editMessageMedia(
    {
      type: 'photo',
      media: BANNER.KAT_C,
      caption,
      parse_mode: 'HTML'
    },
    keyboard
  );
});

// ==========================================
// 5. AKSI TOMBOL DETAIL & UTILITAS
// ==========================================
bot.action('info_standar', async (ctx) => {
  await ctx.answerCbQuery('📦 Paket Standar: Cocok untuk kebutuhan harian dasar.', { show_alert: true });
});

bot.action('info_prioritas', async (ctx) => {
  await ctx.answerCbQuery('👑 Paket Prioritas: Akses fitur lengkap & respon prioritas.', { show_alert: true });
});

bot.action('tes_ping', async (ctx) => {
  await ctx.answerCbQuery('⚡ Server merespons normal via Vercel Webhook!', { show_alert: true });
});

bot.action('cek_id', async (ctx) => {
  await ctx.answerCbQuery(`🆔 ID Telegram kamu: ${ctx.from.id}`, { show_alert: true });
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
