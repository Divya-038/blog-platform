/**
 * Auth Views (Login & Register)
 */

const AuthView = {
  renderLogin(container) {
    if (auth.isAuthenticated()) {
      router.navigate('/blog');
      return;
    }

    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-card-header">
            <h1 class="auth-card-title">Welcome Back</h1>
            <p class="auth-card-subtitle">Sign in to your account to write, comment, and engage.</p>
          </div>

          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-identifier">Email or Username</label>
              <input type="text" id="login-identifier" class="form-input" placeholder="e.g., alex@example.com" required autocomplete="username" />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password" />
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              Sign In
            </button>
          </form>

          <!-- Quick Demo Logins for Instant Testing -->
          <div class="demo-logins-box">
            <div class="demo-logins-title">⚡ Quick 1-Click Demo Logins</div>
            <div class="demo-buttons-row">
              <button class="demo-btn" data-email="alex@example.com" data-pass="password123">
                <span><strong>Alex Turner</strong> (Backend Dev)</span>
                <span style="font-size: 0.75rem;">1-Click</span>
              </button>
              <button class="demo-btn" data-email="sophia@example.com" data-pass="password123">
                <span><strong>Sophia Chen</strong> (UI/UX Lead)</span>
                <span style="font-size: 0.75rem;">1-Click</span>
              </button>
              <button class="demo-btn" data-email="marcus@example.com" data-pass="password123">
                <span><strong>Marcus Vance</strong> (AI Architect)</span>
                <span style="font-size: 0.75rem;">1-Click</span>
              </button>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 0.9rem; color: var(--text-secondary);">
            Don't have an account? <a href="/register" class="nav-navigate" style="color: var(--primary); font-weight: 700;">Sign up</a>
          </div>
        </div>
      </div>
    `;

    this.bindLoginEvents(container);
  },

  bindLoginEvents(container) {
    const form = container.querySelector('#login-form');
    const submitBtn = container.querySelector('#login-submit-btn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = container.querySelector('#login-identifier').value.trim();
      const password = container.querySelector('#login-password').value;

      if (!identifier || !password) {
        Toast.error('Please enter both identifier and password.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await auth.login(identifier, password);
        if (res.success) {
          Toast.success(`Welcome back, ${res.user.name}!`);
          router.navigate('/blog');
        }
      } catch (err) {
        Toast.error(err.message || 'Login failed. Please check credentials.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });

    // 1-Click Demo Buttons
    container.querySelectorAll('.demo-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const email = btn.getAttribute('data-email');
        const pass = btn.getAttribute('data-pass');
        container.querySelector('#login-identifier').value = email;
        container.querySelector('#login-password').value = pass;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        try {
          const res = await auth.login(email, pass);
          if (res.success) {
            Toast.success(`Welcome back, ${res.user.name}!`);
            router.navigate('/blog');
          }
        } catch (err) {
          Toast.error(err.message || 'Demo login failed.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }
      });
    });
  },

  renderRegister(container) {
    if (auth.isAuthenticated()) {
      router.navigate('/blog');
      return;
    }

    container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-card-header">
            <h1 class="auth-card-title">Create Account</h1>
            <p class="auth-card-subtitle">Join the developer community and publish your stories.</p>
          </div>

          <form id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name *</label>
              <input type="text" id="reg-name" class="form-input" placeholder="e.g., Jane Doe" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-username">Username *</label>
              <input type="text" id="reg-username" class="form-input" placeholder="e.g., janedoe" required autocomplete="username" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address *</label>
              <input type="email" id="reg-email" class="form-input" placeholder="e.g., jane@example.com" required autocomplete="email" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">Password (Min 6 chars) *</label>
              <input type="password" id="reg-password" class="form-input" placeholder="Create a strong password" required minlength="6" autocomplete="new-password" />
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-bio">Short Bio (Optional)</label>
              <input type="text" id="reg-bio" class="form-input" placeholder="What topics do you love writing about?" />
            </div>

            <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              Create Free Account
            </button>
          </form>

          <div style="text-align: center; margin-top: 24px; font-size: 0.9rem; color: var(--text-secondary);">
            Already have an account? <a href="/login" class="nav-navigate" style="color: var(--primary); font-weight: 700;">Sign in</a>
          </div>
        </div>
      </div>
    `;

    this.bindRegisterEvents(container);
  },

  bindRegisterEvents(container) {
    const form = container.querySelector('#register-form');
    const submitBtn = container.querySelector('#reg-submit-btn');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = container.querySelector('#reg-name').value.trim();
      const username = container.querySelector('#reg-username').value.trim();
      const email = container.querySelector('#reg-email').value.trim();
      const password = container.querySelector('#reg-password').value;
      const bio = container.querySelector('#reg-bio').value.trim();

      if (!name || !username || !email || !password) {
        Toast.error('Please fill in all required fields.');
        return;
      }

      if (password.length < 6) {
        Toast.error('Password must be at least 6 characters long.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const res = await auth.register({ name, username, email, password, bio });
        if (res.success) {
          Toast.success(`Welcome to BlogSphere, ${res.user.name}!`);
          router.navigate('/blog');
        }
      } catch (err) {
        Toast.error(err.message || 'Registration failed.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Free Account';
      }
    });
  }
};
