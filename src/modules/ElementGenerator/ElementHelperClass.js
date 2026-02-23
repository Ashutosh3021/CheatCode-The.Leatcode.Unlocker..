/**
 * ElementHelperClass
 * Utility factory and helper methods for DOM element creation.
 * All ElementModifiers and ContentBuilders use this as their base.
 * 🟢 Fix: Uses LeetCode CSS custom properties instead of hardcoded hex colors.
 */

export class ElementHelperClass {
    /**
     * Create a DOM element with optional attributes and children.
     * @param {string} tag
     * @param {Object} [attrs]
     * @param {...(Node|string)} children
     * @returns {HTMLElement}
     */
    static create(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        for (const [key, val] of Object.entries(attrs)) {
            if (key === 'class') {
                el.className = val;
            } else if (key === 'style' && typeof val === 'object') {
                Object.assign(el.style, val);
            } else if (key.startsWith('on') && typeof val === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), val);
            } else {
                el.setAttribute(key, val);
            }
        }
        for (const child of children) {
            if (child == null) continue;
            el.appendChild(
                typeof child === 'string' ? document.createTextNode(child) : child
            );
        }
        return el;
    }

    /**
     * Find a single element by CSS selector, optionally scoped to a parent.
     * @param {string} selector
     * @param {Element} [parent=document]
     * @returns {Element|null}
     */
    static qs(selector, parent = document) {
        return parent.querySelector(selector);
    }

    /**
     * Find all elements matching a CSS selector.
     * @param {string} selector
     * @param {Element} [parent=document]
     * @returns {NodeList}
     */
    static qsa(selector, parent = document) {
        return parent.querySelectorAll(selector);
    }

    /**
     * Add one or more CSS classes to an element.
     * @param {Element} el
     * @param {...string} classes
     */
    static addClass(el, ...classes) {
        el.classList.add(...classes);
    }

    /**
     * Remove one or more CSS classes from an element.
     * @param {Element} el
     * @param {...string} classes
     */
    static removeClass(el, ...classes) {
        el.classList.remove(...classes);
    }

    /**
     * Remove an element from the DOM.
     * @param {Element} el
     */
    static remove(el) {
        el?.parentNode?.removeChild(el);
    }

    /**
     * Hide an element using inline display:none.
     * @param {Element} el
     */
    static hide(el) {
        if (el) el.style.display = 'none';
    }

    /**
     * Show an element (resets display).
     * @param {Element} el
     * @param {string} [display='']
     */
    static show(el, display = '') {
        if (el) el.style.display = display;
    }

    /**
     * Observe DOM mutations at the body level with a callback.
     * @param {Function} callback
     * @returns {MutationObserver}
     */
    static observeDOM(callback) {
        const observer = new MutationObserver(callback);
        observer.observe(document.body, { childList: true, subtree: true });
        return observer;
    }

    /**
     * Wait for an element matching selector to appear in the DOM.
     * @param {string} selector
     * @param {number} [timeout=10000]
     * @returns {Promise<Element>}
     */
    static waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const timer = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`[LC-Unlock] Timeout waiting for: ${selector}`));
            }, timeout);

            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve(found);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}
