/**
 * Members Directory System
 * Handles member listing, filtering, search, and pagination
 */

class MembersDirectory {
    constructor() {
        this.members = [];
        this.filteredMembers = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filters = {
            search: '',
            division: '',
            district: '',
            upazila: '',
            role: ''
        };
        this.sortBy = 'name';
        this.locationData = {};
        
        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            await this.loadData();
            this.setupEventListeners();
            this.populateFilters();
            this.renderMembers();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize members directory:', error);
            this.showError();
        }
    }

    async loadData() {
        // Load members data
        const membersResponse = await fetch('/assets/data/members.json');
        if (!membersResponse.ok) throw new Error('Failed to load members data');
        this.members = await membersResponse.json();

        // Load location data (divisions, districts, upazilas)
        const locationResponse = await fetch('/assets/data/bd-locations.json');
        if (locationResponse.ok) {
            this.locationData = await locationResponse.json();
        }

        this.filteredMembers = [...this.members];
    }

    showLoading(show) {
        const loading = document.getElementById('members-loading');
        const grid = document.getElementById('members-grid');
        const pagination = document.getElementById('pagination');
        
        if (loading) loading.style.display = show ? 'block' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'grid';
        if (pagination) pagination.style.display = show ? 'none' : 'flex';
    }

    showError() {
        const grid = document.getElementById('members-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state">
                    <h3>Unable to load members</h3>
                    <p>Please try refreshing the page.</p>
                    <button onclick="location.reload()" class="btn btn--primary">Retry</button>
                </div>
            `;
        }
        this.showLoading(false);
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('member-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value.toLowerCase().trim();
                    this.applyFilters();
                }, 300);
            });
        }

        // Filter selects
        ['division', 'district', 'upazila', 'role'].forEach(filterType => {
            const select = document.getElementById(`${filterType}-filter`);
            if (select) {
                select.addEventListener('change', (e) => {
                    this.filters[filterType] = e.target.value;
                    
                    // Clear dependent filters
                    if (filterType === 'division') {
                        this.filters.district = '';
                        this.filters.upazila = '';
                        this.populateDistricts();
                        this.clearUpazilas();
                    } else if (filterType === 'district') {
                        this.filters.upazila = '';
                        this.populateUpazilas();
                    }
                    
                    this.applyFilters();
                });
            }
        });

        // Sort select
        const sortSelect = document.getElementById('sort-filter');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Clear filters
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus search on '/' key
            if (e.key === '/' && searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }

    populateFilters() {
        this.populateDivisions();
        this.populateRoles();
    }

    populateDivisions() {
        const select = document.getElementById('division-filter');
        if (!select || !this.locationData.divisions) return;

        // Get unique divisions from members
        const divisions = [...new Set(this.members.map(m => m.division).filter(Boolean))];
        
        // Clear existing options except first
        select.innerHTML = '<option value="" data-i18n="members.filters.division">Division</option>';
        
        divisions.sort().forEach(division => {
            const option = document.createElement('option');
            option.value = division;
            option.textContent = division;
            select.appendChild(option);
        });
    }

    populateDistricts() {
        const select = document.getElementById('district-filter');
        const selectedDivision = this.filters.division;
        
        if (!select) return;
        
        // Clear and disable if no division selected
        select.innerHTML = '<option value="" data-i18n="members.filters.district">District</option>';
        select.disabled = !selectedDivision;
        
        if (!selectedDivision) return;

        // Get unique districts for selected division
        const districts = [...new Set(
            this.members
                .filter(m => m.division === selectedDivision)
                .map(m => m.district)
                .filter(Boolean)
        )];
        
        districts.sort().forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            select.appendChild(option);
        });
        
        select.disabled = false;
    }

    populateUpazilas() {
        const select = document.getElementById('upazila-filter');
        const selectedDistrict = this.filters.district;
        
        if (!select) return;
        
        select.innerHTML = '<option value="" data-i18n="members.filters.upazila">Sub-district</option>';
        select.disabled = !selectedDistrict;
        
        if (!selectedDistrict) return;

        // Get unique upazilas for selected district
        const upazilas = [...new Set(
            this.members
                .filter(m => m.division === this.filters.division && m.district === selectedDistrict)
                .map(m => m.upazila)
                .filter(Boolean)
        )];
        
        upazilas.sort().forEach(upazila => {
            const option = document.createElement('option');
            option.value = upazila;
            option.textContent = upazila;
            select.appendChild(option);
        });
        
        select.disabled = false;
    }

    clearUpazilas() {
        const select = document.getElementById('upazila-filter');
        if (select) {
            select.innerHTML = '<option value="" data-i18n="members.filters.upazila">Sub-district</option>';
            select.disabled = true;
        }
    }

    populateRoles() {
        const select = document.getElementById('role-filter');
        if (!select) return;

        // Get unique roles
        const roles = [...new Set(this.members.map(m => m.role).filter(Boolean))];
        
        roles.sort().forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            select.appendChild(option);
        });
    }

    applyFilters() {
        // Reset to first page
        this.currentPage = 1;
        
        // Apply all filters
        this.filteredMembers = this.members.filter(member => {
            // Search filter
            if (this.filters.search && !this.matchesSearch(member, this.filters.search)) {
                return false;
            }
            
            // Location filters
            if (this.filters.division && member.division !== this.filters.division) return false;
            if (this.filters.district && member.district !== this.filters.district) return false;
            if (this.filters.upazila && member.upazila !== this.filters.upazila) return false;
            
            // Role filter
            if (this.filters.role && member.role !== this.filters.role) return false;
            
            return true;
        });

        // Apply sorting
        this.sortMembers();
        
        // Update UI
        this.updateMemberCount();
        this.renderMembers();
        this.renderPagination();
    }

    matchesSearch(member, searchTerm) {
        const searchFields = [
            member.name,
            member.role,
            member.division,
            member.district,
            member.upazila,
            member.skills?.join(' ') || ''
        ].map(field => (field || '').toLowerCase());
        
        return searchFields.some(field => field.includes(searchTerm));
    }

    sortMembers() {
        this.filteredMembers.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'recent':
                    return new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0);
                case 'role':
                    return a.role.localeCompare(b.role);
                default:
                    return 0;
            }
        });
    }

    updateMemberCount() {
        const countElement = document.getElementById('members-count');
        if (countElement && window.i18n) {
            const count = this.filteredMembers.length;
            countElement.textContent = window.i18n.t('members.member_count', { count });
        }
    }

    renderMembers() {
        const grid = document.getElementById('members-grid');
        const noResults = document.getElementById('no-results');
        
        if (!grid) return;

        if (this.filteredMembers.length === 0) {
            grid.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            return;
        }

        if (noResults) noResults.style.display = 'none';
        grid.style.display = 'grid';

        // Calculate pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageMembers = this.filteredMembers.slice(start, end);

        // Render member cards
        grid.innerHTML = pageMembers.map(member => this.createMemberCard(member)).join('');
        
        // Add AOS animation to new cards
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    }

    createMemberCard(member) {
        const avatarSrc = member.avatar || '/assets/img/default-avatar.svg';
        const location = [member.upazila, member.district, member.division].filter(Boolean).join(', ');
        
        return `
            <article class="member-card" role="gridcell" data-aos="fade-up" data-member-id="${member.id}">
                <div class="member-card__avatar">
                    <img src="${avatarSrc}" alt="${member.name}" loading="lazy" onerror="this.src='/assets/img/default-avatar.svg'">
                    ${member.featured ? '<div class="member-card__badge">Featured</div>' : ''}
                </div>
                <div class="member-card__content">
                    <h3 class="member-card__name">${member.name}</h3>
                    <p class="member-card__role">${member.role}</p>
                    <p class="member-card__location">${location}</p>
                    <p class="member-card__id">ID: ${member.id}</p>
                    ${member.skills && member.skills.length > 0 ? `
                        <div class="member-card__skills">
                            ${member.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                            ${member.skills.length > 3 ? `<span class="skill-tag skill-tag--more">+${member.skills.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                    <button class="btn btn--outline btn--small member-card__btn" 
                            onclick="membersDirectory.openMemberModal('${member.id}')"
                            data-i18n="members.view_profile">
                        View Profile
                    </button>
                </div>
            </article>
        `;
    }

    openMemberModal(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (!member) return;

        // Use the global modal system
        if (window.openModal) {
            window.openModal('member-modal', member);
        }
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
        
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

        // Add event listeners to pagination buttons
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
        this.renderMembers();
        this.renderPagination();
        
        // Scroll to top of results
        const grid = document.getElementById('members-grid');
        if (grid) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    clearAllFilters() {
        // Reset filters
        this.filters = {
            search: '',
            division: '',
            district: '',
            upazila: '',
            role: ''
        };
        
        // Reset form elements
        const searchInput = document.getElementById('member-search');
        if (searchInput) searchInput.value = '';
        
        ['division', 'district', 'upazila', 'role'].forEach(filterType => {
            const select = document.getElementById(`${filterType}-filter`);
            if (select) select.value = '';
        });
        
        // Reset sort
        this.sortBy = 'name';
        const sortSelect = document.getElementById('sort-filter');
        if (sortSelect) sortSelect.value = 'name';
        
        // Disable dependent selects
        this.clearUpazilas();
        const districtSelect = document.getElementById('district-filter');
        if (districtSelect) {
            districtSelect.innerHTML = '<option value="" data-i18n="members.
