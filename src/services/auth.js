const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:8001';

const _headers = (json = true) => {
  const h = {};
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const _errMsg = (e) => {
  if (typeof e.detail === 'string') return e.detail;
  if (Array.isArray(e.detail)) return e.detail.map(d => d.msg || JSON.stringify(d)).join('; ');
  return e.detail ? JSON.stringify(e.detail) : 'Request failed';
};

const _post = async (path, body) => {
  const r = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    method: 'POST', headers: _headers(), body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(_errMsg(e)); }
  return r.json();
};

const _put = async (path, body) => {
  const r = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    method: 'PUT', headers: _headers(), body: JSON.stringify(body),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(_errMsg(e)); }
  return r.json();
};

const _get = async (path) => {
  const r = await fetch(`${AUTH_SERVICE_URL}${path}`, { headers: _headers(false) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(_errMsg(e)); }
  return r.json();
};

const _del = async (path) => {
  const r = await fetch(`${AUTH_SERVICE_URL}${path}`, { method: 'DELETE', headers: _headers(false) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(_errMsg(e)); }
  return r.json();
};

export const authService = {
  // ── Auth ────────────────────────────────────────────────────────────────
  async login(username, password, totpCode = null) {
    const body = { username, password };
    if (totpCode) body.totp_code = totpCode;
    const data = await _post('/login', body);

    if (data.requires_2fa) {
      // Store temp token for 2FA step 2
      return { requires_2fa: true, temp_token: data.access_token };
    }

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async login2FA(tempToken, code) {
    const data = await _post('/login/2fa', { temp_token: tempToken, code });
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async signup(userData) {
    const data = await _post('/signup', userData);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  async verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const user = await _get('/verify');
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch {
      this.logout();
      return null;
    }
  },

  // ── Profile ─────────────────────────────────────────────────────────────
  async updateProfile(updates) {
    const data = await _put('/profile', updates);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  async changePassword(currentPassword, newPassword, confirmPassword, totpCode = null) {
    return _put('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
      totp_code: totpCode,
    });
  },

  // ── 2FA ──────────────────────────────────────────────────────────────────
  async setup2FA() {
    return _post('/2fa/setup', {});
  },

  async verify2FA(code) {
    return _post('/2fa/verify', { code });
  },

  async disable2FA(code) {
    return _post('/2fa/disable', { code });
  },

  async regenerateBackupCodes(code) {
    return _post('/2fa/backup-codes', { code });
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  async adminListUsers() {
    return _get('/admin/users');
  },

  async adminSetRole(userId, platformRole) {
    return _put(`/admin/users/${userId}/role`, { platform_role: platformRole });
  },

  async adminSuspendUser(userId) {
    return _put(`/admin/users/${userId}/suspend`, {});
  },

  async adminDeleteUser(userId) {
    return _del(`/admin/users/${userId}`);
  },

  async adminReset2FA(userId) {
    return _post(`/admin/users/${userId}/reset-2fa`, {});
  },

  async adminAuditLog(page = 1, perPage = 50, action = '', userId = '') {
    let url = `/admin/audit-log?page=${page}&per_page=${perPage}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    if (userId) url += `&user_id=${userId}`;
    return _get(url);
  },

  async adminListOrgs() {
    return _get('/admin/orgs');
  },

  async adminUpdateOrg(orgId, updates) {
    return _put(`/orgs/${orgId}`, updates);
  },

  // ── Existing ─────────────────────────────────────────────────────────────
  async searchUsers(query) {
    return _get(`/users/search?query=${encodeURIComponent(query)}`);
  },

  async verifyEmail(token) { return _post(`/verify-email?token=${token}`, {}); },
  async requestPasswordReset(username, email) { return _post('/request-password-reset', { username, email }); },
  async resetPassword(token, newPassword, confirmPassword) {
    return _post('/reset-password', { token, new_password: newPassword, confirm_password: confirmPassword });
  },
  async resendVerification(email) {
    const r = await fetch(`${AUTH_SERVICE_URL}/resend-verification?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
    if (!r.ok) throw new Error('Failed to resend');
    return r.json();
  },

    // ── Organizations ──────────────────────────────────────────────────────
  async createOrg(name) { return _post('/orgs', { name }); },
  async getOrg(orgId) { return _get(`/orgs/${orgId}`); },
  async updateOrg(orgId, updates) { return _put(`/orgs/${orgId}`, updates); },
  async deleteOrg(orgId) { return _del(`/orgs/${orgId}`); },
  async adminCreateUser(data) { return _post('/admin/users/create', data); },
  async getOrgMembers(orgId) { return _get(`/orgs/${orgId}/members`); },
  async updateOrgMember(orgId, userId, role) { return _put(`/orgs/${orgId}/members/${userId}`, { role }); },
  async removeOrgMember(orgId, userId) { return _del(`/orgs/${orgId}/members/${userId}`); },
  async transferOrg(orgId, newAdminId) { return _post(`/orgs/${orgId}/transfer`, { new_admin_id: newAdminId }); },

// ── Local state ──────────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getToken() { return localStorage.getItem('token'); },
  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  isSuperAdmin() { return this.getUser()?.platform_role === 'super_admin'; },
  isAdmin() { return ['super_admin', 'admin'].includes(this.getUser()?.platform_role); },
  hasPermission(p) { return this.getUser()?.permissions?.includes(p) || false; },
};
