const API_URL = 'http://localhost:8000';

class AsyncApiService {
  constructor() {
    this.useAsync = true; // Toggle for async mode
  }

  // Submit async task
  async submitTask(endpoint, data, method = 'POST') {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_URL}/async${endpoint}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Task submission failed');
    }
    return response.json();
  }

  // Poll task status
  async getTaskStatus(taskId) {
    const response = await fetch(`${API_URL}/async/task/${taskId}`);
    if (!response.ok) throw new Error('Failed to get task status');
    return response.json();
  }

  // Cancel task
  async cancelTask(taskId) {
    const response = await fetch(`${API_URL}/async/task/${taskId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to cancel task');
    return response.json();
  }

  // Poll until complete with progress callback
  async waitForTask(taskId, onProgress) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getTaskStatus(taskId);
          
          if (onProgress) onProgress(status);
          
          if (status.status === 'completed') {
            resolve(status.result);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'Task failed'));
          } else {
            setTimeout(poll, 1000); // Poll every second
          }
        } catch (error) {
          reject(error);
        }
      };
      poll();
    });
  }

  // Async operations
  async uploadCSV(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/async/upload_csv`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    const { task_id } = await response.json();
    return this.waitForTask(task_id, onProgress);
  }

  async filterNode(parentId, column, operator, value, onProgress) {
    const { task_id } = await this.submitTask(`/filter?parent_id=${parentId}`, {
      column, operator, value
    });
    return this.waitForTask(task_id, onProgress);
  }

  async selectColumns(parentId, columns, onProgress) {
    const { task_id } = await this.submitTask(
      `/transform/select_columns?parent_id=${parentId}`,
      { columns }
    );
    return this.waitForTask(task_id, onProgress);
  }

  async dropColumns(parentId, columns, onProgress) {
    const { task_id } = await this.submitTask(
      `/transform/drop_columns?parent_id=${parentId}`,
      { columns }
    );
    return this.waitForTask(task_id, onProgress);
  }

  async sortData(parentId, by, descending, onProgress) {
    const { task_id } = await this.submitTask(
      `/transform/sort_data?parent_id=${parentId}`,
      { by, descending }
    );
    return this.waitForTask(task_id, onProgress);
  }

  async joinNodes(leftId, rightId, on, how, onProgress) {
    const { task_id } = await this.submitTask(`/join?left_id=${leftId}&right_id=${rightId}`, {
      on, how
    });
    return this.waitForTask(task_id, onProgress);
  }

  async groupBy(parentId, groupCols, aggs, onProgress) {
    const { task_id } = await this.submitTask(`/groupby?parent_id=${parentId}`, {
      group_cols: groupCols,
      aggs
    });
    return this.waitForTask(task_id, onProgress);
  }

  async transformNode(operation, parentId, params, onProgress) {
    const { task_id } = await this.submitTask(`/transform/${operation}?parent_id=${parentId}`, params);
    return this.waitForTask(task_id, onProgress);
  }
}

export const asyncApi = new AsyncApiService();
