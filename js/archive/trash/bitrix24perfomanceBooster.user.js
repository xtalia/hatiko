// ==UserScript==
// @name         Bitrix24 Performance Booster (Safe)
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Ускорение работы сайта bitrix24.ru с безопасной оптимизацией
// @author       Ваше имя
// @match        https://*.bitrix24.ru/*
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

    // Кэширование API запросов
    function cacheApiResponse(url) {
        const cachedData = localStorage.getItem(url);
        if (cachedData) {
            return Promise.resolve(JSON.parse(cachedData));
        }
        return fetch(url).then(response => response.json()).then(data => {
            localStorage.setItem(url, JSON.stringify(data));
            return data;
        });
    }

    // Основные функции
    function main() {
        lazyLoadMedia();
        optimizeTimers();
    }

    // Запуск скрипта
    main();
})();
