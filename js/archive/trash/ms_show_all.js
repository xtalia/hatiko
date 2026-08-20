// ==UserScript==
// @name         Show All Tab Contents Context Menu
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Добавляет пункт в контекстное меню для показа всех блоков с class="tab-content", убирая у них класс "hidden"
// @author       Serg Sinist
// @match        https://online.moysklad.ru/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Функция для показа всех блоков с class="tab-content"
    function showAllTabContents() {
        const hiddenElements = document.querySelectorAll('.tab-content .hidden');
        hiddenElements.forEach(element => {
            element.classList.remove('hidden');
        });
    }

    // Добавление стилей для контекстного меню
    GM_addStyle(`
        .gm-context-menu {
            z-index: 1000;
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 10px;
            cursor: pointer;
        }
    `);

    // Регистрация пункта в контекстном меню
    GM_registerMenuCommand('Show All Tab Contents', showAllTabContents, 'S');

    // Функция для создания контекстного меню
    function createContextMenu() {
        const contextMenu = document.createElement('div');
        contextMenu.classList.add('gm-context-menu');
        contextMenu.textContent = 'Show All Tab Contents';
        contextMenu.addEventListener('click', showAllTabContents);
        document.body.appendChild(contextMenu);
    }

    // Запуск функции создания контекстного меню после полной загрузки страницы
    window.addEventListener('load', () => {
        setTimeout(createContextMenu, 3000); // Задержка в 3 секунды перед созданием контекстного меню
    });
})();
