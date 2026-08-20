// ==UserScript==
// @name         Мемный чат DEV
// @namespace    http://tampermonkey.net/
// @version      5.2.0-dev
// @description  Тестовая версия мемного чата
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @match        https://*.hatiko.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @require      http://127.0.0.1:8123/01-config-and-state.js
// @require      http://127.0.0.1:8123/02-storage-and-transport.js
// @require      http://127.0.0.1:8123/03-chat.js
// @require      http://127.0.0.1:8123/04-hatiko.js
// @require      http://127.0.0.1:8123/05-calculator.js
// @require      http://127.0.0.1:8123/06-schedule.js
// @require      http://127.0.0.1:8123/07-settings-panels.js
// @require      http://127.0.0.1:8123/08-clear-and-actions.js
// @require      http://127.0.0.1:8123/09-ui.js
// @require      http://127.0.0.1:8123/10-events-and-init.js
// ==/UserScript==

'use strict';

// DEV использует отдельный namespace настроек, чтобы не перезаписывать production.
const MEMCHAT_BUILD = 'dev';
if (typeof initialize === 'function') initialize();
