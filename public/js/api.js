/**
 * BlogSphere REST API Client
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('blog_auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('blog_auth_token', token);
    } else {
      localStorage.removeItem('blog_auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('blog_auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${url}:`, err);
      throw err;
    }
  }

  // Auth Endpoints
  auth = {
    login: (credentials) => this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => this.request('/auth/me'),
    logout: () => this.request('/auth/logout', { method: 'POST' })
  };

  // Posts Endpoints
  posts = {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.tag) query.append('tag', params.tag);
      if (params.author) query.append('author', params.author);
      if (params.sort) query.append('sort', params.sort);
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);

      const qs = query.toString();
      return this.request(`/posts${qs ? '?' + qs : ''}`);
    },
    getBySlugOrId: (idOrSlug) => this.request(`/posts/${encodeURIComponent(idOrSlug)}`),
    getCategories: () => this.request('/posts/categories'),
    create: (data) => this.request('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => this.request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => this.request(`/posts/${id}`, { method: 'DELETE' }),
    toggleLike: (id) => this.request(`/posts/${id}/like`, { method: 'POST' })
  };

  // Comments Endpoints
  comments = {
    getByPost: (postId) => this.request(`/comments/post/${postId}`),
    create: (postId, content) => this.request(`/comments/post/${postId}`, { method: 'POST', body: JSON.stringify({ content }) }),
    update: (id, content) => this.request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    delete: (id) => this.request(`/comments/${id}`, { method: 'DELETE' })
  };

  // User & Profile Endpoints
  users = {
    getProfile: (identifier) => this.request(`/users/${encodeURIComponent(identifier)}`),
    updateProfile: (profileData) => this.request('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    getUserPosts: (identifier) => this.request(`/users/${encodeURIComponent(identifier)}/posts`)
  };
}

const api = new ApiClient();
