# Инвентаризация репозитория

Дата наведения порядка: 2026-08-20.

## Рабочие файлы

| Путь | Назначение | Статус |
|---|---|---|
| `js/memchat.user.js` | Главный serverless userscript | Активный |
| `js/wwPeoples.json` | Данные для расписания главного userscript-а | Активный |
| `js/userscripts/ozon-middle-click/` | Независимый Ozon userscript | Активный/отдельный |
| `js/userscripts/t2-answer-helper/` | Независимый T2 userscript | Активный/отдельный |
| `js/userscripts/polymarket/` | Независимый Polymarket userscript | Отдельное направление |

## Архив

| Путь | Содержимое |
|---|---|
| `js/archive/memchat-versions/` | старые версии memchat |
| `js/archive/unused-userscripts/` | неиспользуемые userscript-ы |
| `js/archive/trash/` | старые эксперименты |
| `js/archive/legacy-node/` | старый Node/Telegram-код и package manifests |
| `js/archive/legacy-data/` | старые JSON/данные JS-проектов |
| `archive/legacy-python/` | старый Python-бот, сервер и интеграции |
| `archive/polymarket-app/` | старое Python-приложение Polymarket |
| `archive/experiments/` | старые frontend-эксперименты |
| `archive/legacy-data/` | старые корневые данные |

## Важное решение

Текущий путь главного файла `js/memchat.user.js` сохранён, чтобы не ломать привычную установку и ссылки. Остальные рабочие userscript-ы разложены по отдельным папкам и не включаются в memchat.

## Локальные файлы

`polymarketmemes/config.json` и локальные виртуальные окружения не отслеживаются Git и остаются на машине разработчика. Секреты и credentials не переносились в рабочую структуру.

## Неиспользуемые дубликаты

`calculatorRates.json` и старые Node-конфиги помещены в архив, поскольку текущий `memchat.user.js` их не читает. Перед будущей модульной сборкой нужно отдельно выбрать источник истины для калькулятора.

## Следующий этап

Разбить `js/memchat.user.js` на модули, не меняя публичный путь к собранному userscript-у.