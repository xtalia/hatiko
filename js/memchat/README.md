# Memchat

Главный serverless userscript репозитория `hatiko`.

Архитектура: локальные исходные модули, автономная production-сборка и отдельный DEV userscript для разработки.

## Исходники

- `metadata.user.js` — metadata шаблон production;
- `src/01-config-and-state.js` — константы и состояние;
- `src/02-storage-and-transport.js` — localStorage и запросы;
- `src/03-chat.js` — история и вывод чата;
- `src/04-hatiko.js` — поиск и цены Hatiko;
- `src/05-calculator.js` — расчёты;
- `src/06-schedule.js` — расписание;
- `src/07-settings-panels.js` — drag и панели правил;
- `src/08-clear-and-actions.js` — очистка и dispatcher;
- `src/09-ui.js` — шаблон и создание окна;
- `src/10-events-and-init.js` — события и инициализация.

## Production

Главный рабочий файл:

```text
js/memchat.user.js
```

Он автономен: содержит metadata и весь код модулей. В production нет `@require`, поэтому скрипт не зависит от загрузки отдельных файлов с GitHub Raw.

Собрать его из локальных модулей:

```bash
node js/memchat/build-memchat.js
node --check js/memchat.user.js
```

Сборщик читает модули в фиксированном порядке, добавляет комментарии с именами файлов и записывает единый userscript.

## DEV-версия

Для запуска локальной разработки есть скрипт:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\js\memchat\scripts\dev.ps1
```

Порт можно изменить:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\js\memchat\scripts\dev.ps1 -Port 8124
```

Тестовый userscript:

```text
js/memchat/dev/memchat.dev.user.js
```

Он подключает те же модули через `@require` с локального HTTP-сервера. Это позволяет быстро редактировать исходники и перезагружать DEV userscript без production-сборки.

Скрипт запускает локальную раздачу модулей из каталога исходников. Альтернативно вручную:

```bash
cd js/memchat/src
python -m http.server 8123 --bind 127.0.0.1
```

Затем установите `js/memchat/dev/memchat.dev.user.js` в Tampermonkey. Для `@require http://127.0.0.1:8123/...` Tampermonkey может потребовать разрешить локальные подключения в настройках.

DEV-скрипт использует отдельные ключи localStorage с префиксом `memchat:dev:` и не должен перезаписывать настройки production.

## Сохранение выбранного режима

Последний выбранный режим (`Hatiko`, `Калькулятор`, `Реверс`, `Скидка/+` или `Простой`) сохраняется в `localStorage`:

```text
memchat:selectedAction_v1
memchat:dev:selectedAction_v1
```

При следующем открытии окна userscript автоматически восстанавливает соответствующую активную кнопку. Если сохранённого или неизвестного режима нет, используется `Hatiko`.

## Ежедневный workflow

1. Изменить один файл в `src/`.
2. Проверить его: `node --check js/memchat/src/<file>.js`.
3. Для быстрой ручной проверки обновить DEV userscript.
4. Перед публикацией собрать production:

```bash
node js/memchat/build-memchat.js
for f in js/memchat/src/*.js js/memchat/build-memchat.js; do node --check "$f"; done
node --check js/memchat.user.js
```

5. Либо выполнить готовый скрипт публикации:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\js\memchat\scripts\publish.ps1
```

Он сам соберёт production, проверит файлы, сделает commit и push. Ручной вариант:

6. Проверить изменения и отправить оба слоя — исходники и результат сборки:

```bash
git add js/memchat js/memchat.user.js README.md
git commit -m "refactor: modularize memchat with standalone production build"
git push origin main
```

## Отладка

В DEV или production откройте DevTools страницы (`F12`) → **Console**. В меню Tampermonkey есть пункт `Переключить отладку мемного чата`. Сообщения имеют префиксы `[Memchat:init]`, `[Memchat:request]`, `[Memchat:response]`, `[Memchat:action]`, `[Memchat:uncaught]` и `[Memchat:promise]`.

Для сетевых проблем проверяйте вкладку **Network**. Для проблем конкретной функции временно добавляйте `debugLog('scope', value)` в соответствующий модуль.

## Ограничения и правила

- Не редактировать `js/memchat.user.js` вручную: это generated-файл.
- Не подключать production через `@require`.
- Не использовать одинаковый localStorage namespace в DEV и production.
- Не менять порядок модулей без проверки зависимостей.
- Перед commit всегда выполнять build и syntax checks.
- Внешние источники данных остаются частью runtime serverless-логики, но модули самого userscript-а в production уже встроены.

## Почему так

Модульность остаётся удобной для разработки, а production-файл остаётся одним автономным userscript-ом. Поэтому сеть, кэш Tampermonkey и рассинхронизация версий модулей не могут сломать установленный production-файл.