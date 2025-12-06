/**
 * i18n - Internationalization Module
 *
 * Provides multi-language support for the application.
 * Usage:
 *   - Call i18n.setLanguage('en') or i18n.setLanguage('zh_tw') to switch language
 *   - Use i18n.t('key') to get translated text
 *   - HTML elements with data-i18n="key" will be auto-translated
 *   - HTML elements with data-i18n-placeholder="key" will have placeholder translated
 *   - HTML elements with data-i18n-title="key" will have title attribute translated
 */

const i18n = (function() {
    // Available languages
    const LANGUAGES = {
        'en': 'English',
        'zh_tw': '繁體中文'
    };

    // Default language
    const DEFAULT_LANGUAGE = 'zh_tw';

    // Storage key for persisting language preference
    const STORAGE_KEY = 'guessNumberLanguage';

    // Current language
    let currentLanguage = DEFAULT_LANGUAGE;

    // Language packs storage
    const languagePacks = {};

    /**
     * Register a language pack
     * @param {string} langCode - Language code (e.g., 'en', 'zh_tw')
     * @param {object} translations - Translation object
     */
    function registerLanguage(langCode, translations) {
        languagePacks[langCode] = translations;
    }

    /**
     * Get translation by key
     * Supports nested keys with dot notation (e.g., 'game.title')
     * @param {string} key - Translation key
     * @param {object} params - Optional parameters for interpolation
     * @returns {string} Translated text or key if not found
     */
    function t(key, params = {}) {
        const pack = languagePacks[currentLanguage] || languagePacks[DEFAULT_LANGUAGE];
        if (!pack) {
            console.warn(`[i18n] No language pack loaded for: ${currentLanguage}`);
            return key;
        }

        // Support nested keys with dot notation
        let value = key.split('.').reduce((obj, k) => obj && obj[k], pack);

        if (value === undefined) {
            console.warn(`[i18n] Missing translation for key: ${key} in ${currentLanguage}`);
            return key;
        }

        // Simple parameter interpolation: {param} -> value
        if (params && typeof value === 'string') {
            Object.keys(params).forEach(param => {
                value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
            });
        }

        return value;
    }

    /**
     * Set the current language
     * @param {string} langCode - Language code
     */
    function setLanguage(langCode) {
        if (!LANGUAGES[langCode]) {
            console.warn(`[i18n] Unknown language: ${langCode}, falling back to ${DEFAULT_LANGUAGE}`);
            langCode = DEFAULT_LANGUAGE;
        }

        if (!languagePacks[langCode]) {
            console.warn(`[i18n] Language pack not loaded: ${langCode}`);
            return false;
        }

        currentLanguage = langCode;
        localStorage.setItem(STORAGE_KEY, langCode);

        // Update HTML lang attribute
        document.documentElement.lang = langCode === 'zh_tw' ? 'zh-TW' : langCode;

        // Update all translatable elements
        updateAllTranslations();

        // Update language switcher buttons
        updateLanguageButtons();

        // Dispatch event for custom handlers
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));

        return true;
    }

    /**
     * Get current language code
     * @returns {string} Current language code
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }

    /**
     * Get all available languages
     * @returns {object} Language code to name mapping
     */
    function getAvailableLanguages() {
        return { ...LANGUAGES };
    }

    /**
     * Initialize i18n - load saved language preference
     */
    function init() {
        const savedLanguage = localStorage.getItem(STORAGE_KEY);
        if (savedLanguage && LANGUAGES[savedLanguage] && languagePacks[savedLanguage]) {
            currentLanguage = savedLanguage;
        } else {
            // Try to detect browser language
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang) {
                if (browserLang.startsWith('zh')) {
                    currentLanguage = 'zh_tw';
                } else if (browserLang.startsWith('en')) {
                    currentLanguage = 'en';
                }
            }
        }

        // Update HTML lang attribute
        document.documentElement.lang = currentLanguage === 'zh_tw' ? 'zh-TW' : currentLanguage;

        // Initial translation update
        updateAllTranslations();
        updateLanguageButtons();
    }

    /**
     * Update all elements with data-i18n attributes
     */
    function updateAllTranslations() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);

            // Preserve child elements (like spans with classes)
            if (el.childElementCount === 0) {
                el.textContent = translated;
            } else {
                // For elements with children, only update text nodes
                const childNodes = el.childNodes;
                for (let i = 0; i < childNodes.length; i++) {
                    if (childNodes[i].nodeType === Node.TEXT_NODE && childNodes[i].textContent.trim()) {
                        // This is a text node with content - we need special handling
                        // For complex cases, use data-i18n-html attribute
                    }
                }
                // For complex content, check for data-i18n-html
                if (el.hasAttribute('data-i18n-html')) {
                    el.innerHTML = translated;
                }
            }
        });

        // Translate HTML content (for elements with formatting)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = t(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });

        // Translate title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key);
        });

        // Update page title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = t(titleKey);
        }
    }

    /**
     * Update language switcher buttons active state
     */
    function updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            if (lang === currentLanguage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Public API
    return {
        registerLanguage,
        t,
        setLanguage,
        getCurrentLanguage,
        getAvailableLanguages,
        init,
        updateAllTranslations,
        LANGUAGES,
        DEFAULT_LANGUAGE
    };
})();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}
