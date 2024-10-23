// ==UserScript==
// @name         Grab and Pin
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Grab and pin any element on the page with a draggable frame
// @author       Your Name
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let selectedElement = null;
    let frameElement = null;
    let placeholderElement = null;

    GM_registerMenuCommand('Grab and Pin - Select Element', () => {
        document.addEventListener('mouseover', highlightElement);
        document.addEventListener('click', selectElement);
    });

    function highlightElement(event) {
        if (selectedElement) return;

        const target = event.target;
        const originalBorder = target.style.border;
        target.style.border = '2px solid purple';

        target.addEventListener('mouseleave', () => {
            target.style.border = originalBorder;
        }, { once: true });
    }

    function selectElement(event) {
        if (!selectedElement) {
            selectedElement = event.target;
            createFrame(selectedElement);
            document.removeEventListener('mouseover', highlightElement);
            document.removeEventListener('click', selectElement);
        }
        event.preventDefault();
    }

    function createFrame(element) {
        const rect = element.getBoundingClientRect();
        
        // Create placeholder
        placeholderElement = document.createElement('div');
        placeholderElement.style.width = `${rect.width}px`;
        placeholderElement.style.height = `${rect.height}px`;
        placeholderElement.textContent = 'Placeholder for grabbed element';
        placeholderElement.style.border = '1px dashed gray';
        placeholderElement.style.position = 'absolute';
        placeholderElement.style.top = `${rect.top + window.scrollY}px`;
        placeholderElement.style.left = `${rect.left + window.scrollX}px`;
        document.body.appendChild(placeholderElement);

        // Create frame
        frameElement = document.createElement('div');
        frameElement.style.position = 'absolute';
        frameElement.style.width = `${rect.width}px`;
        frameElement.style.top = `${rect.top + window.scrollY}px`;
        frameElement.style.left = `${rect.left + window.scrollX}px`;
        frameElement.style.border = '2px solid blue';
        frameElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        frameElement.style.zIndex = '9999';
        frameElement.style.cursor = 'move';
        frameElement.innerHTML = `
            <div style="background: blue; color: white; padding: 5px;">
                ${element.tagName} - ${element.className}
                <button style="float: right; background: red; color: white; border: none; cursor: pointer;">X</button>
            </div>
            <div>${element.innerHTML}</div>
        `;

        frameElement.querySelector('button').addEventListener('click', closeFrame);

        document.body.appendChild(frameElement);

        // Make the frame draggable
        frameElement.onmousedown = (e) => {
            let shiftX = e.clientX - frameElement.getBoundingClientRect().left;
            let shiftY = e.clientY - frameElement.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                frameElement.style.left = pageX - shiftX + 'px';
                frameElement.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(event) {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            frameElement.onmouseup = () => {
                document.removeEventListener('mousemove', onMouseMove);
                frameElement.onmouseup = null;
            };
        };

        frameElement.ondragstart = () => {
            return false;
        };
    }

    function closeFrame() {
        if (frameElement) {
            document.body.removeChild(frameElement);
            frameElement = null;
            selectedElement = null;

            // Remove placeholder
            if (placeholderElement) {
                document.body.removeChild(placeholderElement);
                placeholderElement = null;
            }
        }
    }
})();
