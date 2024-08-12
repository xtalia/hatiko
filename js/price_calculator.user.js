// ==UserScript==
// @name         Price Calculator
// @namespace    https://github.com/xtalia/vscode/blob/main/memchat/js/price_calculator.js
// @version      1.5.9
// @description  Добавляет окошко для расчета цен с возможностью сворачивания и вывода результатов в текстовое поле, а также с функцией для расчета скидки
// @author       Serg
// @match        https://online.moysklad.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Проверка на запуск в iframe
    if (window.self !== window.top) {
        return; // Прекратить выполнение скрипта, если он запущен в iframe
    }

    let moveTimeout;
    let isMoving = false;

    function createCalculator() {
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 250px; background: linear-gradient(to bottom right, #f0f0f0, #e0e0e0); border: 1px solid #ccc; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 15px; z-index: 1000;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; cursor: pointer;';

        const title = document.createElement('span');
        title.textContent = '🧮 Калькулятор 1.5.9';
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

        header.addEventListener('mouseover', () => {
            if (!isMoving) {
                moveTimeout = setTimeout(() => {
                    const rect = container.getBoundingClientRect();
                    container.style.bottom = rect.bottom === window.innerHeight - 10 ? '10px' : '10px';
                    container.style.right = rect.right === window.innerWidth - 10 ? '10px' : '10px';
                    container.style.left = rect.right === window.innerWidth - 10 ? 'auto' : '10px';
                    isMoving = true;
                }, 5000);
            }
        });

        header.addEventListener('mouseout', () => {
            clearTimeout(moveTimeout);
            isMoving = false;
        });

        container.appendChild(header);

        const content = document.createElement('div');
        content.style.display = 'block';

        const inputStyle = 'width: calc(100% - 20px); padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box;';
        
        const cashInput = createInputElement('number', 'Введите сумму', inputStyle);
        content.appendChild(cashInput);

        const modeSelect = createSelectElement([
            { value: 'all', text: 'Для всех' },
            { value: 'balakovo', text: 'Для Балаково' }
        ], inputStyle);
        content.appendChild(modeSelect);

        const calculateButton = createButtonElement('Посчитать', () => calculate(), inputStyle);
        content.appendChild(calculateButton);

        const resultField = createTextAreaElement('', 80, inputStyle);
        content.appendChild(resultField);

        const discountInput = createInputElement('number', 'Введите сумму скидки', inputStyle);
        content.appendChild(discountInput);

        const applyDiscountButton = createButtonElement('Применить скидку', () => applyDiscount(), inputStyle);
        content.appendChild(applyDiscountButton);

        function calculate() {
            const cash = parseFloat(cashInput.value);
            const mode = modeSelect.value;
            const rates = rateConfigurations[mode];

            const qr_price = Math.round(cash * rates.qr / 100) * 100 - 10;
            const card_price = Math.round(cash * rates.card / 100) * 100 - 10;
            const rassrochka_price_six = Math.round(cash * rates.six / 100) * 100 - 10;
            const rassrochka_price_ten = Math.round(cash * rates.ten / 100) * 100 - 10;
            const credit_price = Math.round(cash * rates.credit / 100) * 100 - 10;
            const cashback_amount = Math.round(cash * 0.01);
            const credit_month = 36;

            const twenty = Math.round(credit_price * ((20 / 12 / 100) * (1 + (20 / 12 / 100)) ** credit_month) / (((1 + (20 / 12 / 100)) ** credit_month) - 1));
            const forty = Math.round(credit_price * ((40 / 12 / 100) * (1 + (40 / 12 / 100)) ** credit_month) / (((1 + (40 / 12 / 100)) ** credit_month) - 1));

            resultField.value = `
💵 Стоимость: ${cash} рублей с учетом скидки за оплату наличными
📷 QR = ${qr_price} рублей
💳 по карте = ${card_price} рублей

️🏦 в рассрочку
️🔹 ОТП = ${rassrochka_price_six} рублей (от ${Math.round(rassrochka_price_six / 6)} руб. на 6 месяцев)
🔹 Другие банки = ${rassrochka_price_ten} рублей (от ${Math.round(rassrochka_price_ten / 10)} руб. на 10 месяцев)

🏛 в кредит = ${credit_price} + процент Банка
от ${twenty} - ${forty} руб. сроком до ${credit_month} месяцев)
** %Банка ~ от 20 до 40% годовых (точные условия может предоставить только менеджер)
💸 Кешбек = ${cashback_amount} внутренними баллами
`.trim();
        }

        function applyDiscount() {
            const originalPrice = parseFloat(cashInput.value);
            const discount = parseFloat(discountInput.value);
            
            if (!isNaN(discount)) {
                const discountedPrice = originalPrice - discount;
                const discountPercentage = 100 - (discountedPrice / (originalPrice * 0.01));

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

        function createInputElement(type, placeholder, style) {
            const input = document.createElement('input');
            input.type = type;
            input.placeholder = placeholder;
            input.style.cssText = style;
            return input;
        }

        function createSelectElement(options, style) {
            const select = document.createElement('select');
            select.style.cssText = style;
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                select.appendChild(opt);
            });
            return select;
        }

        function createButtonElement(text, clickHandler, style) {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `${style} background-color: #4CAF50; color: white; font-size: 14px; cursor: pointer; transition: background-color 0.3s;`;
            button.addEventListener('click', clickHandler);
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#45a049';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#4CAF50';
            });
            return button;
        }

        function createTextAreaElement(value, height, style) {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.cssText = `${style} height: ${height}px;`;
            textarea.readOnly = true;
            return textarea;
        }

        const rateConfigurations = {
            all: { qr: 1.041, card: 1.051, six: 1.101, ten: 1.131, credit: 1.201 },
            balakovo: { qr: 1.0151, card: 1.031, six: 1.071, ten: 1.101, credit: 1.181 }
        };

        container.appendChild(content);
        document.body.appendChild(container);
    }

    window.addEventListener('load', createCalculator);
})();
