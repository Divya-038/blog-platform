/**
 * Blog Explore / Feed View
 */

const BlogView = {
  currentPage: 1,
  category: 'All',
  searchQuery: '',
  sortBy: 'newest',
  limit: 9,

  async render(container) {
    container.innerHTML = `
      <div style="padding: 40px 0 20px;">
        <div style="text-align: center; max-width: 680px; margin: 0 auto 36px;">
          <h1 style="font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 12px;">Explore Articles</h1>
          <p style="color: var(--text-secondary); font-size: 1.05rem;">
            Browse our full library of insightful articles across architecture, design, AI, and productivity.
          </p>
        </div>

        <!-- Filter & Search Toolbar -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; margin-bottom: 36px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between;">
          <div style="flex: 1; min-width: 260px; position: relative;">
            <input type="text" id="blog-search-input" class="form-input" style="padding-left: 38px;" placeholder="Search by title, keywords or tags..." value="${escapeHtml(this.searchQuery)}" />
            <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>

          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <select id="blog-category-select" class="form-select" style="width: auto; min-width: 160px;">
              <option value="All">All Categories</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Artificial Intelligence">AI & ML</option>
              <option value="Backend">Backend</option>
              <option value="Productivity">Productivity</option>
            </select>

            <select id="blog-sort-select" class="form-select" style="width: auto; min-width: 150px;">
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="oldest">Oldest First</option>
            </select>

            <button id="blog-reset-btn" class="btn btn-secondary btn-sm" title="Reset Filters">Reset</button>
          </div>
        </div>

        <!-- Post Stats & Results -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <span id="blog-results-count" style="font-size: 0.9rem; color: var(--text-muted);">Showing articles...</span>
        </div>

        <!-- Grid Container -->
        <div class="posts-grid" id="blog-grid-container">
          <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
            Loading articles...
          </div>
        </div>

        <!-- Pagination Controls -->
        <div id="blog-pagination-container" style="display: flex; align-items: center; justify-content: center; gap: 16px; margin: 40px 0 80px;"></div>
      </div>
    `;

    this.bindEvents(container);
    await this.loadPosts();
  },

  bindEvents(container) {
    const searchInput = container.querySelector('#blog-search-input');
    const categorySelect = container.querySelector('#blog-category-select');
    const sortSelect = container.querySelector('#blog-sort-select');
    const resetBtn = container.querySelector('#blog-reset-btn');

    let debounceTimer;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.currentPage = 1;
        this.loadPosts();
      }, 350);
    });

    categorySelect?.addEventListener('change', (e) => {
      this.category = e.target.value;
      this.currentPage = 1;
      this.loadPosts();
    });

    sortSelect?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.currentPage = 1;
      this.loadPosts();
    });

    resetBtn?.addEventListener('click', () => {
      this.searchQuery = '';
      this.category = 'All';
      this.sortBy = 'newest';
      this.currentPage = 1;
      if (searchInput) searchInput.value = '';
      if (categorySelect) categorySelect.value = 'All';
      if (sortSelect) sortSelect.value = 'newest';
      this.loadPosts();
    });
  },

  async loadPosts() {
    const grid = document.getElementById('blog-grid-container');
    const countLabel = document.getElementById('blog-results-count');
    const pagination = document.getElementById('blog-pagination-container');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
        <p>Loading articles...</p>
      </div>
    `;

    try {
      const response = await api.posts.getAll({
        category: this.category === 'All' ? '' : this.category,
        search: this.searchQuery,
        sort: this.sortBy,
        page: this.currentPage,
        limit: this.limit
      });

      if (!response.success || !response.data || response.data.length === 0) {
        if (countLabel) countLabel.textContent = 'Found 0 articles';
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No matching articles</h3>
            <p style="color: var(--text-muted);">Try searching with different terms or selecting another category.</p>
          </div>
        `;
        if (pagination) pagination.innerHTML = '';
        return;
      }

      const total = response.pagination.total;
      if (countLabel) {
        countLabel.textContent = `Showing ${response.data.length} of ${total} total articles`;
      }

      grid.innerHTML = response.data.map(p => renderPostCard(p)).join('');

      // Render Pagination
      const totalPages = response.pagination.totalPages;
      if (totalPages > 1 && pagination) {
        pagination.innerHTML = `
          <button class="btn btn-secondary btn-sm" id="page-prev-btn" ${this.currentPage <= 1 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>&larr; Previous</button>
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">Page ${this.currentPage} of ${totalPages}</span>
          <button class="btn btn-secondary btn-sm" id="page-next-btn" ${this.currentPage >= totalPages ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>Next &rarr;</button>
        `;

        document.getElementById('page-prev-btn')?.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.loadPosts();
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }
        });

        document.getElementById('page-next-btn')?.addEventListener('click', () => {
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.loadPosts();
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }
        });
      } else if (pagination) {
        pagination.innerHTML = '';
      }
    } catch (err) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--danger);">
          <p>Failed to load posts from API.</p>
        </div>
      `;
    }
  }
};
