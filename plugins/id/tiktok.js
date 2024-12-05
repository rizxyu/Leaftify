const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

module.exports = {
  name: ['tiktok', "tt"],
  command: /^(tt|tiktok)$/,  // Mendukung menu dan menu <subcommand>
  type: ['Downloader'],
  desc: 'mengunduh video tiktok.',
  execute: async({ msg, bot,
          text, chatId}) => {
   if (!text) return bot.sendMessage(chatId, `🔴 Butuh tautan tiktok`)
   const data = await ttt(text)
        if (data.data.images) {
          for (const i of data.data.images) {
           await bot.sendPhoto(chatId, i)
   }
        }
        if(!data.data.images) await bot.sendVideo(chatId, data.data.play || data.data.hd_play, { caption: "Berhasil"})
        await bot.sendAudio(chatId, data.data.music_info.play)
  }
};

async function ttt(link) {
    const form = new FormData();
      form.append("url", link);
      form.append("count", "12");
      form.append("cursor", "0");
      form.append("web", "1");
      form.append("hd", "1");

      const {
        data
      } = await axios.post("https://www.tikwm.com/api/", form);

      if(data.code === 0 && data.msg === "success") {
        const baseUrl = "https://www.tikwm.com";
        data.data.cover = baseUrl + data.data.cover;
        data.data.play = baseUrl + data.data.play;
        data.data.wmplay = baseUrl + data.data.wmplay;
        data.data.hdplay = baseUrl + data.data.hdplay;
        data.data.music = baseUrl + data.data.music;
        data.data.author.avatar = baseUrl + data.data.author.avatar;
      }

    return data
}