const ytSearch = require('yt-search');

module.exports = {
  handleInlineQuery: async (bot, query) => {
    const { id, query: searchQuery } = query;
    if (!searchQuery) return;

    try {
      const results = await ytSearch(searchQuery);
      const searchResults = results.videos.slice(0, 5); // Mengambil 5 hasil pencarian

      const resultsArray = searchResults.map((video, index) => ({
        type: 'article',
        id: `${id}-${index}`,
        title: video.title,
        description: video.description.substring(0, 100), // Ambil 100 karakter pertama deskripsi
        thumb_url: video.thumbnail,
        input_message_content: {
          message_text: `<b>${video.title}</b>\n\n${video.url}`,
          parse_mode: 'HTML',
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Unduh Audio',
                callback_data: `yta ${video.url}`,
              }
            ]
          ],
        },
        cache_time: 0,
      }));

      // Menjawab dengan hasil pencarian
      bot.answerInlineQuery(id, resultsArray);
    } catch (err) {
      console.error(err);
      bot.answerInlineQuery(id, [{
        type: 'article',
        id: `${id}-error`,
        title: 'Terjadi kesalahan',
        description: 'Gagal mencari video, coba lagi nanti.',
        input_message_content: {
          message_text: 'Terjadi kesalahan dalam pencarian. Coba lagi nanti.',
          parse_mode: 'HTML',
        },
        cache_time: 0,
      }]);
    }
  }
};