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





