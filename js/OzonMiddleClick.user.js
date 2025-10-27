// ==UserScript==
// @name         Ozon Middle Click Fix (от 01.02.2025)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Восстанавливает стандартное поведение средней кнопки мыши на ozon.ru, включая панель "Рекомендуем также".
// @author       https://qna.habr.com/user/Kazaams
// @match        *://*.ozon.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Функция для клонирования ссылок (удаление обработчиков событий)
    function cloneLinks(container) {
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            const newLink = link.cloneNode(true); // Создаём клон ссылки
            link.replaceWith(newLink); // Заменяем старую ссылку клоном
        });
    }

    // Прерываем обработку событий для средней кнопки мыши
    document.addEventListener('mousedown', event => {
        if (event.button === 1) { // Средний клик
            event.stopImmediatePropagation(); // Блокируем обработчики других скриптов
        }
    }, true);

    // Гарантируем открытие ссылки в новой вкладке
    document.addEventListener('mousedown', event => {
        if (event.button === 1) { // Средний клик
            const link = event.target.closest('a');
            if (link && link.href) {
                window.open(link.href, '_blank'); // Открываем ссылку в новой вкладке
                event.preventDefault(); // Предотвращаем любое другое поведение
            }
        }
    }, true);

    // Клонируем ссылки на странице при загрузке
    cloneLinks(document);

    // Настраиваем наблюдатель за изменениями в DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Проверяем, что это элемент
                        cloneLinks(node); // Клонируем ссылки в добавленных элементах
                    }
                });
            }
        });
    });

    // Наблюдаем за изменениями в теле документа
    observer.observe(document.body, { childList: true, subtree: true });
})();
