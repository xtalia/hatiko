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

function clearResultForNewRequest() {
    const ta = document.getElementById('priceCheckResult');
    if (ta) ta.value = '';
    document.getElementById('hatikoLinksPanel')?.replaceChildren();
    document.getElementById('hatikoLinksPanel')?.style.setProperty('display', 'none');
    document.getElementById('hatikoReopenPickerButton')?.style.setProperty('display', 'none');
}

