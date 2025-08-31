/**
 * Privacy-Friendly Analytics System
 * Handles analytics with proper consent management
 */

class Analytics {
    constructor() {
        this.initialized = false;
        this.consentGiven = false;
        this.provider = 'plausible'; // or 'goatcounter', 'umami'
        this.config = {
            plausible: {
                domain: 'scriptysphere.org',
                apiHost: 'https://plausible.io'
            },
            goatcounter: {
                code: 'scriptysphere'
            }
        };
        
        this.checkConsent();
    }

    checkConsent() {
        try {
            const consent = localStorage.getItem('cookie-consent');
            if (consent) {
                const preferences = JSON.parse(consent);
                this.consentGiven = preferences.analytics === true;
                
                if (this.consentGiven) {
                    this.init();
                }
            }
        } catch (error) {
            console.warn('Could not check analytics consent:', error);
        }
        
        // Listen for consent changes
        document.addEventListener('cookieConsentChanged', (e) => {
            this.consentGiven = e.detail.analytics;
            if (this.consentGiven && !this.initialized) {
                this.init();
            } else if (!this.consentGiven && this.initialized) {
                this.disable();
            }
        });
    }

    init() {
        if (this.initialized || !this.consentGiven) return;
        
        try {
            switch (this.provider) {
                case 'plausible':
                    this.initPlausible();
                    break;
                case 'goatcounter':
                    this.initGoatCounter();
                    break;
                case 'umami':
                    this.initUmami();
                    break;
                default:
                    this.initSimpleAnalytics();
            }
            
            this.initialized = true;
            console.log('Analytics initialized:', this.provider);
        } catch (error) {
            console.error('Analytics initialization failed:', error);
        }
    }

    initPlausible() {
        // Load Plausible script
        const script = document.createElement('script');
        script.defer = true;
        script.src = `${this.config.plausible.apiHost}/js/plausible.js`;
        script.setAttribute('data-domain', this.config.plausible.domain);
        script.setAttribute('data-api', `${this.config.plausible.apiHost}/api/event`);
        
        document.head.appendChild(script);
        
        // Set up global plausible function
        window.plausible = window.plausible || function() {
            (window.plausible.q = window.plausible.q || []).push(arguments);
        };
    }

    initGoatCounter() {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://${this.config.goatcounter.code}.goatcounter.com/count.js`;
        script.setAttribute('data-goatcounter', `https://${this.config.goatcounter.code}.goatcounter.com/count`);
        
        document.head.appendChild(script);
    }

    initUmami() {
        // Configure based on your Umami setup
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = 'https://analytics.yourdomain.com/umami.js';
        script.setAttribute('data-website-id', 'your-website-id');
        
        document.head.appendChild(script);
    }

    initSimpleAnalytics() {
        // Fallback: Simple session-based analytics
        this.trackPageView();
        this.trackUserInteractions();
    }

    // Event tracking methods
    trackEvent(eventName, properties = {}) {
        if (!this.consentGiven || !this.initialized) return;
        
        try {
            switch (this.provider) {
                case 'plausible':
                    if (window.plausible) {
                        window.plausible(eventName, { props: properties });
                    }
                    break;
                case 'goatcounter':
                    // GoatCounter doesn't support custom events by default
                    this.trackGoatCounterEvent(eventName, properties);
                    break;
                case 'umami':
                    if (window.umami) {
                        window.umami.trackEvent(eventName, properties);
                    }
                    break;
                default:
                    this.trackSimpleEvent(eventName, properties);
            }
        } catch (error) {
            console.warn('Event tracking failed:', error);
        }
    }

    trackPageView(url = window.location.pathname) {
        if (!this.consentGiven) return;
        
        this.trackEvent('pageview', {
            url: url,
            referrer: document.referrer,
            language: document.documentElement.lang,
            theme: document.documentElement.getAttribute('data-theme')
        });
    }

    trackGoatCounterEvent(eventName, properties) {
        // GoatCounter custom event tracking via image pixel
        const params = new URLSearchParams({
            p: `${window.location.pathname}#${eventName}`,
            t: eventName,
            ...properties
        });
        
        const img = new Image();
        img.src = `https://${this.config.goatcounter.code}.goatcounter.com/count?${params}`;
    }

    trackSimpleEvent(eventName, properties) {
        // Store events in sessionStorage for simple analytics
        try {
            const events = JSON.parse(sessionStorage.getItem('simple-analytics') || '[]');
            events.push({
                event: eventName,
                properties: properties,
                timestamp: Date.now(),
                url: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
                language: document.documentElement.lang
            });
            
            // Keep only last 50 events
            if (events.length > 50) {
                events.splice(0, events.length - 50);
            }
            
            sessionStorage.setItem('simple-analytics', JSON.stringify(events));
        } catch (error) {
            // Fail silently
        }
    }

    // Common event tracking helpers
    trackOutboundLink(url) {
        this.trackEvent('Outbound Link', { url: url });
    }

    trackDownload(filename) {
        this.trackEvent('File Download', { filename: filename });
    }

    trackFormSubmission(formName, status) {
        this.trackEvent('Form Submission', { 
            form: formName, 
            status: status 
        });
    }

    trackSearch(query, resultCount) {
        this.trackEvent('Site Search', { 
            query_length: query.length, // Privacy: only track length
            results: resultCount 
        });
    }

    trackLanguageChange(from, to) {
        this.trackEvent('Language Change', { 
            from: from, 
            to: to 
        });
    }

    trackThemeChange(theme) {
        this.trackEvent('Theme Change', { 
            theme: theme 
        });
    }

    trackMemberView(memberRole, memberDivision) {
        this.trackEvent('Member Profile View', { 
            role: memberRole,
            division: memberDivision 
        });
    }

    trackProgrammeInterest(programmeName) {
        this.trackEvent('Programme Interest', { 
            programme: programmeName 
        });
    }

    // Automatically track common interactions
    trackUserInteractions() {
        if (!this.consentGiven) return;
        
        // Track outbound links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.hostname !== window.location.hostname) {
                this.trackOutboundLink(link.href);
            }
        });

        // Track downloads
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && /\.(pdf|doc|docx|zip|exe|dmg)$/i.test(link.href)) {
                const filename = link.href.split('/').pop();
                this.trackDownload(filename);
            }
        });

        // Track scroll depth
        this.trackScrollDepth();
        
        // Track time on page
        this.trackTimeOnPage();
    }

    trackScrollDepth() {
        let maxScroll = 0;
        let scrollDepthTracked = [];
        
        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            // Track milestones: 25%, 50%, 75%, 100%
            [25, 50, 75, 100].forEach(milestone => {
                if (scrollPercent >= milestone && !scrollDepthTracked.includes(milestone)) {
                    scrollDepthTracked.push(milestone);
                    this.trackEvent('Scroll Depth', { 
                        depth: milestone,
                        page: window.location.pathname 
                    });
                }
            });
        };
        
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    trackScroll();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    trackTimeOnPage() {
        const startTime = Date.now();
        
        const trackTime = () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            
            // Track time milestones
            if (timeSpent === 30 || timeSpent === 60 || timeSpent === 180) {
                this.trackEvent('Time on Page', { 
                    duration: timeSpent,
                    page: window.location.pathname 
                });
            }
        };
        
        // Track every 30 seconds
        const interval = setInterval(trackTime, 30000);
        
        // Track when user leaves
        window.addEventListener('beforeunload', () => {
            clearInterval(interval);
            const finalTime = Math.round((Date.now() - startTime) / 1000);
            this.trackEvent('Page Exit', { 
                duration: finalTime,
                page: window.location.pathname 
            });
        });
    }

    // Performance tracking
    trackPerformance() {
        if (!this.consentGiven) return;
        
        window.addEventListener('load', () => {
            // Wait a bit for all resources to load
            setTimeout(() => {
                if ('performance' in window) {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    
                    this.trackEvent('Performance', {
                        load_time: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                        dom_ready: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                        page: window.location.pathname
                    });
                }
            }, 1000);
        });
    }

    // Error tracking
    trackErrors() {
        if (!this.consentGiven) return;
        
        window.addEventListener('error', (e) => {
            this.trackEvent('JavaScript Error', {
                message: e.message.substring(0, 100), // Truncate for privacy
                filename: e.filename.split('/').pop(), // Only filename, not full path
                line: e.lineno,
                page: window.location.pathname
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('Promise Rejection', {
                reason: String(e.reason).substring(0, 100),
                page: window.location.pathname
            });
        });
    }

    // Disable analytics
    disable() {
        this.initialized = false;
        
        // Remove tracking scripts
        const scripts = document.querySelectorAll('script[src*="plausible"], script[src*="goatcounter"], script[src*="umami"]');
        scripts.forEach(script => script.remove());
        
        // Clear stored data
        try {
            sessionStorage.removeItem('simple-analytics');
        } catch (error) {
            // Fail silently
        }
        
        console.log('Analytics disabled');
    }

    // GDPR compliance helpers
    getStoredData() {
        try {
            return {
                consent: localStorage.getItem('cookie-consent'),
                session_events: sessionStorage.getItem('simple-analytics'),
                form_analytics: sessionStorage.getItem('form-analytics'),
                search_analytics: sessionStorage.getItem('search-analytics')
            };
        } catch (error) {
            return {};
        }
    }

    deleteStoredData() {
        try {
            sessionStorage.removeItem('simple-analytics');
            sessionStorage.removeItem('form-analytics');
            sessionStorage.removeItem('search-analytics');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Export data for user (GDPR right to data portability)
    exportUserData() {
        const data = this.getStoredData();
        const exportData = {
            export_date: new Date().toISOString(),
            data_collected: data,
            note: 'This is all the analytics data we have stored about your session.'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scriptysphere-analytics-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize analytics
let analytics;

document.addEventListener('DOMContentLoaded', () => {
    analytics = new Analytics();
    
    // Make available globally
    window.analytics = analytics;
    
    // Track performance and errors if consent given
    if (analytics.consentGiven) {
        analytics.trackPerformance();
        analytics.trackErrors();
    }
});

// Track page views for SPA-like navigation
window.addEventListener('popstate', () => {
    if (analytics && analytics.consentGiven) {
        analytics.trackPageView();
    }
});

// Integration with other systems
document.addEventListener('languageChanged', (e) => {
    if (analytics && analytics.consentGiven) {
        analytics.trackLanguageChange(e.detail.from, e.detail.to);
    }
});

document.addEventListener('themeChanged', (e) => {
    if (analytics && analytics.consentGiven) {
        analytics.trackThemeChange(e.detail.theme);
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}
