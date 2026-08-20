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

