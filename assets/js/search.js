/**
 * Site Search System
 * Client-side search using Fuse.js for fuzzy searching
 */

class SiteSearch {
    constructor() {
        this.searchIndex = [];
        this.fuse = null;
        this.currentLanguage = 'en';
        this.isLoading = false;
        this.cache = new Map();
        
        this.init();
    }

    async init() {
        try {
            await this.loadSearchIndex();
            this.setupEventListeners();
            this.updateLanguage();
        } catch (error) {
            console.error('Failed to initialize search:', error);
        }
    }

    async loadSearchIndex() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch('/assets/data/search-index.json');
            if (!response.ok) throw new Error('Failed to load search index');
            
            this.searchIndex = await response.json();
            this.initializeFuse();
        } catch (error) {
            console.error('Error loading search index:', error);
        } finally {
            this.isLoading = false;
        }
    }

    initializeFuse() {
        const options = {
            keys: [
                { name: 'title', weight: 0.4 },
                { name: 'content', weight: 0.3 },
                { name: 'excerpt', weight: 0.2 },
                { name: 'tags', weight: 0.1 }
            ],
            threshold: 0.3,
            distance: 100,
            minMatchCharLength: 2,
            includeScore: true,
            includeMatches: true
        };

        // Filter by current language
        const languageFilteredIndex = this.searchIndex.filter(
            item => item.language === this.currentLanguage
        );

        this.fuse = new Fuse(languageFilteredIndex, options);
    }

    setupEventListeners() {
        // Search input handler
        document.addEventListener('input', (e) => {
            const searchInput = e.target.closest('[data-search-input]');
            if (searchInput) {
                this.debounce(() => {
                    this.performSearch(searchInput.value);
                }, 300)();
            }
        });

        // Search form submission
        document.addEventListener('submit', (e) => {
            const searchForm = e.target.closest('.search-form');
            if (searchForm) {
                e.preventDefault();
                const input = searchForm.querySelector('[data-search-input]');
                if (input) {
                    this.performSearch(input.value);
                }
            }
        });

        // Keyboard navigation in search results
        document.addEventListener('keydown', (e) => {
            const searchResults = document.querySelector('[data-search-results]');
            if (!searchResults || !searchResults.children.length) return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateSearchResults(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter') {
                const focused = searchResults.querySelector('.search-result--focused');
                if (focused) {
                    e.preventDefault();
                    const link = focused.querySelector('a');
                    if (link) link.click();
                }
            }
        });

        // Listen for language changes
        document.addEventListener('languageChanged', (e) => {
            this.currentLanguage = e.detail.language;
            this.updateLanguage();
        });
    }

    updateLanguage() {
        if (this.fuse) {
            this.initializeFuse();
            
            // Clear current search results
            const resultsContainer = document.querySelector('[data-search-results]');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
        }
    }

    async performSearch(query) {
        const resultsContainer = document.querySelector('[data-search-results]');
        if (!resultsContainer) return;

        // Clear results if query is too short
        if (query.trim().length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        // Check cache first
        const cacheKey = `${this.currentLanguage}:${query.toLowerCase()}`;
        if (this.cache.has(cacheKey)) {
            this.renderResults(this.cache.get(cacheKey), query);
            return;
        }

        // Show loading state
        resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';

        try {
            // Ensure Fuse is initialized
            if (!this.fuse) {
                await this.loadSearchIndex();
            }

            const results = this.fuse.search(query);
            
            // Cache results
            this.cache.set(cacheKey, results);
            
            // Limit cache size
            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            this.renderResults(results, query);
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div class="search-error">Search temporarily unavailable</div>';
        }
    }

    renderResults(results, query) {
        const resultsContainer = document.querySelector('[data-search-results]');
        if (!resultsContainer) return;

        if (results.length === 0) {
            const noResultsText = window.i18n ? 
                window.i18n.t('search.no_results') : 
                'No results found for your search.';
            resultsContainer.innerHTML = `<div class="search-no-results">${noResultsText}</div>`;
            return;
        }

        // Limit results
        const limitedResults = results.slice(0, 8);
        
        const resultsHTML = limitedResults.map((result, index) => {
            const item = result.item;
            const score = Math.round((1 - result.score) * 100);
            
            return `
                <div class="search-result" data-result-index="${index}" tabindex="-1">
                    <a href="${item.url}" class="search-result__link">
                        <div class="search-result__header">
                            <h4 class="search-result__title">${this.highlightMatches(item.title, result.matches, 'title')}</h4>
                            <span class="search-result__type">${item.type}</span>
                        </div>
                        <p class="search-result__excerpt">${this.highlightMatches(item.excerpt, result.matches, 'excerpt')}</p>
                        ${item.tags && item.tags.length > 0 ? `
                            <div class="search-result__tags">
                                ${item.tags.slice(0, 3).map(tag => `<span class="search-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </a>
                </div>
            `;
        }).join('');

        // Show results count
        const countText = window.i18n ? 
            window.i18n.t('search.results_count', { count: results.length }) :
            `${results.length} result(s) found`;

        resultsContainer.innerHTML = `
            <div class="search-results__header">
                <span class="search-results__count">${countText}</span>
            </div>
            ${resultsHTML}
        `;
    }

    highlightMatches(text, matches, key) {
        if (!matches || !text) return text;
        
        const match = matches.find(m => m.key === key);
        if (!match) return text;

        let highlightedText = text;
        
        // Sort indices in descending order to avoid offset issues
        const sortedIndices = [...match.indices].sort((a, b) => b[0] - a[0]);
        
        sortedIndices.forEach(([start, end]) => {
            const before = highlightedText.substring(0, start);
            const highlight = highlightedText.substring(start, end + 1);
            const after = highlightedText.substring(end + 1);
            highlightedText = before + `<mark>${highlight}</mark>` + after;
        });

        return highlightedText;
    }

    navigateSearchResults(direction) {
        const results = document.querySelectorAll('.search-result');
        if (results.length === 0) return;

        const currentFocused = document.querySelector('.search-result--focused');
        let nextIndex = 0;

        if (currentFocused) {
            const currentIndex = parseInt(currentFocused.getAttribute('data-result-index'));
            nextIndex = currentIndex + direction;
            currentFocused.classList.remove('search-result--focused');
        }

        // Wrap around
        if (nextIndex < 0) nextIndex = results.length - 1;
        if (nextIndex >= results.length) nextIndex = 0;

        const nextResult = results[nextIndex];
        nextResult.classList.add('search-result--focused');
        nextResult.focus();
    }

    // Global search page functionality
    initGlobalSearchPage() {
        const searchInput = document.getElementById('global-search-input');
        const resultsContainer = document.getElementById('global-search-results');
        
        if (!searchInput || !resultsContainer) return;

        searchInput.addEventListener('input', this.debounce((e) => {
            this.performGlobalSearch(e.target.value, resultsContainer);
        }, 300));

        // Auto-focus search input
        searchInput.focus();

        // Load popular searches or recent queries
        this.showPopularSearches(resultsContainer);
    }

    async performGlobalSearch(query, container) {
        if (query.trim().length < 2) {
            this.showPopularSearches(container);
            return;
        }

        container.innerHTML = '<div class="search-loading">Searching...</div>';

        try {
            if (!this.fuse) await this.loadSearchIndex();
            
            const results = this.fuse.search(query);
            this.renderGlobalResults(results, query, container);
        } catch (error) {
            console.error('Global search error:', error);
            container.innerHTML = '<div class="search-error">Search temporarily unavailable</div>';
        }
    }

    renderGlobalResults(results, query, container) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-no-results">
                    <h3>No results found</h3>
                    <p>Try different keywords or browse our <a href="/programmes/">programmes</a>.</p>
                </div>
            `;
            return;
        }

        const groupedResults = this.groupResultsByType(results);
        
        let html = '';
        
        Object.entries(groupedResults).forEach(([type, items]) => {
            html += `
                <div class="search-section">
                    <h3 class="search-section__title">${type}</h3>
                    <div class="search-section__results">
                        ${items.map(result => this.createGlobalResultItem(result)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    groupResultsByType(results) {
        const grouped = {};
        
        results.slice(0, 20).forEach(result => {
            const type = result.item.type || 'Other';
            if (!grouped[type]) grouped[type] = [];
            grouped[type].push(result);
        });

        return grouped;
    }

    createGlobalResultItem(result) {
        const item = result.item;
        const score = Math.round((1 - result.score) * 100);
        
        return `
            <article class="global-search-result">
                <a href="${item.url}" class="global-search-result__link">
                    <div class="global-search-result__content">
                        <h4 class="global-search-result__title">${item.title}</h4>
                        <p class="global-search-result__excerpt">${item.excerpt}</p>
                        <div class="global-search-result__meta">
                            <span class="global-search-result__type">${item.type}</span>
                            <span class="global-search-result__score">${score}% match</span>
                        </div>
                    </div>
                </a>
            </article>
        `;
    }

    showPopularSearches(container) {
        const popularSearches = [
            'Technology camps',
            'Digital education',
            'Volunteer opportunities',
            'Mental health support',
            'Environmental projects'
        ];

        const html = `
            <div class="popular-searches">
                <h3>Popular Searches</h3>
                <div class="popular-searches__tags">
                    ${popularSearches.map(search => `
                        <button class="popular-search-tag" data-search="${search}">
                            ${search}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Handle popular search clicks
        container.addEventListener('click', (e) => {
            const tag = e.target.closest('.popular-search-tag');
            if (tag) {
                const searchTerm = tag.getAttribute('data-search');
                const searchInput = document.querySelector('[data-search-input]');
                if (searchInput) {
                    searchInput.value = searchTerm;
                    this.performSearch(searchTerm);
                }
            }
        });
    }

    // Utility function for debouncing
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

    // Add search analytics (privacy-friendly)
    trackSearch(query, resultCount) {
        // Only track if analytics consent is given
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) return;

        const preferences = JSON.parse(consent);
        if (!preferences.analytics) return;

        // Simple, privacy-friendly search analytics
        try {
            const searchData = {
                query: query.length, // Only track query length, not content
                results: resultCount,
                timestamp: Date.now(),
                language: this.currentLanguage
            };

            // Store in sessionStorage for this session only
            const sessionSearches = JSON.parse(sessionStorage.getItem('search-analytics') || '[]');
            sessionSearches.push(searchData);
            
            // Keep only last 10 searches
            if (sessionSearches.length > 10) {
                sessionSearches.shift();
            }
            
            sessionStorage.setItem('search-analytics', JSON.stringify(sessionSearches));
        } catch (error) {
            // Fail silently
        }
    }

    // Clear search
    clearSearch() {
        const searchInputs = document.querySelectorAll('[data-search-input]');
        const resultsContainers = document.querySelectorAll('[data-search-results]');
        
        searchInputs.forEach(input => input.value = '');
        resultsContainers.forEach(container => container.innerHTML = '');
        
        // Hide search dropdown
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.classList.remove('nav__search--active');
        }
    }

    // Get search suggestions based on index
    getSuggestions(query, limit = 5) {
        if (!this.fuse || query.length < 2) return [];

        const results = this.fuse.search(query);
        return results.slice(0, limit).map(result => result.item.title);
    }
}

// Initialize search when DOM is ready
let siteSearch;

document.addEventListener('DOMContentLoaded', async () => {
    // Load Fuse.js if not already loaded
    if (typeof Fuse === 'undefined') {
        try {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.6.2/fuse.min.js';
            script.integrity = 'sha512-MQS7Kn0ONzLRlroMUqbW7+9VM8GMVj1mN37/fJJAaX1S5ZSC+2N6DKK5/TGk9m3/lUnkw34oPyHybDJ+hF3V2A==';
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
            });
        } catch (error) {
            console.warn('Could not load Fuse.js, search functionality will be limited');
            return;
        }
    }
    
    siteSearch = new SiteSearch();
    
    // Make available globally
    window.siteSearch = siteSearch;
    
    // Initialize global search page if we're on it
    if (window.location.pathname.includes('/search')) {
        siteSearch.initGlobalSearchPage();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiteSearch;
}
