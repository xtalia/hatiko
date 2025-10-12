const { Telegraf, Markup, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');

const ERROR_CHAT_ID = '184944023';
const DEBUG_LVL = config.DEBUG  ? false : true;

const bot = new Telegraf(DEBUG_LVL ? config.bot.token_debug : config.bot.token);

bot.start((ctx) => {
  ctx.reply('Привет! Напиши что надо или выбери комманды');
});

//Калькулятор
//Кто работает
//Курс валют
//Инфа от сайта Хатико
//Test

bot.command('export_config', async (ctx) => {
  if (ctx.from.id !== 184944023) {
    return ctx.reply(`В доступе отказано. Вы не Сергей ${ctx.from.id}`);
  }

  const directory = __dirname;
  const files = fs.readdirSync(directory);
  const pythonFiles = files.filter(file => 
    ['.py', '.docx', '.xml', '.json'].includes(path.extname(file))
  );

  const buttons = pythonFiles.map(file => 
    [Markup.button.callback(file, `export_config_${file}`)]
  );

  ctx.reply('Выберите файл для экспорта:', Markup.inlineKeyboard(buttons));
});

bot.action(/export_config_(.+)/, async (ctx) => {
  const fileName = ctx.match[1];
  const filePath = path.join(__dirname, fileName);
  
  try {
    await ctx.replyWithDocument({ source: filePath });
    ctx.reply(`Модуль ${fileName} выгружен.`);
  } catch (error) {
    ctx.reply('Ошибка при выгрузке файла');
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
});

// Обработка ошибок
function handleException(e) {
  const errorText = `Error occurred:\n${e.stack}`;
  bot.telegram.sendMessage(ERROR_CHAT_ID, errorText);
}
process.on('uncaughtException', handleException);
process.on('unhandledRejection', handleException);