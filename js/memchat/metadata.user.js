// ==UserScript==
// @name         Мемный чат с калькулятором
// @namespace    http://tampermonkey.net/
// @version      5.4.1
// @description  Улучшенный чат с функциями проверки цен, калькулятором и управлением через кнопки
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @match        https://*.hatiko.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      hatiko.ru
// @connect      *.hatiko.ru
// @connect      panel.hatiko.ru
// @connect      docs.google.com
// @connect      github.com
// @connect      raw.githubusercontent.com
// ==/UserScript==

// Production-файл собирается из js/memchat/src/*.js.