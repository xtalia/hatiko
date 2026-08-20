const { Telegraf, Markup, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');
const waitingUsers = new Map();

// modules
const calculator = require('./modules/calculator');

// ИСПРАВЛЕНО: Правильное определение DEBUG_LVL
const DEBUG_LVL = config.DEBUG;
const bot = new Telegraf(DEBUG_LVL ? config.bot.token_debug : config.bot.token);

console.log(`🤖 Бот запущен в режиме: ${DEBUG_LVL ? 'DEBUG' : 'PRODUCTION'}`);

// Включаем сессии
bot.use(session());

// Простая система состояний
bot.use((ctx, next) => {
    if (!ctx.session) {
        ctx.session = {};
    }
    return next();
});

// Простая реализация waitForInput
function waitForInput(ctx, handler) {
    const userId = ctx.from.id;
    waitingUsers.set(userId, handler);
    
    setTimeout(() => {
        if (waitingUsers.has(userId)) {
            waitingUsers.delete(userId);
            // Можно добавить уведомление о таймауте
            // ctx.reply('⏰ Время ожидания истекло');
        }
    }, 120000);
}



bot.start((ctx) => {
    ctx.reply('Привет! Напиши что надо или выбери команды');
});

// Кто работает
// Курс валют
// Инфа от сайта Хатико
// Test

// Обработчик калькулятора
bot.hears(config.CALCULATE_TRIGGERS, (ctx) => {
    console.log('🔔 CALCULATE_TRIGGER сработал:', ctx.message.text);
    ctx.reply('💵 Введите сумму для расчета:');
    
    waitForInput(ctx, (msg) => {
        try {
            const amount = parseFloat(msg.text);
            const result = calculator.calculate(amount, 'balakovo');
            ctx.reply(result.formatted);
        } catch (error) {
            console.error('Ошибка калькулятора:', error);
            ctx.reply('❌ Ошибка: введите корректное число');
        }
    });
});

// Обработчик скидки - ИСПРАВЛЕН
bot.hears(['скидка', 'discount'], (ctx) => {
    console.log('🔔 DISCOUNT_TRIGGER сработал:', ctx.message.text);
    ctx.reply('Введите исходную цену:');
    
    waitForInput(ctx, (msg1) => {
        try {
            const price = parseFloat(msg1.text);
            
            ctx.reply('Введите размер скидки:');
            
            waitForInput(ctx, (msg2) => {
                try {
                    const discount = parseFloat(msg2.text);
                    const result = calculator.processDiscount(price, discount);
                    ctx.reply(result.text);
                } catch (error) {
                    console.error('Ошибка скидки (шаг 2):', error);
                    ctx.reply('❌ Ошибка: введите корректное число для скидки');
                }
            });
            
        } catch (error) {
            console.error('Ошибка скидки (шаг 1):', error);
            ctx.reply('❌ Ошибка: введите корректное число для цены');
        }
    });
});

// Export config
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
        console.error('Ошибка экспорта:', error);
        ctx.reply('Ошибка при выгрузке файла');
    }
});

// Обработчик сообщений ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
bot.on('message', (ctx) => {
    const userId = ctx.from.id;
    
    if (waitingUsers.has(userId)) {
        const handler = waitingUsers.get(userId);
        waitingUsers.delete(userId);
        
        try {
            handler(ctx.message);
        } catch (error) {
            console.error('Ошибка в waitForInput handler:', error);
            ctx.reply('❌ Ошибка обработки');
        }
        return;
    }
    
    handleRegularMessage(ctx);
});

// hatiko
async function handleRegularMessage(ctx) {
    try {
        console.log('🔍 Обычное сообщение:', ctx.message.text);
        await ctx.reply('🔍 Ищу информацию на сайте Хатико...');
        // Здесь ваш код поиска
        // const result = await searchData(ctx.message.text);
        // await ctx.reply(result);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        await ctx.reply('⚠️ Произошла ошибка при поиске, но бот продолжает работать!');
    }
}

// Глобальный обработчик ошибок для всех middleware
bot.catch((err, ctx) => {
    console.error(`❌ Ошибка в обработчике:`, err);
    
    try {
        ctx.reply('😅 Произошла ошибка при обработке запроса. Попробуйте еще раз.');
    } catch (e) {
        console.error('Не удалось отправить сообщение об ошибке:', e);
    }
});

// Глобальные обработчики ошибок процесса
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('Stack:', reason.stack);
});

process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION:');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('⚠️ Process will continue running!');
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    console.error('👀 UNCAUGHT EXCEPTION MONITOR:');
    console.error('Error:', error);
    console.error('Origin:', origin);
});

// Запуск бота
bot.launch().then(() => {
    console.log('✅ Бот успешно запущен!');
}).catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
});