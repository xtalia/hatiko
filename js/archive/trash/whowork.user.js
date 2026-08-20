(function() {
    'use strict';

    // URL сервера, где находится обработчик запросов для who_works
    const WHO_WORKS_SERVER_URL = 'http://localhost:5000/who_work';

    // URL сервера, где находится обработчик запросов для memchat
    const MEMCHAT_SERVER_URL = 'http://127.0.0.1:5000/memchat';

    // Функция для создания и отображения плавающего окна
    function createFloatingWindow(content) {
        const window = document.createElement('div');
        window.style.position = 'fixed';
        window.style.top = '50%';
        window.style.left = '50%';
        window.style.transform = 'translate(-50%, -50%)';
        window.style.width = '400px';
        window.style.backgroundColor = '#fff';
        window.style.border = '1px solid #ccc';
        window.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
        window.style.zIndex = '10000';

        const header = document.createElement('div');
        header.style.backgroundColor = '#f0f0f0';
        header.style.borderBottom = '1px solid #ccc';
        header.style.padding = '10px';
        header.style.cursor = 'move';
        header.textContent = 'Мемный чат';
        header.style.userSelect = 'none';
        header.style.fontSize = '16px';
        header.style.fontWeight = 'bold';

        const contentWrapper = document.createElement('div');
        contentWrapper.style.padding = '20px';

        const responseText = document.createElement('textarea');
        responseText.style.width = '100%';
        responseText.style.height = '200px';
        responseText.style.marginTop = '10px';
        responseText.style.resize = 'vertical';
        responseText.style.border = '1px solid #ccc';
        responseText.style.padding = '10px';
        responseText.style.fontSize = '14px';
        responseText.style.lineHeight = '1.5';
        responseText.style.overflow = 'auto';
        responseText.value = content;
        responseText.readOnly = true;
        responseText.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });

        const closeButton = document.createElement('button');
        closeButton.innerText = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';

        closeButton.addEventListener('click', () => {
            document.body.removeChild(window);
        });

        header.addEventListener('mousedown', function(e) {
            e.preventDefault();
            header.style.cursor = 'grabbing';
            const initialX = e.clientX - window.offsetLeft;
            const initialY = e.clientY - window.offsetTop;

            function moveWindow(e) {
                window.style.left = e.clientX - initialX + 'px';
                window.style.top = e.clientY - initialY + 'px';
            }

            function stopMoving() {
                header.style.cursor = 'grab';
                document.removeEventListener('mousemove', moveWindow);
                document.removeEventListener('mouseup', stopMoving);
            }

            document.addEventListener('mousemove', moveWindow);
            document.addEventListener('mouseup', stopMoving);
        });

        contentWrapper.appendChild(responseText);
        window.appendChild(header);
        window.appendChild(closeButton);
        window.appendChild(contentWrapper);
        document.body.appendChild(window);
    }

    // Функция для отправки запроса на сервер
    function fetchWhoWorks(day) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${WHO_WORKS_SERVER_URL}?day=${day}`,
            onload: function(response) {
                if (response.status === 200) {
                    const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
                    if (contentType.includes('json')) {
                        const data = JSON.parse(response.responseText);
                        createFloatingWindow(data.text.replace(/\n/g, '\n'));
                    } else {
                        createFloatingWindow(`<p style="color: red;">Error: Response is not JSON</p>`);
                    }
                } else {
                    createFloatingWindow(`<p style="color: red;">Error fetching data: ${response.statusText}</p>`);
                }
            },
            onerror: function(error) {
                createFloatingWindow(`<p style="color: red;">Error fetching data: ${error}</p>`);
                console.error('Error fetching data:', error);
            }
        });
    }

    // Функция для отправки запроса на memchat
    function fetchMemchat(query) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${MEMCHAT_SERVER_URL}?query=${encodeURIComponent(query)}`,
            onload: function(response) {
                if (response.status === 200) {
                    const contentType = response.responseHeaders.match(/content-type:\s*([\w\/\-]+)/i)[1];
                    if (contentType.includes('json')) {
                        const data = JSON.parse(response.responseText);
                        createFloatingWindow(data);
                    } else {
                        createFloatingWindow(`<p style="color: red;">Error: Response is not JSON</p>`);
                    }
                } else {
                    createFloatingWindow(`<p style="color: red;">Error fetching data: ${response.statusText}</p>`);
                }
            },
            onerror: function(error) {
                createFloatingWindow(`<p style="color: red;">Error fetching data: ${error}</p>`);
                console.error('Error fetching data:', error);
            }
        });
    }

    // Регистрация команд контекстного меню
    GM_registerMenuCommand('Показать кто работает сегодня', () => fetchWhoWorks('today'));
    GM_registerMenuCommand('Показать кто работает завтра', () => fetchWhoWorks('tomorrow'));

    // Добавление пунктов меню в контекстное меню страницы
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        const menu = document.createElement('div');
        menu.style = `
            position: fixed;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            padding: 10px;
            background-color: white;
            border: 1px solid black;
            z-index: 1000;
        `;
        menu.innerHTML = `
            <div style="margin-bottom: 10px;"><b>Меню Memchat</b></div>
            <button onclick="openMemchatWindow()">Открыть окно мемного чата</button>
            <button onclick="forceUpdateCache()">Обновить кеш принудительно</button>
            <button onclick="closeWindow()">Закрыть</button>
        `;

        document.body.appendChild(menu);

        // Close the window if user clicks outside the menu
        document.addEventListener('click', function(event) {
            if (!menu.contains(event.target)) {
                menu.remove();
            }
        });

        window.openMemchatWindow = function() {
            const query = prompt('Введите ваш запрос:');
            if (query !== null) {
                fetchMemchat(query);
            }
        };

        window.forceUpdateCache = function() {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${MEMCHAT_SERVER_URL}?force=true`,
                onload: function(response) {
                    alert(response.responseText);
                },
                onerror: function(response) {
                    alert('Ошибка при обновлении кеша');
                }
            });
        };

        window.closeWindow = function() {
            menu.remove();
        };
    });
})();
