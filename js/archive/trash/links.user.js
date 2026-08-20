// ==UserScript==
// @name         Полезные ссылки
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Выдвижная панель с полезными ссылками и кнопкой для показа/скрытия, а также обновления списка ссылок
// @author       Your Name
// @match        https://online.moysklad.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const panelWidth = 250; // Ширина выдвижной панели в пикселях
    let panelVisible = false;

    const showButton = document.createElement('button');
    showButton.textContent = '🔗 Полезные ссылки';
    showButton.style.cssText = `
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        background-color: #007bff;
        color: #fff;
        border: none;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        padding: 10px;
        cursor: pointer;
        z-index: 1000;
    `;
    showButton.addEventListener('click', () => {
        togglePanel();
    });
    document.body.appendChild(showButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = '❌ Скрыть';
    closeButton.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        right: 0;
        transform: translateY(-50%);
        background-color: #dc3545;
        color: #fff;
        border: none;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        padding: 10px;
        cursor: pointer;
        z-index: 1000;
    `;
    closeButton.addEventListener('click', () => {
        hidePanel();
    });
    document.body.appendChild(closeButton);

    const panel = document.createElement('div');
    panel.id = 'usefulLinksPanel';
    panel.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: ${panelWidth}px;
        height: 100%;
        background-color: #fff;
        box-shadow: -1px 0 10px rgba(0, 0, 0, 0.1);
        z-index: 999;
        transform: translateX(${panelWidth}px);
        transition: transform 0.3s ease;
        overflow-y: auto;
        padding: 10px;
    `;

    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 Обновить список';
    refreshButton.style.cssText = `
        background-color: #28a745;
        color: #fff;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        margin-bottom: 10px;
    `;
    refreshButton.addEventListener('click', () => {
        fetchLinks();
    });
    panel.appendChild(refreshButton);

    const linksContainer = document.createElement('div');
    panel.appendChild(linksContainer);

    function togglePanel() {
        if (panelVisible) {
            hidePanel();
        } else {
            showPanel();
        }
    }

    function showPanel() {
        showButton.style.display = 'none';
        closeButton.style.display = 'block';
        panel.style.transform = 'translateX(0)';
        panelVisible = true;
        fetchLinks();
    }

    function hidePanel() {
        showButton.style.display = 'block';
        closeButton.style.display = 'none';
        panel.style.transform = `translateX(${panelWidth}px)`;
        panelVisible = false;
    }

    function fetchLinks() {
        fetch('https://raw.githubusercontent.com/xtalia/vscode/main/memchat/js/links.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load links');
                }
                return response.json();
            })
            .then(linksData => {
                renderLinks(linksData);
            })
            .catch(error => {
                console.error('Failed to load links', error);
                alert('Не удалось загрузить список ссылок. Попробуйте еще раз.');
            });
    }

    function renderLinks(linksData) {
        linksContainer.innerHTML = '';
        linksData.forEach(link => {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.textContent = link.name;
            linkElement.style.cssText = `
                display: block;
                padding: 10px;
                color: #333;
                text-decoration: none;
                border-bottom: 1px solid #eee;
                transition: background-color 0.3s ease;
            `;
            linkElement.addEventListener('mouseover', () => {
                linkElement.style.backgroundColor = '#f0f0f0';
            });
            linkElement.addEventListener('mouseout', () => {
                linkElement.style.backgroundColor = 'transparent';
            });
    
            // Открывать ссылки в новой вкладке
            linkElement.target = '_blank';
    
            linksContainer.appendChild(linkElement);
        });
    }
    

    // Initial hide the panel
    hidePanel();

    // Add panel to the document
    document.body.appendChild(panel);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        #usefulLinksPanel a:hover {
            background-color: #f0f0f0;
        }
    `;
    document.head.appendChild(style);

})();
