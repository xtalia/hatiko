// ==UserScript==
// @name         Price Calculator
// @namespace    https://github.com/xtalia/vscode/blob/main/memchat/js/price_calculator.js
// @version      1.7.8
// @description  Добавляет окошко для расчета цен с возможностью сворачивания и вывода результатов в текстовое поле, а также с функцией для расчета скидки
// @author       Serg
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Проверка на запуск в iframe
    if (window.self !== window.top) {
        return; // Прекратить выполнение скрипта, если он запущен в iframe
    }

        /*

    Переменные

    */


    // Константы для расчетов
    const UPDATE_INTERVAL = 12 * 60 * 60 * 1000; // 12 часов
    let rateConfigurations = {};
    let previousRateConfigurations = {};
    const jsonUrl = "https://raw.githubusercontent.com/xtalia/hatiko/refs/heads/main/js/calculatorRates.json";



    let calculatorVisible = true;
    let container;




    /*

    ФУНКЦИИ

    */

        // Функция загрузки данных из JSON
async function loadRateConfigurations() {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки JSON: ${response.status}`);
        }
        rateConfigurations = await response.json();
        console.log("Данные rateConfigurations загружены:", rateConfigurations);

        // Сохранить загруженные данные в локальное хранилище
        saveToLocalStorage(rateConfigurations);
    } catch (error) {
        console.error("Не удалось загрузить данные для rateConfigurations:", error);

        // Попытка загрузки из локального хранилища
        const savedData = loadFromLocalStorage();
        if (savedData) {
            rateConfigurations = savedData;
            console.log("Используются данные из локального хранилища:", rateConfigurations);
        } else {
            console.error("Данные недоступны в локальном хранилище.");
        }
    }
}


    async function forceUpdateRateConfigurations() {
    await loadRateConfigurations();
    alert("Данные обновлены вручную.");
}

    // Функция для сохранения данных в локальное хранилище
function saveToLocalStorage(data) {
    localStorage.setItem("rateConfigurations", JSON.stringify(data));
}

// Функция для загрузки данных из локального хранилища
function loadFromLocalStorage() {
    const savedData = localStorage.getItem("rateConfigurations");
    return savedData ? JSON.parse(savedData) : null;
}
    function createCalculator() {
        container = document.createElement('div');
        container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 250px; background: linear-gradient(to bottom right, #f0f0f0, #e0e0e0); border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 15px; z-index: 1000;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; cursor: pointer;';

        const title = document.createElement('span');
        title.textContent = `🧮 Калькулятор ${GM_info.script.version}`;
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        header.appendChild(title);

        const toggleButton = document.createElement('span');
        toggleButton.textContent = '▲';
        toggleButton.style.cssText = 'font-size: 14px;';
        header.appendChild(toggleButton);

        header.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            toggleButton.textContent = content.style.display === 'none' ? '▼' : '▲';
        });

        container.appendChild(header);

        const content = document.createElement('div');
        content.style.display = 'block';

        const cashInput = createInputElement('number', 'Введите сумму');
        cashInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                calculate(); // Запускает расчёт по нажатию Enter
            }
        });
content.appendChild(cashInput);

        const modeSelect = createSelectElement([
            { value: 'all', text: 'Для всех' },
            { value: 'balakovo', text: 'Для Балаково' },
            { value: 'prepay', text: 'Предоплата 5%' }
        ]);
        content.appendChild(modeSelect);

        const calculateButton = createButtonElement('Посчитать', () => calculate());
        content.appendChild(calculateButton);

        const reverseButton = createButtonElement('Реверс', () => reverseCalculate());
        reverseButton.style.backgroundColor = '#f44336'; // Красная кнопка
        reverseButton.style.marginBottom = '5px'; // Пример уменьшенного размера
        content.appendChild(reverseButton);

        const resultField = createTextAreaElement('', 80);
        content.appendChild(resultField);

        const discountInput = createInputElement('number', 'Введите сумму скидки');
        content.appendChild(discountInput);

        const applyDiscountButton = createButtonElement('Применить скидку', () => applyDiscount());
        content.appendChild(applyDiscountButton);

function reverseCalculate() {
    const reverseAmount = parseFloat(cashInput.value);
    const mode = modeSelect.value;
    const rates = rateConfigurations[mode];

    // Восстанавливаем исходные суммы для режима Балаково
    const originalQrPrice = Math.round(reverseAmount / rates.qr);
    const originalCardPrice = Math.round(reverseAmount / rates.card);

    // Рассчитываем реверс для рассрочки на 6, 10, 12, 18 и 24 месяца с новыми процентами
    const originalRassrochkaSix = Math.round(reverseAmount / rates.six);
    const originalRassrochkaTen = Math.round(reverseAmount / rates.ten);
    const originalRassrochkaTwelve = Math.round(reverseAmount / rates.twelve || reverseAmount);
    const originalRassrochkaEighteen = Math.round(reverseAmount / rates.eighteen || reverseAmount);
    const originalRassrochkaTwentyFour = Math.round(reverseAmount / rates.twentyfour || reverseAmount);
    const originalRassrochkaThirtySix = Math.round(reverseAmount / rates.thirtysix || reverseAmount);
    // const originalCreditPrice = Math.round(reverseAmount / rates.credit);

    // Формируем результат с заголовком "РЕВЕРС"
    resultField.value = `
🔄 РЕВЕРС расчета:
🔹 QR: ${originalQrPrice} руб.
🔹 Карта: ${originalCardPrice} руб.
🔹 Рассрочка 6 мес: ${originalRassrochkaSix} руб.
🔹 Рассрочка 10 мес: ${originalRassrochkaTen} руб.
🔹 Рассрочка 12 мес: ${originalRassrochkaTwelve} руб.
🔹 Рассрочка 18 мес: ${originalRassrochkaEighteen} руб.
🔹 Рассрочка 24 мес: ${originalRassrochkaTwentyFour} руб.
🔹 Рассрочка 36 мес: ${originalRassrochkaThirtySix} руб.

`.trim();
    //🔹 Кредит: ${originalCreditPrice} руб.
}


function calculate() {

    const cash = parseFloat(cashInput.value);
    const mode = modeSelect.value;

    // Проверка на корректность ввода
    if (isNaN(cash) || cash <= 0) {
        resultField.value = 'Ошибка: Введите корректную сумму.';
        return;
    }
    if (mode === 'prepay') {
        const prepayPercentage = 0.05;
        const prepayAmount = Math.ceil(cash * prepayPercentage / 500) * 500; // Округление до 500
        resultField.value = `Предоплата 5%: ${prepayAmount} рублей\n`;
        return;
    }

    const rates = rateConfigurations[mode];
    const credit_month = 36;

    const qr_price = Math.round(cash * rates.qr / 100) * 100 - 10;
    const card_price = Math.round(cash * rates.card / 100) * 100 - 10;
    const rassrochka_price_six = Math.round(cash * rates.six / 100) * 100 - 10;
    const rassrochka_price_ten = Math.round(cash * rates.ten / 100) * 100 - 10;
    const rassrochka_price_twelve = Math.round(cash * rates.twelve / 100) * 100 - 10;
    const rassrochka_price_eighteen = Math.round(cash * rates.eighteen / 100) * 100 - 10;
    const rassrochka_price_twentyfour = Math.round(cash * rates.twentyfour / 100) * 100 - 10;
    const rassrochka_price_thirtysix = Math.round(cash * rates.thirtysix / 100) * 100 - 10;
    // const credit_price = Math.round(cash * rates.credit / 100) * 100 - 10;
    const cashback_amount = Math.round(cash * 0.01);

    // const twenty = Math.round(credit_price * ((20 / 12 / 100) * (1 + (20 / 12 / 100)) ** credit_month) / (((1 + (20 / 12 / 100)) ** credit_month) - 1));
    // const forty = Math.round(credit_price * ((40 / 12 / 100) * (1 + (40 / 12 / 100)) ** credit_month) / (((1 + (40 / 12 / 100)) ** credit_month) - 1));

    resultField.value = `
💵 Наличными: ${cash} руб.
📷 QR: ${qr_price} руб.
💳 Картой: ${card_price} руб.

🏦 Рассрочка
🔹 6 мес.: ${rassrochka_price_six} руб. (от ${Math.round(rassrochka_price_six / 6)} руб./мес)
🔹 10 мес.: ${rassrochka_price_ten} руб. (от ${Math.round(rassrochka_price_ten / 10)} руб./мес)
🔹 12 мес.: ${rassrochka_price_twelve} руб. (от ${Math.round(rassrochka_price_twelve / 12)} руб./мес)
🔹 18 мес.: ${rassrochka_price_eighteen} руб. (от ${Math.round(rassrochka_price_eighteen / 18)} руб./мес)
🔹 24 мес.: ${rassrochka_price_twentyfour} руб. (от ${Math.round(rassrochka_price_twentyfour / 24)} руб./мес)
🔹 36 мес.: ${rassrochka_price_thirtysix} руб. (от ${Math.round(rassrochka_price_thirtysix / 36)} руб./мес)

💸 Кэшбэк: ${cashback_amount} баллами
`.trim();
    //🏛 Кредит: ${credit_price} руб. + % банка (от 20% до 40% годовых, условия уточнит менеджер)
}


        function applyDiscount() {
            const originalPrice = parseFloat(cashInput.value);
            const discount = parseFloat(discountInput.value);
            
            if (!isNaN(discount)) {
                const discountedPrice = originalPrice - discount;
                const discountPercentage = (discount / originalPrice) * 100;

                resultField.value = `
🎉 Применена скидка:
🔹 Изначальная цена: ${originalPrice} рублей
🔹 Скидка: ${discount} рублей
🔹 Процент скидки: ${discountPercentage} %
🔹 Сумма со скидкой: ${discountedPrice} рублей
`.trim();
            } else {
                resultField.value = 'Ошибка: Введите корректную сумму скидки (только цифры).';
            }
        }

        function createInputElement(type, placeholder) {
            const input = document.createElement('input');
            input.type = type;
            input.placeholder = placeholder;
            input.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;';
            return input;
        }

        function createSelectElement(options) {
            const select = document.createElement('select');
            select.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;';
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                select.appendChild(opt);
            });
            return select;
        }

        function createButtonElement(text, clickHandler) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; font-size: 14px; cursor: pointer; transition: background-color 0.3s;';
            button.addEventListener('click', clickHandler);
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#45a049';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#4CAF50';
            });
            return button;
        }

        function createTextAreaElement(value, height) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.cssText = 'width: 100%; height: ' + height + 'px; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;';
            textarea.readOnly = true;
            return textarea;
        }

        container.appendChild(content);
        document.body.appendChild(container);
    }

    function toggleCalculator() {
        if (calculatorVisible) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
        }
        calculatorVisible = !calculatorVisible;
    }

    function addMenuCommand() {
        GM_registerMenuCommand("Toggle Price Calculator", toggleCalculator);
        GM_registerMenuCommand("Обновить данные вручную", forceUpdateRateConfigurations);
    }

window.addEventListener('load', () => {
    // Загружаем данные из локального хранилища, если они есть
    const savedData = loadFromLocalStorage();
    if (savedData) {
        rateConfigurations = savedData;
        console.log("Данные rateConfigurations загружены из локального хранилища при запуске:", rateConfigurations);
    } else {
        // Иначе загружаем с сервера
        loadRateConfigurations();
    }

    // Создаем калькулятор и добавляем команду меню
    createCalculator();
    addMenuCommand();

    // Обновляем данные из JSON каждые 12 часов
    setInterval(loadRateConfigurations, UPDATE_INTERVAL);
});
})();
