// ==UserScript==
// @name         Polymarket Arb Partner v16.1
// @version      16.1
// @description  Light Theme, Larger Fonts, localStorage, Stop-Loss, and Fixed Shoulders
// @author       Programmer Partner
// @match        https://polymarket.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Ключ для хранения данных
    const STORAGE_KEY = 'poly_arb_settings_v16';

    // Начальное состояние (загрузка из памяти или дефолт)
    let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        bank: 20,
        spread: 10,
        stopLoss: 20,
        liveSync: false,
        lockUp: false,
        lockDown: false,
        upVal: "",
        downVal: ""
    };

    let lastCalculated = { sellUp: 0, sellDown: 0, hedgeUp: 0, hedgeDown: 0 };

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    const style = document.createElement('style');
    style.innerHTML = `
        #arb-helper-wrap {
            margin-bottom: 12px;
            /* --- СВЕТЛАЯ ТЕМА --- */
            background: #f4f4f4; /* Светло-серый фон */
            border: 1px solid #ccc; /* Более заметная граница */
            color: #333; /* ТЕМНО-СЕРЫЙ ТЕКСТ */
            /* --------------------- */
            border-radius: 10px;
            padding: 14px; /* Чуть больше отступов */
            font-family: 'Inter', -apple-system, sans-serif;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15); /* Мягкая тень */
        }
        .inj-btn {
            width: 26px; height: 26px; border-radius: 4px; border: none; /* Крупнее инжект-кнопки */
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: bold; color: #fff; margin: 0 2px; z-index: 50;
        }
        .inj-btn-green { background: #21ba45; color: white; } /* Более спокойный зеленый */
        .inj-btn-red { background: #db2828; color: white; } /* Более спокойный красный */

        .fix-btn {
            padding: 6px 10px;
            font-size: 12px; /* Крупнее шрифт кнопок FU/FD */
            border-radius: 4px; cursor: pointer;
            border: 1px solid #ccc;
            background: #fff; /* Белый фон кнопок */
            color: #555;
            transition: 0.2s;
            font-weight: 600;
        }
        .fix-btn.active-up { background: #21ba45; color: white; border-color: #21ba45; }
        .fix-btn.active-down { background: #db2828; color: white; border-color: #db2828; }

        /* Подсветка зафиксированного поля */
        .locked-input { border: 2px solid #21ba45 !important; background: #e6fffa !important; color: #333 !important;}
        .locked-input-down { border: 2px solid #db2828 !important; background: #fff5f5 !important; color: #333 !important;}

        /* Переключатель Sync */
        .switch { position: relative; display: inline-block; width: 34px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; border-radius: 20px; transition: .3s; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; }
        input:checked + .slider { background-color: #21ba45; }
        input:checked + .slider:before { transform: translateX(14px); }

        /* Общий стиль инпутов TERMINAL */
        .inp-small {
            background:#fff; /* Белый фон полей */
            border:1px solid #ccc;
            color:#333; /* Темный текст */
            padding:6px;
            font-size:12px; /* Крупнее */
            border-radius:4px;
            width: 100%;
            box-sizing: border-color;
        }
        .inp-small:focus { border-color: #21ba45; outline: none; }
    `;
    document.head.appendChild(style);

    function createUI() {
        const wrap = document.createElement('div');
        wrap.id = 'arb-helper-wrap';
        wrap.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:13px; font-weight:bold; color:#222; letter-spacing:0.5px;">TERMINAL v16.1</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:10px; color:#666; font-weight:600;">LIVE SYNC</span>
                    <label class="switch">
                        <input type="checkbox" id="sync-toggle" ${state.liveSync ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:12px; align-items: center;">
                <button id="btn-fu" class="fix-btn ${state.lockUp ? 'active-up' : ''}">FU</button>
                <input type="number" id="m-up-in" value="${state.upVal}" placeholder="Up ¢" class="inp-small ${state.lockUp ? 'locked-input' : ''}" style="text-align:center; font-size:16px; height:34px; font-weight:bold;">
                <input type="number" id="m-down-in" value="${state.downVal}" placeholder="Dn ¢" class="inp-small ${state.lockDown ? 'locked-input-down' : ''}" style="text-align:center; font-size:16px; height:34px; font-weight:bold;">
                <button id="btn-fd" class="fix-btn ${state.lockDown ? 'active-down' : ''}">FD</button>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
                <div>
                    <label style="font-size:9px; color:#777; display:block; margin-bottom:2px; font-weight:600;">BANK $</label>
                    <input type="number" id="v-bank" value="${state.bank}" class="inp-small" style="font-weight:bold;">
                </div>
                <div>
                    <label style="font-size:9px; color:#777; display:block; margin-bottom:2px; font-weight:600;">SPREAD %</label>
                    <input type="number" id="v-spread" value="${state.spread}" class="inp-small" style="font-weight:bold; color:#21ba45;">
                </div>
                <div>
                    <label style="font-size:9px; color:#db2828; display:block; margin-bottom:2px; font-weight:600;">STOP LOSS %</label>
                    <input type="number" id="v-sl" value="${state.stopLoss}" class="inp-small" style="color:#db2828; border-color:#ffcccc; font-weight:bold;">
                </div>
            </div>

            <div id="calc-results" style="font-size:12px; border-top:1px solid #eee; padding-top:10px;"></div>
        `;
        return wrap;
    }

    function setNativeValue(input, value) {
        if (!input) return;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function injectNativeButtons() {
        const pContainer = document.querySelector('input[placeholder="0¢"]')?.parentElement?.parentElement;
        if (pContainer && !pContainer.querySelector('.inj-btn')) {
            pContainer.prepend(createInjBtn('U', 'inj-btn-green', () => setNativeValue(pContainer.querySelector('input'), lastCalculated.sellUp)));
            pContainer.append(createInjBtn('D', 'inj-btn-red', () => setNativeValue(pContainer.querySelector('input'), lastCalculated.sellDown)));
        }
        const aInput = document.querySelector('input#market-order-amount-input') || document.querySelector('input[placeholder="0"]');
        const aContainer = aInput?.parentElement?.parentElement;
        if (aContainer && !aContainer.querySelector('.inj-btn')) {
            aContainer.prepend(createInjBtn('U', 'inj-btn-green', () => setNativeValue(aInput, lastCalculated.hedgeUp)));
            aContainer.append(createInjBtn('D', 'inj-btn-red', () => setNativeValue(aInput, lastCalculated.hedgeDown)));
        }
    }

    function createInjBtn(txt, cls, fn) {
        const b = document.createElement('button');
        b.className = `inj-btn ${cls}`; b.innerText = txt;
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); fn(); };
        return b;
    }

    function mainLoop() {
        let panel = document.getElementById('arb-helper-wrap');
        const widget = document.querySelector('#trade-widget')?.firstChild;

        if (widget && !panel) {
            panel = createUI();
            widget.parentNode.insertBefore(panel, widget);

            // Навешиваем обработчики и сохранение
            const fields = ['v-bank', 'v-spread', 'v-sl', 'm-up-in', 'm-down-in'];
            fields.forEach(id => {
                document.getElementById(id).oninput = (e) => {
                    const key = id.replace('v-', '').replace('m-', '').replace('-in', '');
                    const val = id.includes('up') || id.includes('down') ? e.target.value : parseFloat(e.target.value);
                    if (id.includes('up')) state.upVal = val;
                    else if (id.includes('down')) state.downVal = val;
                    else if (id === 'v-sl') state.stopLoss = val;
                    else state[key] = val;
                    saveState();
                };
            });

            document.getElementById('sync-toggle').onchange = (e) => { state.liveSync = e.target.checked; saveState(); };

            document.getElementById('btn-fu').onclick = () => {
                state.lockUp = !state.lockUp;
                saveState();
                // Мгновенное визуальное обновление
                document.getElementById('btn-fu').classList.toggle('active-up', state.lockUp);
                document.getElementById('m-up-in').classList.toggle('locked-input', state.lockUp);
            };
            document.getElementById('btn-fd').onclick = () => {
                state.lockDown = !state.lockDown;
                saveState();
                // Мгновенное визуальное обновление
                document.getElementById('btn-fd').classList.toggle('active-down', state.lockDown);
                document.getElementById('m-down-in').classList.toggle('locked-input-down', state.lockDown);
            };
        }

        if (!panel) return;

        injectNativeButtons();

        // 1. Парсинг Live цен
        const buttons = Array.from(document.querySelectorAll('button.trading-button'));
        const upBtn = buttons.find(b => b.innerText.includes('Up') || b.innerText.includes('Вверх'));
        const downBtn = buttons.find(b => b.innerText.includes('Down') || b.innerText.includes('Вниз'));

        if (upBtn && downBtn && state.liveSync) {
            const m1 = upBtn.innerText.match(/(\d+\.?\d*)¢/);
            const m2 = downBtn.innerText.match(/(\d+\.?\d*)¢/);
            if (m1 && !state.lockUp) { document.getElementById('m-up-in').value = m1[1]; state.upVal = m1[1]; }
            if (m2 && !state.lockDown) { document.getElementById('m-down-in').value = m2[1]; state.downVal = m2[1]; }
        }

        // 2. Расчеты
        const up = parseFloat(state.upVal);
        const dn = parseFloat(state.downVal);
        const spr = state.spread || 0;
        const sl = state.stopLoss || 0;
        const bnk = state.bank || 0;

        if (up && dn) {
            let base = Math.max(6, Math.floor((bnk * 100) / (up + dn)));
            lastCalculated = {
                sellUp: Math.ceil(up * (1 + spr/100)),
                sellDown: Math.ceil(dn * (1 + spr/100)),
                hedgeDown: Math.ceil(((base * up) * (1 + spr/100)) / 100),
                hedgeUp: Math.ceil(((base * dn) * (1 + spr/100)) / 100)
            };

            // Расчет Stop Loss цены
            const slUpPrice = Math.floor(up * (1 - sl/100));
            const slDownPrice = Math.floor(dn * (1 - sl/100));

            document.getElementById('calc-results').innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; color:#333;">
                    <div style="background:#fff; padding:8px; border-radius:6px; border:1px solid #eee; border-left:4px solid #21ba45;">
                        <span style="color:#21ba45; font-size:10px; font-weight:bold; text-transform:uppercase;">UP SIDE</span><br>
                        Hedge: <b style="font-size:16px; color:#000;">${lastCalculated.hedgeUp}</b><span style="font-size:10px; color:#666; margin-left:2px;">sh</span><br>
                        Sell: <b style="font-size:16px; color:#000;">${lastCalculated.sellUp}¢</b><br>
                        <span style="color:#db2828; font-size:10px; font-weight:600;">SL Target: ${slUpPrice}¢</span>
                    </div>
                    <div style="background:#fff; padding:8px; border-radius:6px; border:1px solid #eee; border-left:4px solid #db2828;">
                        <span style="color:#db2828; font-size:10px; font-weight:bold; text-transform:uppercase;">DOWN SIDE</span><br>
                        Hedge: <b style="font-size:16px; color:#000;">${lastCalculated.hedgeDown}</b><span style="font-size:10px; color:#666; margin-left:2px;">sh</span><br>
                        Sell: <b style="font-size:16px; color:#000;">${lastCalculated.sellDown}¢</b><br>
                        <span style="color:#db2828; font-size:10px; font-weight:600;">SL Target: ${slDownPrice}¢</span>
                    </div>
                </div>
            `;
        }
    }

    setInterval(mainLoop, 800);
})();