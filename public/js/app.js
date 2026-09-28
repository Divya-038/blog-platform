/**
 * BlogSphere Main Application Entrypoint
 */

document.addEventListener('DOMContentLoaded', async () => {
  const mainContent = document.getElementById('main-content');
  router.setContainer(mainContent);

  // Initialize Theme (Dark by default)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('blog_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('blog_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }

  // Mobile menu toggle
  const mobileToggleBtn = document.getElementById('mobile-nav-toggle-btn');
  const navLinks = document.getElementById('main-nav-links');
  mobileToggleBtn?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });

  // Close mobile nav when clicking a link
  navLinks?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      navLinks.classList.remove('open');
    }
  });

  // Setup Navbar according to Auth State
  function renderNavbarAuth(user) {
    const navAuthContainer = document.getElementById('nav-auth-container');
    if (!navAuthContainer) return;

    if (user) {
      navAuthContainer.innerHTML = `
        <a href="/create-post" class="nav-navigate btn btn-primary btn-sm" id="nav-write-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Write
        </a>

        <div class="user-menu-wrapper" id="user-menu-wrapper">
          <button class="user-avatar-btn" id="user-menu-toggle" aria-label="User menu">
            <img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.name)}" class="user-avatar-img" />
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(user.name.split(' ')[0])}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <div class="user-dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <div class="dropdown-user-name">${escapeHtml(user.name)}</div>
              <div class="dropdown-user-email">@${escapeHtml(user.username)}</div>
            </div>

            <a href="/profile/${encodeURIComponent(user.username)}" class="dropdown-item nav-navigate">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              My Profile
            </a>

            <a href="/create-post" class="dropdown-item nav-navigate">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              New Story
            </a>

            <div class="dropdown-divider"></div>

            <button class="dropdown-item" id="logout-menu-item" style="color: var(--danger); width: 100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      `;

      // Toggle dropdown menu
      const menuToggle = navAuthContainer.querySelector('#user-menu-toggle');
      const dropdownMenu = navAuthContainer.querySelector('#user-dropdown-menu');

      menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu?.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#user-menu-wrapper')) {
          dropdownMenu?.classList.remove('show');
        }
      });

      // Logout handler
      navAuthContainer.querySelector('#logout-menu-item')?.addEventListener('click', () => {
        auth.logout();
        Toast.info('Signed out successfully.');
        router.navigate('/');
      });

    } else {
      navAuthContainer.innerHTML = `
        <a href="/login" class="nav-navigate btn btn-ghost btn-sm">Sign In</a>
        <a href="/register" class="nav-navigate btn btn-primary btn-sm">Register</a>
      `;
    }
  }

  // Listen to auth state changes
  window.addEventListener('auth-changed', (e) => {
    renderNavbarAuth(e.detail.user);
  });

  // Setup Routes
  router.addRoute('/', (container) => HomeView.render(container));
  router.addRoute('/blog', (container) => BlogView.render(container));
  router.addRoute('/post/:identifier', (container, params) => PostDetailsView.render(container, params.identifier));
  router.addRoute('/create-post', (container) => EditorView.render(container));
  router.addRoute('/edit-post/:id', (container, params) => EditorView.render(container, params.id));
  router.addRoute('/profile', (container) => ProfileView.render(container));
  router.addRoute('/profile/:identifier', (container, params) => ProfileView.render(container, params.identifier));
  router.addRoute('/login', (container) => AuthView.renderLogin(container));
  router.addRoute('/register', (container) => AuthView.renderRegister(container));

  // Initialize Auth & kick off routing
  await auth.init();
  router.handleRoute();
});
