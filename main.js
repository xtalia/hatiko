const { Telegraf, Markup, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const config = require('./js/config.js');

// Импорт модулей (нужно будет переписать их на Node.js)
// const { cash_amount, process_discount } = require('./as_calculator');
// const megacalculator = require('./megacalculator');
// const who_work = require('./who_work');
// const { sn_cutter } = require('./sn_cutter');
// const { handle_usd_rate } = require('./usd_rate');
// const genpdf = require('./genpdf');
// const { process_model_input } = require('./phone_classifier');
// const { update_cache, handle_query, send_data } = require('./postgresloader');

const ERROR_CHAT_ID = '184944023';
const DEBUG_LVL = process.env.DEBUG ? false : true;

const bot = new Telegraf(DEBUG_LVL ? config.bot.token_debug : config.bot.token);

// Клавиатура
const keyboard = Markup.keyboard([
  ['Калькулятор', 'Скидка'],
  ['ТрейдинДок', 'Кто работает'],
  ['Курс доллара']
]).resize();

// Обработка ошибок
function handleException(e) {
  const errorText = `Error occurred:\n${e.stack}`;
  bot.telegram.sendMessage(ERROR_CHAT_ID, errorText);
}

// Основные обработчики
bot.start((ctx) => {
  ctx.reply('Я умею многое\nТы можешь мне отправить название товара или артикул, нажать на эти кнопки внизу или в меню выбрать что надо');
  ctx.reply('Напиши запрос или нажми на кнопки внизу', keyboard);
});

bot.hears(config.UPDATE_TRIGGERS, (ctx) => {
  ctx.reply('Обновлены кнопки', keyboard);
});

bot.hears(config.TEST_TRIGGERS, (ctx) => {
  test_table(ctx);
});

bot.hears('Contact us', (ctx) => {
  contact_us(ctx);
});

// Обработчики функций
bot.hears(config.CALCULATE_TRIGGERS, (ctx) => {
  if (ctx.message.text.toLowerCase().includes('скидка')) {
    ctx.reply('Сумма без скидки:');
    return ctx.waitForInput((msg) => discount_price(msg));
  }
  ctx.reply('Сколько за наличные:');
  return ctx.waitForInput((msg) => {
    // Заглушка для cash_amount
    ctx.reply(`Результат: ${msg.text}`);
  });
});

bot.hears(config.SN_TRIGGERS, (ctx) => {
  ctx.reply('Введите серийный номер для обрезки:');
  return ctx.waitForInput((msg) => {
    // Заглушка для sn_cutter
    ctx.reply(`Обрезанный номер: ${msg.text.replace('S', '')}`);
  });
});

bot.hears(config.WW_TRIGGERS, (ctx) => {
  ctx.reply('Хочешь узнать кто работает?', Markup.inlineKeyboard([
    [Markup.button.callback('Сегодня', 'today')],
    [Markup.button.callback('Завтра', 'tomorrow')]
  ]));
});

bot.action(['today', 'tomorrow'], (ctx) => {
  // Заглушка для who_work
  ctx.reply(`Информация о работе: ${ctx.callbackQuery.data}`);
});

// Заглушки для остальных обработчиков
bot.hears(config.MEGACALC_TRIGGERS, (ctx) => {
  ctx.reply('Мегакалькулятор запущен');
  // megacalculator.start_megacalculator(bot, ctx);
});

bot.hears(config.USD_RATE_COMMANDS, (ctx) => {
  ctx.reply('Курс доллара');
  // handle_usd_rate(bot, ctx);
});

bot.hears(config.CLASSIFICATOR_TRIGGERS, (ctx) => {
  ctx.reply('Что вы хотите найти по Model?');
  return ctx.waitForInput((msg) => {
    // process_model_input(bot, msg);
  });
});

bot.hears(config.GENPDF_TRIGGERS, (ctx) => {
  ctx.reply('Генерация PDF');
  // genpdf.start_survey(bot, ctx);
});

// Команды
bot.command('restart', (ctx) => {
  ctx.reply('Перезапуск...');
  process.exit(0);
});

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

// Обработка документов
bot.on('document', async (ctx) => {
  if (ctx.from.id !== 184944023) {
    return ctx.reply('У вас нет разрешения на загрузку файла.');
  }

  const fileId = ctx.message.document.file_id;
  const fileName = ctx.message.document.file_name;

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);
    // Здесь должна быть логика скачивания файла
    ctx.reply('Модуль был сохранен.');
    process.exit(0);
  } catch (error) {
    ctx.reply('Ошибка при загрузке файла');
  }
});

// Обработка текста
bot.on('text', async (ctx) => {
  await ctx.reply('Ищу информацию на сайте Хатико');
  // const result = await send_data(ctx.message.text);
  const result = 'Результат поиска'; // Заглушка
  ctx.reply(result);
});

// Вспомогательные функции
function contact_us(ctx) {
  ctx.reply('Все вопросы Сергею из Балаково');
}

function test_table(ctx) {
  DEBUG_LVL = !DEBUG_LVL;
  ctx.reply(`Режим отладки: ${DEBUG_LVL}`);
}

function discount_price(ctx) {
  try {
    const originalPrice = parseFloat(ctx.message.text);
    ctx.reply('Введите скидку:');
    return ctx.waitForInput((msg) => {
      const discount = parseFloat(msg.text);
      // Заглушка для process_discount
      ctx.reply(`Цена со скидкой: ${originalPrice - discount}`);
    });
  } catch (error) {
    ctx.reply('Что-то пошло не так, используй цифры');
  }
}

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
});

// Обработка ошибок
process.on('uncaughtException', handleException);
process.on('unhandledRejection', handleException);