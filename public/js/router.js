/**
 * BlogSphere Client-side SPA Router
 */

class Router {
  constructor() {
    this.routes = [];
    this.container = null;

    window.addEventListener('popstate', () => {
      this.handleRoute();
    });

    // Intercept client navigations
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && !link.getAttribute('target') && !link.getAttribute('download')) {
        const href = link.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('/api')) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });
  }

  setContainer(container) {
    this.container = container;
  }

  addRoute(pathPattern, handler) {
    // Convert path pattern e.g. /post/:identifier to regex
    const paramNames = [];
    const regexPath = pathPattern.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    });

    const regex = new RegExp(`^${regexPath}\\/?$`);
    this.routes.push({ pattern: pathPattern, regex, paramNames, handler });
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  async handleRoute() {
    if (!this.container) {
      this.container = document.getElementById('main-content');
    }

    const currentPath = window.location.pathname || '/';
    let matched = false;

    // Update active nav-links in header
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === currentPath || (href === '/blog' && currentPath.startsWith('/post/')));
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    for (const route of this.routes) {
      const match = currentPath.match(route.regex);
      if (match) {
        matched = true;
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });

        try {
          await route.handler(this.container, params);
        } catch (err) {
          console.error('Route render error:', err);
          this.container.innerHTML = `
            <div style="text-align: center; padding: 80px 20px;">
              <h2 style="color: var(--danger); margin-bottom: 12px;">Rendering Error</h2>
              <p style="color: var(--text-muted);">${escapeHtml(err.message)}</p>
            </div>
          `;
        }
        break;
      }
    }

    if (!matched) {
      // 404 View
      this.container.innerHTML = `
        <div style="text-align: center; padding: 100px 20px;">
          <h1 style="font-size: 4rem; font-weight: 800; background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">404</h1>
          <h2 style="font-size: 1.75rem; margin-bottom: 12px;">Page Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 24px;">The page you are looking for does not exist or has been moved.</p>
          <a href="/" class="btn btn-primary">Return to Homepage</a>
        </div>
      `;
    }
  }
}

const router = new Router();
