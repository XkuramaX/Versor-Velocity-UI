const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const workflowApi = {
  async createWorkflow(workflowId, name, creatorId, creatorUsername) {
    const response = await fetch(`${API_URL}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_id: workflowId, name, creator_id: creatorId, creator_username: creatorUsername })
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
  },

  async getUserWorkflows(userId) {
    const response = await fetch(`${API_URL}/workflows?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch workflows');
    return response.json();
  },

  async updateWorkflow(workflowId, data) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update workflow');
    return response.json();
  },

  async deleteWorkflow(workflowId, userId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}?user_id=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete workflow');
    return response.json();
  },

  async addPermission(workflowId, userId, username, permissionLevel) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, username, permission_level: permissionLevel })
    });
    if (!response.ok) throw new Error('Failed to add permission');
    return response.json();
  },

  async getPermissions(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions`);
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return response.json();
  },

  async removePermission(workflowId, userId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/permissions/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove permission');
    return response.json();
  },

  async checkAccess(workflowId, userId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/access?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to check access');
    return response.json();
  },

  async transferOwnership(workflowId, newOwnerId, newOwnerUsername, currentOwnerId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_owner_id: newOwnerId, new_owner_username: newOwnerUsername, current_owner_id: currentOwnerId })
    });
    if (!response.ok) throw new Error('Failed to transfer ownership');
    return response.json();
  },

  async saveFile(workflowId, nodeId, backendNodeId, filename, savedBy, rows, columns) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, backend_node_id: backendNodeId, filename, saved_by: savedBy, rows, columns })
    });
    if (!response.ok) throw new Error('Failed to save file');
    return response.json();
  },

  async getFileHistory(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/files`);
    if (!response.ok) throw new Error('Failed to fetch file history');
    return response.json();
  },

  async downloadFile(fileId) {
    const response = await fetch(`${API_URL}/workflows/files/${fileId}/download`);
    if (!response.ok) throw new Error('Failed to download file');
    return response.blob();
  },

  async markRun(workflowId, status) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update run status');
    return response.json();
  },

  async saveVersion(workflowId, workflowData, createdBy, comment = '') {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_data: workflowData, created_by: createdBy, comment })
    });
    if (!response.ok) throw new Error('Failed to save version');
    return response.json();
  },

  async getVersions(workflowId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions`);
    if (!response.ok) throw new Error('Failed to fetch versions');
    return response.json();
  },

  async downloadVersion(workflowId, versionId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions/${versionId}/download`);
    if (!response.ok) throw new Error('Failed to download version');
    return response.blob();
  },

  async createRun(workflowId, versionId, runBy, status, savedNodes = []) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_id: versionId, run_by: runBy, status, saved_nodes: JSON.stringify(savedNodes) })
    });
    if (!response.ok) throw new Error('Failed to record run');
    return response.json();
  },

  async getVersionRuns(workflowId, versionId) {
    const response = await fetch(`${API_URL}/workflows/${workflowId}/versions/${versionId}/runs`);
    if (!response.ok) throw new Error('Failed to fetch runs');
    return response.json();
  }
};
