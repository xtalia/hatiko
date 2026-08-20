# hatiko

Личные скрипты и старые инструменты для работы с Hatiko.

## Главный проект

`js/memchat.user.js` — основной serverless userscript для Tampermonkey.

Он работает непосредственно в браузере и получает данные напрямую из внешних источников. Для его работы не требуется собственный сервер.

Связанные данные:

- `js/wwPeoples.json` — данные/переопределения расписания;
- настройки калькулятора и замен расписания по умолчанию находятся внутри текущего userscript-а и сохраняются в `localStorage` браузера.

Установить основной скрипт можно, открыв `js/memchat.user.js` в Tampermonkey. После реорганизации путь к нему сохранён, чтобы не ломать привычную ссылку.

## Другие userscript-ы

Независимые скрипты находятся в отдельных папках:

- `js/userscripts/ozon-middle-click/OzonMiddleClick.user.js` — исправление средней кнопки мыши на Ozon;
- `js/userscripts/t2-answer-helper/T2-Answer-Helper.user.js` — помощник для тестов T2;
- `js/userscripts/polymarket/polyc.user.js` — помощник для Polymarket.

Они не являются зависимостями `memchat.user.js` и развиваются независимо.

## Архив

В `archive/` убраны старые и неиспользуемые проекты:

- `archive/memchat-versions/` — старые версии мемного чата;
- `archive/unused-userscripts/` — userscript-ы, которые сейчас не используются;
- `archive/trash/` — старые эксперименты;
- `archive/legacy-node/` — старый Node.js/Telegram-код и его зависимости;
- `archive/legacy-python/` — старый Python-бот, серверные интеграции и связанные файлы;
- `archive/polymarket-app/` — старое отдельное Python-приложение Polymarket;
- `archive/experiments/` — старые frontend-эксперименты;
- `archive/legacy-data/` — данные, не используемые главным userscript-ом.

Архив намеренно оставлен в Git, чтобы не потерять историю и старые наработки. Он не участвует в работе основного userscript-а.

## Важно

- Не коммитить `config.json`, `creds.json`, `.env`, токены, cookies и локальные базы данных.
- Локальная конфигурация Polymarket остаётся игнорируемым файлом `polymarketmemes/config.json`.
- `package.json` и `requirements.txt` старого backend-кода находятся вместе с ним в архиве и не нужны для запуска `memchat.user.js`.
- Изменения структуры не меняют код главного userscript-а.

## Memchat: разработка и отладка

Исходники главного userscript-а находятся в `js/memchat/`, а итоговый автономный production-файл для Tampermonkey собирается в `js/memchat.user.js`. Для быстрой разработки есть отдельный DEV userscript с локальными `@require`-модулями.

```bash
node js/memchat/build-memchat.js
node --check js/memchat.user.js
```

Для отладки в Tampermonkey:

1. Откройте DevTools страницы (`F12` или `Ctrl+Shift+I`).
2. Перейдите на вкладку **Console**.
3. В меню Tampermonkey выберите **«Переключить отладку мемного чата»**.
4. Перезагрузите страницу и повторите действие.
5. Ищите сообщения с префиксами `[Memchat:request]`, `[Memchat:response]`, `[Memchat:action]`, `[Memchat:uncaught]` и `[Memchat:promise]`.
6. На вкладке **Network** проверяйте статусы запросов Hatiko, Google Sheets и GitHub.

В исходниках можно временно поставить `debugLog('scope', value)` в нужном модуле. Для постоянных изменений сначала воспроизводите проблему, затем добавляйте тест или минимальную проверку, исправляйте один слой и снова запускайте сборку.

## План дальнейшего развития

Следующий этап — добавить тесты для чистых функций калькулятора, парсеров Hatiko и форматтера расписания. После каждого изменения исходников нужно пересобрать `js/memchat.user.js`.
