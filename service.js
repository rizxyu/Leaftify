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
        const commandRegex = /^([!\/+])(\w+)(.*)$/;
        const isGroup = msg.chat.type === "supergroup";
        let isAdmin = false, admins;

        if (isGroup) {
          admins = await bot.getChatAdministrators(chatId);
          isAdmin = admins.some(admin => admin.user.id === userId);
        }

        const match = text ? text.match(commandRegex) : null;
        const prefix = match?.[1] || null;
        const command = match?.[2] || null;
        const extraText = match?.[3]?.trim() || null;

        commandsLang(bahasa);

        if (command) {
          const matchedCommand = global.commands.find(c => c.command.test(command));
          if (matchedCommand) {
            const extra = { chatId, isAdmin, from, text: extraText, command, prefix, bahasa, isGroup };
            await matchedCommand.execute({ msg, bot, ...extra });
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
      try {
        const { query: searchQuery } = query;
        if (!searchQuery) return;
        for (const handler of global.inlineHandlers) {
          await handler.handleInlineQuery(bot, query);
        }
      } catch (err) {
        console.error("Error handling inline query:", err);
      }
    });

    bot.on('callback_query', async (callbackQuery) => {
      try {
        const { data } = callbackQuery;
        const [command, ...args] = data.split(' ');
        const matchedCommand = global.commands.find(c => c.command.test(command));
        if (matchedCommand) {
          await matchedCommand.execute({ msg: callbackQuery, bot });
        }
      } catch (err) {
        console.error("Error handling callback query:", err);
      }
    });
  } catch (err) {
    console.error("Critical error:", err);
  }
}

module.exports = { starts };