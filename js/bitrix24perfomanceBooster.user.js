// ==UserScript==
// @name         Bitrix24 Performance Booster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Ускорение работы сайта bitrix24.ru
// @author       Ваше имя
// @match        https://*.bitrix24.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Функция для отложенной загрузки изображений
    function lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const loadImage = (image) => {
            image.src = image.dataset.src;
            image.onload = () => {
                image.removeAttribute('data-src');
            };
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        images.forEach(image => {
            observer.observe(image);
        });
    }

    // Функция для улучшения производительности
    function optimizePerformance() {
        // Здесь можно добавить дополнительные оптимизации

        // Пример: переопределение setTimeout для использования requestAnimationFrame
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay) => {
            return originalSetTimeout(() => {
                requestAnimationFrame(callback);
            }, delay);
        };
    }

    // Основные функции
    function main() {
        optimizePerformance();
        lazyLoadImages();
    }

    // Запуск
    main();
})();
