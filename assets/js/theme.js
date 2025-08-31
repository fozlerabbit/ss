/**
 * Theme Management System
 * Handles light/dark mode with system preference detection and persistence
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.watchSystemTheme();
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('preferred-theme');
        } catch (error) {
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            localStorage.setItem('preferred-theme', theme);
        } catch (error) {
            console.warn('Could not store theme preference');
        }
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme color meta tag
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.content = theme === 'dark' ? '#111827' : '#ffffff';
        }

        // Update toggle button state
        this.updateToggleState();
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }

    updateToggleState() {
        const toggles = document.querySelectorAll('[data-theme-toggle]');
        toggles.forEach(toggle => {
            toggle.setAttribute('aria-label', 
                this.currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            );
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setStoredTheme(newTheme);
        this.applyTheme(newTheme);
    }

    setupEventListeners() {
        // Theme toggle buttons
        document.addEventListener('click', (e) => {
            const themeToggle = e.target.closest('[data-theme-toggle]');
            if (themeToggle) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Keyboard shortcut (T key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Only if not in input field
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && 
                    activeElement.tagName !== 'TEXTAREA' && 
                    !activeElement.isContentEditable) {
                    e.preventDefault();
                    this.toggleTheme();
                }
            }
        });
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!this.getStoredTheme()) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(systemTheme);
                }
            });
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    // Method to reset to system preference
    resetToSystem() {
        try {
            localStorage.removeItem('preferred-theme');
        } catch (error) {
            console.warn('Could not remove theme preference');
        }
        
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
    }
}

// Initialize theme manager
let themeManager;

document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    
    // Make available globally
    window.themeManager = themeManager;
});

// Re-initialize when partials are loaded
document.addEventListener('partialsLoaded', () => {
    if (themeManager) {
        themeManager.updateToggleState();
        themeManager.setupEventListeners();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
