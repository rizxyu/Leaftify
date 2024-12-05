module.exports = {
  name: ['menu', 'help'],
  command: /^(menu|help)$/, 
  type: ['Helper'],
  desc: 'Menampilkan menu utama bot.',
  execute: ({ msg, bot, prefix, from }) => {
    const chatId = msg.chat.id;
   let username = from.username
    const groupedCommands = global.commands.reduce((groups, command) => {
      if (command.type && Array.isArray(command.type)) {
        command.type.forEach(type => {
          if (!groups[type]) {
            groups[type] = [];
          }
          groups[type].push(command);
        });
      } else if (command.type) {
        if (!groups[command.type]) {
          groups[command.type] = [];
        }
        groups[command.type].push(command);
      }
      return groups;
    }, {});

    const typeKeys = Object.keys(groupedCommands);
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: typeKeys.map(type => [
          { text: type, callback_data: `navigate_${type.toLowerCase()}` }
        ]),
      },
      parse_mode: 'HTML',
    };

    let commandList = '';
    for (const type in groupedCommands) {
      if (typeKeys.length > 1) continue; // Hanya tampilkan jika ada satu tipe
      commandList += `<b>${type}</b>:\n`;
      groupedCommands[type].forEach(command => {
        if (Array.isArray(command.name)) {
          command.name.forEach(cmdName => {
            commandList += `${prefix}${cmdName} - ${command.desc}\n`;
          });
        } else {
          commandList += `${prefix}${command.name} - ${command.desc}\n`;
        }
      });
      commandList += '\n';
    }

    // Pesan untuk menu utama
    const mainMenuMessage = `Hai ${username}\n\nList command:\n${commandList || 'Pilih kategori di bawah ini.'}`;

    // Mengirim pesan menu utama
    bot.sendMessage(chatId, mainMenuMessage, inlineKeyboard);

    // Callback query handler untuk semua tipe
    bot.on('callback_query', (callbackQuery) => {
      const data = callbackQuery.data;

      // Menangani navigasi tipe
      if (data.startsWith('navigate_')) {
        const type = data.replace('navigate_', '');
        const commandsForType = groupedCommands[type.charAt(0).toUpperCase() + type.slice(1)];

        if (commandsForType) {
          // Membuat daftar command untuk tipe tertentu
          let typeCommandList = `<b>${type.charAt(0).toUpperCase() + type.slice(1)} Commands</b>:\n`;
          commandsForType.forEach(command => {
            if (Array.isArray(command.name)) {
              command.name.forEach(cmdName => {
                typeCommandList += `${prefix}${cmdName} - ${command.desc}\n`;
              });
            } else {
              typeCommandList += `${prefix}${command.name} - ${command.desc}\n`;
            }
          });

          // Tombol kembali
          const backButton = {
            inline_keyboard: [
              [{ text: 'Kembali ke Menu Utama', callback_data: 'navigate_main_menu' }],
            ],
          };

          // Edit pesan untuk tipe tertentu
          bot.editMessageText(
            `Hai! Kamu menggunakan prefix: ${prefix}\n\n${typeCommandList}`,
            {
              chat_id: callbackQuery.message.chat.id,
              message_id: callbackQuery.message.message_id,
              parse_mode: 'HTML',
              reply_markup: backButton,
            }
          );
        }
      }

      // Menangani tombol kembali ke menu utama
      if (data === 'navigate_main_menu') {
        bot.editMessageText(
          mainMenuMessage,
          {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard.reply_markup,
          }
        );
      }
    });
  },
};