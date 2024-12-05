require("./configuration");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(global.token, { polling: true });

global.commands = [];
global.loadedLanguage = [];
global.inlineHandlers = [];
global.callbackHandlers = [];

function loadCommands(dir) {
  const commandFiles = fs.readdirSync(dir);
  commandFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const command = require(path.join(dir, file));
      global.commands.push(command);
    }
  });
}

function loadInlineHandlers(dir) {
  const handlerFiles = fs.readdirSync(dir);
  handlerFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const handler = require(path.join(dir, file));
      if (handler.handleInlineQuery) {
        global.inlineHandlers.push(handler);
      }
    }
  });
}

function loadCallbackHandlers(dir) {
  const handlerFiles = fs.readdirSync(dir);
  handlerFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const handler = require(path.join(dir, file));
      if (handler.handleInlineQuery) {
        global.callbackHandlers.push(handler);
      }
    }
  });
}

function commandsLang(lang) {
  if (!global.loadedLanguage.includes(lang)) {
    if (lang === "id") {
      loadCommands(path.join(__dirname, 'plugins/id'));
      loadInlineHandlers(path.join(__dirname, 'plugins/id/inline'));
      loadCallbackHandlers(path.join(__dirname, 'plugins/id/callback'));
    } else if (lang === "en") {
      loadCommands(path.join(__dirname, 'plugins/en'));
      loadCallbackHandlers(path.join(__dirname, 'plugins/en/callback'));
    }
    global.loadedLanguage.push(lang);
  }
}

function animateLog(ms = 700) {
  const emojis = ['🔴', '🟢', '🔴', '🟢'];
  let dots = '';
  let step = 0;
  const interval = setInterval(() => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    dots = '.'.repeat(step % 4);
    step++;
    process.stdout.write(`\r${randomEmoji}| While Running${dots} `);
  }, ms);

  setTimeout(() => clearInterval(interval), 10000);
}

async function starts() {
  try {
    animateLog();
    bot.on('message', async (msg) => {
      try {
      console.log(msg);
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text?.trim() || null;
      const msgType = text ? "textMessage" : msg.sticker ? "stickerMessage" : null;
      const from = msg.from;
      const bahasa = from.language_code;
      const prefixRegex = /^([!\/+])/;
      const commandRegex = /^([!\/+])(\w+)(.*)$/;
      const isGroup = msg.chat.type === "supergroup"; 
      let isAdmin, admins;
      
      if (isGroup) {
        admins = await bot.getChatAdministrators(chatId);
      } else {
        admins = null;
      }
      
      if (admins) {
        isAdmin = admins.some(admin => admin.user.id === userId);
      }

      let match;
      if (text) {
        match = text.match(commandRegex);
      }

      let prefix, command, extraText;

      if (match) {
        prefix = match[1];
        command = match[2];
        extraText = match[3].trim();
      }

      if (!prefix) {
        console.log(`\x1b[32m[MESSAGE]\x1b[0m Type: ${msgType} ${msgType === "textMessage" ? `| text: ${msg.text} ` : ""}| From: ${from.first_name} (${from.username || "Private"})`);
      } else {
        console.log(`\x1b[32m[MESSAGE]\x1b[0m Type: ${msgType} ${msgType === "textMessage" ? `| Prefix: ${prefix} | Command: ${prefix + command} ` : ""}| From: ${from.first_name} (${from.username || "Private"})`);
      }

      commandsLang(bahasa); 
      
      // callback query handler
      bot.on('callback_query', async (callbackQuery) => {
        const { data } = callbackQuery;
        const [command, ...args] = data.split(' '); 

        if (command) {
          const matchedCommand = global.commands.find(c => c.command.test(command));

          if (matchedCommand) {
            const extra = {
              chatId,
              from,
              text: args.join(' '),  //Sigma
              command,
              prefix: '',  // Tidak ada prefix untuk callback query
              isGroup,
              isAdmin,
              bahasa
            };
            if (matchedCommand.execute) {
              matchedCommand.execute({ msg: callbackQuery, bot, ...extra });
            } else if (matchedCommand.before) {
              matchedCommand.before({ msg: callbackQuery, bot, ...extra })
                .then(() => {
                  if (matchedCommand.after) matchedCommand.after({ msg: callbackQuery, bot, ...extra });
                })
                .catch(console.error);
            } else if (matchedCommand.after) {
              matchedCommand.after({ msg: callbackQuery, bot, ...extra });
            }
          }
        } else global.callbackHandlers.forEach((handler) => {
          handler.handleCallback(bot, msg, data);
        });
      });

      // Handle normal message commands
      if (command) {
        try {
        if (!global.public && !global.owner.username.includes(from.username)) {
          return bot.sendMessage(chatId, `Bot is Under Mode Maintenance`);
        }

        const matchedCommand = global.commands.find(c => c.command.test(command));

        if (matchedCommand) {
          const extra = {
            isGroup,
            isAdmin,
            chatId,
            from,
            text: extraText,
            command,
            prefix,
            bahasa
          };

          if (matchedCommand.execute) {
            matchedCommand.execute({ msg, bot, ...extra });
          } else if (matchedCommand.before) {
            matchedCommand.before({ msg, bot, ...extra }).then(() => {
              if (matchedCommand.after) matchedCommand.after({ msg, bot, ...extra });
            }).catch(console.error);
          } else if (matchedCommand.after) {
            matchedCommand.after({ msg, bot, ...extra });
          }
        }
      
      } catch(e) {
        console.log(e)
        bot.sendMessage(chatId, `Error: ${e.message}`)
      }
      }
      } catch (err) {
        if (err instanceof AggregateError) {
          console.error("AggregateError occurred:", err.errors);
        } else {
          console.error("Error processing message:", err);
        }
        bot.sendMessage(msg.chat.id, `An error occurred: ${err.message}`);
      }
    });
  
    bot.on('inline_query', async (query) => {
      const { id, query: searchQuery } = query;
      if (!searchQuery) return;
      global.inlineHandlers.forEach((handler) => {
        handler.handleInlineQuery(bot, query);
      });
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = { starts };