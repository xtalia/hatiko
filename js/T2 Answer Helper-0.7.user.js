// ==UserScript==
// @name         T2 Answer Helper
// @namespace    http://tampermonkey.net/
// @version      0.7.9
// @description  Extract answers from a T2 test and highlight correct ones
// @author       Your Name
// @match        https://*.t2.ru/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Стили для подсветки
    GM_addStyle(`
        .t2-answer-highlight {
            background-color: #add8e6 !important;
            padding: 2px;
            border-radius: 3px;
        }
    `);

    let currentQuestionIndex = 1;
    let totalQuestions = 15;
    let answersCache = [];

    // Создаем плавающее окно
    const floatDiv = document.createElement('div');
    floatDiv.id = 'answerHelper';
    floatDiv.style.position = 'fixed';
    floatDiv.style.bottom = '10px';
    floatDiv.style.right = '10px';
    floatDiv.style.width = '300px';
    floatDiv.style.backgroundColor = 'white';
    floatDiv.style.border = '1px solid #ccc';
    floatDiv.style.padding = '10px';
    floatDiv.style.zIndex = '10000';
    floatDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(floatDiv);

    // Заголовок
    const title = document.createElement('h3');
    title.innerText = 'Помощник ответов T2';
    title.style.margin = '0 0 10px 0';
    floatDiv.appendChild(title);

    // Поле для ввода ссылки
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.placeholder = 'Вставьте ссылку на тест';
    inputLink.style.width = '100%';
    inputLink.style.marginBottom = '10px';
    floatDiv.appendChild(inputLink);

    // Блок управления вопросом
    const questionControl = document.createElement('div');
    questionControl.style.display = 'flex';
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
    getAnswersButton.innerText = 'Загрузить ответы';
    getAnswersButton.style.width = '100%';
    getAnswersButton.style.marginBottom = '10px';
    getAnswersButton.onclick = async () => {
        await loadAndHighlightAnswers();
    };
    floatDiv.appendChild(getAnswersButton);

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
            showInfo('Введите ссылку на тест');
            return;
        }

        try {
            showInfo('Загрузка ответов...');
            await fetchAndCacheAnswers(link);
            highlightAnswers();
            showInfo(`Загружено ${answersCache.length} вопросов`);
        } catch (error) {
            showInfo('Ошибка загрузки ответов');
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

        // Ищем все текстовые элементы на странице
        const allTextElements = document.querySelectorAll('body *');
        
        correctAnswers.forEach(answer => {
            allTextElements.forEach(element => {
                if (element.children.length === 0 && element.textContent.includes(answer)) {
                    // Подсвечиваем элемент, содержащий ответ
                    element.classList.add('t2-answer-highlight');
                }
            });
        });
    }

    // Вспомогательная функция для отображения информации
    function showInfo(message) {
        infoField.textContent = message;
    }

    // Кнопка для повторного открытия окна
    GM_registerMenuCommand('Открыть помощник ответов', () => {
        floatDiv.style.display = 'block';
    });
})();