// ==UserScript==
// @name         Мемный чат с калькулятором и Trade-In
// @namespace    http://tampermonkey.net/
// @version      2.1.1
// @description  Набор скриптов для проверки цен, работы с Hatiko, калькулятором и Trade-In
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

'use strict';

// Константы
const superserver = 'memchat.tw1.ru:5000'; // Основной сервер
const baseUrls = [ // Базовые URL для Hatiko
    "https://hatiko.ru",
    "https://voronezh.hatiko.ru",
    "https://lipetsk.hatiko.ru",
    "https://balakovo.hatiko.ru"
];

// Константы для калькулятора
const UPDATE_INTERVAL = 12 * 60 * 60 * 1000; // 12 часов
let rateConfigurations = {};
const jsonUrl = "https://raw.githubusercontent.com/xtalia/hatiko/refs/heads/main/js/calculatorRates.json";

// Переменные для управления окнами
let isDragging = false;
let offset = { x: 0, y: 0 };

// Переменные для управления очисткой текста
let enabled = false;  // По умолчанию скрипт отключен
let commandId;

// Универсальная функция для выполнения запросов к серверу
function fetchServerData(url, onSuccess, onError) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function(response) {
            if (response.status === 200) {
                onSuccess(response);
            } else {
                onError(`Ошибка: ${response.statusText}`);
            }
        },
        onerror: function(error) {
            onError(`Ошибка при выполнении запроса: ${error}`);
        }
    });
}

// Функция для раскрытия всех скрытых элементов в карточке товара
function showAllTabContents() {
    const hiddenElements = document.querySelectorAll('.tab-content .hidden');
    hiddenElements.forEach(element => {
        element.classList.remove('hidden');
    });
}

// Функция для создания окна проверки цен
function createPriceCheckWindow() {
    if (!window.priceCheckContainer) {
        const container = document.createElement('div');
        container.setAttribute('id', 'priceCheckContainer');
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 360px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            padding: 10px;
            display: none;
            z-index: 9999;
            box-sizing: border-box;
        `;

        // Внутренняя структура окна
        container.innerHTML = `
            <div id="priceCheckHeader" style="font-size: 18px; font-weight: bold; margin-bottom: 10px; user-select: none; cursor: move;">
                Мемный чат
                <span id="priceCheckCloseButton" style="position: absolute; top: 10px; right: 10px; cursor: pointer;">&#10006;</span>
            </div>
            <div style="margin-bottom: 10px;">
                <input type="text" id="priceCheckInput" placeholder="Введите запрос..." style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 10px;">
                <textarea id="priceCheckResult" style="width: 100%; height: 120px; resize: none; border-radius: 5px; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;" readonly></textarea>
            </div>
            <div id="priceCheckControls" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">
                <button id="priceCheckButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🤖</button>
                <button id="hatikoButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🐶</button>
                <button id="copyButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">📋</button>
                <button id="whoWorksTodayButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">👨‍💼 Сегодня</button>
                <button id="whoWorksTomorrowButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">👨‍💼 Завтра</button>
                <button id="calculatorButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🧮 Калькулятор</button>
                <button id="tradeInButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">📱 Trade-In</button>
                <button id="showAllTabsButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">📂 Раскрыть все</button>
                <button id="toggleClearTextAndTimeoutButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🧹 Очистка и задержка</button>
            </div>

            <!-- Калькулятор -->
            <div id="calculator" style="display: none; margin-top: 10px;">
                <div style="margin-bottom: 10px;">
                    <input type="number" id="calculatorCashInput" placeholder="Введите сумму" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
                </div>
                <div style="margin-bottom: 10px;">
                    <select id="calculatorModeSelect" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
                        <option value="all">Для всех</option>
                        <option value="balakovo">Для Балаково</option>
                        <option value="prepay">Предоплата 5%</option>
                    </select>
                </div>
                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                    <button id="calculatorCalculateButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">Посчитать</button>
                    <button id="calculatorReverseButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #f44336; color: white; cursor: pointer;">Реверс</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <textarea id="calculatorResultField" style="width: 100%; height: 80px; resize: none; border-radius: 5px; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;" readonly></textarea>
                </div>
                <div style="margin-bottom: 10px;">
                    <input type="number" id="calculatorDiscountInput" placeholder="Введите сумму скидки" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
                </div>
                <button id="calculatorApplyDiscountButton" style="width: 100%; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">Применить скидку</button>
            </div>

            <!-- Калькулятор Trade-In -->
            <div id="tradeInCalculator" style="display: none; margin-top: 10px;">
                <div style="margin-bottom: 10px;">
                    <select id="tradeInModelSelect" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;"></select>
                </div>
                <div style="margin-bottom: 10px;">
                    <select id="tradeInMemorySelect" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;"></select>
                </div>
                <div style="margin-bottom: 10px;">
                    <select id="tradeInBatterySelect" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
                        <option value="90">90%+</option>
                        <option value="85">85-90%</option>
                        <option value="0">менее 85%</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <select id="tradeInConditionSelect" style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
                        <option value="excellent">Отлично</option>
                        <option value="good">Хорошо</option>
                        <option value="average">Среднее</option>
                        <option value="poor">Плохое</option>
                    </select>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>
                        <input type="checkbox" id="backCoverCheck"> Замена крышки
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>
                        <input type="checkbox" id="screenCheck"> Замена дисплея
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <textarea id="tradeInResult" style="width: 100%; height: 100px; resize: none; border-radius: 5px; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;" readonly></textarea>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button id="tradeInCalculateButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">Рассчитать</button>
                    <button id="tradeInCloseButton" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #f44336; color: white; cursor: pointer;">Закрыть</button>
                </div>
            </div>

            <!-- Окно для очистки текста и настройки задержки -->
            <div id="clearTextAndTimeoutWindow" style="display: none; margin-top: 10px;">
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="clearTextCheckbox"> Очищать текст после Enter
                    <span style="flex: 1;">
                        Задержка (мс): <input type="range" id="timeoutSlider" min="1" max="1000" value="500">
                        <span id="timeoutValue">500</span>
                    </span>
                </label>
            </div>
        `;

        document.body.appendChild(container);

        // Настройка перетаскивания окна
        const header = document.getElementById('priceCheckHeader');
        header.addEventListener('mousedown', startDrag);

        // Обработчики кнопок
        document.getElementById('priceCheckButton').addEventListener('click', checkPrice);
        document.getElementById('hatikoButton').addEventListener('click', checkHatiko);
        document.getElementById('copyButton').addEventListener('click', copyText);
        document.getElementById('whoWorksTodayButton').addEventListener('click', () => fetchWhoWorks('today'));
        document.getElementById('whoWorksTomorrowButton').addEventListener('click', () => fetchWhoWorks('tomorrow'));
        document.getElementById('calculatorButton').addEventListener('click', toggleCalculator);
        document.getElementById('tradeInButton').addEventListener('click', toggleTradeInCalculator);
        document.getElementById('showAllTabsButton').addEventListener('click', showAllTabContents);
        document.getElementById('toggleClearTextAndTimeoutButton').addEventListener('click', () => {
            const clearTextAndTimeoutWindow = document.getElementById('clearTextAndTimeoutWindow');
            clearTextAndTimeoutWindow.style.display = clearTextAndTimeoutWindow.style.display === 'none' ? 'block' : 'none';
        });


        // Обработчики кнопок калькулятора
document.getElementById('calculatorCalculateButton').addEventListener('click', calculate);
document.getElementById('calculatorReverseButton').addEventListener('click', reverseCalculate);
document.getElementById('calculatorApplyDiscountButton').addEventListener('click', applyDiscount);

        // Обработчик для галочки очистки текста
        document.getElementById('clearTextCheckbox').addEventListener('change', (event) => {
            enabled = event.target.checked;
        });

        // Обработчик для ползунка задержки
        document.getElementById('timeoutSlider').addEventListener('input', (event) => {
            const timeoutValue = document.getElementById('timeoutValue');
            timeoutValue.textContent = event.target.value;
        });

        // Обработчик Enter в поле ввода
        document.getElementById('priceCheckInput').addEventListener('keypress', (event) => {
            if (event.key === 'Enter') checkPrice();
        });

        // Кнопка закрытия окна
        document.getElementById('priceCheckCloseButton').addEventListener('click', () => {
            container.style.display = 'none';
        });

        window.priceCheckContainer = container;
    }

    // Показываем окно и фокусируемся на поле ввода
    window.priceCheckContainer.style.display = 'block';
    document.getElementById('priceCheckInput').focus();
    resetTextareaHeight();
}

// Функция для копирования текста из textarea
function copyText() {
    const resultTextarea = document.getElementById('priceCheckResult');
    resultTextarea.select();
    document.execCommand('copy');
    alert('Текст скопирован!');
}

// Функция для парсинга HTML и извлечения данных
function parseHTML(responseText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseText, "text/html");
    const product = doc.querySelector("a.s-product-header");
    if (product) {
        const title = product.getAttribute("title");
        const relativeLink = product.getAttribute("href");
        const priceElement = doc.querySelector("span.price");
        const price = priceElement ? priceElement.textContent.replace(" ", "") : "Нет данных";
        const link = new URL(relativeLink, baseUrls[0]).href;
        return { title, price, link };
    }
    return { title: "Нет данных", price: "Нет данных", link: "Нет данных" };
}

// Функция для проверки цен через Hatiko
function checkHatiko() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (query !== '') {
        const urls = baseUrls.map(url => `${url}/search/?query=${encodeURIComponent(query)}`);
        let results = [];
        let requestsCompleted = 0;

        urls.forEach((url, index) => {
            fetchServerData(
                url,
                function(response) {
                    const data = parseHTML(response.responseText);
                    results[index] = { ...data, link: `${baseUrls[index]}${new URL(data.link).pathname}` };
                    requestsCompleted++;
                    if (requestsCompleted === urls.length) {
                        let messageText = `🧭 ${results[0].title}\n`;
                        messageText += `🪙🆂 ${results[0].price}\n`;
                        messageText += `🪙🆅 ${results[1].price}\n`;
                        messageText += `🪙🅻 ${results[2].price}\n`;
                        messageText += `🪙🗿 ${results[3].price}\n\n`;
                        messageText += `🌐🆂: ${results[0].link}\n`;
                        messageText += `🌐🆅: ${results[1].link}\n`;
                        messageText += `🌐🅻: ${results[2].link}\n`;
                        messageText += `🌐🗿: ${results[3].link}`;

                        document.getElementById('priceCheckResult').value = messageText;
                        resetTextareaHeight();
                    }
                },
                function(error) {
                    document.getElementById('priceCheckResult').value = error;
                }
            );
        });
    } else {
        document.getElementById('priceCheckResult').value = 'Введите запрос';
        resetTextareaHeight();
    }
}

// Функции для перетаскивания окна
function startDrag(e) {
    isDragging = true;
    const rect = window.priceCheckContainer.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

function drag(e) {
    if (isDragging) {
        window.priceCheckContainer.style.right = 'auto';
        window.priceCheckContainer.style.left = `${e.clientX - offset.x}px`;
        window.priceCheckContainer.style.top = `${e.clientY - offset.y}px`;
    }
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

// Функция для проверки цен через основной сервер
function checkPrice() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (query !== '') {
        const url = `http://${superserver}/memchat?query=${encodeURIComponent(query)}`;
        fetchServerData(
            url,
            function(response) {
                document.getElementById('priceCheckResult').value = response.responseText;
                resetTextareaHeight();
            },
            function(error) {
                document.getElementById('priceCheckResult').value = error;
            }
        );
    } else {
        document.getElementById('priceCheckResult').value = 'Введите запрос';
        resetTextareaHeight();
    }
}

// Функция для сброса высоты textarea
function resetTextareaHeight() {
    const textarea = document.getElementById('priceCheckResult');
    if (textarea) {
        textarea.style.height = '120px';
    }
}

// Функция для принудительного обновления цен
function forceUpdate() {
    const url = `http://${superserver}/memchat?force=true`;
    fetchServerData(
        url,
        function(response) {
            alert('Принудительное обновление выполнено успешно!');
        },
        function(error) {
            alert(error);
        }
    );
}

// Функция для получения информации о том, кто работает
function fetchWhoWorks(day) {
    const url = `http://${superserver}/who_work?day=${day}`;
    fetchServerData(
        url,
        function(response) {
            const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
            if (contentType.includes('json')) {
                const data = JSON.parse(response.responseText);
                document.getElementById('priceCheckResult').value = data.text.replace(/\n/g, '\n');
            } else {
                document.getElementById('priceCheckResult').value = 'Ошибка: Ответ не в формате JSON';
            }
        },
        function(error) {
            document.getElementById('priceCheckResult').value = error;
        }
    );
}

// Функции для калькулятора
async function loadRateConfigurations() {
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error(`Ошибка загрузки JSON: ${response.status}`);
        }
        rateConfigurations = await response.json();
        console.log("Данные rateConfigurations загружены:", rateConfigurations);
        saveToLocalStorage(rateConfigurations);
    } catch (error) {
        console.error("Не удалось загрузить данные для rateConfigurations:", error);
        const savedData = loadFromLocalStorage();
        if (savedData) {
            rateConfigurations = savedData;
            console.log("Используются данные из локального хранилища:", rateConfigurations);
        } else {
            console.error("Данные недоступны в локальном хранилище.");
            rateConfigurations = {}; // Убедимся, что rateConfigurations не undefined
        }
    }
}

function saveToLocalStorage(data) {
    localStorage.setItem("rateConfigurations", JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem("rateConfigurations");
    return savedData ? JSON.parse(savedData) : null;
}

function calculate() {
    const cashInput = document.getElementById('calculatorCashInput');
    const modeSelect = document.getElementById('calculatorModeSelect');
    const resultField = document.getElementById('calculatorResultField');

    const cash = parseFloat(cashInput.value);
    const mode = modeSelect.value;

    if (isNaN(cash) || cash <= 0) {
        resultField.value = 'Ошибка: Введите корректную сумму.';
        return;
    }

    if (mode === 'prepay') {
        const prepayPercentage = 0.05;
        const prepayAmount = Math.ceil(cash * prepayPercentage / 500) * 500;
        resultField.value = `Предоплата 5%: ${prepayAmount} рублей\n`;
        return;
    }

    // Проверяем, загружены ли данные для выбранного режима
    if (!rateConfigurations[mode]) {
        resultField.value = 'Ошибка: Данные для выбранного режима не загружены.';
        return;
    }

    const rates = rateConfigurations[mode];
    const qr_price = Math.round(cash * rates.qr / 100) * 100 - 10;
    const card_price = Math.round(cash * rates.card / 100) * 100 - 10;
    const rassrochka_price_six = Math.round(cash * rates.six / 100) * 100 - 10;
    const rassrochka_price_ten = Math.round(cash * rates.ten / 100) * 100 - 10;
    const rassrochka_price_twelve = Math.round(cash * rates.twelve / 100) * 100 - 10;
    const rassrochka_price_eighteen = Math.round(cash * rates.eighteen / 100) * 100 - 10;
    const rassrochka_price_twentyfour = Math.round(cash * rates.twentyfour / 100) * 100 - 10;
    const rassrochka_price_thirtysix = Math.round(cash * rates.thirtysix / 100) * 100 - 10;
    const cashback_amount = Math.round(cash * 0.01);

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
}

function reverseCalculate() {
    const cashInput = document.getElementById('calculatorCashInput');
    const modeSelect = document.getElementById('calculatorModeSelect');
    const resultField = document.getElementById('calculatorResultField');

    const reverseAmount = parseFloat(cashInput.value);
    const mode = modeSelect.value;

    if (isNaN(reverseAmount) || reverseAmount <= 0) {
        resultField.value = 'Ошибка: Введите корректную сумму.';
        return;
    }

    const rates = rateConfigurations[mode];
    const originalQrPrice = Math.round(reverseAmount / rates.qr);
    const originalCardPrice = Math.round(reverseAmount / rates.card);
    const originalRassrochkaSix = Math.round(reverseAmount / rates.six);
    const originalRassrochkaTen = Math.round(reverseAmount / rates.ten);
    const originalRassrochkaTwelve = Math.round(reverseAmount / rates.twelve || reverseAmount);
    const originalRassrochkaEighteen = Math.round(reverseAmount / rates.eighteen || reverseAmount);
    const originalRassrochkaTwentyFour = Math.round(reverseAmount / rates.twentyfour || reverseAmount);
    const originalRassrochkaThirtySix = Math.round(reverseAmount / rates.thirtysix || reverseAmount);

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
}

function applyDiscount() {
    const cashInput = document.getElementById('calculatorCashInput');
    const discountInput = document.getElementById('calculatorDiscountInput');
    const resultField = document.getElementById('calculatorResultField');

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

// Функция для показа/скрытия калькулятора
function toggleCalculator() {
    const calculator = document.getElementById('calculator');
    if (calculator.style.display === 'none') {
        calculator.style.display = 'block'; // Показываем калькулятор
    } else {
        calculator.style.display = 'none'; // Скрываем калькулятор
    }
}

// Функция для показа/скрытия калькулятора Trade-In
function toggleTradeInCalculator() {
    const tradeInCalculator = document.getElementById('tradeInCalculator');
    if (tradeInCalculator.style.display === 'none') {
        tradeInCalculator.style.display = 'block';
        loadTradeInData(); // Загружаем данные для Trade-In
    } else {
        tradeInCalculator.style.display = 'none';
    }
}

// Функция для загрузки данных Trade-In
function loadTradeInData() {
    const url = `http://${superserver}/load_tn`;
    fetchServerData(
        url,
        function(response) {
            if (response.status === 200) {
                const data = JSON.parse(response.responseText);
                populateTradeInOptions(data);
            } else {
                console.error('Ошибка при загрузке данных Trade-In');
            }
        },
        function(error) {
            console.error('Ошибка при загрузке данных Trade-In:', error);
        }
    );
}

// Функция для заполнения выпадающих списков Trade-In
function populateTradeInOptions(data) {
    const modelSelect = document.getElementById('tradeInModelSelect');
    modelSelect.innerHTML = '';
    for (const model in data) {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    }

    // Обновляем список памяти при выборе модели
    modelSelect.addEventListener('change', () => {
        const memorySelect = document.getElementById('tradeInMemorySelect');
        memorySelect.innerHTML = '';
        const selectedModel = modelSelect.value;
        if (data[selectedModel]) {
            data[selectedModel].forEach(item => {
                const option = document.createElement('option');
                option.value = item.memory;
                option.textContent = `${item.memory} GB`;
                memorySelect.appendChild(option);
            });
        }
    });

    // Обработчик для кнопки расчета
    document.getElementById('tradeInCalculateButton').addEventListener('click', () => {
        calculateTradeIn(data);
    });
}

// Функция для расчета Trade-In
function calculateTradeIn(data) {
    const model = document.getElementById('tradeInModelSelect').value;
    const memory = document.getElementById('tradeInMemorySelect').value;
    const battery = document.getElementById('tradeInBatterySelect').value;
    const condition = document.getElementById('tradeInConditionSelect').value;
    const backCover = document.getElementById('backCoverCheck').checked; // Добавляем чекбокс для крышки
    const screen = document.getElementById('screenCheck').checked; // Добавляем чекбокс для дисплея

    const modelData = data[model].find(item => item.memory === memory);
    if (!modelData) {
        document.getElementById('tradeInResult').value = 'Ошибка: Данные для выбранной модели не найдены.';
        return;
    }

    let price = parseInt(modelData.ideal_price, 10);

    // Корректировка цены в зависимости от состояния батареи
    if (battery === '0') {
        price += parseInt(modelData.battery_replacement, 10);
    } else if (battery === '85') {
        price += parseInt(modelData.battery_wear, 10);
    }

    // Корректировка цены в зависимости от состояния устройства
    if (condition === 'average') {
        price -= price < 20000 ? 2000 : 1000;
    } else if (condition === 'poor') {
        price -= price < 20000 ? 3000 : 2000;
    }

    // Учет замены крышки
    if (backCover) {
        price += parseInt(modelData.back_cover_replacement, 10);
    }

    // Учет замены дисплея
    if (screen) {
        price += parseInt(modelData.screen_replacement, 10);
    }

    // Статус крышки и дисплея
    const backCoverStatus = backCover ? '🔧 Требуется замена крышки' : '✅ Крышка в порядке';
    const screenStatus = screen ? '🔧 Требуется замена дисплея' : '✅ Дисплей в порядке';

    const conditionEmoji = condition === 'excellent' ? '😎' :
                          condition === 'good' ? '😀' :
                          condition === 'average' ? '😐' : '😢';

    const result = `
📱 Модель: ${model} (${memory} GB)
🔋 Батарея: ${battery === '90' ? '90%+' : battery === '85' ? '85-90%' : 'менее 85%'}
📦 Состояние: ${condition === 'excellent' ? 'Отлично' : condition === 'good' ? 'Хорошо' : condition === 'average' ? 'Среднее' : 'Плохо'}
${backCoverStatus}
${screenStatus}
${conditionEmoji} Состояние: ${condition === 'excellent' ? 'Отличное' : condition === 'good' ? 'Хорошее' : condition === 'average' ? 'Среднее' : 'Плохое'}

💰 Предварительная цена: ${price} рублей

👉 Окончательная стоимость будет известна только при непосредственной проверке в магазине
    `;

    document.getElementById('tradeInResult').value = result;
}

// Функция для очистки текста после нажатия Enter
function clearText(event) {
    if (event.key === "Enter" && enabled) {
        const timeoutValue = parseInt(document.getElementById('timeoutSlider').value, 10);
        setTimeout(() => {
            event.target.value = ""; // Очистка текстового поля
        }, timeoutValue);  // Выполняется после обработки ввода на странице
    }
}

// Функция переключения состояния скрипта (включение/отключение)
function toggleScript() {
    enabled = !enabled;
    updateMenu();
}

// Функция обновления пункта меню
function updateMenu() {
    if (commandId) {
        GM_unregisterMenuCommand(commandId);
    }
    const menuText = enabled ? "Отключить очистку текста по Enter" : "Включить очистку текста по Enter";
    commandId = GM_registerMenuCommand(menuText, toggleScript);
}

// Инициализация
document.addEventListener('keyup', clearText, true);
updateMenu();

// Инициализация скрипта
function initialize() {
    registerMenuCommands();
    console.log('Initialization complete');

    // Инициализация калькулятора
    loadRateConfigurations(); // Загружаем данные при запуске

    // Обновляем данные из JSON каждые 12 часов
    setInterval(loadRateConfigurations, UPDATE_INTERVAL);
}

// Регистрация команд меню
function registerMenuCommands() {
    GM_registerMenuCommand('Раскрыть всю карточку товара', showAllTabContents, 'S');
    GM_registerMenuCommand('Проверка цен', createPriceCheckWindow);
    GM_registerMenuCommand('Обновить принудительно цены', forceUpdate);
    GM_registerMenuCommand('Показать кто работает сегодня', () => fetchWhoWorks('today'));
    GM_registerMenuCommand('Показать кто работает завтра', () => fetchWhoWorks('tomorrow'));
    GM_registerMenuCommand('Оценка Trade-In', toggleTradeInCalculator);
}

window.addEventListener('load', () => {
    console.log('Main userscript loaded');
    initialize();
});
