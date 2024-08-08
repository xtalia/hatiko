// ==UserScript==
// @name         MoySklad iframe opener
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        https://online.moysklad.ru/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    let openWindows = [];

    GM_registerMenuCommand('Открыть MoySklad в iframe', openMoySkladIframe);
    GM_registerMenuCommand('Закрыть все окна', closeAllWindows);

    function openMoySkladIframe() {
        let modalWindow = createModalWindow();
        let iframe = createIframe('https://online.moysklad.ru/app/#customerorder/edit?new');
        let header = createHeader(modalWindow);

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
        // Удален атрибут sandbox, чтобы элементы в iframe могли работать нормально
        iframe.addEventListener('error', () => {
            alert('Ошибка загрузки контента. Пожалуйста, проверьте соединение.');
        });
        return iframe;
    }

    function createHeader(modalWindow) {
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

        header.appendChild(closeButton);
        header.appendChild(collapseButton);
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
})();
