/**
 * BlogSphere Authentication State Manager
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.initialized = false;
  }

  async init() {
    const token = api.getToken();
    if (token) {
      try {
        const response = await api.auth.getMe();
        if (response.success && response.user) {
          this.user = response.user;
        } else {
          this.logout();
        }
      } catch (err) {
        console.warn('Stored token was invalid or expired. Resetting session.');
        this.logout();
      }
    }
    this.initialized = true;
    this.notifyAuthChanged();
    return this.user;
  }

  getUser() {
    return this.user;
  }

  setUser(user) {
    this.user = user;
    this.notifyAuthChanged();
  }

  isAuthenticated() {
    return !!this.user;
  }

  async login(identifier, password) {
    const response = await api.auth.login({ identifier, password });
    if (response.success && response.token) {
      api.setToken(response.token);
      this.user = response.user;
      this.notifyAuthChanged();
    }
    return response;
  }

  async register(userData) {
    const response = await api.auth.register(userData);
    if (response.success && response.token) {
      api.setToken(response.token);
      this.user = response.user;
      this.notifyAuthChanged();
    }
    return response;
  }

  logout() {
    api.setToken(null);
    this.user = null;
    this.notifyAuthChanged();
  }

  notifyAuthChanged() {
    window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: this.user } }));
  }
}

const auth = new AuthManager();
