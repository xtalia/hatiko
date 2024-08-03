// ==UserScript==
// @name         Clear Text on Enter After Processing (Toggle Enabled)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Очищает текстовое поле после нажатия Enter и завершения обработки на сайте (по умолчанию отключено). Возможность включения и отключения через меню.
// @author       Ваше Имя
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    let enabled = false;  // По умолчанию отключено
    let enableCommandId;
    let disableCommandId;

    // Функция, которая выполняет выделение и удаление текста
    function clearText(event) {
        if (event.key === "Enter" && enabled) {
            setTimeout(() => {
                event.target.select();
                event.target.value = "";
            }, 0);  // Срабатывает сразу после выполнения стандартного кода на сайте
        }
    }

    // Функция включения скрипта
    function enableScript() {
        if (!enabled) {
            enabled = true;
            updateMenu();
        }
    }

    // Функция отключения скрипта
    function disableScript() {
        if (enabled) {
            enabled = false;
            updateMenu();
        }
    }

    // Функция обновления пунктов меню
    function updateMenu() {
        if (enableCommandId) {
            GM_unregisterMenuCommand(enableCommandId);
        }
        if (disableCommandId) {
            GM_unregisterMenuCommand(disableCommandId);
        }
        
        if (enabled) {
            disableCommandId = GM_registerMenuCommand("Disable Text Clear on Enter", disableScript);
        } else {
            enableCommandId = GM_registerMenuCommand("Enable Text Clear on Enter", enableScript);
        }
    }

    // Инициализация
    document.addEventListener('keyup', clearText, true);
    updateMenu();

})();
