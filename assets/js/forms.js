/**
 * Forms Handler
 * Handles form validation, submission, and user feedback
 */

class FormsHandler {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.init();
    }

    init() {
        this.setupFormHandlers();
        this.setupValidation();
        this.setupHoneypot();
    }

    setupFormHandlers() {
        // Contact forms
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            
            if (form.name === 'contact') {
                e.preventDefault();
                await this.handleContactForm(form);
            } else if (form.name === 'newsletter') {
                e.preventDefault();
                await this.handleNewsletterForm(form);
            } else if (form.name === 'volunteer') {
                e.preventDefault();
                await this.handleVolunteerForm(form);
            }
        });
    }

    setupValidation() {
        // Real-time validation
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.validateField(e.target);
            }
        }, true);

        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.clearFieldError(e.target);
                
                // Real-time validation for specific fields
                if (e.target.type === 'email') {
                    this.debounce(() => this.validateField(e.target), 500)();
                }
            }
        });
    }

    setupHoneypot() {
        // Monitor honeypot fields
        document.addEventListener('input', (e) => {
            if (e.target.name === 'bot-field' && e.target.value) {
                console.warn('Bot detected via honeypot');
                // Mark form as spam
                e.target.closest('form').setAttribute('data-spam', 'true');
            }
        });
    }

    async handleContactForm(form) {
        try {
            // Validate form
            if (!this.validateForm(form)) {
                this.showToast('Please fix the errors below', 'error');
                return;
            }

            // Check honeypot
            if (form.getAttribute('data-spam') === 'true') {
                this.showToast('Thank you for your message!', 'success');
                form.reset();
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.textContent = window.i18n ? window.i18n.t('contact.form.sending') : 'Sending...';
            submitBtn.disabled = true;

            // Prepare form data
            const formData = new FormData(form);
            formData.append('form-name', 'contact');

            // Submit to Netlify (or your preferred service)
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
                this.trackFormSubmission('contact', 'success');
            } else {
                throw new Error('Form submission failed');
            }

        } catch (error) {
            console.error('Contact form error:', error);
            this.showToast(
                window.i18n ? window.i18n.t('contact.form.error') : 'Sorry, there was an error sending your message.',
                'error'
            );
            this.trackFormSubmission('contact', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = window.i18n ? window.i18n.t('contact.form.submit') : 'Send Message';
            submitBtn.disabled = false;
        }
    }

    async handleNewsletterForm(form) {
        try {
            const email = form.querySelector('[name="email"]').value;
            
            if (!this.validateEmail(email)) {
                this.showToast('Please enter a valid email address', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<div class="btn-spinner"></div>';
            submitBtn.disabled = true;

            // Submit newsletter subscription
            const formData = new FormData(form);
            formData.append('form-name', 'newsletter');

            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                this.showToast('Thank you for subscribing!', 'success');
                form.reset();
                this.trackFormSubmission('newsletter', 'success');
            } else {
                throw new Error('Newsletter subscription failed');
            }

        } catch (error) {
            console.error('Newsletter error:', error);
            this.showToast('Something went wrong. Please try again.', 'error');
            this.trackFormSubmission('newsletter', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<svg><use href="/assets/img/icons.svg#arrow-right"></use></svg>';
            submitBtn.disabled = false;
        }
    }

    async handleVolunteerForm(form) {
        try {
            if (!this.validateForm(form)) {
                this.showToast('Please complete all required fields', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            formData.append('form-name', 'volunteer');

            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });

            if (response.ok) {
                this.showToast('Thank you for your interest! We\'ll contact you soon.', 'success');
                form.reset();
                this.trackFormSubmission('volunteer', 'success');
            } else {
                throw new Error('Volunteer form submission failed');
            }

        } catch (error) {
            console.error('Volunteer form error:', error);
            this.showToast('Something went wrong. Please try again.', 'error');
            this.trackFormSubmission('volunteer', 'error');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
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
            errorMessage = this.getErrorMessage('required', field);
            isValid = false;
        }
        // Email validation
        else if (field.type === 'email' && value && !this.validateEmail(value)) {
            errorMessage = this.getErrorMessage('email', field);
            isValid = false;
        }
        // Phone validation
        else if (field.type === 'tel' && value && !this.validatePhone(value)) {
            errorMessage = this.getErrorMessage('phone', field);
            isValid = false;
        }
        // Text length validation
        else if (field.type === 'text' && value && value.length < 2) {
            errorMessage = this.getErrorMessage('minLength', field);
            isValid = false;
        }
        // Message length validation
        else if (field.tagName === 'TEXTAREA' && value && value.length < 10) {
            errorMessage = this.getErrorMessage('messageLength', field);
            isValid = false;
        }

        if (isValid) {
            this.clearFieldError(field);
        } else {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    getErrorMessage(type, field) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            minLength: 'Please enter at least 2 characters',
            messageLength: 'Please enter at least 10 characters'
        };

        // Try to get localized message
        if (window.i18n) {
            const key = `validation.${type}`;
            const translated = window.i18n.translate(key);
            if (translated !== key) {
                return translated;
            }
        }

        return messages[type] || 'Invalid input';
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        // Bangladesh phone number patterns
        const cleaned = phone.replace(/\D/g, '');
        const patterns = [
            /^(\+?88)?01[3-9]\d{8}$/, // Bangladesh mobile
            /^(\+?880)?1[3-9]\d{8}$/, // Bangladesh mobile alt
            /^\d{10,11}$/              // Generic 10-11 digits
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('field-error');
        field.setAttribute('aria-invalid', 'true');
        
        let errorElement = field.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error-message';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearFieldError(field) {
        field.classList.remove('field-error');
        field.removeAttribute('aria-invalid');
        
        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        // Use global toast system if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
            return;
        }

        // Fallback simple toast
        const toast = document.createElement('div');
        toast.className = `simple-toast simple-toast--${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    trackFormSubmission(formType, status) {
        // Privacy-friendly form analytics
        try {
            const consent = localStorage.getItem('cookie-consent');
            if (!consent) return;

            const preferences = JSON.parse(consent);
            if (!preferences.analytics) return;

            // Track only aggregated, non-personal data
            const event = {
                type: 'form_submission',
                form: formType,
                status: status,
                timestamp: Date.now(),
                language: window.i18n ? window.i18n.getCurrentLanguage() : 'en'
            };

            // Store in sessionStorage for current session only
            const sessionEvents = JSON.parse(sessionStorage.getItem('form-analytics') || '[]');
            sessionEvents.push(event);
            
            // Keep only last 20 events
            if (sessionEvents.length > 20) {
                sessionEvents.shift();
            }
            
            sessionStorage.setItem('form-analytics', JSON.stringify(sessionEvents));
        } catch (error) {
            // Fail silently for privacy
        }
    }

    // Utility for debouncing
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

    // Save form data to prevent loss
    saveFormData(form) {
        try {
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (key !== 'bot-field') { // Don't save honeypot
                    data[key] = value;
                }
            }
            
            const formKey = `form-draft-${form.name || 'default'}`;
            sessionStorage.setItem(formKey, JSON.stringify(data));
        } catch (error) {
            // Fail silently
        }
    }

    // Restore form data
    restoreFormData(form) {
        try {
            const formKey = `form-draft-${form.name || 'default'}`;
            const savedData = sessionStorage.getItem(formKey);
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                Object.entries(data).forEach(([key, value]) => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && field.name !== 'bot-field') {
                        field.value = value;
                    }
                });
            }
        } catch (error) {
            // Fail silently
        }
    }

    // Clear saved form data
    clearSavedFormData(form) {
        try {
            const formKey = `form-draft-${form.name || 'default'}`;
            sessionStorage.removeItem(formKey);
        } catch (error) {
            // Fail silently
        }
    }

    // Auto-save form data as user types
    setupAutoSave() {
        document.addEventListener('input', (e) => {
            const form = e.target.closest('form');
            if (form && (form.name === 'contact' || form.name === 'volunteer')) {
                this.debounce(() => this.saveFormData(form), 1000)();
            }
        });
    }

    // Form accessibility enhancements
    enhanceAccessibility() {
        // Add ARIA descriptions for form fields
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const fields = form.querySelectorAll('input, textarea, select');
            
            fields.forEach(field => {
                // Add describedby for error messages
                const label = form.querySelector(`label[for="${field.id}"]`);
                if (label && !field.getAttribute('aria-describedby')) {
                    const errorId = `${field.id}-error`;
                    field.setAttribute('aria-describedby', errorId);
                }
                
                // Add autocomplete attributes
                this.addAutocompleteAttributes(field);
            });
        });
    }

    addAutocompleteAttributes(field) {
        const autocompleteMap = {
            email: 'email',
            phone: 'tel',
            name: 'name',
            'first-name': 'given-name',
            'last-name': 'family-name',
            organization: 'organization',
            address: 'street-address',
            city: 'address-level2',
            country: 'country-name'
        };

        const fieldName = field.name.toLowerCase();
        const autocomplete = autocompleteMap[fieldName];
        
        if (autocomplete) {
            field.setAttribute('autocomplete', autocomplete);
        }
    }

    // File upload handling (for future use)
    setupFileUpload() {
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file') {
                this.handleFileUpload(e.target);
            }
        });
    }

    handleFileUpload(input) {
        const files = Array.from(input.files);
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        
        const validFiles = files.filter(file => {
            if (file.size > maxSize) {
                this.showToast(`File ${file.name} is too large (max 5MB)`, 'error');
                return false;
            }
            
            if (!allowedTypes.includes(file.type)) {
                this.showToast(`File ${file.name} is not a supported format`, 'error');
                return false;
            }
            
            return true;
        });

        // Update file list display
        this.updateFileDisplay(input, validFiles);
    }

    updateFileDisplay(input, files) {
        let displayElement = input.parentNode.querySelector('.file-display');
        
        if (!displayElement) {
            displayElement = document.createElement('div');
            displayElement.className = 'file-display';
            input.parentNode.appendChild(displayElement);
        }

        if (files.length === 0) {
            displayElement.innerHTML = '';
            return;
        }

        displayElement.innerHTML = files.map(file => `
            <div class="file-item">
                <svg><use href="/assets/img/icons.svg#file"></use></svg>
                <span>${file.name}</span>
                <span class="file-size">(${this.formatFileSize(file.size)})</span>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Form step navigation (for multi-step forms)
    initStepNavigation() {
        document.addEventListener('click', (e) => {
            const nextBtn = e.target.closest('[data-form-next]');
            const prevBtn = e.target.closest('[data-form-prev]');
            
            if (nextBtn) {
                e.preventDefault();
                this.goToNextStep(nextBtn.closest('form'));
            } else if (prevBtn) {
                e.preventDefault();
                this.goToPrevStep(prevBtn.closest('form'));
            }
        });
    }

    goToNextStep(form) {
        const currentStep = form.querySelector('.form-step--active');
        const currentIndex = parseInt(currentStep.getAttribute('data-step'));
        const nextStep = form.querySelector(`[data-step="${currentIndex + 1}"]`);
        
        if (!nextStep) return;
        
        // Validate current step
        const currentFields = currentStep.querySelectorAll('[required]');
        let isValid = true;
        
        currentFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            this.showToast('Please complete all required fields', 'error');
            return;
        }
        
        // Move to next step
        currentStep.classList.remove('form-step--active');
        nextStep.classList.add('form-step--active');
        
        // Update progress indicator
        this.updateStepProgress(form, currentIndex + 1);
        
        // Focus first field in next step
        const firstField = nextStep.querySelector('input, textarea, select');
        if (firstField) {
            firstField.focus();
        }
    }

    goToPrevStep(form) {
        const currentStep = form.querySelector('.form-step--active');
        const currentIndex = parseInt(currentStep.getAttribute('data-step'));
        const prevStep = form.querySelector(`[data-step="${currentIndex - 1}"]`);
        
        if (!prevStep) return;
        
        currentStep.classList.remove('form-step--active');
        prevStep.classList.add('form-step--active');
        
        this.updateStepProgress(form, currentIndex - 1);
    }

    updateStepProgress(form, currentStep) {
        const progressBars = form.querySelectorAll('.step-progress__bar');
        const stepLabels = form.querySelectorAll('.step-progress__step');
        
        progressBars.forEach((bar, index) => {
            bar.classList.toggle('step-progress__bar--active', index < currentStep);
        });
        
        stepLabels.forEach((label, index) => {
            label.classList.toggle('step-progress__step--active', index === currentStep - 1);
            label.classList.toggle('step-progress__step--completed', index < currentStep - 1);
        });
    }

    // Character counter for textareas
    initCharacterCounters() {
        const textareas = document.querySelectorAll('textarea[maxlength]');
        
        textareas.forEach(textarea => {
            const maxLength = parseInt(textarea.getAttribute('maxlength'));
            
            // Create counter element
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            counter.setAttribute('aria-live', 'polite');
            textarea.parentNode.appendChild(counter);
            
            const updateCounter = () => {
                const remaining = maxLength - textarea.value.length;
                counter.textContent = `${remaining} characters remaining`;
                counter.classList.toggle('character-counter--warning', remaining < 50);
            };
            
            textarea.addEventListener('input', updateCounter);
            updateCounter(); // Initial count
        });
    }

    // Initialize all form enhancements
    initializeAll() {
        this.enhanceAccessibility();
        this.setupAutoSave();
        this.initStepNavigation();
        this.initCharacterCounters();
        this.setupFileUpload();
        
        // Restore saved form data
        document.querySelectorAll('form').forEach(form => {
            this.restoreFormData(form);
        });
    }
}

// Initialize when DOM is ready
let formsHandler;

document.addEventListener('DOMContentLoaded', () => {
    formsHandler = new FormsHandler();
    formsHandler.initializeAll();
    
    // Make available globally
    window.formsHandler = formsHandler;
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormsHandler;
}
