// ==UserScript==
// @name         Очистка текста после Enter (с возможностью включения)
// @namespace    http://tampermonkey.net/
// @version      1.3.2
// @description  Очищает текстовое поле после нажатия Enter и завершения обработки на сайте (по умолчанию отключено). Возможность включения и отключения через меню.
// @author       Ваше Имя
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    let enabled = false;  // По умолчанию скрипт отключен
    let commandId;

    // Функция очистки текста после нажатия Enter
    function clearText(event) {
        if (event.key === "Enter" && enabled) {
            setTimeout(() => {
                event.target.value = ""; // Очистка текстового поля
            }, 350);  // Выполняется после обработки ввода на странице
        }
    }

    // Функция переключения состояния скрипта (включение/отключение)
    function toggleScript() {
        enabled = !enabled;
        updateMenu();
    }

    // Функция обновления пункта меню
    function updateMenu() {
        if (commandId) {
            GM_unregisterMenuCommand(commandId);
        }
        const menuText = enabled ? "Отключить очистку текста по Enter" : "Включить очистку текста по Enter";
        commandId = GM_registerMenuCommand(menuText, toggleScript);
    }

    // Инициализация
    document.addEventListener('keyup', clearText, true);
    updateMenu();

})();
