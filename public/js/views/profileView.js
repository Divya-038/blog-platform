/**
 * User Profile View
 */

const ProfileView = {
  currentProfileUser: null,

  async render(container, identifier = null) {
    const currentUser = auth.getUser();
    const targetUserIdentifier = identifier || (currentUser ? currentUser.username : null);

    if (!targetUserIdentifier) {
      Toast.info('Please log in to view your profile.');
      router.navigate('/login');
      return;
    }

    container.innerHTML = `
      <div class="profile-container" style="text-align: center; padding: 60px 0; color: var(--text-muted);">
        <p>Loading profile details...</p>
      </div>
    `;

    try {
      const response = await api.users.getProfile(targetUserIdentifier);
      if (!response.success || !response.data) throw new Error('User not found');

      this.currentProfileUser = response.data;
      const postsRes = await api.users.getUserPosts(targetUserIdentifier);
      const userPosts = postsRes.success ? (postsRes.data || []) : [];

      this.renderProfileContent(container, userPosts);
    } catch (err) {
      container.innerHTML = `
        <div class="profile-container" style="text-align: center; padding: 80px 20px;">
          <h2 style="font-size: 2rem; color: var(--danger); margin-bottom: 12px;">User Profile Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 24px;">The user profile you are looking for does not exist.</p>
          <a href="/blog" class="nav-navigate btn btn-secondary">Explore Articles</a>
        </div>
      `;
    }
  },

  renderProfileContent(container, posts) {
    const u = this.currentProfileUser;
    const isOwner = u.is_owner;

    const postsHtml = posts.length === 0 ? `
      <div style="text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color); color: var(--text-muted);">
        <p>No articles published yet.</p>
        ${isOwner ? `<a href="/create-post" class="nav-navigate btn btn-primary btn-sm" style="margin-top: 14px;">Write Your First Story</a>` : ''}
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${posts.map(p => `
          <div class="post-card" style="flex-direction: row; align-items: center; padding: 20px; gap: 20px; flex-wrap: wrap;">
            <img src="${escapeHtml(p.cover_image)}" alt="${escapeHtml(p.title)}" style="width: 140px; height: 95px; object-fit: cover; border-radius: var(--radius-sm);" />
            
            <div style="flex: 1; min-width: 240px;">
              <span class="tag-badge" style="margin-bottom: 6px; display: inline-block;">${escapeHtml(p.category || 'General')}</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">
                <a href="/post/${escapeHtml(p.slug)}" class="nav-navigate">${escapeHtml(p.title)}</a>
              </h3>
              <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 12px; align-items: center;">
                <span>${formatDate(p.created_at)}</span>
                <span>•</span>
                <span>${p.read_time || 3} min read</span>
                <span>•</span>
                <span>${p.likes_count || 0} likes</span>
                <span>•</span>
                <span>${p.comments_count || 0} comments</span>
              </div>
            </div>

            <div style="display: flex; gap: 8px;">
              <a href="/post/${escapeHtml(p.slug)}" class="nav-navigate btn btn-secondary btn-sm">Read</a>
              ${isOwner ? `
                <a href="/edit-post/${p.id}" class="nav-navigate btn btn-outline btn-sm">Edit</a>
                <button class="btn btn-ghost btn-sm profile-delete-post-btn" data-id="${p.id}" data-title="${escapeHtml(p.title)}" style="color: var(--danger);">Delete</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = `
      <div class="profile-container">
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-banner-bg"></div>

          <div class="profile-header-content">
            <div class="profile-user-left">
              <img src="${escapeHtml(u.avatar_url)}" alt="${escapeHtml(u.name)}" class="profile-avatar-large" />
              <div class="profile-info">
                <h1>${escapeHtml(u.name)}</h1>
                <div class="username-tag">@${escapeHtml(u.username)} • Joined ${formatDate(u.created_at)}</div>
                <p class="profile-bio">${escapeHtml(u.bio || 'Author on BlogSphere.')}</p>
              </div>
            </div>

            ${isOwner ? `
              <button id="open-edit-profile-btn" class="btn btn-secondary btn-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Profile
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="profile-stats-grid">
          <div class="stat-card">
            <div class="stat-number">${u.stats.total_posts || 0}</div>
            <div class="stat-label">Articles Published</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${u.stats.total_likes || 0}</div>
            <div class="stat-label">Total Likes</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${u.stats.total_comments || 0}</div>
            <div class="stat-label">Comments</div>
          </div>
        </div>

        <!-- Authored Posts List -->
        <section style="margin-top: 40px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <h2 style="font-size: 1.5rem; font-weight: 800;">
              ${isOwner ? 'Your Articles' : `Articles by ${escapeHtml(u.name)}`}
            </h2>
            ${isOwner ? `<a href="/create-post" class="nav-navigate btn btn-primary btn-sm">+ New Post</a>` : ''}
          </div>

          ${postsHtml}
        </section>
      </div>
    `;

    this.bindProfileEvents(container);
  },

  bindProfileEvents(container) {
    const isOwner = this.currentProfileUser?.is_owner;

    if (isOwner) {
      // Edit Profile Button & Modal
      container.querySelector('#open-edit-profile-btn')?.addEventListener('click', () => {
        this.openEditProfileModal();
      });

      // Delete Post Buttons
      container.querySelectorAll('.profile-delete-post-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-id');
          const postTitle = btn.getAttribute('data-title');

          Modal.confirm({
            title: 'Delete Article',
            message: `Are you sure you want to delete "${postTitle}"? All associated comments and likes will be permanently removed.`,
            confirmText: 'Delete Article',
            onConfirm: async () => {
              try {
                const res = await api.posts.delete(postId);
                if (res.success) {
                  Toast.success('Article deleted successfully.');
                  await this.render(container, this.currentProfileUser.username);
                }
              } catch (err) {
                Toast.error(err.message || 'Failed to delete post.');
              }
            }
          });
        });
      });
    }
  },

  openEditProfileModal() {
    const u = this.currentProfileUser;
    Modal.init();

    Modal.overlay.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Edit Your Profile</h3>
          <button class="modal-close-btn" onclick="Modal.close()">&times;</button>
        </div>
        <form id="profile-edit-modal-form">
          <div class="form-group">
            <label class="form-label" for="edit-name">Display Name</label>
            <input type="text" id="edit-name" class="form-input" value="${escapeHtml(u.name)}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-bio">Bio</label>
            <textarea id="edit-bio" class="form-input" style="min-height: 80px;">${escapeHtml(u.bio || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-avatar">Avatar Image URL</label>
            <input type="url" id="edit-avatar" class="form-input" value="${escapeHtml(u.avatar_url || '')}" />
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size: 0.95rem; margin-bottom: 12px; color: var(--text-muted);">Change Password (Optional)</h4>
            <div class="form-group">
              <label class="form-label" for="edit-current-pw">Current Password</label>
              <input type="password" id="edit-current-pw" class="form-input" placeholder="Required if updating password" />
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-new-pw">New Password</label>
              <input type="password" id="edit-new-pw" class="form-input" placeholder="Minimum 6 characters" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" onclick="Modal.close()">Cancel</button>
            <button type="submit" id="save-profile-btn" class="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    Modal.overlay.classList.add('show');

    const form = Modal.overlay.querySelector('#profile-edit-modal-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = Modal.overlay.querySelector('#edit-name').value.trim();
      const bio = Modal.overlay.querySelector('#edit-bio').value.trim();
      const avatar_url = Modal.overlay.querySelector('#edit-avatar').value.trim();
      const currentPassword = Modal.overlay.querySelector('#edit-current-pw').value;
      const newPassword = Modal.overlay.querySelector('#edit-new-pw').value;

      const saveBtn = Modal.overlay.querySelector('#save-profile-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const payload = { name, bio, avatar_url };
        if (newPassword) {
          payload.currentPassword = currentPassword;
          payload.newPassword = newPassword;
        }

        const res = await api.users.updateProfile(payload);
        if (res.success) {
          Toast.success('Profile updated successfully!');
          auth.setUser(res.data);
          Modal.close();
          const mainContainer = document.getElementById('main-content');
          if (mainContainer) {
            this.render(mainContainer, res.data.username);
          }
        }
      } catch (err) {
        Toast.error(err.message || 'Failed to update profile.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }
};
