// ==UserScript==
// @name         T2 Answer Helper
// @namespace    http://tampermonkey.net/
// @version      0.7.2
// @description  Extract answers from a T2 test and highlight correct ones
// @author       Your Name
// @match        https://*.t2.ru/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
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

    // Заголовок (используется для перетаскивания)
    const title = document.createElement('h3');
    title.innerText = 'Помощник';
    title.style.margin = '0 0 10px 0';
    title.style.cursor = 'move';
    floatDiv.appendChild(title);

    // Добавляем обработчики для перетаскивания
    title.onmousedown = function(e) {
        isDragging = true;
        dragOffsetX = e.clientX - floatDiv.getBoundingClientRect().left;
        dragOffsetY = e.clientY - floatDiv.getBoundingClientRect().top;
    };

    document.onmousemove = function(e) {
        if (isDragging) {
            floatDiv.style.left = `${e.clientX - dragOffsetX}px`;
            floatDiv.style.top = `${e.clientY - dragOffsetY}px`;
            floatDiv.style.bottom = 'auto';
            floatDiv.style.right = 'auto';
        }
    };

    document.onmouseup = function() {
        isDragging = false;
    };

    // Кнопка закрыть
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Закрыть';
    closeButton.style.float = 'right';
    closeButton.onclick = () => {
        floatDiv.style.display = 'none';
    };
    floatDiv.appendChild(closeButton);

    // Текстовое поле для ввода ссылки
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.placeholder = 'Вставьте ссылку';
    inputLink.style.width = '100%';
    inputLink.style.marginBottom = '10px';
    inputLink.oninput = function() {
        if (inputLink.value) {
            checkForQuestionNumber();
        }
    };
    floatDiv.appendChild(inputLink);

    // Поле для ввода номера вопроса
    const questionNumberInput = document.createElement('input');
    questionNumberInput.type = 'number';
    questionNumberInput.min = '1';
    questionNumberInput.max = totalQuestions.toString();
    questionNumberInput.value = currentQuestionIndex.toString();
    questionNumberInput.style.width = '100%';
    questionNumberInput.style.marginBottom = '10px';
    questionNumberInput.oninput = function() {
        updateQuestion(Number(questionNumberInput.value));
    };
    floatDiv.appendChild(questionNumberInput);

    // Слайдер для выбора номера вопроса
    const questionSlider = document.createElement('input');
    questionSlider.type = 'range';
    questionSlider.min = '1';
    questionSlider.max = totalQuestions.toString();
    questionSlider.value = currentQuestionIndex.toString();
    questionSlider.style.width = '100%';
    questionSlider.style.marginBottom = '10px';
    questionSlider.oninput = function() {
        updateQuestion(Number(questionSlider.value));
    };
    floatDiv.appendChild(questionSlider);

    // Кнопка "Ответы"
    const getAnswersButton = document.createElement('button');
    getAnswersButton.innerText = 'Ответы';
    getAnswersButton.style.width = '100%';
    getAnswersButton.onclick = async () => {
        const link = inputLink.value;
        if (!link) {
            alert('Пожалуйста, вставьте ссылку');
            return;
        }

        try {
            await fetchAndCacheAnswers(link);
            displayQuestion(answersCache[currentQuestionIndex - 1]);
            highlightCorrectAnswers();
        } catch (error) {
            alert('Ошибка при получении ответов');
        }
    };
    floatDiv.appendChild(getAnswersButton);

    // Текстовое поле для вывода результатов
    const resultField = document.createElement('textarea');
    resultField.id = 'resultField';
    resultField.style.width = '100%';
    resultField.style.height = '150px';
    resultField.style.marginTop = '10px';
    floatDiv.appendChild(resultField);

    // Функция для обновления вопроса
    function updateQuestion(index) {
        currentQuestionIndex = index;
        questionNumberInput.value = index.toString();
        questionSlider.value = index.toString();
        if (answersCache.length > 0) {
            displayQuestion(answersCache[currentQuestionIndex - 1]);
            highlightCorrectAnswers();
        }
    }

    // Функция для отображения вопроса и ответов
    function displayQuestion(question) {
        if (question) {
            resultField.value = formatAnswers([question]);
        } else {
            resultField.value = 'Вопрос не найден.';
        }
    }

    // Функция для получения и кэширования ответов
    async function fetchAndCacheAnswers(link) {
        if (answersCache.length === 0) {
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
    }

    // Функция для форматирования ответов
    function formatAnswers(answers) {
        return answers.map((answer, index) => {
            return `<${index + 1}> ${answer.title}\n${answer.correctTexts.map(text => `✔️ ${text}`).join('\n')}\n`;
        }).join('\n');
    }

    // Функция для подсветки правильных ответов на странице
    function highlightCorrectAnswers() {
        if (answersCache.length === 0) return;
    
        const currentQuestion = answersCache[currentQuestionIndex - 1];
        if (!currentQuestion) return;
    
        const correctAnswers = currentQuestion.correctTexts;
    
        // Ищем все возможные элементы с ответами в основном контейнере теста
        const answerElements = document.querySelectorAll('div[wtq-block="body"] [wtq-elem="answer-text"], div[wtq-block="body"] .answer-text');
        
        answerElements.forEach(el => {
            const text = el.textContent.trim();
            if (correctAnswers.some(correct => text.includes(correct))) {
                el.style.backgroundColor = 'lightgreen';
            } else {
                el.style.backgroundColor = '';
            }
        });
    }

    // Функция для проверки номера вопроса на странице
    async function checkForQuestionNumber() {
        // Ищем элемент с текстом вопроса в любом месте страницы
        const questionElements = document.querySelectorAll('div[wtq-block="body"] *');
        let found = false;
        
        questionElements.forEach(el => {
            const match = el.innerText.match(/Вопрос\s+(\d+)\s+из\s+(\d+)/);
            if (match && !found) {
                found = true;
                const questionNumber = Number(match[1]);
                const total = Number(match[2]);
                
                if (totalQuestions !== total) {
                    totalQuestions = total;
                    questionSlider.max = totalQuestions.toString();
                    questionNumberInput.max = totalQuestions.toString();
                }
                
                updateQuestion(questionNumber);
    
                if (answersCache.length === 0 && inputLink.value) {
                    await fetchAndCacheAnswers(inputLink.value);
                }
                highlightCorrectAnswers();
            }
        });
        
        setTimeout(checkForQuestionNumber, 1000);
    }

    // Добавление кнопки для повторного открытия окна
    GM_registerMenuCommand('Открыть помощник', () => {
        floatDiv.style.display = 'block';
    });

    // Инициализация периодической проверки
    checkForQuestionNumber();
})();
