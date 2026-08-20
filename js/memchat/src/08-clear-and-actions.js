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
        case 'checkHatikoBonuses':   checkHatikoBonuses();       break;
        case 'calculator':           calculateCredit();          break;
        case 'calculator_reverse':   calculateReverse();         break;
        case 'calculator_discount':  applyDiscountOrMarkup();    break;
        case 'calculator_simple':    calculateSimple();          break;
        default: addToChatHistory('system', 'Выберите действие', '⚠️');
    }
}

