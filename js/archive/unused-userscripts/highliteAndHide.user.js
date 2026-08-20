// ==UserScript==
// @name         Enhanced Highlight and Hide Elements
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Enhanced script to highlight and hide elements with customizable options and better user feedback.
// @author       ChatGPT
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    const HIDDEN_ELEMENTS_KEY = 'hidden_elements';
    const ENABLED_KEY = 'highlight_hide_enabled';
    const HIGHLIGHT_COLOR_KEY = 'highlight_color';
    const HIDE_DURATION_KEY = 'hide_duration';

    // Initialize settings
    if (GM_getValue(ENABLED_KEY, false) === null) GM_setValue(ENABLED_KEY, false);
    if (GM_getValue(HIGHLIGHT_COLOR_KEY) === null) GM_setValue(HIGHLIGHT_COLOR_KEY, 'yellow');
    if (GM_getValue(HIDE_DURATION_KEY) === null) GM_setValue(HIDE_DURATION_KEY, 5000);

    function restoreHiddenElements() {
        const hiddenElements = JSON.parse(localStorage.getItem(HIDDEN_ELEMENTS_KEY) || '[]');
        hiddenElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('highlighted');
            });
        });
    }

    function hideElement(e) {
        if (!GM_getValue(ENABLED_KEY)) return;

        const target = e.target;
        const selector = getUniqueSelector(target);
        const hiddenElements = JSON.parse(localStorage.getItem(HIDDEN_ELEMENTS_KEY) || '[]');

        target.classList.add('highlighted');
        target.classList.add('hidden');

        if (!hiddenElements.includes(selector)) {
            hiddenElements.push(selector);
            localStorage.setItem(HIDDEN_ELEMENTS_KEY, JSON.stringify(hiddenElements));
        }

        setTimeout(() => {
            target.classList.remove('hidden');
            target.classList.remove('highlighted');
            localStorage.removeItem(HIDDEN_ELEMENTS_KEY);
        }, GM_getValue(HIDE_DURATION_KEY));
    }

    function getUniqueSelector(el) {
        let path = [];
        while (el) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += `#${el.id}`;
                path.unshift(selector);
                break;
            } else {
                let sibling = el;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === el.nodeName.toLowerCase()) {
                        nth++;
                    }
                }
                selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentElement;
        }
        return path.join(' > ');
    }

    function toggleFeature() {
        const enabled = GM_getValue(ENABLED_KEY);
        GM_setValue(ENABLED_KEY, !enabled);
        alert(`Feature ${enabled ? 'disabled' : 'enabled'}. Refresh the page to apply changes.`);
    }

    function setHighlightColor() {
        const color = prompt('Enter highlight color (e.g., yellow, red, #ff0000):', GM_getValue(HIGHLIGHT_COLOR_KEY));
        if (color) GM_setValue(HIGHLIGHT_COLOR_KEY, color);
    }

    function setHideDuration() {
        const duration = prompt('Enter hide duration in milliseconds:', GM_getValue(HIDE_DURATION_KEY));
        if (duration && !isNaN(duration)) GM_setValue(HIDE_DURATION_KEY, parseInt(duration, 10));
    }

    GM_registerMenuCommand('Toggle Highlight & Hide Feature', toggleFeature);
    GM_registerMenuCommand('Set Highlight Color', setHighlightColor);
    GM_registerMenuCommand('Set Hide Duration', setHideDuration);

    document.addEventListener('mousedown', function(e) {
        if (e.button === 1) {
            e.preventDefault();
            hideElement(e);
        }
    });

    document.addEventListener('mouseover', function(e) {
        if (GM_getValue(ENABLED_KEY)) {
            e.target.classList.add('highlighted');
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (GM_getValue(ENABLED_KEY)) {
            e.target.classList.remove('highlighted');
        }
    });

    window.addEventListener('load', restoreHiddenElements);

    // Add CSS styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .highlighted {
            outline: 2px solid ${GM_getValue(HIGHLIGHT_COLOR_KEY)};
        }
        .hidden {
            display: none;
        }
    `;
    document.head.appendChild(style);
})();
