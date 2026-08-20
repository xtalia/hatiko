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

## План дальнейшего развития

Следующий отдельный этап — разбить `memchat.user.js` на исходные модули, добавить локальную сборку и тесты, сохранив итоговый файл по текущему пути или настроив явный build-артефакт.
