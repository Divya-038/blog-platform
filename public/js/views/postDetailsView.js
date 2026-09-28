/**
 * Post Details & Comments View
 */

const PostDetailsView = {
  currentPost: null,

  async render(container, identifier) {
    if (!identifier) {
      router.navigate('/blog');
      return;
    }

    container.innerHTML = `
      <div class="post-detail-container" id="post-detail-wrapper">
        <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
          <p>Loading post details...</p>
        </div>
      </div>
    `;

    try {
      const response = await api.posts.getBySlugOrId(identifier);
      if (!response.success || !response.data) {
        container.innerHTML = `
          <div class="post-detail-container" style="text-align: center; padding: 80px 20px;">
            <h2 style="font-size: 2rem; margin-bottom: 12px;">Post Not Found</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">The article you are looking for does not exist or has been removed.</p>
            <a href="/blog" class="nav-navigate btn btn-primary">Browse Other Articles</a>
          </div>
        `;
        return;
      }

      this.currentPost = response.data;
      this.renderPostContent(container);
      await this.loadComments();
    } catch (err) {
      container.innerHTML = `
        <div class="post-detail-container" style="text-align: center; padding: 80px 20px;">
          <h2 style="font-size: 2rem; color: var(--danger); margin-bottom: 12px;">Error Loading Post</h2>
          <p style="color: var(--text-muted); margin-bottom: 24px;">${escapeHtml(err.message || 'Could not fetch article.')}</p>
          <a href="/blog" class="nav-navigate btn btn-secondary">Back to Blog</a>
        </div>
      `;
    }
  },

  renderPostContent(container) {
    const post = this.currentPost;
    const currentUser = auth.getUser();
    const isAuthor = currentUser && (currentUser.id === post.author_id || currentUser.role === 'admin');

    const tagsArray = (post.tags || '').split(',').filter(t => t.trim().length > 0);
    const tagsHtml = tagsArray.map(t => `<a href="/blog?tag=${encodeURIComponent(t.trim())}" class="nav-navigate tag-badge" style="font-size: 0.85rem; padding: 4px 12px;">#${escapeHtml(t.trim())}</a>`).join(' ');

    const html = `
      <div class="post-detail-container">
        <!-- Post Header -->
        <header class="post-header">
          <span class="post-header-category">${escapeHtml(post.category || 'General')}</span>
          <h1 class="post-header-title">${escapeHtml(post.title)}</h1>
          
          <div class="post-header-meta">
            <a href="/profile/${escapeHtml(post.author_username)}" class="nav-navigate post-author-link">
              <img src="${escapeHtml(post.author_avatar)}" alt="${escapeHtml(post.author_name)}" class="post-author-avatar" />
              <div style="text-align: left;">
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(post.author_name)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">@${escapeHtml(post.author_username)}</div>
              </div>
            </a>

            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.88rem;">
              <span>${formatDate(post.created_at)}</span>
              <span>•</span>
              <span>${post.read_time || 3} min read</span>
              <span>•</span>
              <span>${post.views || 0} views</span>
            </div>
          </div>
        </header>

        <!-- Cover Image -->
        <div class="post-cover-image-container">
          <img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.title)}" class="post-cover-image" />
        </div>

        <!-- Action Bar -->
        <div class="post-actions-bar">
          <div class="actions-left">
            <button id="post-like-btn" class="like-btn ${post.has_liked ? 'liked' : ''}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${post.has_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span id="post-likes-count">${post.likes_count || 0}</span>
            </button>

            <button id="post-share-btn" class="btn btn-secondary btn-sm" title="Copy article link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
          </div>

          <div class="actions-right">
            ${isAuthor ? `
              <a href="/edit-post/${post.id}" class="nav-navigate btn btn-secondary btn-sm" id="edit-post-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Post
              </a>
              <button class="btn btn-danger btn-sm" id="delete-post-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Rendered Post Content -->
        <article class="post-content">
          ${parseMarkdown(post.content)}
        </article>

        <!-- Tags List -->
        ${tagsArray.length > 0 ? `
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tags:</span>
            ${tagsHtml}
          </div>
        ` : ''}

        <!-- Author Bio Card -->
        <div class="post-author-card">
          <img src="${escapeHtml(post.author_avatar)}" alt="${escapeHtml(post.author_name)}" class="post-author-card-avatar" />
          <div class="post-author-card-body">
            <h3>Written by ${escapeHtml(post.author_name)}</h3>
            <p>${escapeHtml(post.author_bio || 'Author on BlogSphere.')}</p>
            <a href="/profile/${escapeHtml(post.author_username)}" class="nav-navigate btn btn-outline btn-sm">View Full Profile & Articles &rarr;</a>
          </div>
        </div>

        <!-- Comments Section -->
        <section class="comments-section" id="comments-section">
          <div class="comments-header">
            <h2 class="comments-count-title" id="comments-count-header">Comments (${post.comments_count || 0})</h2>
          </div>

          <!-- Add Comment Input Box -->
          <div id="comment-form-container">
            ${auth.isAuthenticated() ? `
              <div class="comment-input-box">
                <textarea id="comment-textarea" class="comment-textarea" placeholder="Share your thoughts or feedback on this article..."></textarea>
                <div class="comment-input-footer">
                  <span style="font-size: 0.8rem; color: var(--text-muted);">Markdown formatting is supported</span>
                  <button id="submit-comment-btn" class="btn btn-primary btn-sm">Post Comment</button>
                </div>
              </div>
            ` : `
              <div class="comment-guest-prompt">
                <h3 style="font-size: 1.15rem; margin-bottom: 8px;">Join the Conversation</h3>
                <p style="color: var(--text-muted); margin-bottom: 16px;">Sign in to leave a comment and interact with the author.</p>
                <div style="display: flex; justify-content: center; gap: 12px;">
                  <a href="/login" class="nav-navigate btn btn-primary btn-sm">Sign In</a>
                  <a href="/register" class="nav-navigate btn btn-secondary btn-sm">Register</a>
                </div>
              </div>
            `}
          </div>

          <!-- Comments Feed -->
          <div class="comments-list" id="comments-list-container">
            <p style="color: var(--text-muted); text-align: center; padding: 24px;">Loading comments...</p>
          </div>
        </section>
      </div>
    `;

    container.innerHTML = html;
    this.bindPostEvents(container);
  },

  bindPostEvents(container) {
    const post = this.currentPost;

    // Like Button
    const likeBtn = container.querySelector('#post-like-btn');
    likeBtn?.addEventListener('click', async () => {
      if (!auth.isAuthenticated()) {
        Toast.info('Please log in to like this post.');
        router.navigate('/login');
        return;
      }

      try {
        const res = await api.posts.toggleLike(post.id);
        if (res.success) {
          likeBtn.classList.toggle('liked', res.has_liked);
          const svg = likeBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', res.has_liked ? 'currentColor' : 'none');
          const countSpan = likeBtn.querySelector('#post-likes-count');
          if (countSpan) countSpan.textContent = res.likes_count;
        }
      } catch (err) {
        Toast.error('Failed to update like status.');
      }
    });

    // Share Button
    const shareBtn = container.querySelector('#post-share-btn');
    shareBtn?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        Toast.success('Article link copied to clipboard!');
      }).catch(() => {
        Toast.info(`URL: ${url}`);
      });
    });

    // Delete Post Button
    const deleteBtn = container.querySelector('#delete-post-btn');
    deleteBtn?.addEventListener('click', () => {
      Modal.confirm({
        title: 'Delete Blog Post',
        message: `Are you sure you want to delete "${post.title}"? This action cannot be undone and will delete all associated comments.`,
        confirmText: 'Yes, Delete Post',
        onConfirm: async () => {
          try {
            const res = await api.posts.delete(post.id);
            if (res.success) {
              Toast.success('Post was deleted successfully.');
              router.navigate('/blog');
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to delete post.');
          }
        }
      });
    });

    // Submit Comment
    const submitCommentBtn = container.querySelector('#submit-comment-btn');
    const commentTextarea = container.querySelector('#comment-textarea');
    submitCommentBtn?.addEventListener('click', async () => {
      const content = commentTextarea ? commentTextarea.value.trim() : '';
      if (!content) {
        Toast.error('Please enter a comment.');
        return;
      }

      submitCommentBtn.disabled = true;
      submitCommentBtn.textContent = 'Posting...';

      try {
        const res = await api.comments.create(post.id, content);
        if (res.success) {
          Toast.success('Comment posted!');
          if (commentTextarea) commentTextarea.value = '';
          await this.loadComments();
        }
      } catch (err) {
        Toast.error(err.message || 'Failed to submit comment.');
      } finally {
        submitCommentBtn.disabled = false;
        submitCommentBtn.textContent = 'Post Comment';
      }
    });
  },

  async loadComments() {
    const listContainer = document.getElementById('comments-list-container');
    const headerTitle = document.getElementById('comments-count-header');
    if (!listContainer || !this.currentPost) return;

    try {
      const res = await api.comments.getByPost(this.currentPost.id);
      if (!res.success) throw new Error(res.message);

      const comments = res.data || [];
      if (headerTitle) {
        headerTitle.textContent = `Comments (${comments.length})`;
      }

      if (comments.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 36px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color); color: var(--text-muted);">
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = comments.map(c => this.renderCommentCard(c)).join('');
      this.bindCommentActions(listContainer);
    } catch (err) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--danger);">
          <p>Failed to load comments.</p>
        </div>
      `;
    }
  },

  renderCommentCard(comment) {
    const currentUser = auth.getUser();
    const canManage = currentUser && (comment.is_owner || currentUser.id === this.currentPost.author_id || currentUser.role === 'admin');
    const isOwner = comment.is_owner;

    return `
      <div class="comment-card" id="comment-${comment.id}">
        <div class="comment-card-header">
          <div class="comment-author-info">
            <a href="/profile/${escapeHtml(comment.user_username)}" class="nav-navigate">
              <img src="${escapeHtml(comment.user_avatar)}" alt="${escapeHtml(comment.user_name)}" class="comment-author-avatar" />
            </a>
            <div>
              <a href="/profile/${escapeHtml(comment.user_username)}" class="nav-navigate comment-author-name">${escapeHtml(comment.user_name)}</a>
              <span class="comment-date">• ${timeAgo(comment.created_at)}</span>
            </div>
          </div>

          ${canManage ? `
            <div class="comment-actions-menu">
              ${isOwner ? `
                <button class="btn btn-ghost btn-sm edit-comment-btn" data-id="${comment.id}" title="Edit Comment">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit
                </button>
              ` : ''}
              <button class="btn btn-ghost btn-sm delete-comment-btn" data-id="${comment.id}" style="color: var(--danger);" title="Delete Comment">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          ` : ''}
        </div>

        <div class="comment-content" id="comment-body-${comment.id}">${escapeHtml(comment.content)}</div>

        <!-- Inline Edit Box (hidden by default) -->
        <div class="comment-edit-box" id="comment-edit-box-${comment.id}" style="display: none;">
          <textarea class="form-input" id="comment-edit-text-${comment.id}" style="min-height: 80px; margin-bottom: 8px;">${escapeHtml(comment.content)}</textarea>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm cancel-edit-btn" data-id="${comment.id}">Cancel</button>
            <button class="btn btn-primary btn-sm save-edit-btn" data-id="${comment.id}">Save Changes</button>
          </div>
        </div>
      </div>
    `;
  },

  bindCommentActions(container) {
    // Edit comment trigger
    container.querySelectorAll('.edit-comment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const bodyEl = container.querySelector(`#comment-body-${id}`);
        const editBox = container.querySelector(`#comment-edit-box-${id}`);
        if (bodyEl && editBox) {
          bodyEl.style.display = 'none';
          editBox.style.display = 'block';
        }
      });
    });

    // Cancel edit
    container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const bodyEl = container.querySelector(`#comment-body-${id}`);
        const editBox = container.querySelector(`#comment-edit-box-${id}`);
        if (bodyEl && editBox) {
          bodyEl.style.display = 'block';
          editBox.style.display = 'none';
        }
      });
    });

    // Save edit
    container.querySelectorAll('.save-edit-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const textarea = container.querySelector(`#comment-edit-text-${id}`);
        const newContent = textarea ? textarea.value.trim() : '';

        if (!newContent) {
          Toast.error('Comment content cannot be empty.');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
          const res = await api.comments.update(id, newContent);
          if (res.success) {
            Toast.success('Comment updated!');
            await this.loadComments();
          }
        } catch (err) {
          Toast.error(err.message || 'Failed to update comment.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Save Changes';
        }
      });
    });

    // Delete comment
    container.querySelectorAll('.delete-comment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        Modal.confirm({
          title: 'Delete Comment',
          message: 'Are you sure you want to delete this comment? This action cannot be reversed.',
          confirmText: 'Delete Comment',
          onConfirm: async () => {
            try {
              const res = await api.comments.delete(id);
              if (res.success) {
                Toast.success('Comment removed.');
                await this.loadComments();
              }
            } catch (err) {
              Toast.error(err.message || 'Failed to delete comment.');
            }
          }
        });
      });
    });
  }
};
