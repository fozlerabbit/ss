/**
 * Theme Management System
 * Handles dark/light theme switching with system preference detection
 */

class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'ss-theme';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.transitionDuration = 300;
    }

    /**
     * Initialize the theme system
     */
    init() {
        try {
            // Get saved theme or detect system preference
            this.currentTheme = this.getSavedTheme() || this.getSystemTheme();
            
            // Apply theme immediately to prevent flash
            this.applyTheme(this.currentTheme, false);
            
            // Initialize theme toggle functionality
            this.initializeThemeToggle();
            
            // Listen for system theme changes
            this.listenForSystemThemeChanges();
            
            // Update UI
            this.updateThemeToggleUI();
            
        } catch (error) {
            console.error('Failed to initialize theme manager:', error);
            // Fallback to light theme
            this.applyTheme('light', false);
        }
    }

    /**
     * Apply theme to the document
     */
    applyTheme(theme, withTransition = true) {
        const html = document.documentElement;
        
        // Add transition class for smooth theme switching
        if (withTransition) {
            html.classList.add('theme-transitioning');
            
            // Remove transition class after animation
            setTimeout(() => {
                html.classList.remove('theme-transitioning');
            }, this.transitionDuration);
        }

        // Set theme attribute
        html.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Update current theme
        this.currentTheme = theme;
        
        // Save theme preference
        this.saveTheme();
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(theme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme, true);
        this.updateThemeToggleUI();
    }

    /**
     * Initialize theme toggle button functionality
     */
    initializeThemeToggle() {
        const toggleBtn = document.querySelector('[data-theme-toggle]');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });

            // Keyboard support
            toggleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }

        // Global keyboard shortcut (T key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * Update theme toggle button UI
     */
    updateThemeToggleUI() {
        const toggleBtn = document.querySelector('[data-theme-toggle]');
        if (!toggleBtn) return;

        // Update aria-label
        const isDark = this.currentTheme === 'dark';
        const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';
        toggleBtn.setAttribute('aria-label', label);
        
        // Update button state
        toggleBtn.classList.toggle('theme-toggle--dark', isDark);
        
        // Update icon visibility (handled by CSS)
        const lightIcon = toggleBtn.querySelector('.theme-toggle__icon--light');
        const darkIcon = toggleBtn.querySelector('.theme-toggle__icon--dark');
        
        if (lightIcon && darkIcon) {
            lightIcon.style.opacity = isDark ? '0' : '1';
            darkIcon.style.opacity = isDark ? '1' : '0';
        }
    }

    /**
     * Listen for system theme changes
     */
    listenForSystemThemeChanges() {
        this.mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!this.hasSavedTheme()) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme, true);
                this.updateThemeToggleUI();
            }
        });
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return this.isValidTheme(saved) ? saved : null;
        } catch (error) {
            console.warn('Failed to get saved theme:', error);
            return null;
        }
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }

    /**
     * Check if user has manually saved a theme preference
     */
    hasSavedTheme() {
        return this.getSavedTheme() !== null;
    }

    /**
     * Check if theme is valid
     */
    isValidTheme(theme) {
        return ['light', 'dark'].includes(theme);
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#2563eb', // Primary blue
            dark: '#1f2937'   // Dark gray
        };
        
        metaThemeColor.content = colors[theme];
    }

    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: theme,
                isDark: theme === 'dark'
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if current theme is dark
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Set theme programmatically
     */
    setTheme(theme) {
        if (this.isValidTheme(theme)) {
            this.applyTheme(theme, true);
            this.updateThemeToggleUI();
        }
    }

    /**
     * Reset theme to system preference
     */
    resetToSystemTheme() {
        // Clear saved preference
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Failed to clear theme preference:', error);
        }
        
        // Apply system theme
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme, true);
        this.updateThemeToggleUI();
    }

    /**
     * Get theme colors for dynamic styling
     */
    getThemeColors() {
        const isDark = this.currentTheme === 'dark';
        
        return {
            primary: '#2563eb',
            secondary: '#10b981',
            accent: '#f59e0b',
            background: isDark ? '#111827' : '#ffffff',
            surface: isDark ? '#1f2937' : '#f9fafb',
            text: isDark ? '#f9fafb' : '#111827',
            textMuted: isDark ? '#d1d5db' : '#6b7280',
            border: isDark ? '#374151' : '#e5e7eb'
        };
    }

    /**
     * Apply custom theme colors
     */
    applyCustomColors(colors) {
        const root = document.documentElement;
        
        Object.entries(colors).forEach(([property, value]) => {
            root.style.setProperty(`--color-${property}`, value);
        });
    }
}

// Global theme manager instance
window.themeManager = new ThemeManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager.init();
    });
} else {
    window.themeManager.init();
}

// Expose useful functions globally
window.toggleTheme = () => window.themeManager.toggleTheme();
window.setTheme = (theme) => window.themeManager.setTheme(theme);

// CSS for smooth theme transitions
const themeTransitionCSS = `
.theme-transitioning,
.theme-transitioning *,
.theme-transitioning *:before,
.theme-transitioning *:after {
    transition: background-color 300ms ease,
                border-color 300ms ease,
                color 300ms ease,
                fill 300ms ease,
                stroke 300ms ease,
                opacity 300ms ease,
                box-shadow 300ms ease !important;
}
`;

// Inject transition CSS
const style = document.createElement('style');
style.textContent = themeTransitionCSS;
document.head.appendChild(style);

// Listen for theme change events to update other components
document.addEventListener('themechange', (e) => {
    const { theme, isDark } = e.detail;
    
    // Update any theme-dependent components
    // For example, charts, maps, or third-party widgets
    if (window.Chart) {
        // Update Chart.js default colors if used
        Chart.defaults.color = isDark ? '#f9fafb' : '#111827';
        Chart.defaults.borderColor = isDark ? '#374151' : '#e5e7eb';
    }
    
    // Update any other theme-sensitive components
    document.querySelectorAll('[data-theme-sensitive]').forEach(element => {
        element.classList.toggle('dark-theme', isDark);
    });
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
