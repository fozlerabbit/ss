/**
 * Blog System
 * Handles blog post loading, filtering, and pagination
 */

class BlogSystem {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.currentPage = 1;
        this.postsPerPage = 9;
        this.currentCategory = '';
        
        this.init();
    }

    async init() {
        try {
            await this.loadPosts();
            this.setupEventListeners();
            this.renderPosts();
        } catch (error) {
            console.error('Failed to initialize blog system:', error);
            this.showError();
        }
    }

    async loadPosts() {
        try {
            const response = await fetch('/assets/data/posts.json');
            if (!response.ok) throw new Error('Failed to load posts');
            
            this.posts = await response.json();
            this.filteredPosts = [...this.posts];
            
            // Sort by date (newest first)
            this.filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading posts:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.filterPosts();
            });
        }
    }

    filterPosts() {
        this.currentPage = 1;
        
        if (this.currentCategory) {
            this.filteredPosts = this.posts.filter(post => 
                post.category.toLowerCase() === this.currentCategory.toLowerCase()
            );
        } else {
            this.filteredPosts = [...this.posts];
        }
        
        this.renderPosts();
        this.renderPagination();
    }

    renderPosts() {
        const grid = document.getElementById('posts-grid');
        if (!grid) return;

        if (this.filteredPosts.length === 0) {
            grid.innerHTML = `
                <div class="no-posts">
                    <h3>No posts found</h3>
                    <p>Try selecting a different category or check back later for new content.</p>
                </div>
            `;
            return;
        }

        // Calculate pagination
        const start = (this.currentPage - 1) * this.postsPerPage;
        const end = start + this.postsPerPage;
        const pagePosts = this.filteredPosts.slice(start, end);

        // Render post cards
        grid.innerHTML = pagePosts.map(post => this.createPostCard(post)).join('');
        
        // Add AOS animation to new cards
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    createPostCard(post) {
        const readTime = this.calculateReadTime(post.excerpt);
        const formattedDate = this.formatDate(post.date);
        
        return `
            <article class="post-card" data-aos="fade-up">
                <div class="post-card__image">
                    <img src="${post.image}" alt="${post.title}" loading="lazy">
                    <div class="post-card__category">${post.category}</div>
                </div>
                <div class="post-card__content">
                    <div class="post-meta">
                        <time datetime="${post.date}">${formattedDate}</time>
                        <span class="post-read-time">${readTime} min read</span>
                    </div>
                    <h3 class="post-card__title">
                        <a href="${post.url}">${post.title}</a>
                    </h3>
                    <p class="post-card__excerpt">${post.excerpt}</p>
                    <div class="post-card__footer">
                        <div class="post-author">
                            <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
                            <span class="author-name">${post.author.name}</span>
                        </div>
                        <a href="${post.url}" class="read-more-link">
                            Read More
                            <svg><use href="/assets/img/icons.svg#arrow-right"></use></svg>
                        </a>
                    </div>
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="post-tags">
                            ${post.tags.slice(0, 3).map(tag => `<span class="post-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </article>
        `;
    }

    calculateReadTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(' ').length;
        return Math.max(1, Math.round(wordCount / wordsPerMinute));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        // Use i18n formatting if available
        if (window.i18n) {
            return window.i18n.formatDate(date, options);
        }
        
        return date.toLocaleDateString('en-US', options);
    }

    renderPagination() {
        const pagination = document.getElementById('blog-pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination__btn" data-page="${this.currentPage - 1}" aria-label="Previous page">
                    <svg><use href="/assets/img/icons.svg#chevron-left"></use></svg>
                </button>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination__btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination__ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination__btn ${i === this.currentPage ? 'pagination__btn--active' : ''}" 
                        data-page="${i}" aria-label="Page ${i}" ${i === this.currentPage ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination__ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination__btn" data-page="${this.currentPage + 1}" aria-label="Next page">
                    <svg><use href="/assets/img/icons.svg#chevron-right"></use></svg>
                </button>
            `;
        }

        pagination.innerHTML = paginationHTML;

        // Add event listeners
        pagination.addEventListener('click', (e) => {
            const pageBtn = e.target.closest('[data-page]');
            if (pageBtn) {
                const page = parseInt(pageBtn.getAttribute('data-page'));
                this.goToPage(page);
            }
        });
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderPosts();
        this.renderPagination();
        
        // Scroll to top of posts
        const postsSection = document.querySelector('.blog-posts');
        if (postsSection) {
            postsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showError() {
        const grid = document.getElementById('posts-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="blog-error">
                    <div class="blog-error__icon">
                        <svg><use href="/assets/img/icons.svg#alert-triangle"></use></svg>
                    </div>
                    <h3>Unable to load blog posts</h3>
                    <p>Please try refreshing the page or check back later.</p>
                    <button onclick="location.reload()" class="btn btn--primary">Retry</button>
                </div>
            `;
        }
    }

    // Search functionality
    searchPosts(query) {
        if (!query || query.length < 2) {
            this.filteredPosts = this.currentCategory ? 
                this.posts.filter(post => post.category.toLowerCase() === this.currentCategory.toLowerCase()) :
                [...this.posts];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredPosts = this.posts.filter(post => {
                return post.title.toLowerCase().includes(searchTerm) ||
                       post.excerpt.toLowerCase().includes(searchTerm) ||
                       post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                       (this.currentCategory ? post.category.toLowerCase() === this.currentCategory.toLowerCase() : true);
            });
        }
        
        this.currentPage = 1;
        this.renderPosts();
        this.renderPagination();
    }

    // Get related posts
    getRelatedPosts(currentPost, limit = 3) {
        return this.posts
            .filter(post => post.id !== currentPost.id)
            .filter(post => {
                // Same category or shared tags
                return post.category === currentPost.category ||
                       post.tags.some(tag => currentPost.tags.includes(tag));
            })
            .slice(0, limit);
    }

    // Get popular posts (based on views or engagement)
    getPopularPosts(limit = 5) {
        return this.posts
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
    }

    // Get posts by category
    getPostsByCategory(category, limit = null) {
        const categoryPosts = this.posts.filter(post => 
            post.category.toLowerCase() === category.toLowerCase()
        );
        
        return limit ? categoryPosts.slice(0, limit) : categoryPosts;
    }

    // Export functionality
    exportPosts() {
        const data = {
            exported_at: new Date().toISOString(),
            total_posts: this.posts.length,
            posts: this.posts.map(post => ({
                title: post.title,
                date: post.date,
                category: post.category,
                url: post.url,
                author: post.author.name
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scriptysphere-blog-posts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize blog system
let blogSystem;

document.addEventListener('DOMContentLoaded', async () => {
    // Only initialize on blog pages
    if (window.location.pathname.includes('/blog/')) {
        blogSystem = new BlogSystem();
        
        // Make available globally
        window.blogSystem = blogSystem;
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogSystem;
}
