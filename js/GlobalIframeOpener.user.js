// ==UserScript==
// @name         Global Iframe Opener
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Открывать текущую страницу в iframe
// @author       You
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    let openWindows = [];
    let linkUrl = ''; // Ссылка для открытия

    GM_registerMenuCommand('Открыть страницу в iframe', openPageInIframe);
    GM_registerMenuCommand('Закрыть все окна', closeAllWindows);

    document.addEventListener('contextmenu', function(event) {
        if (event.target.tagName === 'A' && event.target.href) {
            linkUrl = event.target.href;
        } else {
            linkUrl = window.location.href; // Если клик не по ссылке, берем текущий URL
        }
    });

    function openPageInIframe() {
        let modalWindow = createModalWindow();
        let iframeSrc = linkUrl || window.location.href;
        let iframe = createIframe(iframeSrc);
        let header = createHeader(modalWindow, iframe);

        modalWindow.appendChild(header);
        modalWindow.appendChild(iframe);
        document.body.appendChild(modalWindow);
        openWindows.push(modalWindow);

        bringToFront(modalWindow);
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
        let randomColor = getRandomLightColor();
        header.style.cssText = `
            position: absolute; top: 0; left: 0;
            width: 100%; height: 30px; background: ${randomColor};
            border-bottom: 1px solid #ccc; text-align: center;
            line-height: 30px; cursor: move; color: black;
        `;
        header.textContent = 'Iframe Мини';

        let closeButton = createButton('❎', () => closeWindow(modalWindow));
        closeButton.style.cssText = 'position: absolute; right: 5px; top: 5px;';

        let collapseButton = createButton('🔽', () => collapseWindow(modalWindow));
        collapseButton.style.cssText = 'position: absolute; right: 35px; top: 5px;';

        let copyButton = createButton('📋', () => copyIframeURL(iframe));
        copyButton.style.cssText = 'position: absolute; right: 65px; top: 5px;';

        let hideHeaderButton = createButton('👁️', () => hideHeader(header));

        let urlField = createURLField();
        header.appendChild(closeButton);
        header.appendChild(collapseButton);
        header.appendChild(copyButton);
        header.appendChild(hideHeaderButton);
        header.appendChild(urlField);
        header.addEventListener('mousedown', moveHandler.bind(null, modalWindow));

        header.addEventListener('click', () => bringToFront(modalWindow)); 
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

    function bringToFront(modalWindow) {
        openWindows.forEach(w => {
            w.style.zIndex = '999';
        });
        modalWindow.style.zIndex = '1000';
    }

    function getRandomLightColor() {
        let r = Math.floor(Math.random() * 156 + 100);
        let g = Math.floor(Math.random() * 156 + 100);
        let b = Math.floor(Math.random() * 156 + 100);
        return `rgb(${r},${g},${b})`;
    }

    function closeAllWindows() {
        openWindows.forEach(w => w.remove());
        openWindows = [];
    }

    function hideHeader(header) {
         // Прячем заголовок
    header.style.display = 'none';
    setTimeout(() => {
         // Восстанавливаем через 5 секунд
        header.style.display = 'block';
    }, 5000);
}
})();
