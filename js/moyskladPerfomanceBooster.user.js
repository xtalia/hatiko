// ==UserScript==
// @name         MoySklad Performance Booster
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Ускорение работы сайта online.moysklad.ru с минификацией и асинхронной загрузкой скриптов
// @author       Ваше имя
// @match        https://online.moysklad.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Lazy Load для изображений и видео
    function lazyLoadMedia() {
        const images = document.querySelectorAll('img[data-src]');
        const videos = document.querySelectorAll('video');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const loadImage = (image) => {
            image.src = image.dataset.src;
            image.onload = () => image.removeAttribute('data-src');
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.tagName === 'IMG') {
                        loadImage(entry.target);
                    } else if (entry.target.tagName === 'VIDEO') {
                        entry.target.play();
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        images.forEach(image => observer.observe(image));
        videos.forEach(video => observer.observe(video));
    }

    // Throttle функция для прокрутки и изменения размеров
    function throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function() {
            const context = this;
            const args = arguments;
            if (!lastRan) {
                func.apply(context, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    // Пример использования throttle на прокрутке
    window.addEventListener('scroll', throttle(() => {
        console.log('Прокрутка обработана');
    }, 200));

    // Оптимизация setTimeout и setInterval
    function optimizeTimers() {
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay) => {
            return originalSetTimeout(() => {
                requestAnimationFrame(callback);
            }, delay);
        };

        const originalSetInterval = window.setInterval;
        window.setInterval = (callback, interval) => {
            return originalSetInterval(() => {
                requestAnimationFrame(callback);
            }, interval);
        };
    }

    // Извлечение и асинхронная загрузка динамических скриптов с кэшированием
    function asyncDynamicScripts() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.src;
            if (!localStorage.getItem(src)) {
                // Сохраняем исходный скрипт в localStorage
                fetch(src).then(response => response.text()).then(code => {
                    localStorage.setItem(src, code);
                });
            } else {
                // Заменяем старый скрипт на асинхронный, загружаемый из localStorage
                const cachedScript = localStorage.getItem(src);
                const asyncScript = document.createElement('script');
                asyncScript.type = 'text/javascript';
                asyncScript.async = true;
                asyncScript.text = cachedScript;
                document.body.appendChild(asyncScript);
                script.remove();
            }
        });
    }

    // Минификация HTML: удаление лишних пробелов, табуляций и комментариев
    function minifyHTML() {
        const body = document.body.innerHTML;
        const minified = body
            .replace(/\s+/g, ' ') // Убираем все лишние пробелы и табуляции
            .replace(/<!--[\s\S]*?-->/g, ''); // Удаляем комментарии
        document.body.innerHTML = minified;
    }

    // Основные функции
    function main() {
        lazyLoadMedia();
        optimizeTimers();
        asyncDynamicScripts(); // Асинхронная загрузка динамических скриптов
        minifyHTML(); // Минификация HTML
    }

    // Запуск скрипта
    main();
})();
