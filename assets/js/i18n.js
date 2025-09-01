/**
 * Internationalization (i18n) System
 * Handles bilingual content switching between English and Bengali
 */

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.fallbackLanguage = 'en';
        this.storageKey = 'ss-language';
        this.rtlLanguages = ['ar', 'ur', 'fa']; // Add RTL languages if needed
    }

    /**
     * Initialize the i18n system
     */
    async init() {
        try {
            // Load saved language or detect from browser
            this.currentLanguage = this.getSavedLanguage() || this.detectLanguage();
            
            // Load translation files
            await this.loadTranslations();
            
            // Apply translations to the page
            this.applyTranslations();
            
            // Update document language attributes
            this.updateDocumentLanguage();
            
            // Initialize language toggle functionality
            this.initializeLanguageToggle();
            
            // Set up language toggle UI
            this.updateLanguageToggleUI();
            
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
            // Fallback to English if initialization fails
            this.currentLanguage = 'en';
        }
    }

    /**
     * Load translation files for current and fallback languages
     */
    async loadTranslations() {
        const languages = [this.currentLanguage];
        if (this.currentLanguage !== this.fallbackLanguage) {
            languages.push(this.fallbackLanguage);
        }

        await Promise.all(languages.map(async (lang) => {
            try {
                const response = await fetch(`/assets/i18n/${lang}.json`);
                if (response.ok) {
                    this.translations[lang] = await response.json();
                }
            } catch (error) {
                console.warn(`Failed to load translations for ${lang}:`, error);
            }
        }));

        // Ensure we have at least fallback translations
        if (!this.translations[this.fallbackLanguage]) {
            console.error('Failed to load fallback translations');
            this.translations[this.fallbackLanguage] = {};
        }
    }

    /**
     * Apply translations to all elements with data-i18n attributes
     */
    applyTranslations() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Translate placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Translate aria-label attributes
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.setAttribute('aria-label', translation);
            }
        });

        // Translate title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.title = translation;
            }
        });

        // Update page title
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                document.title = translation;
            }
        }
    }

    /**
     * Get translation for a key with fallback support
     */
    getTranslation(key) {
        if (!key) return null;

        // Try current language first
        let translation = this.getNestedValue(this.translations[this.currentLanguage], key);
        
        // Fallback to default language if not found
        if (!translation && this.currentLanguage !== this.fallbackLanguage) {
            translation = this.getNestedValue(this.translations[this.fallbackLanguage], key);
        }

        return translation || key; // Return key as fallback if no translation found
    }

    /**
     * Get nested object value using dot notation
     */
    getNestedValue(obj, path) {
        if (!obj || !path) return null;
        
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * Switch to a different language
     */
    async switchLanguage(newLanguage) {
        if (newLanguage === this.currentLanguage) return;

        const previousLanguage = this.currentLanguage;
        this.currentLanguage = newLanguage;

        try {
            // Load new language translations if not already loaded
            if (!this.translations[newLanguage]) {
                await this.loadTranslations();
            }

            // Apply new translations
            this.applyTranslations();
            
            // Update document attributes
            this.updateDocumentLanguage();
            
            // Save language preference
            this.saveLanguage();
            
            // Update UI
            this.updateLanguageToggleUI();
            
            // Trigger custom event for other components
            this.dispatchLanguageChangeEvent(newLanguage, previousLanguage);
            
        } catch (error) {
            console.error('Failed to switch language:', error);
            // Revert to previous language on error
            this.currentLanguage = previousLanguage;
        }
    }

    /**
     * Update document language and direction attributes
     */
    updateDocumentLanguage() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLanguage);
        
        // Set direction for RTL languages
        const direction = this.rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
        html.setAttribute('dir', direction);
        
        // Add language-specific body class
        // Add language-specific body class
        document.body.className = document.body.className.replace(/\blang-\w+\b/g, '') + ` lang-${this.currentLanguage}`;
    }

    /**
     * Initialize language toggle functionality
     */
    initializeLanguageToggle() {
        // Language toggle button
        const toggleBtn = document.querySelector('[data-language-toggle]');
        const dropdown = document.querySelector('[data-language-dropdown]');
        
        if (toggleBtn && dropdown) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('language-toggle__dropdown--active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.language-toggle')) {
                    dropdown.classList.remove('language-toggle__dropdown--active');
                }
            });
        }

        // Language option buttons
        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.getAttribute('data-lang');
                this.switchLanguage(lang);
                
                // Close dropdown
                if (dropdown) {
                    dropdown.classList.remove('language-toggle__dropdown--active');
                }
            });
        });

        // Keyboard navigation for language toggle
        if (toggleBtn) {
            toggleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleBtn.click();
                }
            });
        }
    }

    /**
     * Update language toggle UI to reflect current language
     */
    updateLanguageToggleUI() {
        const currentLangDisplay = document.querySelector('[data-current-lang]');
        if (currentLangDisplay) {
            currentLangDisplay.textContent = this.currentLanguage.toUpperCase();
        }

        // Update active state in dropdown
        document.querySelectorAll('[data-lang]').forEach(btn => {
            const isActive = btn.getAttribute('data-lang') === this.currentLanguage;
            btn.classList.toggle('language-toggle__option--active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.isValidLanguage(urlLang)) {
            return urlLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0];
        
        // Return Bengali for Bengali speakers, English for others
        return langCode === 'bn' ? 'bn' : 'en';
    }

    /**
     * Check if language code is valid
     */
    isValidLanguage(lang) {
        return ['en', 'bn'].includes(lang);
    }

    /**
     * Save language preference to localStorage
     */
    saveLanguage() {
        try {
            localStorage.setItem(this.storageKey, this.currentLanguage);
        } catch (error) {
            console.warn('Failed to save language preference:', error);
        }
    }

    /**
     * Get saved language from localStorage
     */
    getSavedLanguage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return this.isValidLanguage(saved) ? saved : null;
        } catch (error) {
            console.warn('Failed to get saved language:', error);
            return null;
        }
    }

    /**
     * Dispatch custom event when language changes
     */
    dispatchLanguageChangeEvent(newLang, oldLang) {
        const event = new CustomEvent('languagechange', {
            detail: {
                newLanguage: newLang,
                oldLanguage: oldLang,
                translations: this.translations[newLang]
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Add new translation dynamically
     */
    addTranslation(language, key, value) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }
        
        this.setNestedValue(this.translations[language], key, value);
    }

    /**
     * Set nested object value using dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        
        target[lastKey] = value;
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * Format numbers according to current locale
     */
    formatNumber(number) {
        const locale = this.currentLanguage === 'bn' ? 'bn-BD' : 'en-US';
        return new Intl.NumberFormat(locale).format(number);
    }

    /**
     * Format dates according to current locale
     */
    formatDate(date, options = {}) {
        const locale = this.currentLanguage === 'bn' ? 'bn-BD' : 'en-US';
        return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    }

    /**
     * Get text direction for current language
     */
    getTextDirection() {
        return this.rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
    }

    /**
     * Translate a key programmatically
     */
    translate(key, params = {}) {
        let translation = this.getTranslation(key);
        
        // Simple parameter substitution
        if (translation && typeof translation === 'string') {
            Object.entries(params).forEach(([param, value]) => {
                translation = translation.replace(`{{${param}}}`, value);
            });
        }
        
        return translation;
    }

    /**
     * Update page URL with language parameter
     */
    updateURL() {
        if (this.currentLanguage === 'en') {
            // Remove lang parameter for English (default)
            const url = new URL(window.location);
            url.searchParams.delete('lang');
            window.history.replaceState({}, '', url.pathname + url.search);
        } else {
            // Add lang parameter for non-English languages
            const url = new URL(window.location);
            url.searchParams.set('lang', this.currentLanguage);
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    }

    /**
     * Handle dynamic content translation
     */
    translateDynamicContent(container) {
        if (!container) return;
        
        // Translate elements within the container
        container.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.textContent = translation;
            }
        });

        // Translate placeholders
        container.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.placeholder = translation;
            }
        });
    }

    /**
     * Get language-specific content
     */
    getLocalizedContent(content) {
        if (typeof content === 'object' && content !== null) {
            // Return language-specific version if available
            return content[this.currentLanguage] || content[this.fallbackLanguage] || content;
        }
        
        return content;
    }

    /**
     * Format currency according to current locale
     */
    formatCurrency(amount, currency = 'BDT') {
        const locale = this.currentLanguage === 'bn' ? 'bn-BD' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Get language name in native script
     */
    getLanguageName(langCode) {
        const names = {
            'en': 'English',
            'bn': 'বাংলা'
        };
        return names[langCode] || langCode;
    }

    /**
     * Check if current language is RTL
     */
    isRTL() {
        return this.rtlLanguages.includes(this.currentLanguage);
    }

    /**
     * Pluralization helper
     */
    pluralize(key, count) {
        const baseKey = `${key}.${count === 1 ? 'singular' : 'plural'}`;
        return this.translate(baseKey, { count });
    }
}

// Global i18n instance
window.i18n = new I18nManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.i18n.init();
    });
} else {
    window.i18n.init();
}

// Expose useful functions globally
window.translate = (key, params) => window.i18n.translate(key, params);
window.switchLanguage = (lang) => window.i18n.switchLanguage(lang);

// Listen for dynamic content changes
document.addEventListener('contentloaded', (e) => {
    if (e.detail && e.detail.container) {
        window.i18n.translateDynamicContent(e.detail.container);
    }
});

// Keyboard shortcut for language switching (L key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const currentLang = window.i18n.getCurrentLanguage();
        const newLang = currentLang === 'en' ? 'bn' : 'en';
        window.i18n.switchLanguage(newLang);
    }
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18nManager;
}
