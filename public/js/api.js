const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('vibenet_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('vibenet_token', token);
    } else {
      localStorage.removeItem('vibenet_token');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // --- Auth Endpoints ---
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setToken(data.token);
    return data.user;
  }

  async register(username, displayName, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, displayName, password })
    });
    this.setToken(data.token);
    return data.user;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentUser() {
    if (!this.token) return null;
    try {
      return await this.request('/auth/me');
    } catch (err) {
      // If token is invalid, clear it
      this.setToken(null);
      return null;
    }
  }

  // --- Posts Endpoints ---
  async getPosts(feedType = 'all') {
    return await this.request(`/posts?feed=${feedType}`);
  }

  async createPost(content, mediaUrl = '') {
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, mediaUrl })
    });
  }

  async deletePost(postId) {
    return await this.request(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }

  async toggleLike(postId) {
    return await this.request(`/posts/${postId}/like`, {
      method: 'POST'
    });
  }

  // --- Comments Endpoints ---
  async getComments(postId) {
    return await this.request(`/posts/${postId}/comments`);
  }

  async addComment(postId, content) {
    return await this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // --- User & Profile Endpoints ---
  async getUserProfile(username) {
    return await this.request(`/users/profile/${username}`);
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async toggleFollow(userId) {
    return await this.request(`/users/${userId}/follow`, {
      method: 'POST'
    });
  }

  // --- Explore Endpoints ---
  async getExploreData() {
    return await this.request('/explore');
  }
}

const api = new ApiClient();
window.api = api; // Expose globally for app.js
