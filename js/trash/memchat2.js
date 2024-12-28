// ==UserScript==
// @name         Проверка цен
// @namespace    http://your.site.com
// @version      0.1
// @description  Проверка цен через GM HTTP запрос
// @author       You
// @match        https://online.moysklad.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let container;
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    function createPriceCheckWindow() {
        if (!container) {
            // Создаем элементы окна и добавляем стили
            container = document.createElement('div');
            container.setAttribute('id', 'priceCheckContainer');
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.width = '360px'; // Увеличиваем ширину окна
            container.style.height = '300px'; // Увеличиваем высоту окна
            container.style.backgroundColor = '#f0f0f0';
            container.style.border = '1px solid #ccc';
            container.style.padding = '10px';
            container.style.display = 'none';
            container.style.zIndex = '9999';

            container.innerHTML = `
                <div id="priceCheckHeader">Проверка цен</div>
                <div>Введите запрос:</div>
                <input type="text" id="priceCheckInput" style="width: 70%; margin-bottom: 5px;">
                <button id="priceCheckButton">Проверить</button>
                <div>
                    <textarea id="priceCheckResult" style="width: 100%; height: 200px; resize: vertical;" readonly></textarea>
                </div>
                <span id="priceCheckCloseButton" style="position: absolute; top: 5px; right: 10px; cursor: pointer;">&#10006;</span>
            `;
            document.body.appendChild(container);

            // Добавляем обработчик для перемещения окна
            let header = document.getElementById('priceCheckHeader');
            header.style.cursor = 'move';
            header.addEventListener('mousedown', startDrag);

            // Обработчик кнопки "Проверить"
            let checkButton = document.getElementById('priceCheckButton');
            checkButton.addEventListener('click', function() {
                checkPrice();
            });

            // Обработчик нажатия Enter в текстовом поле
            let inputField = document.getElementById('priceCheckInput');
            inputField.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    checkPrice();
                }
            });

            // Закрытие окна
            let closeButton = document.getElementById('priceCheckCloseButton');
            closeButton.addEventListener('click', function() {
                container.style.display = 'none';
            });

            // Стили для элементов
            GM_addStyle(`
                #priceCheckHeader {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    user-select: none;
                }
                #priceCheckButton {
                    margin-top: 5px;
                }
            `);
        }

        container.style.display = 'block';
        document.getElementById('priceCheckInput').focus(); // Установка фокуса на поле ввода
        resetTextareaHeight();
    }

    function startDrag(e) {
        isDragging = true;
        let rect = container.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }

    function drag(e) {
        if (isDragging) {
            container.style.right = 'auto';
            container.style.left = `${e.clientX - offset.x}px`;
            container.style.top = `${e.clientY - offset.y}px`;
        }
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }

    function checkPrice() {
        let query = document.getElementById('priceCheckInput').value.trim();
        if (query !== '') {
            // Выполняем запрос
            let url = `http://127.0.0.1:5000/memchat?query=${encodeURIComponent(query)}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    if (response.status === 200) {
                        document.getElementById('priceCheckResult').value = response.responseText;
                        resetTextareaHeight();
                    } else {
                        document.getElementById('priceCheckResult').value = 'Ошибка при выполнении запроса';
                    }
                },
                onerror: function() {
                    document.getElementById('priceCheckResult').value = 'Ошибка при выполнении запроса';
                }
            });
        } else {
            document.getElementById('priceCheckResult').value = 'Введите запрос';
            resetTextareaHeight();
        }
    }

    function resetTextareaHeight() {
        document.getElementById('priceCheckResult').style.height = '200px';
    }

    function forceUpdate() {
        // Выполняем принудительное обновление
        let url = 'http://127.0.0.1:5000/memchat?force=true';
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                if (response.status === 200) {
                    alert('Принудительное обновление выполнено успешно!');
                } else {
                    alert('Ошибка при выполнении принудительного обновления');
                }
            },
            onerror: function() {
                alert('Ошибка при выполнении принудительного обновления');
            }
        });
    }

    // Добавляем команды в контекстное меню
    GM_registerMenuCommand('Проверка цен', createPriceCheckWindow);
    GM_registerMenuCommand('Обновить принудительно цены', forceUpdate);

})();