// ==UserScript==
// @name         Trade-In Calculator
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Calculate trade-in value for devices
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const superserver = 'memchat.tw1.ru:5000';

    let tradeInData = null;

    function loadTradeInData(force = false) {
        // Show loading message
        const existingWindow = document.getElementById('tradeInWindow');
        if (existingWindow) {
            existingWindow.innerHTML = '<p>Загрузка данных...</p>';
        } else {
            const loadingWindow = document.createElement('div');
            loadingWindow.id = 'tradeInWindow';
            loadingWindow.style.position = 'fixed';
            loadingWindow.style.top = '50px';
            loadingWindow.style.left = '50px';
            loadingWindow.style.width = '300px';
            loadingWindow.style.backgroundColor = 'white';
            loadingWindow.style.border = '1px solid black';
            loadingWindow.style.padding = '10px';
            loadingWindow.style.zIndex = '9999';
            loadingWindow.style.fontFamily = 'Arial, sans-serif';
            loadingWindow.innerHTML = '<p>Загрузка данных...</p>';
            document.body.appendChild(loadingWindow);
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: `http://${superserver}/load_tn${force ? '?force=true' : ''}`,
            onload: function(response) {
                try {
                    tradeInData = JSON.parse(response.responseText);
                    if (force) {
                        const notice = document.getElementById('updateNotice');
                        if (notice) {
                            notice.textContent = 'Данные обновлены. Перезапустите окно для просмотра.';
                            notice.style.color = 'red';
                        }
                        // Load trade-in data again without force after update
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: `http://${superserver}/load_tn`,
                            onload: function(response) {
                                try {
                                    tradeInData = JSON.parse(response.responseText);
                                    createTradeInWindow();
                                } catch (e) {
                                    console.error('Failed to parse updated trade-in data:', e);
                                }
                            },
                            onerror: function() {
                                console.error('Failed to load updated trade-in data');
                            }
                        });
                    } else {
                        createTradeInWindow();
                    }
                } catch (e) {
                    console.error('Failed to parse trade-in data:', e);
                }
            },
            onerror: function() {
                console.error('Failed to load trade-in data');
            }
        });
    }

    function createTradeInWindow() {
        // Remove existing window if it exists
        const existingWindow = document.getElementById('tradeInWindow');
        if (existingWindow) {
            existingWindow.remove();
        }

        // Create and position the window
        const windowHtml = `
        <div id="tradeInWindow" style="position: fixed; top: 50px; left: 50px; width: 300px; background-color: white; border: 1px solid black; padding: 10px; z-index: 9999; font-family: Arial, sans-serif;">
            <div id="windowHeader" style="display: flex; justify-content: space-between; margin-bottom: 10px; cursor: move;">
                <h2 style="margin: 0;">Оценка Trade-In</h2>
                <button id="closeTradeInWindow" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            <select id="modelSelect" style="width: 100%; margin-bottom: 10px;"></select>
            <select id="memorySelect" style="width: 100%; margin-bottom: 10px;"></select>
            <select id="batteryCapacitySelect" style="width: 100%; margin-bottom: 10px;">
                <option value="90">90%+</option>
                <option value="85">85-90%</option>
                <option value="0">менее 85%</option>
            </select>
            <select id="deviceConditionSelect" style="width: 100%; margin-bottom: 10px;">
                <option value="device_only">Только устройство</option>
                <option value="device_box">Устройство и коробка</option>
                <option value="full">Полный комплект</option>
            </select>
            <div style="margin-bottom: 10px;">
                <input type="checkbox" id="backCoverCheck"> Замена крышки
            </div>
            <div style="margin-bottom: 10px;">
                <input type="checkbox" id="screenCheck"> Замена дисплея
            </div>
            <select id="conditionSelect" style="width: 100%; margin-bottom: 10px;">
                <option value="excellent">Отлично</option>
                <option value="good">Хорошо</option>
                <option value="average">Среднее</option>
                <option value="poor">Плохое</option>
            </select>
            <textarea id="resultArea" style="width: 100%; height: 150px; margin-bottom: 10px;" readonly></textarea>
            <div id="updateNotice" style="font-size: 12px; margin-top: 10px;"></div>
        </div>
        `;

        // Create window div and append to body
        const windowDiv = document.createElement('div');
        windowDiv.innerHTML = windowHtml;
        document.body.appendChild(windowDiv);

        const tradeInWindow = document.getElementById('tradeInWindow');
        const closeButton = document.getElementById('closeTradeInWindow');
        const modelSelect = document.getElementById('modelSelect');
        const memorySelect = document.getElementById('memorySelect');
        const deviceConditionSelect = document.getElementById('deviceConditionSelect');

        closeButton.addEventListener('click', () => {
            tradeInWindow.style.display = 'none';
        });

        // Populate model options
        for (const model in tradeInData) {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        }

        modelSelect.addEventListener('change', updateMemoryOptions);
        updateMemoryOptions();

        const inputs = ['modelSelect', 'memorySelect', 'batteryCapacitySelect', 'deviceConditionSelect', 'backCoverCheck', 'screenCheck', 'conditionSelect'];
        inputs.forEach(id => document.getElementById(id).addEventListener('change', calculateTradeIn));

        function updateMemoryOptions() {
            const selectedModel = modelSelect.value;
            memorySelect.innerHTML = '';
            if (tradeInData[selectedModel]) {
                tradeInData[selectedModel].forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.memory;
                    option.textContent = item.memory + ' GB';
                    memorySelect.appendChild(option);
                });
                calculateTradeIn();
            } else {
                console.error('No data found for the selected model');
            }
        }

        function calculateTradeIn() {
            const model = modelSelect.value;
            const memory = memorySelect.value;
            const batteryCapacity = document.getElementById('batteryCapacitySelect').value;
            const deviceCondition = deviceConditionSelect.value;
            const backCover = document.getElementById('backCoverCheck').checked;
            const screen = document.getElementById('screenCheck').checked;
            const condition = document.getElementById('conditionSelect').value;

            if (!tradeInData[model]) {
                console.error('No data for model:', model);
                return;
            }

            const modelData = tradeInData[model].find(item => item.memory === memory);
            if (!modelData) {
                console.error('No data for memory:', memory);
                return;
            }

            let price = parseInt(modelData.ideal_price, 10);

            if (batteryCapacity === '0') {
                price += parseInt(modelData.battery_replacement, 10);
            } else if (batteryCapacity === '85') {
                price += parseInt(modelData.battery_wear, 10);
            }

            if (deviceCondition === 'device_only') {
                price += parseInt(modelData.device_only, 10);
            } else if (deviceCondition === 'device_box') {
                price += parseInt(modelData.device_box, 10);
            }

            if (backCover) {
                price += parseInt(modelData.back_cover_replacement, 10);
            }

            if (screen) {
                price += parseInt(modelData.screen_replacement, 10);
            }

            if (condition === 'average') {
                price -= price < 20000 ? 2000 : 1000;
            } else if (condition === 'poor') {
                price -= price < 20000 ? 3000 : 2000;
            }

            const backCoverStatus = backCover ? '🔧 Требуется замена крышки' : '✅ Крышка в порядке';
            const screenStatus = screen ? '🔧 Требуется замена дисплея' : '✅ Дисплей в порядке';

            const conditionEmoji = condition === 'excellent' ? '😎' :
                                    condition === 'good' ? '😀' :
                                    condition === 'average' ? '😐' : '😢';

            const result = `
📲 ${model} на ${memory} GB
🔋 Аккумулятор ${batteryCapacity === '90' ? '90%+' : batteryCapacity === '85' ? '85-90%' : 'менее 85%'}
📦 Комплект ${deviceCondition === 'device_only' ? 'Только устройство' : deviceCondition === 'device_box' ? 'Устройство и коробка' : 'Полный комплект'}
${backCoverStatus}
${screenStatus}
${conditionEmoji} Состояние: ${condition === 'excellent' ? 'Отличное' : condition === 'good' ? 'Хорошее' : condition === 'average' ? 'Среднее' : 'Плохое'}

💰 Предварительная цена выкупа: ${price} рублей

👉 Окончательная стоимость будет известна только при непосредственной проверке в магазине
            `;

            document.getElementById('resultArea').value = result;
        }

        // Make the window draggable only by the header
        let isDragging = false;
        let dragOffsetX, dragOffsetY;

        const windowHeader = document.getElementById('windowHeader');
        windowHeader.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffsetX = e.clientX - tradeInWindow.offsetLeft;
            dragOffsetY = e.clientY - tradeInWindow.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                tradeInWindow.style.left = (e.clientX - dragOffsetX) + 'px';
                tradeInWindow.style.top = (e.clientY - dragOffsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
            }
        });
    }

    GM_registerMenuCommand("Оценка Trade-In", () => {
        loadTradeInData(); // Load trade-in data and then create window
    });

    GM_registerMenuCommand("Принудительно обновить трейдин", () => {
        GM_xmlhttpRequest({
            method: "GET",
            url: `http://${superserver}/load_tn?force=true`,
            onload: function() {
                const notice = document.getElementById('updateNotice');
                if (notice) {
                    notice.textContent = 'Данные обновлены. Перезапустите окно для просмотра.';
                    notice.style.color = 'red';
                }
                // Load trade-in data again without force after update
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `http://${superserver}/load_tn`,
                    onload: function(response) {
                        try {
                            tradeInData = JSON.parse(response.responseText);
                            createTradeInWindow();
                            if (notice) {
                                notice.textContent = '';
                            }
                        } catch (e) {
                            console.error('Failed to parse updated trade-in data:', e);
                        }
                    },
                    onerror: function() {
                        console.error('Failed to load updated trade-in data');
                    }
                });
            },
            onerror: function() {
                console.error('Failed to force update trade-in data');
            }
        });
    });

})();
