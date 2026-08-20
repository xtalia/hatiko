// ==UserScript==
// @name         Мемный чат с калькулятором
// @namespace    http://tampermonkey.net/
// @version      5.2.0
// @description  Улучшенный чат с функциями проверки цен, калькулятором и управлением через кнопки
// @match        https://online.moysklad.ru/*
// @match        https://*.bitrix24.ru/*
// @match        https://*.hatiko.ru/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// ==/UserScript==

// Production-файл собирается из js/memchat/src/*.js.


/* ===== 01-config-and-state.js ===== */

'use strict';

// ─── Константы ───────────────────────────────────────────────────────────────
const BASE_URLS = [
    "https://hatiko.ru",
    "https://voronezh.hatiko.ru",
    "https://lipetsk.hatiko.ru",
    "https://balakovo.hatiko.ru"
];
const CITY_ICONS = ['🆂', '🆅', '🅻', '🗿'];
const CITY_NAMES = ['Саратов', 'Воронеж', 'Липецк', 'Балаково'];

// ─── Правила калькулятора по умолчанию ───────────────────────────────────────
const DEFAULT_CALC_RULES = [
    { name: "Наличными",      percent: 100,   round: 1,   extra: 0   },
    { name: "QR",             percent: 101.5, round: 100, extra: -10 },
    { name: "Картой",         percent: 102,   round: 100, extra: -10 },
    { name: "Рассрочка 6м",   percent: 107,   round: 100, extra: -10 },
    { name: "Рассрочка 10м",  percent: 109,   round: 100, extra: -10 },
    { name: "Рассрочка 12м",  percent: 110,   round: 100, extra: -10 },
    { name: "Рассрочка 18м",  percent: 113,   round: 100, extra: -10 },
    { name: "Рассрочка 24м",  percent: 116,   round: 100, extra: -10 },
    { name: "Рассрочка 36м",  percent: 120,   round: 100, extra: -10 },
    { name: "Кэшбэк 1%",      percent: 1,     round: 1,   extra: 0,  isCashback: true }
];

// ─── Замены расписания по умолчанию ──────────────────────────────────────────
const DEFAULT_REPLACEMENTS = {
    "У":     "😎 как Управляющий",
    "М":     "🙂 как Менеджер",
    "M":     "🙂 как Менеджер",
    "РБ":    "🏪 в ТЦ Рубин",
    "Р":     "🏪 на Рахова",
    "К":     "🏪 на Казачьей",
    "Ч":     "🏪 на Чернышевского",
    "C":     "🏪 в ТЦ СитиМолл",
    "С":     "🏪 в ТЦ СитиМолл",
    "И":     "😱 как SMM",
    "1":     "🧑‍💼 Работает",
    "А":     "👀 Шатает Авито",
    "114":   "🛠️ на Чернышевского 📞114",
    "111":   "🛠️ в ТЦ Рубин 📞111",
    "104":   "🛠️ на Казачьей 📞104",
    "107":   "🛠️ на Казачьей, Старший(-ая) 📞107",
    "К-100": "🏪 на Казачьей 📞100",
    "К-101": "🏪 на Казачьей 📞101",
    "Р-116": "🏪 на Рахова 📞116",
    "Р-117": "🏪 на Рахова 📞117",
    "РБ-111":"🏪 в ТЦ Рубин 📞117",
    "Ч-114": "🏪 На Чернышевского 📞114",
    "С130":  "🏪 в ТЦ СитиМолл 📞131",
    "С131":  "🏪 в ТЦ СитиМолл 📞131",
    "С132":  "🏪 в ТЦ СитиМолл 📞132",
    "300":   "🏪 Никитинская 44 📞300",
    "310":   "⛵ Галерея Чижова 📞310",
    "311":   "⛵ Галерея Чижова 📞311"
};

// ─── Состояние ────────────────────────────────────────────────────────────────
let isDragging    = false;
let offset        = { x: 0, y: 0 };
let currentAction = null;
let chatHistory   = [];
let clearTextEnabled = false;
let calcRules     = [];
let scheduleReplacements = {};

const DEBUG_STORAGE_KEY = 'memchat:debug';

function isDebugEnabled() {
    try {
        return localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function debugLog(scope, ...args) {
    if (isDebugEnabled()) console.debug(`[Memchat:${scope}]`, ...args);
}

function debugError(scope, ...args) {
    console.error(`[Memchat:${scope}]`, ...args);
}

function toggleDebugMode() {
    const enabled = !isDebugEnabled();
    try {
        localStorage.setItem(DEBUG_STORAGE_KEY, String(enabled));
    } catch (error) {
        debugError('debug', 'Не удалось сохранить режим отладки', error);
    }
    console.info(`[Memchat:debug] ${enabled ? 'включена' : 'выключена'}`);
}

function installDebugHandlers() {
    window.addEventListener('error', event => {
        debugError('uncaught', event.error || event.message, event.filename, event.lineno);
    });
    window.addEventListener('unhandledrejection', event => {
        debugError('promise', event.reason);
    });
}

/* ===== 02-storage-and-transport.js ===== */

// ─── Загрузка / сохранение ────────────────────────────────────────────────────
function storageKey(key) {
    return `${typeof MEMCHAT_BUILD !== 'undefined' ? `memchat:${MEMCHAT_BUILD}:` : 'memchat:'}${key}`;
}

function loadCalcRules() {
    try {
        const key = storageKey('calcRules_v2');
        const legacyKey = 'calcRules_v2';
        const s = localStorage.getItem(key)
            || (typeof MEMCHAT_BUILD === 'undefined' ? localStorage.getItem(legacyKey) : null);
        calcRules = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_CALC_RULES));
        if (s && !localStorage.getItem(key)) saveCalcRules();
    } catch { calcRules = JSON.parse(JSON.stringify(DEFAULT_CALC_RULES)); }
}
function saveCalcRules() {
    localStorage.setItem(storageKey('calcRules_v2'), JSON.stringify(calcRules));
}

function loadScheduleReplacements() {
    try {
        const key = storageKey('scheduleReplacements_v1');
        const legacyKey = 'scheduleReplacements_v1';
        const s = localStorage.getItem(key)
            || (typeof MEMCHAT_BUILD === 'undefined' ? localStorage.getItem(legacyKey) : null);
        scheduleReplacements = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_REPLACEMENTS));
        if (s && !localStorage.getItem(key)) saveScheduleReplacements();
    } catch { scheduleReplacements = JSON.parse(JSON.stringify(DEFAULT_REPLACEMENTS)); }
}
function saveScheduleReplacements() {
    localStorage.setItem(storageKey('scheduleReplacements_v1'), JSON.stringify(scheduleReplacements));
}

function loadSelectedAction() {
    try {
        return localStorage.getItem(storageKey('selectedAction_v1')) || 'checkHatiko';
    } catch {
        return 'checkHatiko';
    }
}

function saveSelectedAction(action) {
    try {
        localStorage.setItem(storageKey('selectedAction_v1'), action);
    } catch (error) {
        debugError('storage', 'Не удалось сохранить выбранный режим', error);
    }
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────
function fetchServerData(url, onSuccess, onError) {
    debugLog('request', 'GET', url);
    GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload:  r => {
            debugLog('response', r.status, url);
            r.status === 200 ? onSuccess(r) : onError(`Ошибка: ${r.statusText}`);
        },
        onerror: e => {
            debugError('request', url, e);
            onError(`Ошибка запроса: ${e}`);
        }
    });
}

function applyRule(cash, rule) {
    if (rule.isCashback) return Math.round(cash * rule.percent / 100);
    const rounded = Math.round(cash * rule.percent / 100 / rule.round) * rule.round;
    return rounded + (rule.extra || 0);
}

/* ===== 03-chat.js ===== */

// ─── addToChatHistory ─────────────────────────────────────────────────────────
function addToChatHistory(sender, message, emoji = '') {
    const ts = new Date().toLocaleString();
    const map = {
        user:   `=== Я — ${ts} — ${emoji} ===\n${message}\n\n`,
        bot:    `=== Ответ — ${emoji} — ${ts} ===\n${message}\n\n`,
        system: `=== Система — ${ts} ===\n${message}\n\n`
    };
    chatHistory.push({ sender, message, emoji, timestamp: ts });
    const ta = document.getElementById('priceCheckResult');
    if (ta) {
        ta.value += map[sender] || '';
        ta.scrollTop = ta.scrollHeight;
    }
    if (sender === 'user' && document.getElementById('clearTextCheckbox')?.checked) {
        const ms = parseInt(document.getElementById('timeoutSlider')?.value || 500, 10);
        setTimeout(() => { const inp = document.getElementById('priceCheckInput'); if (inp) inp.value = ''; }, ms);
    }
}

function clearChat() {
    const ta = document.getElementById('priceCheckResult');
    if (ta) ta.value = '';
    chatHistory = [];
    addToChatHistory('system', 'Чат очищен', '🧹');
}

/* ===== 04-hatiko.js ===== */

// ─── HATIKO ───────────────────────────────────────────────────────────────────

/**
 * Парсит страницу поиска Hatiko.
 * Возвращает: { title, articleNo, price, productUrl }
 */
function parseSearchPage(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const product = doc.querySelector('a.s-product-header');
    if (!product) return null;

    const title        = (product.getAttribute('title') || product.textContent || '').trim();
    const relativeLink = product.getAttribute('href') || '';

    // Путь товара — один и тот же для всех городов, только домен меняется
    const pathname   = relativeLink ? new URL(relativeLink, baseUrl).pathname : '';
    const productUrl = pathname ? `${baseUrl}${pathname}` : baseUrl;

    // Цена: ищем span.price-wrapper span.price или просто span.price
    const priceEl = doc.querySelector('span.price-wrapper span.price')
                 || doc.querySelector('span.price');
    const price   = priceEl
        ? priceEl.textContent.replace(/\s+/g, ' ').trim() + ' ₽'
        : '—';

    return { title, price, productUrl, pathname };
}



/**
 * Парсит страницу КАРТОЧКИ товара для получения статуса наличия.
 * Возвращает строку статуса.
 */
function parseProductPage(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Статус: stock-high, stock-low, stock-none или аналоги
    const stockHigh = doc.querySelector('.stock-high');
    const stockLow  = doc.querySelector('.stock-low');
    const stockNone = doc.querySelector('.stock-none, .stock-out');

    if (stockHigh) return '🟢 ' + stockHigh.textContent.trim();
    if (stockLow)  return '🟡 ' + stockLow.textContent.trim();
    if (stockNone) return '🔴 ' + stockNone.textContent.trim();

    // Запасные варианты
    const stockEl = doc.querySelector('[class*="stock"], [class*="availability"], [class*="наличи"]');
    if (stockEl) return '📦 ' + stockEl.textContent.trim();

    return '❓ Статус неизвестен';
}

function checkHatiko() {
    const query = document.getElementById('priceCheckInput').value.trim();
    if (!query) return;
    addToChatHistory('user', query, '🐶 Hatiko');

    // Шаг 1: ищем товар через поиск Саратова
    const searchUrl = `${BASE_URLS[0]}/search/?query=${encodeURIComponent(query)}`;

    fetchServerData(
        searchUrl,
        (searchResp) => {
            const parsed = parseSearchPage(searchResp.responseText, BASE_URLS[0]);

            if (!parsed || !parsed.pathname) {
                addToChatHistory('bot', 'Товар не найден', '🐶 Hatiko');
                return;
            }

            const title    = parsed.title;
            const pathname = parsed.pathname;

            // Шаг 2: для каждого города заходим на страницу товара
            let prices            = new Array(BASE_URLS.length).fill('—');
            let requestsCompleted = 0;

            BASE_URLS.forEach((baseUrl, idx) => {
                const productUrl = `${baseUrl}${pathname}`;

                fetchServerData(
                    productUrl,
                    (productResp) => {
                        const doc = new DOMParser().parseFromString(productResp.responseText, 'text/html');

                        // span.s-price — это реальная цена, span.s-compare-price — зачёркнутая (0 ₽), её игнорируем
                        const priceEl = doc.querySelector('span.s-price span.price-wrapper span.price')
                                     || doc.querySelector('span.price-wrapper span.price')
                                     || doc.querySelector('span.price');

                        prices[idx] = priceEl
                            ? priceEl.textContent.replace(/\s+/g, ' ').trim() + ' ₽'
                            : '—';

                        requestsCompleted++;
                        if (requestsCompleted === BASE_URLS.length) finish();
                    },
                    () => {
                        prices[idx] = '—';
                        requestsCompleted++;
                        if (requestsCompleted === BASE_URLS.length) finish();
                    }
                );
            });

            function finish() {
                let msg = `🧭 ${title}\n\n`;
                BASE_URLS.forEach((baseUrl, i) => {
                    msg += `🪙${CITY_ICONS[i]} ${prices[i]}\n`;
                });
                msg += '\n';
                BASE_URLS.forEach((baseUrl, i) => {
                    msg += `🌐${CITY_ICONS[i]}: ${baseUrl}${pathname}\n`;
                });
                addToChatHistory('bot', msg.trim(), '🐶 Hatiko');
            }
        },
        (err) => {
            addToChatHistory('bot', 'Ошибка поиска: ' + err, '🐶 Hatiko');
        }
    );
}

/* ===== 05-calculator.js ===== */

// ─── Калькулятор ──────────────────────────────────────────────────────────────
function calculateCredit() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (!input) return;
    addToChatHistory('user', input, '🧮 Калькулятор');
    const cash = parseFloat(input);
    if (isNaN(cash) || cash <= 0) {
        addToChatHistory('bot', 'Ошибка: введите корректную сумму.', '🧮 Калькулятор');
        return;
    }
    const lines = calcRules.map(rule => {
        const result = applyRule(cash, rule);
        return rule.isCashback
            ? `💸 ${rule.name}: ${result} баллами`
            : `🔹 ${rule.name}: ${result} руб.`;
    });
    addToChatHistory('bot', lines.join('\n'), '🧮 Калькулятор');
}

function calculateReverse() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (!input) return;
    addToChatHistory('user', input, '🔄 Реверс');
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
        addToChatHistory('bot', 'Ошибка: введите корректную сумму.', '🔄 Реверс');
        return;
    }
    const lines = calcRules
        .filter(r => !r.isCashback && r.percent > 0)
        .map(r => {
            const original = Math.round((amount - (r.extra || 0)) / r.percent * 100);
            return `🔹 ${r.name}: ${original} руб.`;
        });
    addToChatHistory('bot', '🔄 РЕВЕРС расчёта:\n' + lines.join('\n'), '🔄 Реверс');
}

/**
 * Скидка / Наценка
 * Форматы:
 *   цена - скидка   → вычесть
 *   цена + наценка  → прибавить
 */
function applyDiscountOrMarkup() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (!input) return;
    addToChatHistory('user', input, '🎉 Скидка/Наценка');

    // Определяем операцию: + или -
    const minusIdx = input.lastIndexOf('-');
    const plusIdx  = input.lastIndexOf('+');

    let op = null, splitIdx = -1;
    if (minusIdx > 0 && minusIdx > plusIdx) { op = '-'; splitIdx = minusIdx; }
    else if (plusIdx > 0)                   { op = '+'; splitIdx = plusIdx;  }

    if (!op) {
        addToChatHistory('bot', 'Ошибка: формат — "сумма - скидка" или "сумма + наценка"', '🎉');
        return;
    }

    const orig = parseFloat(input.substring(0, splitIdx).trim());
    const diff = parseFloat(input.substring(splitIdx + 1).trim());

    if (isNaN(orig) || isNaN(diff)) {
        addToChatHistory('bot', 'Ошибка: некорректные числа', '🎉');
        return;
    }

    const result = op === '-' ? orig - diff : orig + diff;
    const pct    = Math.abs(diff / orig * 100).toFixed(2);
    const label  = op === '-' ? '🎉 Скидка' : '📈 Наценка';
    const verb   = op === '-' ? 'Скидка'    : 'Наценка';

    addToChatHistory('bot',
        `${label}:\n` +
        `🔹 Было: ${orig} руб.\n` +
        `🔹 ${verb}: ${diff} руб. (${pct}%)\n` +
        `🔹 Итого: ${result} руб.`,
        '🎉');
}

function calculateSimple() {
    const input = document.getElementById('priceCheckInput').value.trim();
    if (!input) return;
    addToChatHistory('user', input, '∑ Простой');
    try {
        const result = Function('"use strict"; return (' + input + ')')();
        addToChatHistory('bot', `Результат: ${result}`, '∑ Простой');
    } catch {
        addToChatHistory('bot', 'Ошибка: некорректное выражение', '∑ Простой');
    }
}

function copyText() {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
        const e = chatHistory[i];
        if (e.sender === 'bot' || e.sender === 'system') {
            const ta = document.createElement('textarea');
            ta.value = e.message;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            addToChatHistory('system', 'Последний ответ скопирован', '📋');
            return;
        }
    }
    addToChatHistory('system', 'Нет ответов для копирования', '⚠️');
}

/* ===== 06-schedule.js ===== */

// ─── Расписание ───────────────────────────────────────────────────────────────
function fetchWhoWorksToday()    { addToChatHistory('user', 'Кто работает сегодня?', '👨‍💼 Сегодня'); fetchWhoWorks('today'); }
function fetchWhoWorksTomorrow() { addToChatHistory('user', 'Кто работает завтра?',  '👨‍💼 Завтра');  fetchWhoWorks('tomorrow'); }

function fetchWhoWorks(day) {
    const url     = `https://docs.google.com/spreadsheets/d/13KUmHtRXYbXjBE7KQ_4MFQ5VsgUYqu2heURY1y2NwiE/edit`;
    const jsonUrl = 'https://github.com/xtalia/hatiko/raw/refs/heads/main/js/wwPeoples.json';

    fetch(jsonUrl)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(loaded => loadTableWithReplacements(day, url, { ...scheduleReplacements, ...loaded }))
        .catch(()    => loadTableWithReplacements(day, url, scheduleReplacements));
}

function loadTableWithReplacements(day, url, replacements) {
    GM_xmlhttpRequest({
        method: 'GET', url,
        onload(response) {
            const regex = /🎯РАБОЧИЙ_ГРАФИК_ДАННЫЕ🎯([\s\S]*?)🎯/i;
            const match = response.responseText.match(regex);
            if (!match?.[1]) { addToChatHistory('bot', 'Не удалось найти данные в таблице', '👨‍💼'); return; }

            const tmp = document.createElement('div');
            tmp.innerHTML = match[1];
            let full = (tmp.textContent || '').trim().replace(/\s+/g, ' ');

            const markers = {
                today:    ['📅СЕГОДНЯ_НАЧАЛО📅', '📅СЕГОДНЯ_КОНЕЦ📅'],
                tomorrow: ['📅ЗАВТРА_НАЧАЛО📅',   '📅ЗАВТРА_КОНЕЦ📅']
            };
            const [sm, em] = markers[day];
            const si = full.indexOf(sm), ei = full.indexOf(em);
            if (si === -1 || ei === -1) { addToChatHistory('bot', 'Данные не найдены', '👨‍💼'); return; }

            let text = full.substring(si, ei).replace(sm, '').replace(em, '').trim();
            addToChatHistory('bot', formatOutputWithReplacements(text, replacements, day), '👨‍💼');
        },
        onerror(e) { addToChatHistory('bot', 'Ошибка сети: ' + e.statusText, '👨‍💼'); }
    });
}

function formatOutputWithReplacements(text, replacements, day) {
    const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
    const dateStr = dateMatch ? dateMatch[1] : '';
    if (dateStr) text = text.replace(dateStr, '').trim();

    let formatted = text
        .replace(/🏢 /g, '\n\n🏢 В городе ')
        .replace(/👤 /g, '\n👤 ')
        .replace(/\|/g, ' - ')
        .trim();

    const lines = formatted.split('\n').filter(l => l.trim());
    const processed = lines.map(line => {
        if (!line.startsWith('👤')) return line;
        let [info, value] = line.includes(' - ') ? line.split(' - ') : [line, ''];
        info = info.replace(/👤\s*/, '👤 ')
                   .replace(/([а-яА-Я])([a-zA-Z@])/g, '$1 $2')
                   .replace(/\s+/g, ' ')
                   .replace(/\.([a-zA-Z])/g, '. $1').trim();
        value = (value || '').trim();
        if (value && replacements[value]) value = replacements[value];
        return value ? `${info} - ${value}` : info;
    });

    const dayName = day === 'today' ? 'Сегодня' : 'Завтра';
    return `📅 ${dayName} (${dateStr})\n\n${processed.join('\n')}`;
}

/* ===== 07-settings-panels.js ===== */

// ─── Перетаскивание ───────────────────────────────────────────────────────────
function startDrag(e) {
    if (e.target.closest('button, input, textarea, select')) return;
    isDragging = true;
    const rect = window.priceCheckContainer.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}
function drag(e) {
    if (!isDragging) return;
    window.priceCheckContainer.style.right = 'auto';
    window.priceCheckContainer.style.left  = `${e.clientX - offset.x}px`;
    window.priceCheckContainer.style.top   = `${e.clientY - offset.y}px`;
}
function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
}

// ─── Панель правил калькулятора ───────────────────────────────────────────────
function buildCalcRulesPanel() {
    const panel = document.getElementById('calcRulesPanel');
    if (!panel) return;
    panel.innerHTML = '';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:grid;grid-template-columns:1fr 72px 72px 88px 30px;gap:4px;margin-bottom:6px;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.4px;';
    hdr.innerHTML = '<span>Название</span><span>%</span><span>Округл.</span><span>Доп.</span><span></span>';
    panel.appendChild(hdr);

    calcRules.forEach((rule, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:1fr 72px 72px 88px 30px;gap:4px;margin-bottom:4px;align-items:center;';

        const mkInp = (val, placeholder, field) => {
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = val; inp.placeholder = placeholder;
            inp.style.cssText = 'width:100%;padding:3px 6px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:11px;box-sizing:border-box;outline:none;transition:border .15s;';
            inp.addEventListener('focus', () => inp.style.borderColor = '#6366f1');
            inp.addEventListener('blur',  () => inp.style.borderColor = '#334155');
            inp.addEventListener('input', () => {
                calcRules[i][field] = field === 'name' ? inp.value : (parseFloat(inp.value) || 0);
                saveCalcRules();
            });
            return inp;
        };

        const del = document.createElement('button');
        del.textContent = '✕';
        del.style.cssText = 'width:26px;height:24px;background:transparent;border:1px solid #ef4444;border-radius:5px;color:#ef4444;font-size:10px;cursor:pointer;transition:all .15s;';
        del.addEventListener('mouseenter', () => { del.style.background='#ef4444'; del.style.color='#fff'; });
        del.addEventListener('mouseleave', () => { del.style.background='transparent'; del.style.color='#ef4444'; });
        del.addEventListener('click', () => { calcRules.splice(i,1); saveCalcRules(); buildCalcRulesPanel(); });

        const extraVal = rule.extra !== undefined ? (rule.extra >= 0 ? '+' + rule.extra : String(rule.extra)) : '0';
        row.appendChild(mkInp(rule.name, 'Название', 'name'));
        row.appendChild(mkInp(rule.percent, '%', 'percent'));
        row.appendChild(mkInp(rule.round, 'Округл.', 'round'));
        row.appendChild(mkInp(extraVal, '+/-0', 'extra'));
        row.appendChild(del);
        panel.appendChild(row);
    });

    _appendRulesPanelFooter(panel, 'calc');
}

// ─── Панель замен расписания ──────────────────────────────────────────────────
function buildSchedulePanel() {
    const panel = document.getElementById('scheduleRulesPanel');
    if (!panel) return;
    panel.innerHTML = '';

    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:grid;grid-template-columns:100px 1fr 28px;gap:4px;margin-bottom:6px;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.4px;';
    hdr.innerHTML = '<span>Ключ</span><span>Значение (замена)</span><span></span>';
    panel.appendChild(hdr);

    Object.entries(scheduleReplacements).forEach(([key, val]) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:100px 1fr 28px;gap:4px;margin-bottom:4px;align-items:center;';

        const mkInp = (v, ph, onChange) => {
            const inp = document.createElement('input');
            inp.type = 'text'; inp.value = v; inp.placeholder = ph;
            inp.style.cssText = 'width:100%;padding:3px 6px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:11px;box-sizing:border-box;outline:none;transition:border .15s;';
            inp.addEventListener('focus', () => inp.style.borderColor = '#6366f1');
            inp.addEventListener('blur',  () => inp.style.borderColor = '#334155');
            inp.addEventListener('input', () => onChange(inp.value));
            return inp;
        };

        const oldKey = key;
        const keyInp = mkInp(key, 'ключ', newKey => {
            if (newKey !== oldKey) {
                const tmp = { ...scheduleReplacements };
                delete tmp[oldKey];
                tmp[newKey] = scheduleReplacements[oldKey];
                scheduleReplacements = tmp;
                saveScheduleReplacements();
            }
        });
        const valInp = mkInp(val, 'замена', newVal => {
            scheduleReplacements[key] = newVal;
            saveScheduleReplacements();
        });

        const del = document.createElement('button');
        del.textContent = '✕';
        del.style.cssText = 'width:24px;height:24px;background:transparent;border:1px solid #ef4444;border-radius:5px;color:#ef4444;font-size:10px;cursor:pointer;transition:all .15s;flex-shrink:0;';
        del.addEventListener('mouseenter', () => { del.style.background='#ef4444'; del.style.color='#fff'; });
        del.addEventListener('mouseleave', () => { del.style.background='transparent'; del.style.color='#ef4444'; });
        del.addEventListener('click', () => {
            delete scheduleReplacements[key];
            saveScheduleReplacements();
            buildSchedulePanel();
        });

        row.appendChild(keyInp);
        row.appendChild(valInp);
        row.appendChild(del);
        panel.appendChild(row);
    });

    _appendRulesPanelFooter(panel, 'schedule');
}

// Общий "подвал" панелей с кнопками + JSON-редактором
function _appendRulesPanelFooter(panel, type) {
    const isCalc = type === 'calc';
    const jsonAreaId = isCalc ? 'calcRulesJsonArea' : 'scheduleJsonArea';

    const addRow = document.createElement('div');
    addRow.style.cssText = 'display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;';

    const mkBtn = (label, css, onClick) => {
        const b = document.createElement('button');
        b.innerHTML = label; b.style.cssText = css;
        b.addEventListener('mouseenter', () => b.style.opacity = '.8');
        b.addEventListener('mouseleave', () => b.style.opacity = '1');
        b.addEventListener('click', onClick);
        return b;
    };

    addRow.appendChild(mkBtn('＋ Добавить',
        'flex:1;padding:4px 8px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:7px;color:#fff;font-size:11px;cursor:pointer;font-weight:600;',
        () => {
            if (isCalc) {
                calcRules.push({ name: 'Новое', percent: 100, round: 1, extra: 0 });
                saveCalcRules(); buildCalcRulesPanel();
            } else {
                scheduleReplacements['новый_ключ'] = 'Замена';
                saveScheduleReplacements(); buildSchedulePanel();
            }
        }
    ));

    addRow.appendChild(mkBtn('↺ Сброс',
        'padding:4px 8px;background:#1e293b;border:1px solid #475569;border-radius:7px;color:#94a3b8;font-size:11px;cursor:pointer;',
        () => {
            if (!confirm('Сбросить к значениям по умолчанию?')) return;
            if (isCalc) { calcRules = JSON.parse(JSON.stringify(DEFAULT_CALC_RULES)); saveCalcRules(); buildCalcRulesPanel(); }
            else { scheduleReplacements = JSON.parse(JSON.stringify(DEFAULT_REPLACEMENTS)); saveScheduleReplacements(); buildSchedulePanel(); }
        }
    ));

    addRow.appendChild(mkBtn('{ } JSON',
        'padding:4px 8px;background:#1e293b;border:1px solid #475569;border-radius:7px;color:#94a3b8;font-size:11px;cursor:pointer;',
        () => {
            const ja = document.getElementById(jsonAreaId);
            if (ja.style.display === 'none') {
                ja.value = JSON.stringify(isCalc ? calcRules : scheduleReplacements, null, 2);
                ja.style.display = 'block';
            } else {
                ja.style.display = 'none';
            }
        }
    ));

    panel.appendChild(addRow);

    // JSON textarea
    const ja = document.createElement('textarea');
    ja.id = jsonAreaId;
    ja.style.cssText = 'display:none;width:100%;height:110px;margin-top:7px;padding:7px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#a5f3fc;font-size:11px;font-family:monospace;box-sizing:border-box;resize:vertical;outline:none;';
    ja.spellcheck = false;
    ja.addEventListener('blur', () => {
        try {
            const parsed = JSON.parse(ja.value);
            if (isCalc) { calcRules = parsed; saveCalcRules(); buildCalcRulesPanel(); }
            else { scheduleReplacements = parsed; saveScheduleReplacements(); buildSchedulePanel(); }
            ja.style.borderColor = '#22c55e';
        } catch { ja.style.borderColor = '#ef4444'; }
    });
    panel.appendChild(ja);
}

/* ===== 08-clear-and-actions.js ===== */

// ─── Очистка текста ───────────────────────────────────────────────────────────
function setupGlobalClearTextFunctionality() {
    const saved = localStorage.getItem('clearTextEnabled');
    if (saved !== null) {
        clearTextEnabled = saved === 'true';
        const cb = document.getElementById('clearTextCheckbox');
        if (cb) cb.checked = clearTextEnabled;
    }
    document.getElementById('clearTextCheckbox')?.addEventListener('change', function () {
        clearTextEnabled = this.checked;
        localStorage.setItem('clearTextEnabled', clearTextEnabled);
        updateClearTextButton();
    });
    document.addEventListener('keypress', e => {
        if (e.key === 'Enter' && clearTextEnabled && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            const ms = parseInt(document.getElementById('timeoutSlider')?.value || 500, 10);
            setTimeout(() => { e.target.value = ''; }, ms);
        }
    });
    updateClearTextButton();
}

function updateClearTextButton() {
    const btn = document.getElementById('clearTextButton');
    if (!btn) return;
    if (clearTextEnabled) {
        btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
        btn.style.boxShadow  = '0 2px 8px #22c55e30';
        btn.textContent = '🧹 Вкл';
    } else {
        btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
        btn.style.boxShadow  = '0 2px 8px #ef444430';
        btn.textContent = '🧹 Выкл';
    }
}

// ─── Диспетчер действий ───────────────────────────────────────────────────────
function executeCurrentAction() {
    debugLog('action', currentAction);
    switch (currentAction) {
        case 'checkHatiko':          checkHatiko();              break;
        case 'calculator':           calculateCredit();          break;
        case 'calculator_reverse':   calculateReverse();         break;
        case 'calculator_discount':  applyDiscountOrMarkup();    break;
        case 'calculator_simple':    calculateSimple();          break;
        default: addToChatHistory('system', 'Выберите действие', '⚠️');
    }
}

/* ===== 09-ui.js ===== */

// ─── Создание интерфейса ──────────────────────────────────────────────────────
function createPriceCheckWindow() {
    if (!window.priceCheckContainer) {

        const style = document.createElement('style');
        style.textContent = `
            #priceCheckContainer {
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                font-size: 13px;
                color: #e2e8f0;
            }
            #priceCheckContainer *::-webkit-scrollbar { width: 4px; height: 4px; }
            #priceCheckContainer *::-webkit-scrollbar-track { background: #0f172a; }
            #priceCheckContainer *::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
            #priceCheckContainer *::-webkit-scrollbar-thumb:hover { background: #6366f1; }

            .mc-btn {
                padding: 6px 10px; border: none; border-radius: 8px;
                color: #fff; cursor: pointer; font-size: 12px; font-weight: 600;
                transition: all .18s ease; white-space: nowrap; letter-spacing: .2px;
                line-height: 1.3;
            }
            .mc-btn:hover  { transform: translateY(-1px); filter: brightness(1.15); }
            .mc-btn:active { transform: translateY(0);    filter: brightness(.95);  }
            .mc-btn-green  { background:linear-gradient(135deg,#22c55e,#16a34a); box-shadow:0 2px 8px #22c55e28; }
            .mc-btn-blue   { background:linear-gradient(135deg,#3b82f6,#2563eb); box-shadow:0 2px 8px #3b82f628; }
            .mc-btn-purple { background:linear-gradient(135deg,#a855f7,#7c3aed); box-shadow:0 2px 8px #a855f728; }
            .mc-btn-orange { background:linear-gradient(135deg,#f97316,#ea580c); box-shadow:0 2px 8px #f9731628; }
            .mc-btn-teal   { background:linear-gradient(135deg,#14b8a6,#0d9488); box-shadow:0 2px 8px #14b8a628; }
            .mc-btn-indigo { background:linear-gradient(135deg,#6366f1,#4f46e5); box-shadow:0 2px 8px #6366f128; }
            .mc-btn-slate  { background:linear-gradient(135deg,#475569,#334155); border:1px solid #475569; box-shadow:none; }
            .mc-btn-active {
                outline: 2px solid #fff !important;
                outline-offset: 2px !important;
                filter: brightness(1.15) !important;
                transform: translateY(-1px) !important;
            }
            .mc-section-label {
                font-size: 9px; font-weight: 700; color: #334155;
                text-transform: uppercase; letter-spacing: .8px;
                margin-bottom: 4px; padding-left: 2px;
            }
            .mc-panel {
                background: #0f172a; border: 1px solid #1e293b;
                border-radius: 12px; padding: 11px;
                max-height: 340px; overflow-y: auto;
            }
            .mc-panel-title {
                font-size: 10px; font-weight: 700; color: #6366f1;
                text-transform: uppercase; letter-spacing: .7px;
                margin-bottom: 10px;
            }
            #priceCheckInput {
                width: 100%; padding: 8px 44px 8px 12px;
                background: #1e293b; border: 1.5px solid #334155;
                border-radius: 10px; color: #e2e8f0; font-size: 13px;
                box-sizing: border-box; outline: none;
                transition: border-color .2s, box-shadow .2s;
            }
            #priceCheckInput:focus {
                border-color: #6366f1; box-shadow: 0 0 0 3px #6366f118;
            }
            #priceCheckInput::placeholder { color: #334155; }
            #priceCheckResult {
                flex: 1; width: 100%; resize: none;
                background: #080e1a; border: 1.5px solid #1a2332;
                border-radius: 10px; color: #64748b; font-size: 11.5px;
                padding: 10px 12px; box-sizing: border-box; line-height: 1.65;
                font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
                outline: none; transition: border-color .2s;
                min-height: 180px;
            }
            #priceCheckResult:focus { border-color: #1e293b; color: #94a3b8; }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'priceCheckContainer';
        container.style.cssText = `
            position:fixed; top:14px; right:14px; width:430px;
            min-height:540px; max-height:93vh;
            background:linear-gradient(160deg,#192035 0%,#0d1422 100%);
            border:1px solid #1e2d45;
            border-radius:18px;
            box-shadow:0 12px 48px rgba(0,0,0,.65), 0 0 0 1px #ffffff06;
            padding:14px; display:none; z-index:99999;
            box-sizing:border-box; flex-direction:column; gap:10px;
            resize:both; overflow:auto;
        `;

        container.innerHTML = `
            <!-- ── Шапка ── -->
            <div id="priceCheckHeader" style="
                display:flex;align-items:center;justify-content:space-between;
                cursor:move;user-select:none;padding-bottom:11px;
                border-bottom:1px solid #1a2840;
            ">
                <div style="display:flex;align-items:center;gap:9px;">
                    <div style="
                        width:34px;height:34px;border-radius:9px;flex-shrink:0;
                        background:linear-gradient(135deg,#6366f1,#a855f7);
                        display:flex;align-items:center;justify-content:center;
                        font-size:17px;box-shadow:0 3px 10px #6366f138;
                    ">🐱</div>
                    <div>
                        <div style="font-size:14px;font-weight:700;color:#e2e8f0;line-height:1.2;">Мемный чат</div>
                        <div style="font-size:9.5px;color:#334155;letter-spacing:.6px;margin-top:1px;">v5.0.0</div>
                    </div>
                </div>
                <button id="priceCheckCloseButton" style="
                    width:29px;height:29px;border-radius:8px;border:none;
                    background:#1a2535;color:#475569;font-size:13px;
                    cursor:pointer;transition:all .18s;
                    display:flex;align-items:center;justify-content:center;flex-shrink:0;
                ">✕</button>
            </div>

            <!-- ── Поле ввода ── -->
            <div style="position:relative;">
                <input type="text" id="priceCheckInput" placeholder="Артикул, товар или сумма…">
                <span style="
                    position:absolute;right:11px;top:50%;transform:translateY(-50%);
                    font-size:9.5px;color:#283347;pointer-events:none;
                ">Enter ↵</span>
            </div>

            <!-- ── Лог ── -->
            <textarea id="priceCheckResult" readonly spellcheck="false"></textarea>

            <!-- ── Группа 1: расчётные ── -->
            <div>
                <div class="mc-section-label">Поиск и расчёт</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    <button class="mc-btn mc-btn-green"  data-action="checkHatiko">🐶 Hatiko</button>
                    <button class="mc-btn mc-btn-indigo" data-action="calculator">🧮 Калькулятор</button>
                    <button class="mc-btn mc-btn-purple" data-action="calculator_reverse">🔄 Реверс</button>
                    <button class="mc-btn mc-btn-orange" data-action="calculator_discount">🎉 Скидка/+</button>
                    <button class="mc-btn mc-btn-teal"   data-action="calculator_simple">∑ Простой</button>
                </div>
            </div>

            <!-- ── Группа 2: быстрые ── -->
            <div>
                <div class="mc-section-label">Быстрые действия</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    <button id="whoWorksTodayButton"    class="mc-btn mc-btn-blue">👨‍💼 Сегодня</button>
                    <button id="whoWorksTomorrowButton" class="mc-btn mc-btn-blue">📅 Завтра</button>
                    <button id="copyButton"             class="mc-btn mc-btn-blue">📋 Копировать</button>
                    <button id="clearChatButton"        class="mc-btn mc-btn-blue">🗑️ Чат</button>
                </div>
            </div>

            <!-- ── Группа 3: настройки ── -->
            <div>
                <div class="mc-section-label">Настройки</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    <button id="clearTextButton"    class="mc-btn mc-btn-orange">🧹 Выкл</button>
                    <button id="calcSettingsBtn"    class="mc-btn mc-btn-slate">⚙️ Правила 🧮</button>
                    <button id="scheduleSettingsBtn" class="mc-btn mc-btn-slate">⚙️ Замены 📅</button>
                </div>
            </div>

            <!-- ── Панель правил калькулятора ── -->
            <div id="calcSettingsPanel" class="mc-panel" style="display:none;">
                <div class="mc-panel-title">⚙️ Правила калькулятора
                    <span style="font-weight:400;color:#334155;text-transform:none;letter-spacing:0;margin-left:6px;">
                        round(сумма × % ÷ 100 ÷ округл.) × округл. + доп.
                    </span>
                </div>
                <div id="calcRulesPanel"></div>
            </div>

            <!-- ── Панель замен расписания ── -->
            <div id="scheduleSettingsPanel" class="mc-panel" style="display:none;">
                <div class="mc-panel-title">⚙️ Замены для расписания</div>
                <div id="scheduleRulesPanel"></div>
            </div>

            <!-- ── Панель очистки текста ── -->
            <div id="settingsPanel" class="mc-panel" style="display:none;max-height:none;">
                <div class="mc-panel-title">⚙️ Настройки очистки</div>
                <label style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:12px;margin-bottom:10px;cursor:pointer;">
                    <input type="checkbox" id="clearTextCheckbox" style="accent-color:#6366f1;width:14px;height:14px;">
                    Глобальная очистка текста после Enter
                </label>
                <label style="display:block;color:#94a3b8;font-size:12px;">
                    Задержка: <span id="timeoutValue" style="color:#6366f1;font-weight:700;">500</span> мс
                    <input type="range" id="timeoutSlider" min="1" max="2000" value="500"
                        style="width:100%;margin-top:5px;accent-color:#6366f1;display:block;">
                </label>
            </div>
        `;

        document.body.appendChild(container);
        window.priceCheckContainer = container;
        setupEventListeners();
        setupGlobalClearTextFunctionality();
        buildCalcRulesPanel();
        buildSchedulePanel();
    }

    window.priceCheckContainer.style.display = 'flex';
    document.getElementById('priceCheckInput').focus();
    restoreSelectedAction();
}

/* ===== 10-events-and-init.js ===== */

// ─── Обработчики событий ──────────────────────────────────────────────────────
function setupEventListeners() {
    const container = window.priceCheckContainer;

    // Перетаскивание
    document.getElementById('priceCheckHeader').addEventListener('mousedown', startDrag);

    // Enter в поле ввода
    document.getElementById('priceCheckInput').addEventListener('keypress', e => {
        if (e.key === 'Enter' && currentAction) executeCurrentAction();
    });

    // Кнопки с data-action (переключаемые)
    container.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', e => {
            container.querySelectorAll('[data-action]').forEach(b => b.classList.remove('mc-btn-active'));
            e.currentTarget.classList.add('mc-btn-active');
            currentAction = e.currentTarget.dataset.action;
            saveSelectedAction(currentAction);
            debugLog('action', 'selected', currentAction);
        });
    });

    // Быстрые кнопки
    document.getElementById('whoWorksTodayButton').addEventListener('click',    fetchWhoWorksToday);
    document.getElementById('whoWorksTomorrowButton').addEventListener('click', fetchWhoWorksTomorrow);
    document.getElementById('copyButton').addEventListener('click',             copyText);
    document.getElementById('clearChatButton').addEventListener('click',        clearChat);

    // Кнопка очистки → панель настроек
    document.getElementById('clearTextButton').addEventListener('click', () => {
        togglePanel('settingsPanel');
    });

    // Правила калькулятора
    document.getElementById('calcSettingsBtn').addEventListener('click', () => {
        const wasHidden = document.getElementById('calcSettingsPanel').style.display === 'none';
        togglePanel('calcSettingsPanel');
        if (wasHidden) buildCalcRulesPanel();
    });

    // Замены расписания
    document.getElementById('scheduleSettingsBtn').addEventListener('click', () => {
        const wasHidden = document.getElementById('scheduleSettingsPanel').style.display === 'none';
        togglePanel('scheduleSettingsPanel');
        if (wasHidden) buildSchedulePanel();
    });

    // Ползунок задержки
    document.getElementById('timeoutSlider').addEventListener('input', e => {
        document.getElementById('timeoutValue').textContent = e.target.value;
    });

    // Закрытие
    document.getElementById('priceCheckCloseButton').addEventListener('click', () => {
        window.priceCheckContainer.style.display = 'none';
    });

    // Hover эффект кнопки закрытия
    const closeBtn = document.getElementById('priceCheckCloseButton');
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background='#ef4444'; closeBtn.style.color='#fff'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background='#1a2535'; closeBtn.style.color='#475569'; });
}

// Открыть/закрыть одну панель (остальные закрываются)
function restoreSelectedAction() {
    const action = loadSelectedAction();
    const button = document.querySelector(`[data-action="${action}"]`)
        || document.querySelector('[data-action="checkHatiko"]');
    if (button) button.click();
}

function togglePanel(id) {
    const ids = ['settingsPanel', 'calcSettingsPanel', 'scheduleSettingsPanel'];
    ids.forEach(pid => {
        const el = document.getElementById(pid);
        if (!el) return;
        el.style.display = (pid === id && el.style.display === 'none') ? 'block' : 'none';
    });
}

// ─── Инициализация ────────────────────────────────────────────────────────────
function closeChatWindow() {
    if (window.priceCheckContainer) window.priceCheckContainer.style.display = 'none';
}

function initialize() {
    installDebugHandlers();
    loadCalcRules();
    loadScheduleReplacements();
    GM_registerMenuCommand('Открыть мемный чат', createPriceCheckWindow);
    GM_registerMenuCommand('Закрыть мемный чат', closeChatWindow);
    GM_registerMenuCommand('Переключить отладку мемного чата', toggleDebugMode);
    debugLog('init', 'initialized');
    console.log('Мемный чат v5.0.0 инициализирован');
}

// ─── Production entrypoint ───────────────────────────────────────────────────
initialize();
