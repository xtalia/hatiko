// ==UserScript==
// @name         Мемный чат с калькулятором
// @namespace    http://tampermonkey.net/
// @version      5.3.0
// @description  Улучшенный чат с функциями проверки цен, калькулятором и управлением через кнопки
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @match        https://*.hatiko.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      panel.hatiko.ru
// ==/UserScript==

// Production-файл собирается из js/memchat/src/*.js.