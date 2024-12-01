const axios = require("axios");
const { SaveTube } = require('../../scraper/downloader'); // Pastikan kamu mengimpor SaveTube dengan benar

module.exports = {
  name: ['yta', "ytmp3"],
  command: /^(yt(a)?(mp3)?)$/,  // Mendukung menu dan menu <subcommand>
  type: ['Downloader'],
  desc: 'Mengunduh audio dari video YouTube.',
  execute: async({ msg, bot, text }) => {
    if (!text) {
      return bot.sendMessage(msg.chat.id, `🔴 Butuh tautan YouTube`);
    }

    try {
      // Menunggu hasil dari fungsi dl() di SaveTube
      const data = await SaveTube.dl(text, 3, 1); // 3 untuk kualitas audio (misal, 128kbps) dan 1 untuk tipe audio
      
      // Mengirim audio setelah mendapatkan data dari SaveTube
      await bot.sendAudio(msg.chat.id, data.link, {
        caption: `🔊 Menikmati Audio: ${data.title}`, // Opsional: Menambahkan caption
        performer: data.titleSlug, // Nama artis
        title: data.title, // Judul lagu
        thumb: data.thumbnail // Gambar thumbnail
      });
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      bot.sendMessage(msg.chat.id, '❌ Terjadi kesalahan saat mencoba mengunduh audio.');
    }
  }
};