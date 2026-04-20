import axios from 'axios';

// In Docker: empty string = relative URL, nginx proxies to backend
// In local dev: use localhost:8000 directly
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// --- 1. DATA INGESTION ---
export const uploadCSV = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/nodes/io/upload_csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: onProgress,
  });
  return response.data;
};

export const uploadExcel = async (file, sheetName = 'Sheet1', onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/nodes/io/upload_excel?sheet_name=${sheetName}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: onProgress,
  });
  return response.data;
};

export const getExcelSheets = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/nodes/io/excel_sheets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
};

// --- 2. DATA TRANSFORMATION ---
export const getNodeColumns = async (nodeId) => {
  const response = await api.get(`/nodes/${nodeId}/columns`);
  return response.data;
};

export const getColumnValues = async (nodeId, column) => {
  const response = await api.get(`/nodes/${nodeId}/column_values?column=${encodeURIComponent(column)}`);
  return response.data;
};

export const getColumnInfo = async (nodeId) => {
  const response = await api.get(`/nodes/${nodeId}/column_info`);
  return response.data;
};

export const safeFilterNode = async (parentId, filters, logic = 'and') => {
  const response = await api.post(`/nodes/transform/safe_filter?parent_id=${parentId}`, {
    filters, logic
  });
  return response.data;
};

export const filterNode = async (parentId, column, operator, value) => {
  const response = await api.post(`/nodes/transform/filter?parent_id=${parentId}`, {
    column, operator, value
  });
  return response.data;
};

export const selectColumns = async (parentId, columns) => {
  const response = await api.post(`/nodes/transform/select?parent_id=${parentId}`, columns);
  return response.data;
};

export const dropColumns = async (parentId, columns) => {
  const response = await api.post(`/nodes/transform/drop?parent_id=${parentId}`, columns);
  return response.data;
};

export const sortData = async (parentId, by, descending = false) => {
  const response = await api.post(`/nodes/transform/sort?parent_id=${parentId}`, {
    by, descending
  });
  return response.data;
};

export const renameColumns = async (parentId, mapping) => {
  // FastAPI expects the dict directly as the body (single Body param)
  const response = await api.post(`/nodes/transform/rename?parent_id=${parentId}`, mapping);
  return response.data;
};

// --- 3. STRING OPERATIONS ---
export const changeCase = async (parentId, column, mode, newCol = null) => {
  const response = await api.post(`/nodes/string/case?parent_id=${parentId}`, {
    column, mode, new_col: newCol
  });
  return response.data;
};

export const stringSlice = async (parentId, column, nChars, mode, newCol = null) => {
  const response = await api.post(`/nodes/string/slice?parent_id=${parentId}`, {
    column, n_chars: nChars, mode, new_col: newCol
  });
  return response.data;
};

export const stringMid = async (parentId, column, start, length, newCol = null) => {
  const response = await api.post(`/nodes/string/mid?parent_id=${parentId}`, {
    column, start, length, new_col: newCol
  });
  return response.data;
};

export const concatColumns = async (parentId, columns, separator = ' ', newCol = 'concatenated') => {
  const response = await api.post(`/nodes/string/concat?parent_id=${parentId}`, {
    columns, separator, new_col: newCol
  });
  return response.data;
};

export const addPrefixSuffix = async (parentId, column, prefix = '', suffix = '', newCol = null) => {
  const response = await api.post(`/nodes/string/prefix_suffix?parent_id=${parentId}`, {
    column, prefix, suffix, new_col: newCol
  });
  return response.data;
};

export const cleanString = async (parentId, column) => {
  // Single Body(str) param — send the value directly
  const response = await api.post(`/nodes/string/clean?parent_id=${parentId}`, column);
  return response.data;
};

// --- 4. MATH OPERATIONS ---
export const horizontalMath = async (parentId, columns, newCol, op = 'sum') => {
  const response = await api.post(`/nodes/math/horizontal?parent_id=${parentId}`, {
    columns, new_col: newCol, op
  });
  return response.data;
};

export const customExpression = async (parentId, expression, newCol, columns = null) => {
  const body = { expression, new_col: newCol };
  if (columns) body.columns = columns;
  const response = await api.post(`/nodes/math/custom?parent_id=${parentId}`, body);
  return response.data;
};

export const multiplyBulk = async (parentId, columns, factor, suffix) => {
  const response = await api.post(`/nodes/math/multiply_bulk?parent_id=${parentId}`, {
    columns, factor, suffix
  });
  return response.data;
};

// --- VECTOR OPERATIONS ---
export const vectorDotProduct = async (parentId, vecA, vecB, newCol) => {
  const response = await api.post(`/nodes/vector/dot_product?parent_id=${parentId}`, {
    vec_a: vecA, vec_b: vecB, new_col: newCol
  });
  return response.data;
};

export const vectorLinearMultiply = async (parentId, vecA, vecB, suffix) => {
  const response = await api.post(`/nodes/vector/linear_multiply?parent_id=${parentId}`, {
    vec_a: vecA, vec_b: vecB, suffix
  });
  return response.data;
};

export const vectorCrossProduct = async (parentId, vecA, vecB, prefix) => {
  const response = await api.post(`/nodes/vector/cross_product?parent_id=${parentId}`, {
    vec_a: vecA, vec_b: vecB, prefix
  });
  return response.data;
};

// --- 5. ADVANCED ANALYTICS ---
export const removeOutliers = async (parentId, column) => {
  // Single Body(str) param — send the value directly
  const response = await api.post(`/nodes/advanced/outliers?parent_id=${parentId}`, column);
  return response.data;
};

export const groupBy = async (parentId, groupCols, aggs) => {
  const response = await api.post(`/nodes/advanced/groupby?parent_id=${parentId}`, {
    group_cols: groupCols, aggs
  });
  return response.data;
};

export const calculateStats = async (parentId, columns) => {
  // Single Body(List[str]) param — send the array directly
  const response = await api.post(`/nodes/advanced/stats?parent_id=${parentId}`, columns);
  return response.data;
};

export const pivotTable = async (parentId, values, index, on, agg = 'sum') => {
  const response = await api.post(`/nodes/advanced/pivot?parent_id=${parentId}`, {
    values, index, on, agg
  });
  return response.data;
};

export const movingAverage = async (parentId, column, window) => {
  const response = await api.post(`/nodes/advanced/moving_average?parent_id=${parentId}`, {
    column, window
  });
  return response.data;
};

export const conditionalColumn = async (parentId, column, op, threshold, thenVal, elseVal, newCol) => {
  const response = await api.post(`/nodes/advanced/conditional?parent_id=${parentId}`, {
    column, op, threshold, then_val: thenVal, else_val: elseVal, new_col: newCol
  });
  return response.data;
};

// --- 6. MACHINE LEARNING ---
export const linearRegression = async (parentId, target, features) => {
  const response = await api.post(`/nodes/ml/linear_regression?parent_id=${parentId}`, {
    target, features
  });
  return response.data;
};

export const logisticPrediction = async (parentId, features, weights) => {
  const response = await api.post(`/nodes/ml/logistic_prediction?parent_id=${parentId}`, {
    features, weights
  });
  return response.data;
};

export const correlationMatrix = async (parentId, columns) => {
  const response = await api.post(`/nodes/ml/correlation?parent_id=${parentId}`, columns);
  return response.data;
};

// --- 7. DATA CLEANING ---
export const dropNA = async (parentId, subset = null) => {
  // Optional single Body param — send array directly or no body
  const response = subset && subset.length
    ? await api.post(`/nodes/clean/drop_na?parent_id=${parentId}`, subset)
    : await api.post(`/nodes/clean/drop_na?parent_id=${parentId}`);
  return response.data;
};

export const dropNulls = async (parentId) => {
  // No body params
  const response = await api.post(`/nodes/clean/drop_nulls?parent_id=${parentId}`);
  return response.data;
};

export const dropDuplicates = async (parentId, subset = null) => {
  // Optional single Body param — send array directly or no body
  const response = subset && subset.length
    ? await api.post(`/nodes/clean/drop_duplicates?parent_id=${parentId}`, subset)
    : await api.post(`/nodes/clean/drop_duplicates?parent_id=${parentId}`);
  return response.data;
};

export const fillMissing = async (parentId, column, value) => {
  const response = await api.post(`/nodes/clean/fill_missing?parent_id=${parentId}`, {
    column, value
  });
  return response.data;
};

// --- DATA TYPE OPERATIONS ---
export const castColumn = async (parentId, column, dtype) => {
  const response = await api.post(`/nodes/dtype/cast?parent_id=${parentId}`, {
    column, dtype
  });
  return response.data;
};

// --- DATE/TIME OPERATIONS ---
export const extractDateParts = async (parentId, column) => {
  // Single Body(str) param — send the value directly
  const response = await api.post(`/nodes/datetime/extract_parts?parent_id=${parentId}`, column);
  return response.data;
};

// --- JOINS & COMBINE ---
export const joinNodes = async (leftId, rightId, on, how = 'inner') => {
  const response = await api.post(`/nodes/combine/join?left_id=${leftId}&right_id=${rightId}`, {
    on, how
  });
  return response.data;
};

export const unionNodes = async (nodeIds) => {
  // Single Body(List[str]) param — send the array directly
  const response = await api.post('/nodes/combine/union', nodeIds);
  return response.data;
};

// --- MATRIX OPERATIONS ---
export const transposeMatrix = async (parentId) => {
  const response = await api.post(`/nodes/matrix/transpose?parent_id=${parentId}`, {});
  return response.data;
};

// --- UTILITY NODES ---
export const addLiteralColumn = async (parentId, column, value, dtype = 'string') => {
  const response = await api.post(`/nodes/util/add_literal_column?parent_id=${parentId}`, { column, value, dtype });
  return response.data;
};

export const rangeBucket = async (parentId, column, bins, labels, newCol = 'bucket') => {
  const response = await api.post(`/nodes/util/range_bucket?parent_id=${parentId}`, { column, bins, labels, new_col: newCol });
  return response.data;
};

export const dateOffset = async (parentId, column, offset, unit = 'days', newCol = null) => {
  const body = { column, offset, unit };
  if (newCol) body.new_col = newCol;
  const response = await api.post(`/nodes/util/date_offset?parent_id=${parentId}`, body);
  return response.data;
};

export const crosstabNode = async (parentId, index, columns, values = null, agg = 'count') => {
  const body = { index, columns, agg };
  if (values) body.values = values;
  const response = await api.post(`/nodes/util/crosstab?parent_id=${parentId}`, body);
  return response.data;
};

export const cumulativeProduct = async (parentId, column, newCol = null) => {
  const body = { column };
  if (newCol) body.new_col = newCol;
  const response = await api.post(`/nodes/util/cumulative_product?parent_id=${parentId}`, body);
  return response.data;
};

// --- ENHANCED REGRESSION ---
export const olsRegression = async (parentId, target, features) => {
  const response = await api.post(`/nodes/ml/ols_regression?parent_id=${parentId}`, { target, features });
  return response.data;
};

// --- STATISTICAL TESTS ---
export const tTest = async (parentId, columnA, columnB = null, testType = 'two_sample', alternative = 'two-sided', popmean = 0) => {
  const body = { column_a: columnA, test_type: testType, alternative, popmean };
  if (columnB) body.column_b = columnB;
  const response = await api.post(`/nodes/stats/t_test?parent_id=${parentId}`, body);
  return response.data;
};

export const fTest = async (parentId, columnA, columnB) => {
  const response = await api.post(`/nodes/stats/f_test?parent_id=${parentId}`, { column_a: columnA, column_b: columnB });
  return response.data;
};

export const chiSquareTest = async (parentId, columnA, columnB) => {
  const response = await api.post(`/nodes/stats/chi_square?parent_id=${parentId}`, { column_a: columnA, column_b: columnB });
  return response.data;
};

export const dwTest = async (parentId, residualsCol) => {
  const response = await api.post(`/nodes/stats/dw_test?parent_id=${parentId}`, { residuals_col: residualsCol });
  return response.data;
};

export const anovaTest = async (parentId, valueCol, groupCol) => {
  const response = await api.post(`/nodes/stats/anova?parent_id=${parentId}`, { value_col: valueCol, group_col: groupCol });
  return response.data;
};

// --- VISUALIZATION ---
export const chartNode = async (parentId, chartType, xCol = null, yCol = null, colorCol = null, title = '', bins = 20, agg = 'sum') => {
  const body = { chart_type: chartType, title, bins, agg };
  if (xCol) body.x_col = xCol;
  if (yCol) body.y_col = yCol;
  if (colorCol) body.color_col = colorCol;
  const response = await api.post(`/nodes/viz/chart?parent_id=${parentId}`, body);
  return response.data;
};

export const getChartImage = async (nodeId) => {
  const response = await api.get(`/nodes/${nodeId}/chart`);
  return response.data;
};

// --- SCHEDULER ---
export const getSchedule = async (workflowId) => {
  const response = await api.get(`/scheduler/workflows/${workflowId}/schedule`);
  return response.data;
};

export const setSchedule = async (workflowId, cronExpression, enabled = true, createdBy = 'admin') => {
  const response = await api.post(`/scheduler/workflows/${workflowId}/schedule`, {
    cron_expression: cronExpression, enabled, created_by: createdBy,
  });
  return response.data;
};

export const deleteSchedule = async (workflowId) => {
  const response = await api.delete(`/scheduler/workflows/${workflowId}/schedule`);
  return response.data;
};

export const toggleSchedule = async (workflowId, enabled) => {
  const response = await api.patch(`/scheduler/workflows/${workflowId}/schedule/toggle`, { enabled });
  return response.data;
};

export const getWatchedFiles = async (workflowId) => {
  const response = await api.get(`/scheduler/workflows/${workflowId}/files`);
  return response.data;
};

export const uploadWatchedFile = async (workflowId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/scheduler/workflows/${workflowId}/files/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 600000,
  });
  return response.data;
};

export const deleteWatchedFile = async (workflowId, filename) => {
  const response = await api.delete(`/scheduler/workflows/${workflowId}/files/${encodeURIComponent(filename)}`);
  return response.data;
};

export const useStaticFile = async (workflowId, filename) => {
  const response = await api.post(`/scheduler/workflows/${workflowId}/files/${encodeURIComponent(filename)}/use`);
  return response.data;
};

export const triggerWorkflow = async (workflowId, triggeredBy = 'manual') => {
  const formData = new FormData();
  formData.append('triggered_by', triggeredBy);
  formData.append('sync', 'true');
  const token = localStorage.getItem('token');
  const response = await api.post(`/scheduler/workflows/${workflowId}/trigger`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    timeout: 600000,
  });
  return response.data;
};

export const getWebhookUrl = async (workflowId) => {
  const response = await api.get(`/scheduler/workflows/${workflowId}/webhook-url`);
  return response.data;
};

// --- TRANSFORM OPERATIONS ---
export const reorderColumns = async (parentId, orderedCols) => {
  const response = await api.post(`/nodes/transform/reorder?parent_id=${parentId}`, {
    ordered_cols: orderedCols
  });
  return response.data;
};

export const readFromDB = async (connectionString, query) => {
  const response = await api.post('/nodes/io/read_from_db', {
    connection_string: connectionString, query
  });
  return response.data;
};

// --- 8. NODE MANAGEMENT ---
export const clearNodeData = async (nodeId) => {
  const response = await api.delete(`/nodes/${nodeId}`);
  return response.data;
};

export const inspectNode = async (nodeId, limit = 50) => {
  const response = await api.get(`/nodes/${nodeId}?limit=${limit}`);
  return response.data;
};

export const downloadNodeData = async (nodeId, format = 'csv') => {
  const response = await api.get(`/nodes/${nodeId}/download?format=${format}`, {
    responseType: 'blob',
    timeout: 600000,
  });
  return response.data;
};

export const cacheNode = async (nodeId, ttl = 3600) => {
  const response = await api.post(`/nodes/${nodeId}/cache?ttl=${ttl}`);
  return response.data;
};

// --- 9. WORKFLOW MANAGEMENT ---
export const validateConnection = async (parentId, childType, childParams) => {
  const response = await api.post(`/workflow/validate-connection?parent_id=${parentId}`, {
    child_type: childType, child_params: childParams
  });
  return response.data;
};

export const exportWorkflow = async () => {
  const response = await api.get('/workflow/export', {
    responseType: 'blob'
  });
  return response.data;
};

// --- 10. HEALTH CHECK ---
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// --- 11. AI WORKFLOW GENERATION ---
export const generateWorkflow = async (inputFiles, outputFile, prompt) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  inputFiles.forEach(f => formData.append('input_files', f));
  if (outputFile) formData.append('output_file', outputFile);
  const response = await api.post('/ai/generate-workflow', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 1800000,
  });
  return response.data;
};

export const getAIStatus = async () => {
  const response = await api.get('/ai/status');
  return response.data;
};

export const refineWorkflow = async (prompt, currentWorkflow, inputSchemas = []) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('current_workflow', JSON.stringify(currentWorkflow));
  formData.append('input_schemas', JSON.stringify(inputSchemas));
  const response = await api.post('/ai/refine-workflow', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 1800000,
  });
  return response.data;
};

export const getFeatureTickets = async (status = null) => {
  const url = status ? `/ai/tickets?status=${status}` : '/ai/tickets';
  const response = await api.get(url);
  return response.data;
};

export const voteFeatureTicket = async (ticketId) => {
  const response = await api.post(`/ai/tickets/${ticketId}/vote`);
  return response.data;
};

// --- NODE DATA API (authenticated) ---
export const getNodeDataAuthenticated = async (workflowId, nodeFrontendId, token, format = 'json', limit = 100) => {
  const opts = { headers: { Authorization: `Bearer ${token}` } };
  if (format === 'csv') {
    opts.responseType = 'blob';
    opts.timeout = 600000;
  }
  const response = await api.get(
    `/scheduler/workflows/${workflowId}/nodes/${nodeFrontendId}/data?format=${format}&limit=${limit}`,
    opts
  );
  return response.data;
};

// --- ROLL-RATE ANALYSIS ---
export const monthlySnapshot = async (parentId, idCol, dateCol, valueCol, agg = 'max') => {
  const response = await api.post(`/nodes/rollrate/monthly_snapshot?parent_id=${parentId}`, {
    id_col: idCol, date_col: dateCol, value_col: valueCol, agg
  });
  return response.data;
};

export const transitionMatrix = async (parentId, idCol, periodCol, bucketCol, bucketOrder = null) => {
  const body = { id_col: idCol, period_col: periodCol, bucket_col: bucketCol };
  if (bucketOrder) body.bucket_order = bucketOrder;
  const response = await api.post(`/nodes/rollrate/transition_matrix?parent_id=${parentId}`, body);
  return response.data;
};

export const periodAverage = async (parentId, window = 12, bucketOrder = null) => {
  const body = { window };
  if (bucketOrder) body.bucket_order = bucketOrder;
  const response = await api.post(`/nodes/rollrate/period_average?parent_id=${parentId}`, body);
  return response.data;
};

export const chainProbability = async (parentId, bucketOrder = null) => {
  const body = {};
  if (bucketOrder) body.bucket_order = bucketOrder;
  const response = await api.post(`/nodes/rollrate/chain_probability?parent_id=${parentId}`, body);
  return response.data;
};

export default api;