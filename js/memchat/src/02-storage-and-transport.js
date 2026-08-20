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

function loadShowHatikoLinks() {
    try {
        return localStorage.getItem(storageKey('showHatikoLinks_v1')) === 'true';
    } catch {
        return false;
    }
}

function saveShowHatikoLinks(enabled) {
    try {
        localStorage.setItem(storageKey('showHatikoLinks_v1'), String(enabled));
    } catch (error) {
        debugError('storage', 'Не удалось сохранить настройку ссылок Hatiko', error);
    }
}

function loadHatikoSearchMode() {
    try {
        const mode = localStorage.getItem(storageKey('hatikoSearchMode_v1'));
        return ['auto', 'panel', 'hatiko'].includes(mode) ? mode : 'auto';
    } catch { return 'auto'; }
}

function saveHatikoSearchMode(mode) {
    if (!['auto', 'panel', 'hatiko'].includes(mode)) return;
    hatikoSearchMode = mode;
    localStorage.setItem(storageKey('hatikoSearchMode_v1'), mode);
}

function panelCsrfStorageKey() {
    return storageKey('panelCsrf_v1');
}

function loadPanelCsrf() {
    try {
        const saved = JSON.parse(localStorage.getItem(panelCsrfStorageKey()) || 'null');
        if (!saved?.token || !saved?.savedAt || Date.now() - saved.savedAt > 30 * 60 * 1000) return '';
        return saved.token;
    } catch { return ''; }
}

function savePanelCsrf(token) {
    if (!token) return;
    try { localStorage.setItem(panelCsrfStorageKey(), JSON.stringify({ token, savedAt: Date.now() })); }
    catch (error) { debugError('storage', 'Не удалось сохранить CSRF Panel', error); }
}

function clearPanelCsrf() {
    try { localStorage.removeItem(panelCsrfStorageKey()); } catch { /* storage unavailable */ }
}

function ensurePanelCsrf(onSuccess, onError) {
    const cached = loadPanelCsrf();
    if (cached) { onSuccess(cached); return; }
    panelRequest('/search', {}, response => {
        const token = parsePanelCsrf(response.responseText);
        if (!token) {
            clearPanelCsrf();
            onError(new Error('Panel: нет авторизации. Войдите в panel.hatiko.ru.'));
            return;
        }
        savePanelCsrf(token);
        onSuccess(token);
    }, onError);
}

function panelRequest(path, options, onSuccess, onError) {
    GM_xmlhttpRequest({
        method: options?.method || 'GET',
        url: `https://panel.hatiko.ru${path}`,
        headers: {
            Accept: 'application/json, text/html;q=0.9',
            Referer: 'https://panel.hatiko.ru/search',
            'X-Requested-With': 'XMLHttpRequest',
            ...(options?.headers || {})
        },
        data: options?.data,
        timeout: 30000,
        anonymous: false,
        onload: response => {
            const contentType = response.responseHeaders?.match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
            const raw = response.responseText || '';
            const isHtml = /^\s*<html/i.test(raw) || /noindex, noarchive|ajaxload\.info|gorizontal-vertikal/i.test(raw);
            debugLog('panel-response', { path, status: response.status, contentType, isHtml });
            if (response.status >= 200 && response.status < 300 && !isHtml) {
                onSuccess(response);
            } else if (isHtml) {
                const login = /\/login|вход|авторизац/i.test(raw);
                onError(new Error(login
                    ? 'Panel: нет авторизации. Войдите в panel.hatiko.ru.'
                    : 'Panel: вернула HTML вместо JSON. Проверь авторизацию Panel.'), response);
            } else {
                onError(new Error(`Panel HTTP ${response.status}`), response);
            }
        },
        ontimeout: () => onError(new Error('Panel: таймаут запроса')),
        onerror: error => onError(new Error(`Panel: ошибка сети ${error}`))
    });
}

function parsePanelCsrf(html) {
    const meta = html.match(/<meta\b[^>]*name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i);
    if (meta) return meta[1];
    const input = html.match(/<input\b[^>]*name=["']_token["'][^>]*value=["']([^"']+)["']/i);
    return input ? input[1] : '';
}

function parsePanelJson(response) {
    const raw = String(response.responseText || response.response || '')
        .replace(/^\uFEFF/, '')
        .trim();
    if (!raw) throw new Error('Panel: пустой ответ');
    try {
        return JSON.parse(raw);
    } catch (error) {
        debugError('panel-json', {
            status: response.status,
            contentType: response.responseHeaders?.match(/content-type:\s*([^\\r\\n]+)/i)?.[1] || '',
            preview: raw.slice(0, 160)
        });
        throw new Error('Panel: некорректный JSON-ответ');
    }
}

function panelSearch(query, onSuccess, onError) {
    ensurePanelCsrf(csrf => {
        const request = () => panelRequest('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
            data: JSON.stringify({ search_type: 'article', query: String(query).trim(), cities_filter: [], stores_filter: [], show_external_code: true })
        }, response => {
            try { onSuccess(parsePanelJson(response)); }
            catch (error) { onError(error); }
        }, (error, response) => {
            if (response?.status === 419 || response?.status === 401 || response?.status === 403) {
                clearPanelCsrf();
                onError(new Error('Panel: авторизация истекла. Войдите в panel.hatiko.ru.'));
                return;
            }
            onError(error);
        });
        request();
    }, onError);
}

function panelCheckBonuses(phone, onSuccess, onError) {
    const normalized = String(phone || '').replace(/\D/g, '');
    if (!normalized) {
        onError(new Error('Panel: введите номер телефона'));
        return;
    }
    ensurePanelCsrf(csrf => {
        const request = () => panelRequest(`/api/bonuses/check/${encodeURIComponent(Number(normalized))}`, {
            headers: { 'X-CSRF-TOKEN': csrf }
        }, response => {
            try { onSuccess(parsePanelJson(response)); }
            catch (error) { onError(error); }
        }, (error, response) => {
            if (response?.status === 419 || response?.status === 401 || response?.status === 403) {
                clearPanelCsrf();
                onError(new Error('Panel: авторизация истекла. Войдите в panel.hatiko.ru.'));
                return;
            }
            onError(error);
        });
        request();
    }, onError);
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

