const axios = require("axios");
const { SaveTube } = require('../../scraper/downloader');


module.exports = {
  name: ['yta', "ytmp3"],
  command: /^(yt(a)?(mp3)?)$/, 
  type: ['Downloader'],
  desc: 'Mengunduh audio dari video YouTube.',
  execute: async({ msg, bot, text, chatId }) => {
    if (!text) {
      return bot.sendMessage(chatId, `🔴 Butuh tautan YouTube`);
    }
   const { ID3Writer } = await import('browser-id3-writer');
    try {
      // Kirim pesan "Memuat..."
      const loadingMessage = await bot.sendMessage(chatId, '⏳ Memuat... Mengunduh audio, harap tunggu.');

      // Mendapatkan data dari SaveTube
      const data = await SaveTube.dl(text, 3, 1); // 3 = kualitas audio (misal, 128kbps), 1 = tipe audio

      // Unduh audio dari URL yang diberikan
      const response = await axios.get(data.link, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(response.data);

      // Menambahkan metadata menggunakan node-id3
      const writer = new ID3Writer(audioBuffer);
      writer.setFrame('TIT2', data.title) // Judul
            .setFrame('TPE1', [data.titleSlug]) // Nama artis
            .setFrame('APIC', {
              type: 3, // Sampul depan
              data: (await axios.get(data.thumbnail, { responseType: 'arraybuffer' })).data, // Gambar thumbnail
              description: 'Cover'
            });
      writer.addTag();
      const taggedAudio = Buffer.from(writer.arrayBuffer);

      // Kirim audio
      await bot.sendAudio(chatId, taggedAudio, {
        caption: `🔊 Menikmati Audio: ${data.title}`, 
      });

      // Hapus pesan "Memuat..."
      await bot.deleteMessage(chatId, loadingMessage.message_id);
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mencoba mengunduh audio.');
    }
  }
};