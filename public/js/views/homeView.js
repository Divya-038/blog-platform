/**
 * Home View
 */

const HomeView = {
  activeCategory: 'All',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-badge">
          <span>✨ Discover the Future of Tech & Design</span>
        </div>
        <h1 class="hero-title">
          Where brilliant ideas find their <span class="gradient-text">voice & audience.</span>
        </h1>
        <p class="hero-subtitle">
          Join thousands of developers, researchers, and designers sharing deep architectural insights, creative breakthroughs, and modern engineering practices.
        </p>

        <div class="hero-cta-group">
          <a href="/blog" class="nav-navigate btn btn-primary btn-lg">Explore All Articles</a>
          <button id="hero-write-btn" class="btn btn-secondary btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Write a Story
          </button>
        </div>

        <div class="search-bar-wrapper">
          <span class="search-icon-inside">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="text" id="home-search-input" class="search-input-box" placeholder="Search articles by title, topic, or keywords..." />
        </div>
      </section>

      <!-- Category Filter Pills -->
      <div class="categories-filter-bar" id="home-category-bar">
        <button class="filter-pill active" data-cat="All">All Topics</button>
        <button class="filter-pill" data-cat="Development">Development</button>
        <button class="filter-pill" data-cat="Design">Design</button>
        <button class="filter-pill" data-cat="Artificial Intelligence">AI & ML</button>
        <button class="filter-pill" data-cat="Backend">Backend</button>
        <button class="filter-pill" data-cat="Productivity">Productivity</button>
      </div>

      <!-- Articles Section -->
      <section>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 1.6rem; font-weight: 800;" id="home-posts-heading">Featured & Recent Posts</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;" id="home-posts-subheading">Hand-crafted articles and engineering deep dives.</p>
          </div>
          <a href="/blog" class="nav-navigate btn btn-ghost btn-sm" style="color: var(--primary);">View all &rarr;</a>
        </div>

        <div class="posts-grid" id="home-posts-container">
          <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
            Loading articles...
          </div>
        </div>
      </section>

      <!-- Banner / Call to Action -->
      <section style="margin: 40px 0 80px; padding: 48px; border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-color); text-align: center; position: relative; overflow: hidden;">
        <div style="position: relative; z-index: 2; max-width: 620px; margin: 0 auto;">
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 14px;">Have a story or insight to share?</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 1.05rem;">
            Whether you just solved a tricky architectural bug or designed an exquisite UI pattern, your experience can empower developers worldwide.
          </p>
          <button id="cta-start-writing-btn" class="btn btn-primary btn-lg">Start Writing Today</button>
        </div>
      </section>
    `;

    this.bindEvents(container);
    await this.loadPosts();
  },

  bindEvents(container) {
    // Write buttons
    const handleWriteClick = () => {
      if (auth.isAuthenticated()) {
        router.navigate('/create-post');
      } else {
        Toast.info('Please log in or register to publish your story.');
        router.navigate('/login');
      }
    };

    container.querySelector('#hero-write-btn')?.addEventListener('click', handleWriteClick);
    container.querySelector('#cta-start-writing-btn')?.addEventListener('click', handleWriteClick);

    // Search input
    let debounceTimer;
    const searchInput = container.querySelector('#home-search-input');
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.loadPosts();
      }, 350);
    });

    // Category pills
    const pillButtons = container.querySelectorAll('#home-category-bar .filter-pill');
    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.getAttribute('data-cat');
        this.loadPosts();
      });
    });
  },

  async loadPosts() {
    const postsContainer = document.getElementById('home-posts-container');
    if (!postsContainer) return;

    postsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
        <p>Loading curated articles...</p>
      </div>
    `;

    try {
      const response = await api.posts.getAll({
        category: this.activeCategory === 'All' ? '' : this.activeCategory,
        search: this.searchQuery,
        limit: 6,
        sort: 'popular'
      });

      if (!response.success || !response.data || response.data.length === 0) {
        postsContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <h3 style="font-size: 1.25rem; margin-bottom: 8px;">No articles found</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Try adjusting your search query or picking another topic.</p>
            <button class="btn btn-secondary btn-sm" id="reset-home-filter">Reset Filters</button>
          </div>
        `;
        document.getElementById('reset-home-filter')?.addEventListener('click', () => {
          this.activeCategory = 'All';
          this.searchQuery = '';
          const searchInput = document.getElementById('home-search-input');
          if (searchInput) searchInput.value = '';
          const pills = document.querySelectorAll('#home-category-bar .filter-pill');
          pills.forEach(p => p.classList.toggle('active', p.getAttribute('data-cat') === 'All'));
          this.loadPosts();
        });
        return;
      }

      postsContainer.innerHTML = response.data.map(p => renderPostCard(p)).join('');
    } catch (err) {
      postsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--danger);">
          <p>Failed to load articles. Please ensure the server is running.</p>
        </div>
      `;
    }
  }
};
