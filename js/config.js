const isDebug = process.argv.includes('--debug') || process.argv.includes('-d');

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config/config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Добавляем триггеры которые были в Python конфиге
configData.UPDATE_TRIGGERS = ["кнопки", "buttons", "меню"];
configData.TEST_TRIGGERS = ["тест", "test"];
configData.CALCULATE_TRIGGERS = ["калькулятор", "посчитай", "calc", "/calc"];
configData.SN_TRIGGERS = ["серийник", "serial", "sn", "/sn"];
configData.WW_TRIGGERS = ["кто работает", "who work", "who", "/who"];
configData.MEGACALC_TRIGGERS = ["мегакалькулятор", "megacalc", "/megacalc"];
configData.USD_RATE_COMMANDS = ["курс", "доллар", "usd", "/usd"];
configData.CLASSIFICATOR_TRIGGERS = ["классификатор", "classifier", "/classify"];
configData.GENPDF_TRIGGERS = ["трейдиндок", "трейд-ин", "trade-in", "/tradedoc"];
configData.SITE_TRIGGERS = ["хатико", "hatiko", "сайт"];

module.exports = configData;
module.exports.DEBUG = isDebug;