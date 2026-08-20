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
            #hatikoRequestStatus { color:#94a3b8; font-size:10px; min-height:14px; }
            .mc-links-panel {
                display:none; max-height:150px; overflow-y:auto;
                background:#080e1a; border:1px solid #1a2332;
                border-radius:10px; padding:8px 10px; font-size:11px;
            }
            .mc-links-panel a { display:block; color:#93c5fd; margin:4px 0; word-break:break-all; }
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
            <div id="hatikoRequestStatus"></div>
            <button id="hatikoReopenPickerButton" type="button" style="display:none;padding:5px 8px;border:1px solid #475569;border-radius:7px;background:#1e293b;color:#cbd5e1;cursor:pointer;">↶ Выбрать другой товар</button>
            <div id="hatikoLinksPanel" class="mc-links-panel"></div>

            <!-- ── Группа 1: расчётные ── -->
            <div>
                <div class="mc-section-label">Поиск и расчёт</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    <button class="mc-btn mc-btn-green"  data-action="checkHatiko">🐶 Hatiko</button>
                    <button class="mc-btn mc-btn-green"  data-action="checkHatikoBonuses">🎁 Бонусы</button>
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
                <label style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:12px;margin-top:10px;cursor:pointer;">
                    <input type="checkbox" id="showHatikoLinksCheckbox" style="accent-color:#6366f1;width:14px;height:14px;">
                    Показывать ссылки Hatiko
                </label>
                <label style="display:block;color:#94a3b8;font-size:12px;margin-top:10px;">
                    Поиск цифровых запросов:
                    <select id="hatikoSearchMode" style="display:block;width:100%;margin-top:5px;padding:5px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;">
                        <option value="auto">Сначала Panel, затем сайт</option>
                        <option value="panel">Только Panel</option>
                        <option value="hatiko">Только сайт Hatiko</option>
                    </select>
                </label>
            </div>
        `;

        document.body.appendChild(container);
        window.priceCheckContainer = container;
        setupEventListeners();
        setupGlobalClearTextFunctionality();
        setupHatikoLinksSetting();
        setupHatikoSearchModeSetting();
        document.getElementById('hatikoReopenPickerButton').addEventListener('click', reopenHatikoProductPicker);
        buildCalcRulesPanel();
        buildSchedulePanel();
    }

    window.priceCheckContainer.style.display = 'flex';
    document.getElementById('priceCheckInput').focus();
    restoreSelectedAction();
}

function updateHatikoStatus(message) {
    const status = document.getElementById('hatikoRequestStatus');
    if (status) status.textContent = `🐶 ${message}`;
    debugLog('hatiko-status', message);
}

function setupHatikoSearchModeSetting() {
    const select = document.getElementById('hatikoSearchMode');
    if (!select) return;
    hatikoSearchMode = loadHatikoSearchMode();
    select.value = hatikoSearchMode;
    select.addEventListener('change', () => saveHatikoSearchMode(select.value));
}

function updateHatikoLinksPanel(pathname) {
    const panel = document.getElementById('hatikoLinksPanel');
    if (!panel) return;
    panel.innerHTML = '';
    if (!loadShowHatikoLinks() || !pathname) {
        panel.style.display = 'none';
        return;
    }
    BASE_URLS.forEach((baseUrl, i) => {
        const link = document.createElement('a');
        link.href = `${baseUrl}${pathname}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `🌐${CITY_ICONS[i]} ${CITY_NAMES[i]}: ${link.href}`;
        panel.appendChild(link);
    });
    panel.style.display = 'block';
}

function setupHatikoLinksSetting() {
    const checkbox = document.getElementById('showHatikoLinksCheckbox');
    if (!checkbox) return;
    checkbox.checked = loadShowHatikoLinks();
    checkbox.addEventListener('change', () => {
        saveShowHatikoLinks(checkbox.checked);
        updateHatikoLinksPanel(currentHatikoPathname);
    });
}

function closeHatikoProductPicker() {
    document.getElementById('hatikoProductPicker')?.remove();
}

function reopenHatikoProductPicker() {
    if (lastHatikoResults.length > 1) openHatikoProductPicker(lastHatikoResults);
}

function copyHatikoText(text) {
    const fallback = () => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(fallback);
    } else {
        fallback();
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'\"]/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
    }[char]));
}

function openHatikoProductPicker(results) {
    closeHatikoProductPicker();

    const overlay = document.createElement('div');
    overlay.id = 'hatikoProductPicker';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:100000;
        display:flex;align-items:center;justify-content:center;
        padding:20px;background:rgba(2,6,23,.72);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        width:min(720px, calc(100vw - 40px));max-height:80vh;overflow:auto;
        padding:16px;background:#111827;border:1px solid #334155;
        border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.6);
        color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
    const title = document.createElement('strong');
    title.textContent = '🐶 Выберите товар для копирования';
    title.style.fontSize = '15px';
    header.appendChild(title);

    const close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = 'border:0;border-radius:7px;padding:6px 9px;background:#334155;color:#e2e8f0;cursor:pointer;';
    close.addEventListener('click', closeHatikoProductPicker);
    header.appendChild(close);
    modal.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;';

    results.forEach(result => {
        const card = document.createElement('button');
        card.type = 'button';
        card.style.cssText = `
            min-height:130px;padding:12px;text-align:left;cursor:pointer;
            border:1px solid #334155;border-radius:12px;background:#1e293b;color:#e2e8f0;
            transition:transform .15s,border-color .15s,background .15s;
        `;
        const cardTitle = document.createElement('strong');
        cardTitle.textContent = result.title;
        cardTitle.style.cssText = 'display:block;margin-bottom:8px;';
        card.appendChild(cardTitle);
        const prices = document.createElement('span');
        prices.style.cssText = 'display:block;color:#a5b4fc;font-size:12px;line-height:1.5;white-space:pre-line;';
        prices.textContent = result.prices.map((price, i) => `${CITY_NAMES[i]}: ${price}`).join('\n');
        card.appendChild(prices);
        card.addEventListener('mouseenter', () => { card.style.borderColor = '#818cf8'; card.style.transform = 'translateY(-2px)'; });
        card.addEventListener('mouseleave', () => { card.style.borderColor = '#334155'; card.style.transform = 'none'; });
        card.addEventListener('click', () => {
            copyHatikoText(result.message);
            addToChatHistory('bot', result.message, '🐶 Hatiko');
            addToChatHistory('system', 'Ответ выбранного товара скопирован', '📋');
            closeHatikoProductPicker();
            const reopenButton = document.getElementById('hatikoReopenPickerButton');
            if (reopenButton) reopenButton.style.display = 'block';
        });
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'min-width:0;';
        wrapper.appendChild(card);

        const links = document.createElement('div');
        links.style.cssText = 'margin-top:5px;font-size:10px;line-height:1.5;';
        BASE_URLS.forEach((baseUrl, i) => {
            const link = document.createElement('a');
            link.href = `${baseUrl}${result.pathname}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = `${CITY_ICONS[i]} ${CITY_NAMES[i]}`;
            link.style.cssText = 'color:#93c5fd;margin-right:7px;';
            links.appendChild(link);
        });
        wrapper.appendChild(links);
        grid.appendChild(wrapper);
    });

    modal.appendChild(grid);
    overlay.appendChild(modal);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) closeHatikoProductPicker();
    });
    document.body.appendChild(overlay);
}

