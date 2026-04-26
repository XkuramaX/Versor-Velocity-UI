const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const _authHeaders = (json = true) => {
  const h = {};
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

export const workflowApi = {
  // ── Workflow CRUD ─────────────────────────────────────────────────────────
  // NOTE: Backend derives creator identity from JWT. No user_id/creator_id needed.

  async createWorkflow(workflowId, name) {
    const response = await fetch(`${API_URL}/workflows`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ workflow_id: workflowId, name })
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
  },

  async getUserWorkflows() {
    const response = await fetch(`${API_URL}/workflows`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return response.json();
  },

  async updateWorkflow(workflowId, data) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}`, {
      method: 'PUT',
      headers: _authHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update workflow');
    return response.json();
  },

  async deleteWorkflow(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}`, {
      method: 'DELETE', headers: _authHeaders(false)
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
    return response.json();
  },

  // ── Permissions ───────────────────────────────────────────────────────────

  async addPermission(workflowId, userId, username, permissionLevel) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ user_id: userId, username, permission_level: permissionLevel })
    });
    if (!response.ok) throw new Error('Failed to add permission');
    return response.json();
  },

  async getPermissions(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return response.json();
  },

  async removePermission(workflowId, userId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions/${userId}`, {
      method: 'DELETE', headers: _authHeaders(false)
    });
    if (!response.ok) throw new Error('Failed to remove permission');
    return response.json();
  },

  async checkAccess(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/access`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to check access');
    return response.json();
  },

  async transferOwnership(workflowId, newOwnerId, newOwnerUsername) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/transfer`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ new_owner_id: newOwnerId, new_owner_username: newOwnerUsername })
    });
    if (!response.ok) throw new Error('Failed to transfer ownership');
    return response.json();
  },

  // ── Files ─────────────────────────────────────────────────────────────────

  async saveFile(workflowId, nodeId, backendNodeId, filename, rows, columns) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/files`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ node_id: nodeId, backend_node_id: backendNodeId, filename, rows, columns })
    });
    if (!response.ok) throw new Error('Failed to save file');
    return response.json();
  },

  async getFileHistory(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/files`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to fetch file history');
    return response.json();
  },

  async downloadFile(fileId) {
    const response = await fetch(`${API_URL}/workflows/files/${fileId}/download`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to download file');
    return response.blob();
  },

  // ── Runs & Versions ───────────────────────────────────────────────────────

  async markRun(workflowId, status) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update run status');
    return response.json();
  },

  async saveVersion(workflowId, workflowData, comment = '') {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ workflow_data: workflowData, comment })
    });
    if (!response.ok) throw new Error('Failed to save version');
    return response.json();
  },

  async getVersions(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to fetch versions');
    return response.json();
  },

  async downloadVersion(workflowId, versionId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions/${versionId}/download`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to download version');
    return response.blob();
  },

  async createRun(workflowId, versionId, status, savedNodes = []) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/runs`, {
      method: 'POST',
      headers: _authHeaders(),
      body: JSON.stringify({ version_id: versionId, status, saved_nodes: JSON.stringify(savedNodes) })
    });
    if (!response.ok) throw new Error('Failed to record run');
    return response.json();
  },

  async getVersionRuns(workflowId, versionId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions/${versionId}/runs`, { headers: _authHeaders(false) });
    if (!response.ok) throw new Error('Failed to fetch runs');
    return response.json();
  }
};
