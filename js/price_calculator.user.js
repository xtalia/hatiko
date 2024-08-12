// ==UserScript==
// @name         Price Calculator
// @namespace    https://github.com/xtalia/vscode/blob/main/memchat/js/price_calculator.js
// @version      1.5.7
// @description  Окно расчета цен с возможностью сворачивания, применения скидки и перемещения окна при наведении на заголовок.
// @author       Serg
// @match        https://online.moysklad.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Проверка на запуск в iframe
    if (window.self !== window.top) return;

    function createCalculator() {
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 250px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 10px; padding: 15px; z-index: 1000;';

        const header = createHeader();
        const content = createContent();

        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);

        // Таймер для отслеживания наведения мыши
        let hoverTimer;
        header.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(() => moveToOppositeSide(container), 5000);
        });
        header.addEventListener('mouseleave', () => clearTimeout(hoverTimer));

        function moveToOppositeSide(elem) {
            const rect = elem.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const newLeft = windowWidth - rect.right;
            const newTop = windowHeight - rect.bottom;
            elem.style.left = `${newLeft}px`;
            elem.style.top = `${newTop}px`;
            elem.style.right = 'auto';
            elem.style.bottom = 'auto';
        }
    }

    function createHeader() {
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; cursor: pointer;';

        const title = document.createElement('span');
        title.textContent = '🧮 Калькулятор 1.5.7';
        title.style.fontWeight = 'bold';

        const toggleButton = document.createElement('span');
        toggleButton.textContent = '▲';

        header.appendChild(title);
        header.appendChild(toggleButton);

        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            toggleButton.textContent = content.style.display === 'none' ? '▼' : '▲';
        });

        return header;
    }

    function createContent() {
        const content = document.createElement('div');
        content.style.display = 'block';

        const cashInput = createInput('number', 'Введите сумму');
        const modeSelect = createSelect([
            { value: 'all', text: 'Для всех' },
            { value: 'balakovo', text: 'Для Балаково' }
        ]);
        const resultField = createTextArea('', 80);
        const discountInput = createInput('number', 'Введите сумму скидки');

        const calculateButton = createButton('Посчитать', () => calculate(cashInput, modeSelect, resultField));
        const applyDiscountButton = createButton('Применить скидку', () => applyDiscount(cashInput, discountInput, resultField));

        [cashInput, modeSelect, calculateButton, resultField, discountInput, applyDiscountButton].forEach(el => content.appendChild(el));

        return content;
    }

    function calculate(cashInput, modeSelect, resultField) {
        const cash = parseFloat(cashInput.value);
        if (isNaN(cash)) return;

        const mode = modeSelect.value;
        const rateConfigurations = {
            all: { qr: 1.041, card: 1.051, six: 1.101, ten: 1.131, credit: 1.201 },
            balakovo: { qr: 1.0151, card: 1.031, six: 1.071, ten: 1.101, credit: 1.181 }
        };

        const rates = rateConfigurations[mode];
        const creditMonths = 36;
        const creditPercents = [20, 40];

        const prices = {
            qr: Math.round(cash * rates.qr / 100) * 100 - 10,
            card: Math.round(cash * rates.card / 100) * 100 - 10,
            six: Math.round(cash * rates.six / 100) * 100 - 10,
            ten: Math.round(cash * rates.ten / 100) * 100 - 10,
            credit: Math.round(cash * rates.credit / 100) * 100 - 10,
            cashback: Math.round(cash * 0.01)
        };

        const creditPayments = creditPercents.map(perc => Math.round(prices.credit * ((perc / 12 / 100) * (1 + (perc / 12 / 100)) ** creditMonths) / (((1 + (perc / 12 / 100)) ** creditMonths) - 1)));

        resultField.value = `
💵 Стоимость: ${cash} рублей с учетом скидки за оплату наличными
📷 QR = ${prices.qr} рублей
💳 по карте = ${prices.card} рублей

️🏦 в рассрочку
️🔹 ОТП = ${prices.six} рублей (от ${Math.round(prices.six / 6)} руб. на 6 месяцев)
🔹 Другие банки = ${prices.ten} рублей (от ${Math.round(prices.ten / 10)} руб. на 10 месяцев)

🏛 в кредит = ${prices.credit} + процент Банка
от ${creditPayments[0]} - ${creditPayments[1]} руб. сроком до ${creditMonths} месяцев)
** %Банка ~ от 20 до 40% годовых (точные условия может предоставить только менеджер)
💸 Кешбек = ${prices.cashback} внутренними баллами
`.trim();
    }

    function applyDiscount(cashInput, discountInput, resultField) {
        const originalPrice = parseFloat(cashInput.value);
        const discount = parseFloat(discountInput.value);
        
        if (isNaN(discount) || isNaN(originalPrice)) return resultField.value = 'Ошибка: Введите корректные значения.';

        const discountedPrice = originalPrice - discount;
        const discountPercentage = 100 - (discountedPrice / (originalPrice * 0.01));

        resultField.value = `
🎉 Применена скидка:
🔹 Изначальная цена: ${originalPrice} рублей
🔹 Скидка: ${discount} рублей
🔹 Процент скидки: ${discountPercentage.toFixed(2)} %
🔹 Сумма со скидкой: ${discountedPrice} рублей
`.trim();
    }

    function createInput(type, placeholder) {
        const input = document.createElement('input');
        input.type = type;
        input.placeholder = placeholder;
        input.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc;';
        return input;
    }

    function createSelect(options) {
        const select = document.createElement('select');
        select.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc;';
        options.forEach(optData => {
            const opt = document.createElement('option');
            opt.value = optData.value;
            opt.textContent = optData.text;
            select.appendChild(opt);
        });
        return select;
    }

    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: none; background-color: #4CAF50; color: white; font-size: 14px; cursor: pointer;';
        button.addEventListener('click', onClick);
        return button;
    }

    function createTextArea(value, height) {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.cssText = `width: 100%; height: ${height}px; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc;`;
        textarea.readOnly = true;
        return textarea;
    }

    window.addEventListener('load', createCalculator);
})();
