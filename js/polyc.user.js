// ==UserScript==
// @name         Polymarket Arb Partner v17.2
// @version      17.2
// @description  Perfect React Sync, Emoji UI, Robust Input Selectors + FORCE SELL
// @author       Programmer Partner
// @match        https://polymarket.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'poly_arb_settings_v17';
    let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        bank: 20, spread: 10, stopLoss: 20, liveSync: true, forceSell: false,
        lockUp: false, lockDown: false, upVal: "", downVal: ""
    };

    let lastCalculated = { sellUp: 0, sellDown: 0, slUp: 0, slDown: 0, hedgeUp: 0, hedgeDown: 0 };

    function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    const style = document.createElement('style');
    style.innerHTML = `
        #arb-helper-wrap {
            margin-bottom: 12px; background: #f4f4f4; border: 1px solid #ccc;
            color: #333; border-radius: 10px; padding: 14px;
            font-family: 'Inter', sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .inj-row { display: flex; gap: 6px; margin-bottom: 8px; width: 100%; justify-content: center; }
        .inj-btn {
            padding: 4px 10px; border-radius: 6px; border: 1px solid #ddd;
            cursor: pointer; font-size: 15px; background: #fff;
            transition: all 0.1s; display: flex; align-items: center; justify-content: center; height: 30px;
        }
        .inj-btn:hover { background: #eee; transform: translateY(-1px); }
        .inj-btn:active { transform: translateY(0px); }
        .share-btn-native { font-size: 13px !important; padding: 0 8px !important; height: 30px !important; border-radius: 6px !important; margin: 0 2px !important; }
        .inp-small { background:#fff; border:1px solid #ccc; padding:6px; font-size:12px; border-radius:4px; width: 100%; text-align:center; font-weight:bold; }
        .fix-btn { padding: 6px 10px; font-size: 12px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; background: #fff; font-weight: 600; }
        .fix-btn.active-up { background: #21ba45; color: white; border-color: #21ba45; }
        .fix-btn.active-down { background: #db2828; color: white; border-color: #db2828; }
        .force-sell-label { font-size:10px; cursor:pointer; font-weight:bold; color:#db2828; border: 1px solid #db2828; padding: 2px 6px; border-radius: 4px; background: #ffeeee; }
    `;
    document.head.appendChild(style);

    function setNativeValue(input, value) {
        if (!input || value === undefined) return;
        const lastValue = input.value;
        input.value = value;
        const event = new Event('input', { bubbles: true });
        event.simulated = true;
        const tracker = input._valueTracker;
        if (tracker) tracker.setValue(lastValue);
        input.dispatchEvent(event);
    }

    function getPolyInputs() {
        const inputs = Array.from(document.querySelectorAll('input[type="text"][inputmode="decimal"]'));
        return {
            price: inputs.find(i => i.placeholder && i.placeholder.includes('¢')),
            amount: inputs.find(i => i.placeholder && !i.placeholder.includes('¢'))
        };
    }

    function createInjBtn(txt, title, fn, extraClass = '') {
        const b = document.createElement('button');
        b.className = `inj-btn ${extraClass}`; b.innerText = txt; b.title = title;
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); fn(); };
        return b;
    }

    function injectNativeButtons() {
        const inputs = getPolyInputs();

        if (inputs.price) {
            const priceContainer = inputs.price.closest('.relative.flex.items-center');
            if (priceContainer && !priceContainer.parentElement.querySelector('.price-inj-row')) {
                const row = document.createElement('div');
                row.className = 'inj-row price-inj-row';
                row.appendChild(createInjBtn('🟢', 'Up', () => setNativeValue(inputs.price, lastCalculated.sellUp)));
                row.appendChild(createInjBtn('🔴', 'Down', () => setNativeValue(inputs.price, lastCalculated.sellDown)));
                row.appendChild(createInjBtn('🚀', '+10%', () => {
                    const cur = parseFloat(inputs.price.value);
                    if (cur) setNativeValue(inputs.price, Math.ceil(cur * 1.1));
                }));
                row.appendChild(createInjBtn('⚠️', 'SL', () => {
                    const cur = parseFloat(inputs.price.value);
                    const val = (Math.abs(cur - lastCalculated.sellUp) < Math.abs(cur - lastCalculated.sellDown)) ? lastCalculated.slUp : lastCalculated.slDown;
                    setNativeValue(inputs.price, val);
                }));
                priceContainer.parentNode.insertBefore(row, priceContainer);
            }
        }

        if (inputs.amount) {
            const nativeSharesRow = document.querySelector('.flex.gap-1.w-full.justify-between[color="grey"]');
            if (nativeSharesRow && !nativeSharesRow.querySelector('.share-btn-native')) {
                nativeSharesRow.prepend(createInjBtn('🟢 шт', 'U Shares', () => setNativeValue(inputs.amount, lastCalculated.hedgeUp), 'share-btn-native'));
                nativeSharesRow.append(createInjBtn('🔴 шт', 'D Shares', () => setNativeValue(inputs.amount, lastCalculated.hedgeDown), 'share-btn-native'));
            }
        }
    }

    function syncPrices() {
        if (!state.liveSync) return;
        const tradeButtons = Array.from(document.querySelectorAll('button.trading-button'));
        const upBtn = tradeButtons.find(b => b.innerText.match(/Up|Yes|Вверх|Да/i));
        const downBtn = tradeButtons.find(b => b.innerText.match(/Down|No|Вниз|Нет/i));

        if (upBtn) {
            const match = upBtn.innerText.match(/(\d+\.?\d*)¢/);
            if (match && !state.lockUp) {
                state.upVal = match[1];
                const inp = document.getElementById('m-up-in');
                if (inp && inp.value !== state.upVal) inp.value = state.upVal;
            }
        }
        if (downBtn) {
            const match = downBtn.innerText.match(/(\d+\.?\d*)¢/);
            if (match && !state.lockDown) {
                state.downVal = match[1];
                const inp = document.getElementById('m-down-in');
                if (inp && inp.value !== state.downVal) inp.value = state.downVal;
            }
        }
    }

    // НОВАЯ ФУНКЦИЯ: Принудительное удержание вкладки SELL
    function enforceSellState() {
        if (!state.forceSell) return;

        const sellBtn = document.querySelector('button[value="SELL"][role="radio"]');
        if (sellBtn && sellBtn.getAttribute('aria-checked') !== 'true') {
            sellBtn.click(); // Имитируем клик, если вкладка не активна
            console.log("[PolyPulse] ПРЕДОХРАНИТЕЛЬ: Принудительно переключено на SELL");
        }
    }

    function createUI() {
        const wrap = document.createElement('div');
        wrap.id = 'arb-helper-wrap';
        wrap.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-weight:bold;">TERMINAL v17.2 🔌</span>
                <div style="display:flex; gap: 10px; align-items: center;">
                    <label class="force-sell-label" title="Запрещает покупать. Всегда держит вкладку SELL">
                        <input type="checkbox" id="force-sell-toggle" ${state.forceSell ? 'checked' : ''}> FORCE SELL
                    </label>
                    <label style="font-size:10px; cursor:pointer; font-weight:bold;">LIVE SYNC <input type="checkbox" id="sync-toggle" ${state.liveSync ? 'checked' : ''}></label>
                </div>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <button id="btn-fu" class="fix-btn ${state.lockUp ? 'active-up' : ''}">FU</button>
                <input type="number" id="m-up-in" value="${state.upVal}" class="inp-small" style="font-size:16px;">
                <input type="number" id="m-down-in" value="${state.downVal}" class="inp-small" style="font-size:16px;">
                <button id="btn-fd" class="fix-btn ${state.lockDown ? 'active-down' : ''}">FD</button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">
                <div><small style="font-weight:600;">BANK $</small><input type="number" id="v-bank" value="${state.bank}" class="inp-small"></div>
                <div><small style="color:#21ba45; font-weight:600;">SPR %</small><input type="number" id="v-spread" value="${state.spread}" class="inp-small"></div>
                <div><small style="color:#db2828; font-weight:600;">SL %</small><input type="number" id="v-sl" value="${state.stopLoss}" class="inp-small"></div>
            </div>
        `;
        return wrap;
    }

    function mainLoop() {
        let panel = document.getElementById('arb-helper-wrap');
        const widget = document.querySelector('#trade-widget')?.firstChild || document.querySelector('.trading-button')?.closest('.flex.flex-col');

        if (widget && !panel) {
            panel = createUI();
            widget.parentNode.insertBefore(panel, widget);

            ['v-bank', 'v-spread', 'v-sl', 'm-up-in', 'm-down-in'].forEach(id => {
                document.getElementById(id).oninput = (e) => {
                    const val = e.target.value;
                    if (id === 'm-up-in') state.upVal = val;
                    else if (id === 'm-down-in') state.downVal = val;
                    else {
                        const key = id.replace('v-', '');
                        state[key === 'sl' ? 'stopLoss' : key] = parseFloat(val) || 0;
                    }
                    saveState();
                };
            });
            document.getElementById('sync-toggle').onchange = (e) => { state.liveSync = e.target.checked; saveState(); };
            document.getElementById('force-sell-toggle').onchange = (e) => { state.forceSell = e.target.checked; saveState(); };
            document.getElementById('btn-fu').onclick = () => { state.lockUp = !state.lockUp; saveState(); document.getElementById('btn-fu').classList.toggle('active-up'); };
            document.getElementById('btn-fd').onclick = () => { state.lockDown = !state.lockDown; saveState(); document.getElementById('btn-fd').classList.toggle('active-down'); };
        }

        if (panel) {
            syncPrices();
            injectNativeButtons();
            enforceSellState(); // <-- Вызов нового предохранителя

            const up = parseFloat(state.upVal), dn = parseFloat(state.downVal), bnk = state.bank || 0;
            if (up && dn) {
                let base = Math.max(1, Math.floor((bnk * 100) / (up + dn)));
                lastCalculated = {
                    sellUp: Math.ceil(up * (1 + state.spread/100)),
                    slUp: Math.floor(up * (1 - state.stopLoss/100)),
                    sellDown: Math.ceil(dn * (1 + state.spread/100)),
                    slDown: Math.floor(dn * (1 - state.stopLoss/100)),
                    hedgeUp: Math.ceil(((base * dn) * (1 + state.spread/100)) / 100),
                    hedgeDown: Math.ceil(((base * up) * (1 + state.spread/100)) / 100)
                };
            }
        }
    }
    setInterval(mainLoop, 500);
})();
