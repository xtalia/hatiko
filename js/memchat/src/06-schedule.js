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

