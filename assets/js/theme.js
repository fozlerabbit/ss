/**
 * Internationalization (i18n) System
 * Handles bilingual support for English and Bengali
 */

class I18n {
    constructor() {
        this.currentLang = this.getStoredLanguage() || this.detectLanguage();
        this.translations = {};
        this.fallbackLang = 'en';
        this.init();
    }

    async init() {
        try {
            await this.loadTranslations();
            this.applyLanguage();
            this.setupEventListeners();
            this.updateLanguageDisplay();
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
        }
    }

    detectLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && ['en', 'bn'].includes(urlLang)) {
            return urlLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.languages[0];
        if (browserLang.startsWith('bn')) {
            return 'bn';
        }

        return 'en'; // Default to English
    }

    getStoredLanguage() {
        try {
            return localStorage.getItem('preferred-language');
        } catch (error) {
            return null;
        }
    }

    setStoredLanguage(lang) {
        try {
            localStorage.setItem('preferred-language', lang);
        } catch (error) {
            console.warn('Could not store language preference');
        }
    }

    async loadTranslations() {
        const languages = ['en', 'bn'];
        const loadPromises = languages.map(async (lang) => {
            try {
                const response = await fetch(`/assets/i18n/${lang}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${lang} translations`);
                }
                const translations = await response.json();
                this.translations[lang] = translations;
            } catch (error) {
                console.error(`Error loading ${lang} translations:`, error);
                this.translations[lang] = {};
            }
        });

        await Promise.all(loadPromises);
    }

    translate(key, lang = this.currentLang) {
        const keys = key.split('.');
        let translation = this.translations[lang];

        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                // Fallback to other language
                translation = this.translations[this.fallbackLang];
                for (const fallbackKey of keys) {
                    if (translation && typeof translation === 'object' && fallbackKey in translation) {
                        translation = translation[fallbackKey];
                    } else {
                        return key; // Return key if no translation found
                    }
                }
                break;
            }
        }

        return typeof translation === 'string' ? translation : key;
    }

    applyLanguage() {
        // Update document language and direction
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'bn' ? 'ltr' : 'ltr'; // Both are LTR

        // Update page title
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-i18n');
            titleElement.textContent = this.translate(key);
        }

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
        if (metaDesc) {
            const key = metaDesc.getAttribute('data-i18n');
            metaDesc.content = this.translate(key);
        }

        // Update all elements with data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);
            
            // Handle different element types
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Update placeholder attributes
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.translate(key);
        });

        // Update aria-label attributes
        const ariaElements = document.querySelectorAll('[data-i18n-aria]');
        ariaElements.forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            element.setAttribute('aria-label', this.translate(key));
        });

        // Apply language-specific font styles
        document.body.classList.toggle('lang-bengali', this.currentLang === 'bn');

        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    }

    changeLanguage(lang) {
        if (!['en', 'bn'].includes(lang) || lang === this.currentLang) {
            return;
        }

        this.currentLang = lang;
        this.setStoredLanguage(lang);
        this.applyLanguage();
        this.updateLanguageDisplay();

        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
    }

    updateLanguageDisplay() {
        const currentLangElements = document.querySelectorAll('[data-current-lang]');
        currentLangElements.forEach(element => {
            element.textContent = this.currentLang.toUpperCase();
        });

        // Update language option active state
        const langOptions = document.querySelectorAll('[data-lang]');
        langOptions.forEach(option => {
            const lang = option.getAttribute('data-lang');
            option.classList.toggle('language-toggle__option--active', lang === this.currentLang);
        });
    }

    setupEventListeners() {
        // Language toggle buttons
        document.addEventListener('click', (e) => {
            const langToggle = e.target.closest('[data-language-toggle]');
            if (langToggle) {
                const dropdown = document.querySelector('[data-language-dropdown]');
                if (dropdown) {
                    dropdown.classList.toggle('language-toggle__dropdown--active');
                }
                return;
            }

            const langOption = e.target.closest('[data-lang]');
            if (langOption) {
                const lang = langOption.getAttribute('data-lang');
                this.changeLanguage(lang);
                
                // Close dropdown
                const dropdown = document.querySelector('[data-language-dropdown]');
                if (dropdown) {
                    dropdown.classList.remove('language-toggle__dropdown--active');
                }
                return;
            }
        });

        // Close language dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const languageToggle = e.target.closest('.language-toggle');
            if (!languageToggle) {
                const dropdown = document.querySelector('[data-language-dropdown]');
                if (dropdown) {
                    dropdown.classList.remove('language-toggle__dropdown--active');
                }
            }
        });

        // Keyboard shortcut (L key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only if not in input field
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && 
                    activeElement.tagName !== 'TEXTAREA' && 
                    !activeElement.isContentEditable) {
                    e.preventDefault();
                    this.toggleLanguage();
                }
            }
        });
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'bn' : 'en';
        this.changeLanguage(newLang);
    }

    // Utility method for dynamic content
    t(key, interpolations = {}) {
        let translation = this.translate(key);
        
        // Handle interpolations
        Object.keys(interpolations).forEach(placeholder => {
            const value = interpolations[placeholder];
            translation = translation.replace(`{{${placeholder}}}`, value);
        });

        return translation;
    }

    // Format numbers based on locale
    formatNumber(number, options = {}) {
        const locale = this.currentLang === 'bn' ? 'bn-BD' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(number);
    }

    // Format dates based on locale
    formatDate(date, options = {}) {
        const locale = this.currentLang === 'bn' ? 'bn-BD' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(date);
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Check if current language is RTL (future-proofing)
    isRTL() {
        return false; // Both Bengali and English are LTR
    }
}

// Initialize i18n system
let i18nInstance;

document.addEventListener('DOMContentLoaded', async () => {
    i18nInstance = new I18n();
    
    // Make available globally for other scripts
    window.i18n = i18nInstance;
});

// Re-apply translations when partials are loaded
document.addEventListener('partialsLoaded', () => {
    if (i18nInstance) {
        i18nInstance.applyLanguage();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
