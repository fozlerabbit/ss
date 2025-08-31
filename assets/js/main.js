/**
 * Main JavaScript functionality
 * Handles global features and page-specific interactions
 */

class ScriptySphereApp {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    async init() {
        try {
            // Wait for partials to load
            await this.waitForPartials();
            
            // Initialize core functionality
            this.initCounters();
            this.initScrollEffects();
            this.initInteractionEffects();
            this.initFormHandlers();
            this.initSearchToggle();
            
            // Page-specific initialization
            this.initPageSpecific();
            
            this.isLoaded = true;
            document.dispatchEvent(new CustomEvent('appLoaded'));
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async waitForPartials() {
        return new Promise((resolve) => {
            if (document.querySelector('.header')) {
                resolve();
            } else {
                const checkPartials = setInterval(() => {
                    if (document.querySelector('.header')) {
                        clearInterval(checkPartials);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkPartials);
                    resolve();
                }, 5000);
            }
        });
    }

    initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (counters.length === 0) return;

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    this.animateCounter(entry.target);
                    entry.target.classList.add('counted');
                }
            });
        }, observerOptions);

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const start = Date.now();
        const increment = target / (duration / 16); // ~60fps

        const updateCounter = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * easeOut);
            
            // Format number based on current language
            if (window.i18n) {
                element.textContent = window.i18n.formatNumber(current);
            } else {
                element.textContent = current.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = window.i18n ? 
                    window.i18n.formatNumber(target) : 
                    target.toLocaleString();
            }
        };

        updateCounter();
    }

    initScrollEffects() {
        // Parallax effect for hero background
        const hero = document.querySelector('.hero');
        if (hero) {
            let ticking = false;
            
            const updateParallax = () => {
                const scrolled = window.pageYOffset;
                const parallax = hero.querySelector('.hero__background');
                if (parallax) {
                    parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
                }
                ticking = false;
            };

            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            };

            // Only enable parallax if user hasn't requested reduced motion
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                window.addEventListener('scroll', onScroll, { passive: true });
            }
        }

        // Header background opacity on scroll
        const header = document.querySelector('.header');
        if (header) {
            let ticking = false;
            
            const updateHeaderOpacity = () => {
                const scrolled = window.pageYOffset;
                const opacity = Math.min(scrolled / 100, 1);
                header.style.background = `rgba(255, 255, 255, ${0.9 + (opacity * 0.1)})`;
                ticking = false;
            };

            const onHeaderScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(updateHeaderOpacity);
                    ticking = true;
                }
            };

            window.addEventListener('scroll', onHeaderScroll, { passive: true });
        }
    }

    initInteractionEffects() {
        // Card hover effects
        const cards = document.querySelectorAll('.mission__card, .programme-card, .member-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    card.style.transform = 'translateY(-8px)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });

        // Button ripple effect
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.btn');
            if (!button) return;

            // Don't add ripple if reduced motion is preferred
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });

        // Add ripple animation CSS
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    initFormHandlers() {
        // Newsletter form
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        });

        // Contact forms
        const contactForms = document.querySelectorAll('[name="contact"]');
        contactForms.forEach(form => {
            form.addEventListener('submit', this.handleContactSubmit.bind(this));
        });

        // Generic form validation
        const inputs = document.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    async handleNewsletterSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('[name="email"]').value;
        const button = form.querySelector('button[type="submit"]');
        
        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const originalHTML = button.innerHTML;
        button.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px;"></div>';
        button.disabled = true;

        try {
            // Simulate form submission (replace with actual endpoint)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showToast('Thank you for subscribing!', 'success');
            form.reset();
        } catch (error) {
            this.showToast('Something went wrong. Please try again.', 'error');
        } finally {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }
    }

    async handleContactSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');
        
        // Validate form
        const isValid = this.validateForm(form);
        if (!isValid) return;

        // Show loading state
        const originalText = button.textContent;
        button.textContent = window.i18n ? window.i18n.t('contact.form.sending') : 'Sending...';
        button.disabled = true;

        try {
            // Use Netlify Forms or similar service
            const formData = new FormData(form);
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                this.showToast(
                    window.i18n ? window.i18n.t('contact.form.success') : 'Thank you! We\'ll get back to you soon.',
                    'success'
                );
                form.reset();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            this.showToast(
                window.i18n ? window.i18n.t('contact.form.error') : 'Sorry, there was an error sending your message.',
                'error'
            );
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (field.hasAttribute('required') && !value) {
            errorMessage = 'This field is required';
            isValid = false;
        }
        // Email validation
        else if (field.type === 'email' && value && !this.validateEmail(value)) {
            errorMessage = 'Please enter a valid email address';
            isValid = false;
        }
        // Phone validation for Bangladesh
        else if (field.type === 'tel' && value && !this.validateBDPhone(value)) {
            errorMessage = 'Please enter a valid Bangladesh phone number';
            isValid = false;
        }

        // Show/hide error
        if (isValid) {
            this.clearFieldError(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validateBDPhone(phone) {
        // Bangladesh phone number patterns
        const cleaned = phone.replace(/\D/g, '');
        return /^(\+?88)?01[3-9]\d{8}$/.test(cleaned);
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('field-error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error-message';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorMessage = field.parentNode.querySelector('.field-error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    initSearchToggle() {
        document.addEventListener('click', (e) => {
            const searchToggle = e.target.closest('[data-search-toggle]');
            if (searchToggle) {
                e.preventDefault();
                const dropdown = document.querySelector('[data-search-dropdown]');
                const nav = document.querySelector('.nav');
                
                if (dropdown && nav) {
                    nav.classList.toggle('nav__search--active');
                    
                    if (nav.classList.contains('nav__search--active')) {
                        const searchInput = dropdown.querySelector('[data-search-input]');
                        if (searchInput) {
                            setTimeout(() => searchInput.focus(), 100);
                        }
                    }
                }
                return;
            }

            // Close search if clicking outside
            const searchContainer = e.target.closest('.nav__search');
            if (!searchContainer) {
                const nav = document.querySelector('.nav');
                if (nav) {
                    nav.classList.remove('nav__search--active');
                }
            }
        });

        // Close search on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const nav = document.querySelector('.nav');
                if (nav && nav.classList.contains('nav__search--active')) {
                    nav.classList.remove('nav__search--active');
                }
            }
        });
    }

    initPageSpecific() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') {
            this.initHomePage();
        }
    }

    initHomePage() {
        // Typed text effect for hero title
        this.initTypedText();
        
        // Testimonials carousel
        this.initTestimonialsCarousel();
    }

    initTypedText() {
        const heroTitle = document.querySelector('.hero__title');
        if (!heroTitle) return;

        // Don't animate if reduced motion is preferred
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };

        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }

    initTestimonialsCarousel() {
        // Simple testimonials rotation (if testimonials exist)
        const testimonials = document.querySelectorAll('.testimonial');
        if (testimonials.length <= 1) return;

        let current = 0;
        const showTestimonial = (index) => {
            testimonials.forEach((testimonial, i) => {
                testimonial.style.display = i === index ? 'block' : 'none';
            });
        };

        const nextTestimonial = () => {
            current = (current + 1) % testimonials.length;
            showTestimonial(current);
        };

        // Auto-rotate every 5 seconds
        showTestimonial(0);
        setInterval(nextTestimonial, 5000);
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 5000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast__icon">${icon}</div>
            <div class="toast__message">${message}</div>
            <button class="toast__close" aria-label="Close notification">
                <svg><use href="/assets/img/icons.svg#x"></use></svg>
            </button>
        `;

        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: var(--space-6);
            right: var(--space-6);
            background: var(--color-background);
            color: var(--color-text);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            padding: var(--space-4);
            display: flex;
            align-items: center;
            gap: var(--space-3);
            max-width: 400px;
            z-index: var(--z-tooltip);
            transform: translateX(100%);
            transition: transform var(--transition-base);
        `;

        // Type-specific styles
        if (type === 'success') {
            toast.style.borderColor = 'var(--color-success)';
            toast.style.color = 'var(--color-success)';
        } else if (type === 'error') {
            toast.style.borderColor = 'var(--color-error)';
            toast.style.color = 'var(--color-error)';
        } else if (type === 'warning') {
            toast.style.borderColor = 'var(--color-warning)';
            toast.style.color = 'var(--color-warning)';
        }

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Close button handler
        toast.querySelector('.toast__close').addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast(toast);
            }, duration);
        }

        return toast;
    }

    hideToast(toast) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }

    getToastIcon(type) {
        const icons = {
            success: '<svg><use href="/assets/img/icons.svg#check-circle"></use></svg>',
            error: '<svg><use href="/assets/img/icons.svg#x-circle"></use></svg>',
            warning: '<svg><use href="/assets/img/icons.svg#alert-triangle"></use></svg>',
            info: '<svg><use href="/assets/img/icons.svg#info-circle"></use></svg>'
        };
        return icons[type] || icons.info;
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Performance monitoring
    measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load performance:', {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    totalLoad: perfData.loadEventEnd - perfData.loadEventStart
                });
            });
        }
    }

    // Accessibility helpers
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        // Focus first element
        firstElement.focus();
    }

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing
            if (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable) {
                return;
            }

            switch (e.key) {
                case '/':
                    e.preventDefault();
                    this.focusSearch();
                    break;
                case 'h':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.location.href = '/';
                    }
                    break;
            }
        });
    }

    focusSearch() {
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
            const nav = document.querySelector('.nav');
            if (nav) {
                nav.classList.add('nav__search--active');
            }
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    // Lazy loading images
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    // Smooth reveal animations
    initRevealAnimations() {
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const revealElements = document.querySelectorAll('[data-reveal]');
            
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, { threshold: 0.1 });

            revealElements.forEach(el => revealObserver.observe(el));
        }
    }

    // Service Worker registration
    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/assets/js/sw.js');
                    console.log('SW registered:', registration);
                } catch (error) {
                    console.log('SW registration failed:', error);
                }
            });
        }
    }

    // PWA install prompt
    initPWAPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show custom install button if desired
            const installButton = document.querySelector('[data-install-pwa]');
            if (installButton) {
                installButton.style.display = 'block';
                installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log('PWA install outcome:', outcome);
                        deferredPrompt = null;
                    }
                });
            }
        });
    }
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new ScriptySphereApp();
    
    // Make available globally
    window.app = app;
});

// Performance measurement
if ('performance' in window && 'PerformanceObserver' in window) {
    // Measure Core Web Vitals
    try {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                console.log(`${entry.name}: ${entry.value}`);
            });
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
        // Performance observer not supported
    }
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScriptySphereApp;
}
