// ==UserScript==
// @name         Объединенный скрипт (Мемный чат + MoySklad iframe opener + Очистка текста)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Объединение функциональности трех скриптов
// @match        https://online.moysklad.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // --- Memchat Script ---
    console.log('Main userscript loaded');
    const superserver = 'mem.1721671-cu28683.twc1.net:5000';

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

    function showAllTabContents() {
        const hiddenElements = document.querySelectorAll('.tab-content .hidden');
        hiddenElements.forEach(element => {
            element.classList.remove('hidden');
        });
    }

    function createPriceCheckWindow() {
        if (!window.priceCheckContainer) {
            const container = document.createElement('div');
            container.setAttribute('id', 'priceCheckContainer');
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.width = '360px';
            container.style.height = '350px';
            container.style.backgroundColor = '#f0f0f0';
            container.style.border = '1px solid #ccc';
            container.style.padding = '10px';
            container.style.display = 'none';
            container.style.zIndex = '9999';

            container.innerHTML = `
                <div id="priceCheckHeader">Проверка цен</div>
                <div id="priceCheckControls">
                    <input type="text" id="priceCheckInput" placeholder="Введите запрос...">
                    <button id="priceCheckButton">🤖</button>
                    <button id="hatikoButton">🐶</button>
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
            hatikoButton.addEventListener('click', checkHatiko);

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
                    font-size: 20px;
                }
            `);

            window.priceCheckContainer = container;
        }

        window.priceCheckContainer.style.display = 'block';
        document.getElementById('priceCheckInput').focus();
        resetTextareaHeight();
    }

    const baseUrls = [
        "https://hatiko.ru",
        "https://voronezh.hatiko.ru",
        "https://lipetsk.hatiko.ru",
        "https://balakovo.hatiko.ru"
    ];

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

    function fetchWhoWorks(day) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `http://${superserver}/who_work?day=${day}`,
            onload: function(response) {
                if (response.status === 200) {
                    const data = JSON.parse(response.responseText);
                    alert(data.text.replace(/\n/g, '\n'));
                } else {
                    alert('Ошибка при получении данных');
                }
            },
            onerror: function(error) {
                alert('Ошибка при получении данных');
                console.error('Error fetching data:', error);
            }
        });
    }

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

    initialize();

    // --- MoySklad Iframe Opener ---
    let openWindows = [];
    let linkUrl = ''; 

    GM_registerMenuCommand('Открыть MoySklad в iframe', openMoySkladIframe);
    GM_registerMenuCommand('Закрыть все окна', closeAllWindows);

    document.addEventListener('contextmenu', function(event) {
        if (event.target.tagName === 'A' && event.target.href) {
            linkUrl = event.target.href;
        } else {
            linkUrl = ''; 
        }
    });

    function openMoySkladIframe() {
        let modalWindow = createModalWindow();
        let iframeSrc = linkUrl || 'https://online.moysklad.ru/app/#customerorder/edit?new';
        let iframe = createIframe(iframeSrc);
        let header = createHeader(modalWindow, iframe);

        modalWindow.appendChild(header);
        modalWindow.appendChild(iframe);
        document.body.appendChild(modalWindow);
        openWindows.push(modalWindow);
    }

    function createModalWindow() {
        let modalWindow = document.createElement('div');
        modalWindow.style.cssText = `
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            border: 1px solid #ccc; border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            width: 800px; height: 600px;
            background: white; overflow: hidden;
            resize: both; z-index: 1000;
        `;
        return modalWindow;
    }

    function createIframe(src) {
        let iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.style.cssText = 'width: 100%; height: calc(100% - 30px); border: none;';
        iframe.addEventListener('error', () => {
            alert('Ошибка загрузки контента. Пожалуйста, проверьте соединение.');
        });
        return iframe;
    }

    function createHeader(modalWindow, iframe) {
        let header = document.createElement('div');
        header.style.cssText = `
            position: absolute; top: 0; left: 0;
            width: 100%; height: 30px; background: #f0f0f0;
            border-bottom: 1px solid #ccc; text-align: center;
            line-height: 30px; cursor: move;
        `;
        header.textContent = 'Мой Склад Мини';

        let closeButton = createButton('✖', () => closeWindow(modalWindow));
        closeButton.style.cssText = 'position: absolute; right: 5px; top: 5px;';

        let collapseButton = createButton('▲', () => collapseWindow(modalWindow));
        collapseButton.style.cssText = 'position: absolute; right: 35px; top: 5px;';

        let copyButton = createButton('⧉', () => copyIframeURL(iframe));
        copyButton.style.cssText = 'position: absolute; right: 65px; top: 5px;';

        let urlField = createURLField();
        header.appendChild(closeButton);
        header.appendChild(collapseButton);
        header.appendChild(copyButton);
        header.appendChild(urlField);
        header.addEventListener('mousedown', moveHandler.bind(null, modalWindow));
        return header;
    }

    function createButton(text, onClick) {
        let button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            border: none; background: transparent;
            cursor: pointer; font-size: 14px;
        `;
        button.addEventListener('click', onClick);
        return button;
    }

    function createURLField() {
        let urlField = document.createElement('input');
        urlField.type = 'text';
        urlField.readOnly = true;
        urlField.style.cssText = `
            position: absolute; left: 100px; top: 5px; right: 90px;
            height: 20px; background: white; border: 1px solid #ccc;
            padding: 2px; display: none; font-size: 12px;
        `;
        return urlField;
    }

    function copyIframeURL(iframe) {
        try {
            let currentURL = iframe.contentWindow.location.href;
            navigator.clipboard.writeText(currentURL).then(() => {
                alert('URL скопирован: ' + currentURL);
            }).catch(() => {
                toggleURLField(currentURL);
            });
        } catch (e) {
            let fallbackURL = iframe.src;
            toggleURLField(fallbackURL);
        }
    }

    function toggleURLField(url) {
        let urlField = document.querySelector('input[type="text"]');
        if (urlField.style.display === 'none') {
            urlField.style.display = 'block';
            urlField.value = url;
        } else {
            urlField.style.display = 'none';
            urlField.value = '';
        }
    }

    function closeWindow(modalWindow) {
        modalWindow.remove();
        openWindows = openWindows.filter(w => w !== modalWindow);
    }

    function collapseWindow(modalWindow) {
        modalWindow.style.display = 'none';
        let expandButton = document.createElement('button');
        expandButton.textContent = '▶ Развернуть';
        expandButton.style.cssText = `
            position: fixed; left: 10px; top: 50%;
            transform: translateY(-50%); z-index: 9999;
        `;
        document.body.appendChild(expandButton);

        expandButton.addEventListener('click', function() {
            modalWindow.style.display = 'block';
            document.body.removeChild(expandButton);
        });
    }

    function moveHandler(modalWindow, event) {
        let startX = event.clientX;
        let startY = event.clientY;
        let windowLeft = modalWindow.offsetLeft;
        let windowTop = modalWindow.offsetTop;

        let mouseMoveHandler = function(event) {
            modalWindow.style.left = windowLeft + (event.clientX - startX) + 'px';
            modalWindow.style.top = windowTop + (event.clientY - startY) + 'px';
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', function() {
            document.removeEventListener('mousemove', mouseMoveHandler);
        });
    }

    function closeAllWindows() {
        openWindows.forEach(w => w.remove());
        openWindows = [];
    }

    // --- Cleartext Script ---
    let enabled = false;  
    let commandId;

    function clearText(event) {
        if (event.key === "Enter" && enabled) {
            setTimeout(() => {
                event.target.value = ""; 
            }, 0); 
        }
    }

    function toggleScript() {
        enabled = !enabled;
        updateMenu();
    }

    function updateMenu() {
        if (commandId) {
            GM_unregisterMenuCommand(commandId);
        }
        const menuText = enabled ? "Отключить очистку текста по Enter" : "Включить очистку текста по Enter";
        commandId = GM_registerMenuCommand(menuText, toggleScript);
    }

    document.addEventListener('keyup', clearText, true);
    updateMenu();
})();
