/**
 * BlogSphere UI Components & Utilities
 */

// Toast Notifications
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
      <button class="toast-close" title="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.remove(toast);
    });

    this.container.appendChild(toast);

    setTimeout(() => {
      this.remove(toast);
    }, duration);
  },

  remove(toast) {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

// Reusable Modal Component
const Modal = {
  overlay: null,

  init() {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      this.overlay.id = 'app-modal-overlay';
      document.body.appendChild(this.overlay);

      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
  },

  confirm({ title, message, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
    this.init();
    this.overlay.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${escapeHtml(title)}</h3>
          <button class="modal-close-btn" onclick="Modal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
          <button class="btn ${confirmClass} btn-sm" id="modal-confirm-btn">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    this.overlay.querySelector('#modal-confirm-btn').addEventListener('click', async () => {
      this.close();
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    });

    this.overlay.classList.add('show');
  },

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('show');
      this.overlay.innerHTML = '';
    }
  }
};

// Safe Markdown Parser
function parseMarkdown(md) {
  if (!md) return '';
  let html = escapeHtml(md);

  // Fenced Code Blocks with language or plain
  html = html.replace(/```([a-zA-Z0-9_]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline Code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers (# H1, ## H2, ### H3, #### H4)
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^\&gt;\s?(.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">$1</a>');

  // Unordered list items
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<pre') || block.startsWith('<blockquote') || block.startsWith('<ul') || block.startsWith('<li')) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).join('');

  return html;
}

// Helpers
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString.replace(' ', 'T'));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function timeAgo(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString.replace(' ', 'T'));
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString);
}

// Card Component
function renderPostCard(post) {
  const tagsList = (post.tags || '').split(',').filter(t => t.trim().length > 0);
  const tagsHtml = tagsList.slice(0, 3).map(t => `<span class="tag-badge">#${escapeHtml(t.trim())}</span>`).join('');

  return `
    <article class="post-card" data-slug="${escapeHtml(post.slug)}" data-id="${post.id}">
      <a href="/post/${escapeHtml(post.slug)}" class="nav-navigate post-card-cover-wrapper" aria-label="${escapeHtml(post.title)}">
        <img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" class="post-card-cover-img" loading="lazy" />
        <span class="post-card-category-badge">${escapeHtml(post.category || 'General')}</span>
      </a>

      <div class="post-card-body">
        <div class="post-card-meta">
          <span>${post.read_time || 3} min read</span>
          <span>•</span>
          <span>${formatDate(post.created_at)}</span>
        </div>

        <h3 class="post-card-title">
          <a href="/post/${escapeHtml(post.slug)}" class="nav-navigate">${escapeHtml(post.title)}</a>
        </h3>

        <p class="post-card-summary">${escapeHtml(post.summary || '')}</p>

        <div class="post-card-tags">
          ${tagsHtml}
        </div>

        <div class="post-card-footer">
          <a href="/profile/${escapeHtml(post.author_username)}" class="nav-navigate author-chip">
            <img src="${escapeHtml(post.author_avatar)}" alt="${escapeHtml(post.author_name)}" class="author-chip-avatar" />
            <div class="author-chip-info">
              <span class="author-chip-name">${escapeHtml(post.author_name)}</span>
              <span class="author-chip-date">@${escapeHtml(post.author_username)}</span>
            </div>
          </a>

          <div class="post-card-stats">
            <span class="post-stat-item" title="Likes">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              ${post.likes_count || 0}
            </span>
            <span class="post-stat-item" title="Comments">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              ${post.comments_count || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  `;
}
