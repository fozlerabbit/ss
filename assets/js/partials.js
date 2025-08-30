/**
 * Partials Injection System
 * Loads and injects HTML partials into elements with data-include attributes
 */

class PartialsLoader {
    constructor() {
        this.cache = new Map();
        this.init();
    }

    async init() {
        try {
            await this.loadPartials();
            this.initializeComponents();
        } catch (error) {
            console.error('Failed to load partials:', error);
        }
    }

    async loadPartials() {
        const elements = document.querySelectorAll('[data-include]');
        const partialPromises = [...elements].map(async (element) => {
            const partialName = element.getAttribute('data-include');
            
            if (!this.cache.has(partialName)) {
                try {
                    const response = await fetch(`/partials/${partialName}.html`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${partialName}: ${response.status}`);
                    }
                    const html = await response.text();
                    this.cache.set(partialName, html);
                } catch (error) {
                    console.error(`Error loading partial ${partialName}:`, error);
                    return;
                }
            }
            
            element.innerHTML = this.cache.get(partialName);
        });

        await Promise.all(partialPromises);
    }

    initializeComponents() {
        // Initialize navigation
        this.initNavigation();
        
        // Initialize mobile menu
        this.initMobileMenu();
        
        // Initialize modals
        this.initModals();
        
        // Initialize smooth scroll
        this.initSmoothScroll();
        
        // Initialize back to top
        this.initBackToTop();
    }

    initNavigation() {
        // Highlight active nav item
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav__link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add('nav__link--active');
            }
        });

        // Scrollspy
        this.initScrollspy();
    }

    initScrollspy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
        
        if (sections.length === 0 || navLinks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => link.classList.remove('nav__link--active'));
                    const activeLink = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('nav__link--active');
                    }
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-20% 0px -70% 0px'
        });

        sections.forEach(section => observer.observe(section));
    }

    initMobileMenu() {
        const mobileToggle = document.querySelector('.nav__mobile-toggle');
        const nav = document.querySelector('.nav');
        
        if (!mobileToggle || !nav) return;

        mobileToggle.addEventListener('click', () => {
            const isOpen = nav.classList.contains('nav--open');
            nav.classList.toggle('nav--open');
            mobileToggle.setAttribute('aria-expanded', !isOpen);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isOpen ? '' : 'hidden';
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
                nav.classList.remove('nav--open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && nav.classList.contains('nav--open')) {
                nav.classList.remove('nav--open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    initModals() {
        // Modal triggers
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal]');
            if (trigger) {
                e.preventDefault();
                this.openModal(trigger.getAttribute('data-modal'));
            }

            // Close modal
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal__close')) {
                this.closeModal();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('modal--active');
        document.body.style.overflow = 'hidden';
        
        // Focus first focusable element
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    }

    closeModal() {
        const activeModal = document.querySelector('.modal--active');
        if (activeModal) {
            activeModal.classList.remove('modal--active');
            document.body.style.overflow = '';
        }
    }

    initSmoothScroll() {
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Update URL without triggering scroll
            history.pushState(null, null, href);
        });
    }

    initBackToTop() {
        const backToTop = document.querySelector('.back-to-top');
        if (!backToTop) return;

        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('back-to-top--visible');
            } else {
                backToTop.classList.remove('back-to-top--visible');
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PartialsLoader();
});

// Export for potential use in other scripts
window.PartialsLoader = PartialsLoader;