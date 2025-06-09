// ==UserScript==
// @name         T2 Answer Helper
// @namespace    http://tampermonkey.net/
// @version      0.7.91
// @description  Extract answers from a T2 test and highlight correct ones
// @author       Your Name
// @match        https://*.t2.ru/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Переменные для перетаскивания
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Основные переменные
    let currentQuestionIndex = 1;
    let totalQuestions = 15;
    let answersCache = [];

    // Стили для подсветки
    GM_addStyle(`
        .t2-answer-highlight {
            background-color: #add8e6 !important;
            padding: 2px;
            border-radius: 3px;
        }
        #answerHelper {
            cursor: default;
            user-select: none;
        }
        #answerHelper h3 {
            cursor: move;
        }
        .emoji {
            font-size: 1.2em;
            vertical-align: middle;
        }
    `);

    // Создаем плавающее окно
    const floatDiv = document.createElement('div');
    floatDiv.id = 'answerHelper';
    floatDiv.style.position = 'fixed';
    floatDiv.style.bottom = '10px';
    floatDiv.style.right = '10px';
    floatDiv.style.width = '350px';
    floatDiv.style.backgroundColor = 'white';
    floatDiv.style.border = '1px solid #ccc';
    floatDiv.style.padding = '10px';
    floatDiv.style.zIndex = '10000';
    floatDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(floatDiv);

    // Заголовок (для перетаскивания)
    const title = document.createElement('h3');
    title.innerHTML = '<span class="emoji">🔍</span> Помощник ответов T2';
    title.style.margin = '0 0 10px 0';
    title.style.paddingBottom = '5px';
    title.style.borderBottom = '1px solid #eee';
    floatDiv.appendChild(title);

    // Обработчики перетаскивания
    title.addEventListener('mousedown', function(e) {
        isDragging = true;
        dragOffsetX = e.clientX - floatDiv.getBoundingClientRect().left;
        dragOffsetY = e.clientY - floatDiv.getBoundingClientRect().top;
        floatDiv.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            floatDiv.style.left = (e.clientX - dragOffsetX) + 'px';
            floatDiv.style.top = (e.clientY - dragOffsetY) + 'px';
            floatDiv.style.bottom = 'auto';
            floatDiv.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        floatDiv.style.cursor = 'default';
    });

    // Поле для ввода ссылки
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.placeholder = '📋 Вставьте ссылку на тест';
    inputLink.style.width = '100%';
    inputLink.style.marginBottom = '10px';
    inputLink.style.padding = '5px';
    floatDiv.appendChild(inputLink);

    // Блок управления вопросом
    const questionControl = document.createElement('div');
    questionControl.style.display = 'flex';
    questionControl.style.alignItems = 'center';
    questionControl.style.marginBottom = '10px';
    floatDiv.appendChild(questionControl);

    // Поле номера вопроса
    const questionNumberInput = document.createElement('input');
    questionNumberInput.type = 'number';
    questionNumberInput.min = '1';
    questionNumberInput.max = totalQuestions.toString();
    questionNumberInput.value = currentQuestionIndex.toString();
    questionNumberInput.style.width = '50px';
    questionNumberInput.style.marginRight = '10px';
    questionNumberInput.style.padding = '5px';
    questionNumberInput.onchange = function() {
        updateQuestion(Number(this.value));
    };
    questionControl.appendChild(questionNumberInput);

    // Слайдер вопроса
    const questionSlider = document.createElement('input');
    questionSlider.type = 'range';
    questionSlider.min = '1';
    questionSlider.max = totalQuestions.toString();
    questionSlider.value = currentQuestionIndex.toString();
    questionSlider.style.flex = '1';
    questionSlider.oninput = function() {
        updateQuestion(Number(this.value));
    };
    questionControl.appendChild(questionSlider);

    // Кнопка "Ответы"
    const getAnswersButton = document.createElement('button');
    getAnswersButton.innerHTML = '<span class="emoji">📥</span> Загрузить ответы';
    getAnswersButton.style.width = '100%';
    getAnswersButton.style.marginBottom = '10px';
    getAnswersButton.style.padding = '5px';
    getAnswersButton.onclick = async () => {
        await loadAndHighlightAnswers();
    };
    floatDiv.appendChild(getAnswersButton);

    // Текстовое поле для вывода ответов
    const resultField = document.createElement('textarea');
    resultField.id = 'resultField';
    resultField.style.width = '100%';
    resultField.style.height = '150px';
    resultField.style.marginBottom = '10px';
    resultField.style.padding = '5px';
    resultField.readOnly = true;
    floatDiv.appendChild(resultField);

    // Информационное поле
    const infoField = document.createElement('div');
    infoField.id = 'infoField';
    infoField.style.fontSize = '12px';
    infoField.style.color = '#666';
    floatDiv.appendChild(infoField);

    // Функция загрузки и подсветки ответов
    async function loadAndHighlightAnswers() {
        const link = inputLink.value;
        if (!link) {
            showInfo('⚠️ Введите ссылку на тест');
            return;
        }

        try {
            showInfo('⏳ Загрузка ответов...');
            await fetchAndCacheAnswers(link);
            highlightAnswers();
            updateResultField();
            showInfo(`✅ Загружено ${answersCache.length} вопросов. Текущий вопрос: ${currentQuestionIndex}`);
        } catch (error) {
            showInfo(`❌ Ошибка загрузки ответов: ${error.message}`);
            console.error(error);
        }
    }

    // Функция обновления вопроса
    function updateQuestion(index) {
        if (index < 1) index = 1;
        if (index > totalQuestions) index = totalQuestions;
        
        currentQuestionIndex = index;
        questionNumberInput.value = index.toString();
        questionSlider.value = index.toString();
        
        if (answersCache.length > 0) {
            highlightAnswers();
            updateResultField();
            showInfo(`📌 Текущий вопрос: ${currentQuestionIndex}`);
        }
    }

    // Функция загрузки ответов
    async function fetchAndCacheAnswers(link) {
        const url = new URL(link);
        const atl = url.searchParams.get('object_id');
        const code = url.searchParams.get('part_code');
        
        if (!atl || !code) {
            throw new Error('Некорректная ссылка');
        }

        const apiUrl = `https://abc.t2.ru/qti_return.html?atl=${atl}&code=${code}&charset=utf-8`;
        const response = await fetch(apiUrl);
        const xml = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const items = xmlDoc.getElementsByTagName('item');
        
        answersCache = [];
        totalQuestions = items.length;
        questionSlider.max = totalQuestions.toString();
        questionNumberInput.max = totalQuestions.toString();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const title = item.getAttribute('title');
            const responseLid = item.getElementsByTagName('response_lid')[0];
            const labels = responseLid.getElementsByTagName('response_label');
            const correctLabels = Array.from(labels).filter(label => label.getAttribute('ws_right') === '1');
            const correctTexts = correctLabels.map(label => label.getElementsByTagName('mattext')[0].textContent.trim());
            answersCache.push({ title, correctTexts });
        }
    }

    // Функция подсветки ответов
    function highlightAnswers() {
        // Сначала убираем все предыдущие подсветки
        document.querySelectorAll('.t2-answer-highlight').forEach(el => {
            el.classList.remove('t2-answer-highlight');
        });

        if (!answersCache[currentQuestionIndex - 1]) return;
        
        const correctAnswers = answersCache[currentQuestionIndex - 1].correctTexts;
        if (correctAnswers.length === 0) return;

        // Ищем все элементы с текстом на странице
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.trim() !== '') {
                textNodes.push(node);
            }
        }

        correctAnswers.forEach(answer => {
            textNodes.forEach(textNode => {
                if (textNode.nodeValue.includes(answer)) {
                    const parent = textNode.parentNode;
                    if (parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE') {
                        const span = document.createElement('span');
                        span.className = 't2-answer-highlight';
                        parent.replaceChild(span, textNode);
                        span.appendChild(textNode);
                    }
                }
            });
        });
    }

    // Функция обновления текстового поля с ответами
    function updateResultField() {
        if (!answersCache[currentQuestionIndex - 1]) {
            resultField.value = '❌ Ответы не загружены';
            return;
        }

        const question = answersCache[currentQuestionIndex - 1];
        resultField.value = `❓ Вопрос ${currentQuestionIndex}:\n${question.title}\n\n` +
                          `✅ Правильные ответы:\n${question.correctTexts.map(t => `✔ ${t}`).join('\n')}`;
    }

    // Функция копирования всех ответов
    function copyAllAnswersToClipboard() {
        if (answersCache.length === 0) {
            showInfo('❌ Нет загруженных ответов для копирования');
            return;
        }

        const allAnswers = answersCache.map((q, i) => {
            return `❓ Вопрос ${i + 1}:\n${q.title}\n\n` +
                   `✅ Правильные ответы:\n${q.correctTexts.map(t => `✔ ${t}`).join('\n')}\n\n`;
        }).join('');

        GM_setClipboard(allAnswers, 'text');
        showInfo('📋 Все ответы скопированы в буфер обмена!');
    }

    // Вспомогательная функция для отображения информации
    function showInfo(message) {
        infoField.innerHTML = message;
    }

    // Меню Tampermonkey
    GM_registerMenuCommand('📋 Скопировать все вопросы и ответы', copyAllAnswersToClipboard);
    GM_registerMenuCommand('🔍 Открыть помощник ответов', () => {
        floatDiv.style.display = 'block';
    });
})();