/**
 * Create / Edit Post Editor View
 */

const EditorView = {
  isEditMode: false,
  postId: null,

  presetCovers: [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
  ],

  async render(container, postId = null) {
    if (!auth.isAuthenticated()) {
      Toast.info('You must be logged in to create or edit articles.');
      router.navigate('/login');
      return;
    }

    this.isEditMode = !!postId;
    this.postId = postId;

    let initialData = {
      title: '',
      category: 'Development',
      tags: '',
      cover_image: this.presetCovers[0],
      summary: '',
      content: ''
    };

    if (this.isEditMode) {
      container.innerHTML = `
        <div class="editor-container" style="text-align: center; padding: 60px 0; color: var(--text-muted);">
          <p>Loading article data for editing...</p>
        </div>
      `;

      try {
        const res = await api.posts.getBySlugOrId(postId);
        if (!res.success || !res.data) throw new Error('Article not found');
        
        const currentUser = auth.getUser();
        if (res.data.author_id !== currentUser.id && currentUser.role !== 'admin') {
          Toast.error('You do not have permission to edit this article.');
          router.navigate('/blog');
          return;
        }

        initialData = res.data;
      } catch (err) {
        Toast.error(err.message || 'Could not load article for editing.');
        router.navigate('/blog');
        return;
      }
    }

    const presetThumbsHtml = this.presetCovers.map((url, idx) => `
      <img src="${url}" class="cover-preset-thumb ${initialData.cover_image === url ? 'selected' : ''}" data-url="${url}" alt="Preset ${idx + 1}" />
    `).join('');

    container.innerHTML = `
      <div class="editor-container">
        <div class="editor-card">
          <div class="editor-header">
            <div>
              <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 4px;">
                ${this.isEditMode ? 'Edit Article' : 'Write a New Story'}
              </h1>
              <p style="color: var(--text-muted); font-size: 0.9rem;">
                Craft your technical insights with clean markdown and live formatting preview.
              </p>
            </div>
            <a href="${this.isEditMode ? `/post/${this.postId}` : '/blog'}" class="nav-navigate btn btn-ghost btn-sm">Cancel</a>
          </div>

          <form id="editor-form">
            <!-- Title -->
            <div class="form-group">
              <label class="form-label" for="post-title">Article Title *</label>
              <input type="text" id="post-title" class="form-input" style="font-size: 1.15rem; font-weight: 700;" placeholder="e.g., Designing Resilient Distributed Systems with Micro-Frontends" value="${escapeHtml(initialData.title)}" required />
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
              <!-- Category -->
              <div class="form-group">
                <label class="form-label" for="post-category">Category *</label>
                <select id="post-category" class="form-select">
                  <option value="Development" ${initialData.category === 'Development' ? 'selected' : ''}>Development</option>
                  <option value="Design" ${initialData.category === 'Design' ? 'selected' : ''}>Design</option>
                  <option value="Artificial Intelligence" ${initialData.category === 'Artificial Intelligence' ? 'selected' : ''}>Artificial Intelligence</option>
                  <option value="Backend" ${initialData.category === 'Backend' ? 'selected' : ''}>Backend</option>
                  <option value="Productivity" ${initialData.category === 'Productivity' ? 'selected' : ''}>Productivity</option>
                  <option value="General" ${initialData.category === 'General' ? 'selected' : ''}>General</option>
                </select>
              </div>

              <!-- Tags -->
              <div class="form-group">
                <label class="form-label" for="post-tags">Tags (Comma-separated)</label>
                <input type="text" id="post-tags" class="form-input" placeholder="e.g., JavaScript, React, Architecture" value="${escapeHtml(initialData.tags || '')}" />
              </div>
            </div>

            <!-- Cover Image URL -->
            <div class="form-group">
              <label class="form-label" for="post-cover">Cover Image URL</label>
              <input type="url" id="post-cover" class="form-input" placeholder="Paste an image URL or choose a preset below" value="${escapeHtml(initialData.cover_image || '')}" />
              
              <div style="margin-top: 10px;">
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Or pick a curated wallpaper:</span>
                <div class="cover-presets" id="cover-presets-row">
                  ${presetThumbsHtml}
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div class="form-group">
              <label class="form-label" for="post-summary">Short Summary / Subtitle (Optional)</label>
              <input type="text" id="post-summary" class="form-input" placeholder="A compelling 1-2 sentence hook for cards and previews..." value="${escapeHtml(initialData.summary || '')}" />
            </div>

            <!-- Content Area with Tabs & Markdown Toolbar -->
            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="form-label" style="margin-bottom: 0;">Article Content (Markdown Supported) *</label>
                <div class="editor-tabs">
                  <button type="button" class="editor-tab-btn active" id="tab-write">Write</button>
                  <button type="button" class="editor-tab-btn" id="tab-preview">Preview</button>
                </div>
              </div>

              <!-- Toolbar -->
              <div class="markdown-toolbar" id="md-toolbar">
                <button type="button" class="toolbar-btn" data-tag="bold" title="Bold"><strong>B</strong></button>
                <button type="button" class="toolbar-btn" data-tag="italic" title="Italic"><em>I</em></button>
                <button type="button" class="toolbar-btn" data-tag="h2" title="Header 2">H2</button>
                <button type="button" class="toolbar-btn" data-tag="h3" title="Header 3">H3</button>
                <button type="button" class="toolbar-btn" data-tag="quote" title="Quote">&ldquo; Quote</button>
                <button type="button" class="toolbar-btn" data-tag="code" title="Inline Code">&lt;/&gt;</button>
                <button type="button" class="toolbar-btn" data-tag="codeblock" title="Code Block">{ Code }</button>
                <button type="button" class="toolbar-btn" data-tag="link" title="Insert Link">🔗 Link</button>
                <button type="button" class="toolbar-btn" data-tag="list" title="Bullet List">• List</button>
              </div>

              <!-- Textarea & Preview -->
              <textarea id="post-content-input" class="editor-textarea" placeholder="Write your full story here in Markdown...&#10;&#10;### Introduction&#10;Start sharing your insights..." required>${escapeHtml(initialData.content || '')}</textarea>
              <div id="post-preview-pane" class="preview-pane post-content"></div>
            </div>

            <!-- Submit Button -->
            <div style="display: flex; justify-content: flex-end; gap: 14px; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <a href="${this.isEditMode ? `/post/${this.postId}` : '/blog'}" class="nav-navigate btn btn-secondary">Discard</a>
              <button type="submit" id="save-post-btn" class="btn btn-primary btn-lg">
                ${this.isEditMode ? 'Save & Update Article' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEditorEvents(container);
  },

  bindEditorEvents(container) {
    const form = container.querySelector('#editor-form');
    const textarea = container.querySelector('#post-content-input');
    const previewPane = container.querySelector('#post-preview-pane');
    const tabWrite = container.querySelector('#tab-write');
    const tabPreview = container.querySelector('#tab-preview');
    const coverInput = container.querySelector('#post-cover');
    const saveBtn = container.querySelector('#save-post-btn');

    // Preset selection
    container.querySelectorAll('.cover-preset-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        container.querySelectorAll('.cover-preset-thumb').forEach(t => t.classList.remove('selected'));
        thumb.classList.add('selected');
        const url = thumb.getAttribute('data-url');
        if (coverInput) coverInput.value = url;
      });
    });

    // Tab switcher
    tabWrite?.addEventListener('click', () => {
      tabWrite.classList.add('active');
      tabPreview.classList.remove('active');
      textarea.style.display = 'block';
      previewPane.classList.remove('show');
    });

    tabPreview?.addEventListener('click', () => {
      tabPreview.classList.add('active');
      tabWrite.classList.remove('active');
      textarea.style.display = 'none';
      previewPane.classList.add('show');
      previewPane.innerHTML = parseMarkdown(textarea.value || '*Nothing to preview yet. Start typing!*');
    });

    // Markdown Toolbar actions
    container.querySelectorAll('#md-toolbar .toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-tag');
        this.insertMarkdown(textarea, action);
      });
    });

    // Form Submission
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = container.querySelector('#post-title').value.trim();
      const category = container.querySelector('#post-category').value;
      const tags = container.querySelector('#post-tags').value.trim();
      const cover_image = coverInput.value.trim();
      const summary = container.querySelector('#post-summary').value.trim();
      const content = textarea.value.trim();

      if (!title) {
        Toast.error('Please enter an article title.');
        return;
      }
      if (!content) {
        Toast.error('Please write some content for your article.');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = this.isEditMode ? 'Saving changes...' : 'Publishing...';

      try {
        const payload = { title, category, tags, cover_image, summary, content };
        let res;

        if (this.isEditMode) {
          res = await api.posts.update(this.postId, payload);
          if (res.success) {
            Toast.success('Article updated successfully!');
            router.navigate(`/post/${res.data.slug || this.postId}`);
          }
        } else {
          res = await api.posts.create(payload);
          if (res.success) {
            Toast.success('Article published successfully!');
            router.navigate(`/post/${res.data.slug || res.data.id}`);
          }
        }
      } catch (err) {
        Toast.error(err.message || 'Failed to save article.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = this.isEditMode ? 'Save & Update Article' : 'Publish Article';
      }
    });
  },

  insertMarkdown(textarea, action) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = 1;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Heading 2'}\n`;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Heading 3'}\n`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Quote text'}\n`;
        break;
      case 'code':
        replacement = `\`${selected || 'code'}\``;
        cursorOffset = 1;
        break;
      case 'codeblock':
        replacement = `\n\`\`\`javascript\n${selected || '// Write your code here'}\n\`\`\`\n`;
        break;
      case 'link':
        replacement = `[${selected || 'link text'}](https://example.com)`;
        break;
      case 'list':
        replacement = `\n- ${selected || 'List item'}\n`;
        break;
    }

    textarea.value = text.substring(0, start) + replacement + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + replacement.length, start + replacement.length);
  }
};
