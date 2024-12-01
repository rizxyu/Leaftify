module.exports = {
  name: ['start', 'mulai'],
  command: /^(start|mulai)$/, 
  type: ['Helper'],
  desc: 'Menyambut pengguna baru dengan keyboard Help dan About.',
  execute: ({ msg, bot, prefix }) => {
    const chatId = msg.chat.id;
    const username = msg.from.first_name;

    // Keyboard biasa
    const replyKeyboard = {
      reply_markup: {
        keyboard: [
          [{ text: `${prefix}help` }, { text: `${prefix}about` }], // Tombol Help dan About
        ],
        resize_keyboard: true, // Menyesuaikan ukuran tombol
        one_time_keyboard: true, // Biarkan keyboard tetap muncul
      }
    };

    // Mengirim pesan dengan keyboard
    bot.sendMessage(
      chatId,
      `Hai ${username}, Selamat datang di bot kami!\n\nGunakan tombol di bawah ini untuk mengakses informasi lebih lanjut:\n- Help untuk bantuan\n- About untuk informasi tentang bot ini.`,
      replyKeyboard
    );
  },
};