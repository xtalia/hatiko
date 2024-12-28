// ==UserScript==
// @name         Floating Window with GET Request
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Floating window with GET request and minimize/maximize button
// @author       Your Name
// @match        https://online.moysklad.ru/
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Создание плавающего окна
    const floatingWindow = document.createElement('div');
    floatingWindow.style.position = 'fixed';
    floatingWindow.style.top = '20px';
    floatingWindow.style.right = '20px';
    floatingWindow.style.backgroundColor = '#f1f1f1';
    floatingWindow.style.padding = '20px';
    floatingWindow.style.border = '1px solid #ddd';
    floatingWindow.style.zIndex = '9999';

    // Создание текстового поля для ввода
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Введите цифры';
    inputField.style.marginBottom = '10px';
    inputField.style.padding = '5px';

    // Создание кнопки для отправки запроса
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Отправить';
    submitButton.style.padding = '5px 10px';

    // Создание текстового поля для вывода ответа
    const responseField = document.createElement('textarea');
    responseField.rows = '5';
    responseField.style.width = '300px';
    responseField.style.marginTop = '10px';
    responseField.style.padding = '5px';
    responseField.readOnly = true;

    // Создание кнопки для сворачивания/разворачивания окна
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '—';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '5px';
    toggleButton.style.right = '5px';
    toggleButton.style.padding = '2px 6px';
    toggleButton.style.fontSize = '16px';
    toggleButton.style.cursor = 'pointer';

    // Добавление элементов в плавающее окно
    floatingWindow.appendChild(inputField);
    floatingWindow.appendChild(submitButton);
    floatingWindow.appendChild(responseField);
    floatingWindow.appendChild(toggleButton);

    // Добавление плавающего окна в документ
    document.body.appendChild(floatingWindow);

    // Обработчик события клика на кнопку "Отправить"
    submitButton.addEventListener('click', () => {
        const searchQuery = inputField.value.trim();
        if (searchQuery) {
            const url = `http://127.0.0.1:25536/search?search_query=${searchQuery}&search_type=vendor_code`;

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    responseField.value = response.responseText;
                },
                onerror: function(error) {
                    responseField.value = 'Ошибка при выполнении запроса: ' + error.status;
                }
            });
        }
    });

    // Обработчик события клика на кнопку сворачивания/разворачивания
    let isMinimized = false;
    toggleButton.addEventListener('click', () => {
        if (isMinimized) {
            floatingWindow.style.height = 'auto';
            responseField.style.display = 'block';
            toggleButton.textContent = '—';
        } else {
            floatingWindow.style.height = '50px';
            responseField.style.display = 'none';
            toggleButton.textContent = '＋';
        }
        isMinimized = !isMinimized;
    });
})();