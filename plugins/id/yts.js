const ytSearch = require('yt-search');

module.exports = {
  name: ['yts'],
  command: /^(yts)$/i,
  type: ['Pencarian'],
  desc: 'Mencari video YouTube berdasarkan kata kunci.',
  execute: async ({ msg, bot, prefix, chatId }) => {
    const text = msg.text.trim();

    if (!text) {
      return bot.sendMessage(chatId, `🔴 Butuh kata kunci untuk pencarian YouTube.`);
    }

    const resultsPerPage = 5;
    let currentPage = 0;

    try {
      const results = await ytSearch(text);
      const totalResults = results.videos.length;
      const totalPages = Math.ceil(totalResults / resultsPerPage);

      const searchResults = results.videos.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage);

      const buttons = searchResults.map((video, index) => ({
        text: `${index + 1}. ${video.title}`,
        callback_data: `yts:${currentPage}:${text}:${index}`
      }));

      const paginationButtons = [];
      if (currentPage > 0) {
        paginationButtons.push({
          text: '◀️ Previous',
          callback_data: `yts:${currentPage - 1}:${text}`
        });
      }
      if (currentPage < totalPages - 1) {
        paginationButtons.push({
          text: 'Next ▶️',
          callback_data: `yts:${currentPage + 1}:${text}`
        });
      }

      bot.sendMessage(chatId, 'Pilih video dari hasil pencarian YouTube:', {
        reply_markup: {
          inline_keyboard: [
            ...buttons.map(button => [button]),
            ...paginationButtons.length ? [paginationButtons] : []
          ]
        }
      });

      bot.on('callback_query', async (callbackQuery) => {
        const { data, message } = callbackQuery;
        const chatId = message.chat.id;

        const [command, page, searchQuery, index] = data.split(':');
        const searchIndex = parseInt(index);
        const currentPage = parseInt(page);

        try {
          const results = await ytSearch(searchQuery);
          const searchResults = results.videos.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage);

          const buttons = searchResults.map((video, index) => ({
            text: `${index + 1}. ${video.title}`,
            callback_data: `yts:${currentPage}:${searchQuery}:${index}`
          }));

          const paginationButtons = [];
          if (currentPage > 0) {
            paginationButtons.push({
              text: '◀️ Previous',
              callback_data: `yts:${currentPage - 1}:${searchQuery}`,
            });
          }
          if (currentPage < totalPages - 1) {
            paginationButtons.push({
              text: 'Next ▶️',
              callback_data: `yts:${currentPage + 1}:${searchQuery}`,
            });
          }

          bot.editMessageText('Pilih video dari hasil pencarian YouTube:', {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: {
              inline_keyboard: [
                ...buttons.map(button => [button]),
                ...paginationButtons.length ? [paginationButtons] : []
              ]
            }
          });

          if (index !== undefined) {
            const video = results.videos[searchIndex];
            bot.sendMessage(chatId, `🔊 <b>${video.title}</b>\n\n${video.url}`, {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🎵 Download Audio',
                      callback_data: `/yta ${video.url}`
                    },
                    {
                      text: '📹 Download Video',
                      callback_data: `/ytv ${video.url}`
                    }
                  ]
                ]
              }
            });

            bot.editMessageReplyMarkup({}, {
              chat_id: chatId,
              message_id: message.message_id
            });
          }
        } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mencoba mengambil video.');
        }
      });

    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, '❌ Terjadi kesalahan saat mencoba mencari video.');
    }
  }
};