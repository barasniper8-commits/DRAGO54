const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Ganti dengan URL gambar landscape (16:9) desainmu yang sudah berisi blok-blok visual
const FOTO_LANDSCAPE = {
  UTAMA: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1280&auto=format&fit=crop',
  HALAMAN_2: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1280&auto=format&fit=crop',
  HALAMAN_3: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1280&auto=format&fit=crop'
};

// URL halaman web jika ingin membuka blok UI penuh via Telegram Mini App (opsional)
const MINI_APP_URL = 'https://example.com';

const menuUtama = (nama) => ({
  caption: `⚡ <b>${nama}</b> — 24/7 Active`,
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('🖼️ Banner 1', 'banner_1'), Markup.button.callback('🖼️ Banner 2', 'banner_2')],
    [Markup.button.callback('🖼️ Banner 3', 'banner_3')],
    [Markup.button.webApp('📱 Buka Mini App', MINI_APP_URL)]
  ])
});

bot.start(async (ctx) => {
  const nama = ctx.from.first_name || 'User';
  const { caption, extra } = menuUtama(nama);
  await ctx.replyWithPhoto(FOTO_LANDSCAPE.UTAMA, { caption, parse_mode: 'HTML', ...extra });
});

bot.action('banner_1', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageMedia(
    { type: 'photo', media: FOTO_LANDSCAPE.UTAMA, caption: '🖼️ <b>Banner 1</b>', parse_mode: 'HTML' },
    Markup.inlineKeyboard([
      [Markup.button.callback('🖼️ Banner 2', 'banner_2'), Markup.button.callback('🖼️ Banner 3', 'banner_3')],
      [Markup.button.webApp('📱 Buka Mini App', MINI_APP_URL)]
    ])
  );
});

bot.action('banner_2', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageMedia(
    { type: 'photo', media: FOTO_LANDSCAPE.HALAMAN_2, caption: '🖼️ <b>Banner 2</b>', parse_mode: 'HTML' },
    Markup.inlineKeyboard([
      [Markup.button.callback('🖼️ Banner 1', 'banner_1'), Markup.button.callback('🖼️ Banner 3', 'banner_3')],
      [Markup.button.webApp('📱 Buka Mini App', MINI_APP_URL)]
    ])
  );
});

bot.action('banner_3', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageMedia(
    { type: 'photo', media: FOTO_LANDSCAPE.HALAMAN_3, caption: '🖼️ <b>Banner 3</b>', parse_mode: 'HTML' },
    Markup.inlineKeyboard([
      [Markup.button.callback('🖼️ Banner 1', 'banner_1'), Markup.button.callback('🖼️ Banner 2', 'banner_2')],
      [Markup.button.webApp('📱 Buka Mini App', MINI_APP_URL)]
    ])
  );
});

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
