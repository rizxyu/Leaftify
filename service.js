require("./configuration");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const bot = new TelegramBot(global.token, { polling: true });

global.commands = [];
global.loadedLanguage = [];

function loadCommands(dir) {
  const commandFiles = fs.readdirSync(dir);
  commandFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const command = require(path.join(dir, file));
      global.commands.push(command);
    }
  });
}

function commandsLang(lang) {
  if (!global.loadedLanguage.includes(lang)) {
  if (lang === "id") {
loadCommands(path.join(__dirname, 'plugins/id'));
} else if (lang === "en") {
loadCommands(path.join(__dirname, 'plugins/en'));
}
global.loadedLanguage.push(lang)
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
 function starts() {
  animateLog();
  
  bot.setMyCommands([
  { command: '/help', description: 'To view category Command' }])
  
  bot.on('message', async (msg) => {
    console.log(msg);
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || null;
    const msgType = text ? "textMessage" : msg.sticker ? "stickerMessage" : null;
    const from = msg.from;
    global.username = from.username
    const bahasa = from.language_code
    const prefixRegex = /^([!\/+])/;
    const commandRegex = /^([!\/+])(\w+)(.*)$/; // Ambil command dan teks setelahnya
    let match
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
      console.log(`\x1b[32m[MESSAGE]\x1b[0m Type: ${msgType} ${msgType == "textMessage" ? `| text: ${msg.text} ` : ""}| From: ${from.first_name} (${from.username || "Private"})`);
    } else {
      console.log(`\x1b[32m[MESSAGE]\x1b[0m Type: ${msgType} ${msgType == "textMessage" ? `| Prefix: ${prefix} | Command: ${prefix + command} ` : ""}| From: ${from.first_name} (${from.username || "Private"})`);
    }
   
   commandsLang(bahasa); //load & add command from plugins to global
   
   if (command) {
     if (!global.public && !global.owner.username.includes(from.username)) return bot.sendMessage(chatId, `Bot is Under Mode Maintenance`);
     
     
      const matchedCommand = global.commands.find(c => c.command.test(command));

      if (matchedCommand) {
        const extra = {
          text: extraText,
          command,
          prefix,
          bahasa
        };

        matchedCommand.execute({
          msg,
          bot,
          ...extra
        });
      }
    }
  });
}

module.exports = { starts }