const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:8001';

export const authService = {
  async login(username, password) {
    const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async signup(userData) {
    const response = await fetch(`${AUTH_SERVICE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async verifyEmail(token) {
    const response = await fetch(`${AUTH_SERVICE_URL}/verify-email?token=${token}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Verification failed');
    return response.json();
  },

  async requestPasswordReset(email) {
    const response = await fetch(`${AUTH_SERVICE_URL}/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },

  async resetPassword(token, newPassword, confirmPassword) {
    const response = await fetch(`${AUTH_SERVICE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword, confirm_password: confirmPassword })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Reset failed');
    }
    return response.json();
  },

  async resendVerification(email) {
    const response = await fetch(`${AUTH_SERVICE_URL}/resend-verification?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resend');
    }
    return response.json();
  },

  async verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch(`${AUTH_SERVICE_URL}/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      this.logout();
      return null;
    }
    
    const user = await response.json();
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  hasPermission(permission) {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  },

  isAdmin() {
    return this.hasPermission('admin');
  },

  async searchUsers(query) {
    const token = this.getToken();
    const response = await fetch(`${AUTH_SERVICE_URL}/users/search?query=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  }
};