// ==UserScript==
// @name         Мемный чат
// @namespace    http://tampermonkey.net/
// @version      1.7.611
// @description  Набор скриптов
// @match        https://online.moysklad.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    console.log('Main userscript loaded');
    const superserver = 'memchat.tw1.ru:5000';

    GM_addStyle(`
        .tab-content .hidden {
            display: block !important;
            visibility: visible !important;
        }
        #priceCheckContainer {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        #priceCheckControls {
            display: flex;
            align-items: center;
            width: 100%;
        }
        #priceCheckInput {
            flex-grow: 1;
            margin-right: 10px;
        }
        #priceCheckButton, #hatikoButton {
            font-size: 20px;
            margin-left: 10px;
        }
    `);

    // Function to show all tab contents
    function showAllTabContents() {
        const hiddenElements = document.querySelectorAll('.tab-content .hidden');
        hiddenElements.forEach(element => {
            element.classList.remove('hidden');
        });
    }

    // Function to create the price check window
    function createPriceCheckWindow() {
        if (!window.priceCheckContainer) {
            const container = document.createElement('div');
            container.setAttribute('id', 'priceCheckContainer');
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.width = '360px';
            container.style.height = '350px'; // Увеличиваем высоту, чтобы разместить вторую кнопку
            container.style.backgroundColor = '#f0f0f0';
            container.style.border = '1px solid #ccc';
            container.style.padding = '10px';
            container.style.display = 'none';
            container.style.zIndex = '9999';

            container.innerHTML = `
                <div id="priceCheckHeader">Проверка цен</div>
                <div id="priceCheckControls">
                    <input type="text" id="priceCheckInput" placeholder="Введите запрос...">
                    <button id="priceCheckButton">🤖</button> <!-- Кнопка с эмодзи робота -->
                    <button id="hatikoButton">🐶</button> <!-- Кнопка с эмодзи песика -->
                </div>
                <div>
                    <textarea id="priceCheckResult" style="width: 100%; height: 300px; resize: vertical;" readonly></textarea>
                </div>
                <span id="priceCheckCloseButton" style="position: absolute; top: 5px; right: 10px; cursor: pointer;">&#10006;</span>
            `;
            document.body.appendChild(container);

            const header = document.getElementById('priceCheckHeader');
            header.style.cursor = 'move';
            header.addEventListener('mousedown', startDrag);

            const checkButton = document.getElementById('priceCheckButton');
            checkButton.addEventListener('click', checkPrice);

            const hatikoButton = document.getElementById('hatikoButton');
            hatikoButton.addEventListener('click', checkHatiko); // Привязываем новую функцию к кнопке

            const inputField = document.getElementById('priceCheckInput');
            inputField.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    checkPrice();
                }
            });

            const closeButton = document.getElementById('priceCheckCloseButton');
            closeButton.addEventListener('click', function() {
                container.style.display = 'none';
            });

            GM_addStyle(`
                #priceCheckHeader {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    user-select: none;
                }
                #priceCheckButton, #hatikoButton {
                    font-size: 20px; /* Устанавливаем размер шрифта для кнопок */
                }
            `);

            window.priceCheckContainer = container;
        }

        window.priceCheckContainer.style.display = 'block';
        document.getElementById('priceCheckInput').focus();
        resetTextareaHeight();
    }

// Список базовых URL
const baseUrls = [
    "https://hatiko.ru",
    "https://voronezh.hatiko.ru",
    "https://lipetsk.hatiko.ru",
    "https://balakovo.hatiko.ru"
];

// Функция для парсинга HTML и извлечения нужных данных
function parseHTML(responseText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseText, "text/html");
    const product = doc.querySelector("a.s-product-header");
    if (product) {
        const title = product.getAttribute("title");
        const relativeLink = product.getAttribute("href");
        const priceElement = doc.querySelector("span.price");
        const price = priceElement ? priceElement.textContent.replace(" ", "") : "Нет данных";
        const link = new URL(relativeLink, baseUrls[0]).href; // Формируем полный URL
        return { title, price, link };
    }
    return { title: "Нет данных", price: "Нет данных", link: "Нет данных" };
}

// Функция для выполнения запросов и формирования сообщения
function checkHatiko() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (query !== '') {
        const urls = baseUrls.map(url => `${url}/search/?query=${encodeURIComponent(query)}`);
        let results = [];
        let requestsCompleted = 0;

        urls.forEach((url, index) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    const data = parseHTML(response.responseText);
                    results[index] = { ...data, link: `${baseUrls[index]}${new URL(data.link).pathname}` }; // Добавляем правильный базовый URL
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
                onerror: function() {
                    document.getElementById('priceCheckResult').value = 'Ошибка при выполнении запроса';
                }
            });
        });
    } else {
        document.getElementById('priceCheckResult').value = 'Введите запрос';
        resetTextareaHeight();
    }
}


    let isDragging = false;
    let offset = { x: 0, y: 0 };

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

    function checkPrice() {
        const query = document.getElementById('priceCheckInput').value.trim();
        if (query !== '') {
            const url = `http://${superserver}/memchat?query=${encodeURIComponent(query)}`;
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
        document.getElementById('priceCheckResult').style.height = '280px';
    }

    function forceUpdate() {
        const url = `http://${superserver}/memchat?force=true`;
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

    // Functions for who_works
    const WHO_WORKS_SERVER_URL = `http://${superserver}/who_work`;

    function createFloatingWindow(content) {
        const window = document.createElement('div');
        window.style.position = 'fixed';
        window.style.top = '50%';
        window.style.left = '50%';
        window.style.transform = 'translate(-50%, -50%)';
        window.style.width = '400px';
        window.style.backgroundColor = '#fff';
        window.style.border = '1px solid #ccc';
        window.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
        window.style.zIndex = '10000';

        const header = document.createElement('div');
        header.style.backgroundColor = '#f0f0f0';
        header.style.borderBottom = '1px solid #ccc';
        header.style.padding = '10px';
        header.style.cursor = 'move';
        header.textContent = 'Мемный чат';
        header.style.userSelect = 'none';
        header.style.fontSize = '16px';
        header.style.fontWeight = 'bold';

        const contentWrapper = document.createElement('div');
        contentWrapper.style.padding = '20px';

        const responseText = document.createElement('textarea');
        responseText.style.width = '100%';
        responseText.style.height = '200px';
        responseText.style.marginTop = '10px';
        responseText.style.resize = 'vertical';
        responseText.style.border = '1px solid #ccc';
        responseText.style.padding = '10px';
        responseText.style.fontSize = '14px';
        responseText.style.lineHeight = '1.5';
        responseText.style.overflow = 'auto';
        responseText.value = content;
        responseText.readOnly = true;
        responseText.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });

        const closeButton = document.createElement('button');
        closeButton.innerText = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';

        closeButton.addEventListener('click', () => {
            document.body.removeChild(window);
        });

        header.addEventListener('mousedown', function(e) {
            e.preventDefault();
            header.style.cursor = 'grabbing';
            const initialX = e.clientX - window.offsetLeft;
            const initialY = e.clientY - window.offsetTop;

            function moveWindow(e) {
                window.style.left = e.clientX - initialX + 'px';
                window.style.top = e.clientY - initialY + 'px';
            }

            function stopMoving() {
                header.style.cursor = 'grab';
                document.removeEventListener('mousemove', moveWindow);
                document.removeEventListener('mouseup', stopMoving);
            }

            document.addEventListener('mousemove', moveWindow);
            document.addEventListener('mouseup', stopMoving);
        });

        contentWrapper.appendChild(responseText);
        window.appendChild(header);
        window.appendChild(closeButton);
        window.appendChild(contentWrapper);
        document.body.appendChild(window);
    }

    function fetchWhoWorks(day) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `http://${superserver}/who_work?day=${day}`,
            onload: function(response) {
                if (response.status === 200) {
                    const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
                    if (contentType.includes('json')) {
                        const data = JSON.parse(response.responseText);
                        createFloatingWindow(data.text.replace(/\n/g, '\n'));
                    } else {
                        createFloatingWindow(`<p style="color: red;">Error: Response is not JSON</p>`);
                    }
                } else {
                    createFloatingWindow(`<p style="color: red;">Error fetching data: ${response.statusText}</p>`);
                }
            },
            onerror: function(error) {
                createFloatingWindow(`<p style="color: red;">Error fetching data: ${error}</p>`);
                console.error('Error fetching data:', error);
            }
        });
    }

    function fetchMemchat(query) {
        const MEMCHAT_SERVER_URL = `http://${superserver}/memchat`;
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${MEMCHAT_SERVER_URL}?query=${encodeURIComponent(query)}`,
            onload: function(response) {
                if (response.status === 200) {
                    const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
                    if (contentType.includes('json')) {
                        const data = JSON.parse(response.responseText);
                        createFloatingWindow(data);
                    } else {
                        createFloatingWindow(`<p style="color: red;">Error: Response is not JSON</p>`);
                    }
                } else {
                    createFloatingWindow(`<p style="color: red;">Error fetching data: ${response.statusText}</p>`);
                }
            },
            onerror: function(error) {
                createFloatingWindow(`<p style="color: red;">Error fetching data: ${error}</p>`);
                console.error('Error fetching data:', error);
            }
        });
    }

    // Register menu commands
    function registerMenuCommands() {
        GM_registerMenuCommand('Раскрыть всю карточку товара', showAllTabContents, 'S');
        GM_registerMenuCommand('Проверка цен', createPriceCheckWindow);
        GM_registerMenuCommand('Обновить принудительно цены', forceUpdate);
        GM_registerMenuCommand('Показать кто работает сегодня', () => fetchWhoWorks('today'));
        GM_registerMenuCommand('Показать кто работает завтра', () => fetchWhoWorks('tomorrow'));
    }

    function initialize() {
        registerMenuCommands();
        console.log('Initialization complete');
    }

    // Call the initialize function to set up the script
    initialize();
})();
