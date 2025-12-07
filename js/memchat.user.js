// ==UserScript==
// @name         Мемный чат с калькулятором
// @namespace    http://tampermonkey.net/
// @version      3.0.31
// @description  Улучшенный чат с функциями проверки цен, калькулятором и управлением через кнопки
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

'use strict';

// Константы
const SUPERSERVER = 'memchat.tw1.ru:5000';
const BASE_URLS = [
    "https://hatiko.ru",
    "https://voronezh.hatiko.ru", 
    "https://lipetsk.hatiko.ru",
    "https://balakovo.hatiko.ru"
];
const UPDATE_INTERVAL = 12 * 60 * 60 * 1000;
const JSON_URL = "https://raw.githubusercontent.com/xtalia/hatiko/refs/heads/main/js/calculatorRates.json";

// Переменные для управления
let isDragging = false;
let offset = { x: 0, y: 0 };
let currentAction = null;
let rateConfigurations = {};
let chatHistory = [];
let clearTextEnabled = false;

// Универсальная функция для выполнения запросов к серверу
function fetchServerData(url, onSuccess, onError) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: (response) => response.status === 200 ? onSuccess(response) : onError(`Ошибка: ${response.statusText}`),
        onerror: (error) => onError(`Ошибка при выполнении запроса: ${error}`)
    });
}

/// clearChatButton - Очистка чата
function clearChat() {
    document.getElementById('priceCheckResult').value = '';
    chatHistory = [];
    addToChatHistory('system', 'Чат очищен', '🧹');
}

/// clearTextFunctionality - Глобальная функция очистки текста после Enter
function setupGlobalClearTextFunctionality() {
    // Восстанавливаем состояние из localStorage
    const savedState = localStorage.getItem('clearTextEnabled');
    if (savedState !== null) {
        clearTextEnabled = savedState === 'true';
        document.getElementById('clearTextCheckbox').checked = clearTextEnabled;
    }
    
    // Обработчик изменения чекбокса
    document.getElementById('clearTextCheckbox').addEventListener('change', function() {
        clearTextEnabled = this.checked;
        localStorage.setItem('clearTextEnabled', clearTextEnabled);
        updateClearTextButton();
    });
    
    // Глобальный обработчик нажатия Enter на ВСЕЙ странице
    document.addEventListener('keypress', function(event) {
        if (event.key === "Enter" && clearTextEnabled) {
            const target = event.target;
            // Проверяем, что это текстовое поле (input или textarea)
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                const timeoutValue = parseInt(document.getElementById('timeoutSlider').value, 10);
                setTimeout(() => {
                    target.value = "";
                }, timeoutValue);
            }
        }
    });
    
    updateClearTextButton();
}

/// updateClearTextButton - Обновление внешнего вида кнопки очистки
function updateClearTextButton() {
    const clearTextButton = document.getElementById('clearTextButton');
    if (clearTextEnabled) {
        clearTextButton.style.backgroundColor = '#4CAF50';
        clearTextButton.textContent = '🧹 Вкл';
    } else {
        clearTextButton.style.backgroundColor = '#f44336';
        clearTextButton.textContent = '🧹 Выкл';
    }
}

/// priceCheckButton - Основная функция проверки цен
function checkPrice() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (query !== '') {
        addToChatHistory('user', query, '🤖 Проверка цен');
        
        const url = `http://${SUPERSERVER}/memchat?query=${encodeURIComponent(query)}`;
        fetchServerData(
            url,
            (response) => {
                addToChatHistory('bot', response.responseText, '🤖 Проверка цен');
            },
            (error) => addToChatHistory('bot', error, '🤖 Проверка цен')
        );
    }
}

/// hatikoButton - Проверка цен через Hatiko
function checkHatiko() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (query !== '') {
        addToChatHistory('user', query, '🐶 Hatiko');
        
        const urls = BASE_URLS.map(url => `${url}/search/?query=${encodeURIComponent(query)}`);
        let results = [];
        let requestsCompleted = 0;

        urls.forEach((url, index) => {
            fetchServerData(
                url,
                (response) => {
                    const data = parseHTML(response.responseText);
                    results[index] = { ...data, link: `${BASE_URLS[index]}${new URL(data.link).pathname}` };
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

                        addToChatHistory('bot', messageText, '🐶 Hatiko');
                    }
                },
                (error) => addToChatHistory('bot', error, '🐶 Hatiko')
            );
        });
    }
}

/// calculatorCalculateButton - Калькулятор кредита
function calculateCredit() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (input !== '') {
        const mode = currentAction === 'calculator_all' ? 'all' : 'balakovo';
        const modeName = currentAction === 'calculator_all' ? 'All' : 'Balakovo';
        
        addToChatHistory('user', input, `🧮 Калькулятор ${modeName}`);
        
        const cash = parseFloat(input);

        if (isNaN(cash) || cash <= 0) {
            addToChatHistory('bot', 'Ошибка: Введите корректную сумму.', `🧮 Калькулятор ${modeName}`);
            return;
        }

        if (!rateConfigurations[mode]) {
            addToChatHistory('bot', 'Ошибка: Данные для выбранного режима не загружены.', `🧮 Калькулятор ${modeName}`);
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

        const resultText = formatText(`
            💵 Наличными: ${cash} руб.
            📷 QR: ${qr_price} руб.
            💳 Картой: ${card_price} руб.
            
            🏦 Рассрочка
            ${generateInstallmentText(rassrochka_price_six, 6)}
            ${generateInstallmentText(rassrochka_price_ten, 10)}
            ${generateInstallmentText(rassrochka_price_twelve, 12)}
            ${generateInstallmentText(rassrochka_price_eighteen, 18)}
            ${generateInstallmentText(rassrochka_price_twentyfour, 24)}
            ${generateInstallmentText(rassrochka_price_thirtysix, 36)}
            
            💸 Кэшбэк: ${cashback_amount} баллами
        `);

        addToChatHistory('bot', resultText, `🧮 Калькулятор ${modeName}`);
    }
}

/// calculatorReverseButton - Реверс калькулятора
function calculateReverse() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (input !== '') {
        addToChatHistory('user', input, '🔄 Реверс');
        
        const reverseAmount = parseFloat(input);
        const mode = 'balakovo';

        if (isNaN(reverseAmount) || reverseAmount <= 0) {
            addToChatHistory('bot', 'Ошибка: Введите корректную сумму.', '🔄 Реверс');
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

        const resultText = `
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

        addToChatHistory('bot', resultText, '🔄 Реверс');
    }
}

/// calculatorApplyDiscountButton - Применение скидки
function applyDiscount() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (input !== '') {
        addToChatHistory('user', input, '🎉 Скидка');
        
        const parts = input.split('-').map(part => part.trim());
        if (parts.length !== 2) {
            addToChatHistory('bot', 'Ошибка: Введите в формате "сумма - скидка"', '🎉 Скидка');
            return;
        }

        const originalPrice = parseFloat(parts[0]);
        const discount = parseFloat(parts[1]);

        if (isNaN(originalPrice) || isNaN(discount)) {
            addToChatHistory('bot', 'Ошибка: Введите корректные числа', '🎉 Скидка');
            return;
        }

        const discountedPrice = originalPrice - discount;
        const discountPercentage = (discount / originalPrice) * 100;

        const resultText = `
🎉 Применена скидка:
🔹 Изначальная цена: ${originalPrice} рублей
🔹 Скидка: ${discount} рублей
🔹 Процент скидки: ${discountPercentage.toFixed(10)} %
🔹 Сумма со скидкой: ${discountedPrice} рублей
`.trim();

        addToChatHistory('bot', resultText, '🎉 Скидка');
    }
}

/// calculatorSimpleButton - Простой калькулятор
function calculateSimple() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (input !== '') {
        addToChatHistory('user', input, '🧮 Простой калькулятор');
        
        try {
            // Безопасное вычисление выражения
            const result = Function('"use strict"; return (' + input + ')')();
            addToChatHistory('bot', `Результат: ${result}`, '🧮 Простой калькулятор');
        } catch (error) {
            addToChatHistory('bot', 'Ошибка: Некорректное выражение', '🧮 Простой калькулятор');
        }
    }
}

/// whoWorksTodayButton - Кто работает сегодня
function fetchWhoWorksToday() {
    addToChatHistory('user', 'Кто работает сегодня?', '👨‍💼 Сегодня');
    fetchWhoWorks('today');
}

/// whoWorksTomorrowButton - Кто работает завтра  
function fetchWhoWorksTomorrow() {
    addToChatHistory('user', 'Кто работает завтра?', '👨‍💼 Завтра');
    fetchWhoWorks('tomorrow');
}

/// copyButton - Копирование текста
function copyText() {
    const resultTextarea = document.getElementById('priceCheckResult');
    resultTextarea.select();
    document.execCommand('copy');
    addToChatHistory('system', 'Текст скопирован в буфер обмена', '📋');
}

// Вспомогательные функции
function addToChatHistory(sender, message, emoji = '') {
    const timestamp = new Date().toLocaleString();
    let formattedMessage = '';
    
    switch(sender) {
        case 'user':
            formattedMessage = `=== Я - ${timestamp} - ${emoji} ===\n${message}\n\n`;
            break;
        case 'bot':
            formattedMessage = `=== Калачев - ${emoji} - ${timestamp} ===\n${message}\n\n`;
            break;
        case 'system':
            formattedMessage = `=== Система - ${timestamp} ===\n${message}\n\n`;
            break;
    }
    
    chatHistory.push({sender, message, emoji, timestamp});
    
    const resultTextarea = document.getElementById('priceCheckResult');
    resultTextarea.value += formattedMessage;
    resultTextarea.scrollTop = resultTextarea.scrollHeight;
    
    // Автоматическая очистка поля ввода для некоторых действий
    if (sender === 'user' && document.getElementById('clearTextCheckbox').checked) {
        setTimeout(() => {
            document.getElementById('priceCheckInput').value = '';
        }, parseInt(document.getElementById('timeoutSlider').value));
    }
}

function generateInstallmentText(price, months) {
    return `    🔹 ${months} мес.: ${price} руб. (от ${Math.round(price / months)} руб./мес)`;
}

function formatText(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n');
}

function parseHTML(responseText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseText, "text/html");
    const product = doc.querySelector("a.s-product-header");
    if (product) {
        const title = product.getAttribute("title");
        const relativeLink = product.getAttribute("href");
        const priceElement = doc.querySelector("span.price");
        const price = priceElement ? priceElement.textContent.replace(" ", "") : "Нет данных";
        const link = new URL(relativeLink, BASE_URLS[0]).href;
        return { title, price, link };
    }
    return { title: "Нет данных", price: "Нет данных", link: "Нет данных" };
}

function fetchWhoWorks(day) {
    const url = `http://${SUPERSERVER}/who_work?day=${day}`;
    fetchServerData(
        url,
        (response) => {
            const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
            if (contentType.includes('json')) {
                const data = JSON.parse(response.responseText);
                addToChatHistory('bot', data.text.replace(/\n/g, '\n'), '👨‍💼');
            } else {
                addToChatHistory('bot', 'Ошибка: Ответ не в формате JSON', '👨‍💼');
            }
        },
        (error) => addToChatHistory('bot', error, '👨‍💼')
    );
}

// Функции для управления окном
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

// Функции для калькулятора
async function loadRateConfigurations() {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error(`Ошибка загрузки JSON: ${response.status}`);
        rateConfigurations = await response.json();
        console.log("Данные rateConfigurations загружены:", rateConfigurations);
        localStorage.setItem("rateConfigurations", JSON.stringify(rateConfigurations));
    } catch (error) {
        console.error("Не удалось загрузить данные:", error);
        const savedData = localStorage.getItem("rateConfigurations");
        if (savedData) {
            rateConfigurations = JSON.parse(savedData);
            console.log("Используются данные из локального хранилища:", rateConfigurations);
        }
    }
}

// Создание интерфейса
function createPriceCheckWindow() {
    if (!window.priceCheckContainer) {
        const container = document.createElement('div');
        container.id = 'priceCheckContainer';
        container.style.cssText = `
            position: fixed; top: 10px; right: 10px; width: 400px; height: 500px; 
            background: #fff; border: 1px solid #ccc; border-radius: 10px; 
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 10px; display: none;
            z-index: 9999; box-sizing: border-box; display: flex; flex-direction: column;
            resize: vertical; overflow: auto;
        `;

        container.innerHTML = `
            <div id="priceCheckHeader" style="font-size: 18px; font-weight: bold; margin-bottom: 10px; user-select: none; cursor: move;">
                Мемный чат
                <span id="priceCheckCloseButton" style="position: absolute; top: 10px; right: 10px; cursor: pointer;">&#10006;</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <input type="text" id="priceCheckInput" placeholder="Введите запрос..." 
                    style="width: 100%; padding: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;">
            </div>
            
            <textarea id="priceCheckResult" 
                style="flex: 1; width: 100%; resize: none; border-radius: 5px; border: 1px solid #ccc; padding: 5px; box-sizing: border-box; margin-bottom: 10px;" 
                readonly></textarea>
            
            <div id="priceCheckControls" style="display: flex; flex-wrap: wrap; gap: 5px;">
                <!-- Кнопки типа 1 -->
                <button id="priceCheckButton" class="action-button" data-action="checkPrice" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🤖</button>
                <button id="hatikoButton" class="action-button" data-action="checkHatiko" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🐶</button>
                <button id="calculatorAllButton" class="action-button" data-action="calculator_all" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🧮 All</button>
                <button id="calculatorBalakovoButton" class="action-button" data-action="calculator_balakovo" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🧮 Balakovo</button>
                <button id="calculatorReverseButton" class="action-button" data-action="calculator_reverse" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🔄</button>
                <button id="calculatorDiscountButton" class="action-button" data-action="calculator_discount" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🎉 Скидка</button>
                <button id="calculatorSimpleButton" class="action-button" data-action="calculator_simple" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; cursor: pointer;">🧮 Простой</button>
                
                <!-- Кнопки типа 2 -->
                <button id="whoWorksTodayButton" class="instant-button" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #2196F3; color: white; cursor: pointer;">👨‍💼 Сегодня</button>
                <button id="whoWorksTomorrowButton" class="instant-button" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #2196F3; color: white; cursor: pointer;">👨‍💼 Завтра</button>
                <button id="copyButton" class="instant-button" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #2196F3; color: white; cursor: pointer;">📋 Копировать</button>
                <button id="clearChatButton" class="instant-button" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #2196F3; color: white; cursor: pointer;">🗑️ Очистить чат</button>
                
                <!-- Кнопки типа 3 -->
                <button id="clearTextButton" class="toggle-button" style="flex: 1; padding: 5px; border-radius: 5px; border: none; background-color: #f44336; color: white; cursor: pointer;">🧹 Выкл</button>
            </div>
            
            <div id="settingsPanel" style="display: none; margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" id="clearTextCheckbox"> Глобальная очистка текста после Enter
                </label>
                <label style="display: block;">
                    Задержка очистки (мс): 
                    <input type="range" id="timeoutSlider" min="1" max="1000" value="500" style="width: 100%;">
                    <span id="timeoutValue">500</span>
                </label>
            </div>
        `;

        document.body.appendChild(container);
        setupEventListeners();
        setupGlobalClearTextFunctionality();
        window.priceCheckContainer = container;
    }

    window.priceCheckContainer.style.display = 'flex';
    document.getElementById('priceCheckInput').focus();
}

function setupEventListeners() {
    // Перетаскивание окна
    document.getElementById('priceCheckHeader').addEventListener('mousedown', startDrag);
    
    // Обработчик Enter в поле ввода
    document.getElementById('priceCheckInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && currentAction) {
            executeCurrentAction();
        }
    });

    // Кнопки типа 1 - переключаемые
    document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', (e) => {
            // Сбрасываем фон у всех кнопок типа 1
            document.querySelectorAll('.action-button').forEach(btn => {
                btn.style.backgroundColor = '#4CAF50';
            });
            
            // Устанавливаем голубой фон для активной кнопки
            e.target.style.backgroundColor = '#87CEEB';
            currentAction = e.target.dataset.action;
        });
    });

    // Кнопки типа 2 - мгновенные
    document.getElementById('whoWorksTodayButton').addEventListener('click', fetchWhoWorksToday);
    document.getElementById('whoWorksTomorrowButton').addEventListener('click', fetchWhoWorksTomorrow);
    document.getElementById('copyButton').addEventListener('click', copyText);
    document.getElementById('clearChatButton').addEventListener('click', clearChat);

    // Кнопки типа 3 - переключатели
    document.getElementById('clearTextButton').addEventListener('click', function() {
        const settingsPanel = document.getElementById('settingsPanel');
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Настройки
    document.getElementById('timeoutSlider').addEventListener('input', (event) => {
        document.getElementById('timeoutValue').textContent = event.target.value;
    });

    // Закрытие окна
    document.getElementById('priceCheckCloseButton').addEventListener('click', () => {
        window.priceCheckContainer.style.display = 'none';
    });
}

function executeCurrentAction() {
    switch(currentAction) {
        case 'checkPrice':
            checkPrice();
            break;
        case 'checkHatiko':
            checkHatiko();
            break;
        case 'calculator_all':
        case 'calculator_balakovo':
            calculateCredit();
            break;
        case 'calculator_reverse':
            calculateReverse();
            break;
        case 'calculator_discount':
            applyDiscount();
            break;
        case 'calculator_simple':
            calculateSimple();
            break;
        default:
            addToChatHistory('system', 'Выберите действие', '⚠️');
    }
}

// Инициализация
function initialize() {
    GM_registerMenuCommand('Открыть мемный чат', createPriceCheckWindow);
    loadRateConfigurations();
    setInterval(loadRateConfigurations, UPDATE_INTERVAL);
    console.log('Мемный чат инициализирован');
}


window.addEventListener('load', initialize);
