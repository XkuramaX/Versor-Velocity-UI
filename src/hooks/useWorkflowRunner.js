import { useState, useRef } from 'react';
import * as api from '../services/api';
import { uploadCSV, uploadExcel } from '../services/api';
import { getFile, cleanupFile } from '../utils/fileStorage';
import { workflowApi } from '../services/workflow';

export const useWorkflowRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const executedNodes = useRef({});

  const runSingleNode = async (nodeId, nodes, edges, setNodes, isStandaloneRun = false) => {
    // For standalone single-node runs, reset the execution cache so
    // previously-executed parents are re-resolved from their backendNodeId (#9)
    if (isStandaloneRun) {
      executedNodes.current = {};
      // Pre-populate cache from already-executed nodes so we don't re-run them
      let currentNodes = nodes;
      setNodes(nds => { currentNodes = nds; return nds; });
      currentNodes.forEach(n => {
        if (n.data?.backendNodeId) executedNodes.current[n.id] = n.data.backendNodeId;
      });
    }
    await _runNode(nodeId, nodes, edges, setNodes);
  };

  const _runNode = async (nodeId, nodes, edges, setNodes) => {
    // Always read the freshest node state — never use the passed nodes array
    // as it may be a stale snapshot from when runWorkflow/runSingleNode was called
    let node = null;
    setNodes(nds => { node = nds.find(n => n.id === nodeId); return nds; });
    if (!node) return;

    if (executedNodes.current[nodeId]) return;

    const parentEdges = edges.filter(e => e.target === nodeId);
    for (const edge of parentEdges) {
      if (!executedNodes.current[edge.source]) {
        await _runNode(edge.source, nodes, edges, setNodes);
      }
    }

    setNodes(nds => { node = nds.find(n => n.id === nodeId) || node; return nds; });
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

    try {
      let result;
      const { nodeType, config } = node.data;

      if (['upload_csv', 'upload_excel'].includes(nodeType)) {
        const fileRef = node.data.fileRef;
        const file = fileRef ? getFile(fileRef) : null;

        // If the upload node already has a backendNodeId and no file staged,
        // it was executed in a previous run — reuse the existing result.
        if (!file && node.data.backendNodeId) {
          executedNodes.current[nodeId] = node.data.backendNodeId;
          setNodes(nds => nds.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'success', error: null } } : n
          ));
          return;
        }

        if (!file) throw new Error(`No file found for "${node.data.label}" — please upload a file and try again`);

        result = nodeType === 'upload_csv'
          ? await uploadCSV(file)
          : await uploadExcel(file, node.data.config?.sheet_name || 'Sheet1');

        if (fileRef) cleanupFile(fileRef);
      } else {
        const parentEdge = edges.find(e => e.target === nodeId);
        const parentFrontendId = parentEdge?.source;
        const parentId = parentFrontendId ? executedNodes.current[parentFrontendId] : null;

        switch (nodeType) {
          case 'read_from_db':
            result = await api.readFromDB(config.connection_string, config.query); break;
          case 'safe_filter':
            result = await api.safeFilterNode(parentId, config.filters, config.logic); break;
          case 'filter':
            result = await api.filterNode(parentId, config.column, config.operator, config.value); break;
          case 'select':
            result = await api.selectColumns(parentId, config.columns); break;
          case 'drop':
            result = await api.dropColumns(parentId, config.columns); break;
          case 'sort':
            result = await api.sortData(parentId, config.by, config.descending ?? false); break;
          case 'rename':
            result = await api.renameColumns(parentId, config.mapping); break;
          case 'reorder':
            result = await api.reorderColumns(parentId, config.ordered_cols); break;
          case 'string_case':
            result = await api.changeCase(parentId, config.column, config.mode, config.new_col || null); break;
          case 'string_slice':
            result = await api.stringSlice(parentId, config.column, config.n_chars, config.mode, config.new_col || null); break;
          case 'string_mid':
            result = await api.stringMid(parentId, config.column, config.start, config.length, config.new_col || null); break;
          case 'string_concat':
            result = await api.concatColumns(parentId, config.columns, config.separator ?? '', config.new_col); break;
          case 'string_prefix_suffix':
            result = await api.addPrefixSuffix(parentId, config.column, config.prefix ?? '', config.suffix ?? '', config.new_col || null); break;
          case 'string_clean':
            result = await api.cleanString(parentId, config.column); break;
          case 'math_horizontal':
            result = await api.horizontalMath(parentId, config.columns, config.new_col, config.op); break;
          case 'math_custom':
            result = await api.customExpression(parentId, config.left_cols, config.op, config.right_val, config.new_suffix); break;
          case 'math_multiply_bulk':
            result = await api.multiplyBulk(parentId, config.columns, config.factor, config.suffix); break;
          case 'vector_dot_product':
            result = await api.vectorDotProduct(parentId, config.vec_a, config.vec_b, config.new_col); break;
          case 'vector_linear_multiply':
            result = await api.vectorLinearMultiply(parentId, config.vec_a, config.vec_b, config.suffix); break;
          case 'vector_cross_product':
            result = await api.vectorCrossProduct(parentId, config.vec_a, config.vec_b, config.prefix); break;
          case 'groupby':
            result = await api.groupBy(parentId, config.group_cols, config.aggs); break;
          case 'stats':
            result = await api.calculateStats(parentId, config.columns); break;
          case 'pivot':
            result = await api.pivotTable(parentId, config.values, config.index, config.on, config.agg ?? 'sum'); break;
          case 'outliers':
            result = await api.removeOutliers(parentId, config.column); break;
          case 'moving_average':
            result = await api.movingAverage(parentId, config.column, config.window); break;
          case 'conditional':
            // Send safe structured params — no raw expression string (#7)
            result = await api.conditionalColumn(
              parentId,
              config._cond_col, config._cond_op, config._cond_threshold,
              config.then_val, config.else_val, config.new_col
            ); break;
          case 'linear_regression':
            // Appends predicted_{target} column to the original dataframe
            result = await api.linearRegression(parentId, config.target, config.features); break;
          case 'logistic_prediction':
            // Appends 'probability' column to the original dataframe
            result = await api.logisticPrediction(parentId, config.features, config.weights); break;
          case 'correlation':
            // Outputs tidy 1-D dataframe: col_a, col_b, correlation
            result = await api.correlationMatrix(parentId, config.columns); break;
          case 'drop_na':
            result = await api.dropNA(parentId, config.subset?.length ? config.subset : null); break;
          case 'drop_nulls':
            result = await api.dropNulls(parentId); break;
          case 'drop_duplicates':
            result = await api.dropDuplicates(parentId, config.subset?.length ? config.subset : null); break;
          case 'fill_missing':
            result = await api.fillMissing(parentId, config.column, config.value); break;
          case 'cast':
            result = await api.castColumn(parentId, config.column, config.dtype); break;
          case 'extract_date_parts':
            result = await api.extractDateParts(parentId, config.column); break;
          case 'transpose':
            result = await api.transposeMatrix(parentId); break;
          case 'join': {
            const joinEdges = edges.filter(e => e.target === nodeId);
            const leftId = executedNodes.current[joinEdges[0]?.source];
            const rightId = executedNodes.current[joinEdges[1]?.source];
            result = await api.joinNodes(leftId, rightId, config.on, config.how); break;
          }
          case 'union': {
            const unionEdges = edges.filter(e => e.target === nodeId);
            const unionIds = unionEdges.map(e => executedNodes.current[e.source]).filter(Boolean);
            result = await api.unionNodes(unionIds); break;
          }
          default:
            throw new Error(`Unknown node type: ${nodeType}`);
        }
      }

      executedNodes.current[nodeId] = result.node_id;

      setNodes(nds => nds.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status: 'success', backendNodeId: result.node_id, metadata: result.metadata, fileRef: null, error: null } }
          : n
      ));

    } catch (error) {
      console.error('Node execution failed:', error);
      setNodes(nds => nds.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, status: 'error', error: error.response?.data?.detail || error.message } }
          : n
      ));
    }
  };

  const runWorkflow = async (nodes, edges, setNodes, workflowId = null) => {
    setIsRunning(true);
    // Pre-populate executedNodes from any nodes that already have a backendNodeId.
    // This handles re-runs where some nodes succeeded previously:
    // - Already-executed nodes are skipped (their IDs are in the cache)
    // - New nodes can resolve their parentId from the cache
    // - Upload nodes with backendNodeId but no fileRef are treated as done
    executedNodes.current = {};
    let currentNodes = nodes;
    setNodes(nds => { currentNodes = nds; return nds; });
    currentNodes.forEach(n => {
      if (n.data?.backendNodeId) executedNodes.current[n.id] = n.data.backendNodeId;
    });

    if (workflowId) workflowApi.markRun(workflowId, 'RUNNING').catch(() => {});
    try {
      const executionOrder = getExecutionOrder(nodes, edges);
      for (const nodeId of executionOrder) {
        await _runNode(nodeId, nodes, edges, setNodes);
      }
      if (workflowId) workflowApi.markRun(workflowId, 'SUCCESS').catch(() => {});
    } catch (error) {
      console.error('Workflow execution failed:', error);
      if (workflowId) workflowApi.markRun(workflowId, 'ERROR').catch(() => {});
    } finally {
      setIsRunning(false);
    }
  };

  return { runSingleNode, runWorkflow, isRunning };
};

// Helper function to determine execution order using topological sort
const getExecutionOrder = (nodes, edges) => {
  const graph = {};
  const inDegree = {};
  
  // Initialize graph and in-degree count
  nodes.forEach(node => {
    graph[node.id] = [];
    inDegree[node.id] = 0;
  });
  
  // Build graph and calculate in-degrees
  edges.forEach(edge => {
    graph[edge.source].push(edge.target);
    inDegree[edge.target]++;
  });
  
  // Topological sort using Kahn's algorithm
  const queue = [];
  const result = [];
  
  // Start with nodes that have no dependencies
  Object.keys(inDegree).forEach(nodeId => {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  });
  
  while (queue.length > 0) {
    const nodeId = queue.shift();
    result.push(nodeId);
    
    graph[nodeId].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return result;
};