import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  Play, Save, Download, Upload,
  Users, Share2, Lock, Unlock, Eye, Loader, Sparkles, LayoutGrid, Clock
} from 'lucide-react';

import CustomNodes from './CustomNodes';
import NodeLibrary from './NodeLibraryFixed';
import AIChatPanel from './AIChatPanel';
import { PropertiesPanel } from './PropertiesPanel/index';
import DataPreviewModal from './DataPreviewModal';
import FileUploadModal from './FileUploadModal';
import ValidationTooltip from './ValidationTooltip';
import PermissionManager from './PermissionManager';
import SaveWorkflowModal from './SaveWorkflowModal';
import SchedulerPanel from './SchedulerPanel';
import FileHistoryTab from './FileHistoryTab';
import VersionHistoryTab from './VersionHistoryTab';
import { useWorkflowRunner } from '../hooks/useWorkflowRunner';
import { downloadNodeData, clearNodeData } from '../services/api';
import { workflowApi } from '../services/workflow.js';
import { authService } from '../services/auth.js';
import { storeFile, cleanupFile } from '../utils/fileStorage';

const connectionLineStyle = {
  strokeWidth: 2,
  stroke: '#06b6d4',
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#64748b' },
  type: 'smoothstep',
};

export default function WorkflowCanvas({
  workflowId,
  permissions = { role: 'owner', canEdit: true, canRun: true, canShare: true },
  aiMode = false,
  initialNodes = null,
  initialEdges = null,
}) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Refs to always hold the latest nodes/edges — avoids stale closures in callbacks
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Keep refs in sync with state
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Derive live node data from the nodes array — never stale
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null;
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeTab, setActiveTab] = useState('canvas');
  const [uploadingNode, setUploadingNode] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [validationPosition, setValidationPosition] = useState({ x: 0, y: 0 });
  const [leftPanel, setLeftPanel] = useState(aiMode ? 'ai' : 'nodes'); // 'nodes' | 'ai'
  const [aiInputSchemas, setAiInputSchemas] = useState([]);

  const { runWorkflow, runSingleNode, isRunning } = useWorkflowRunner();

  // Use refs to pass live nodes/edges to CustomNode without recreating nodeTypes
  // Recreating nodeTypes causes ReactFlow to remount all nodes (flicker + lost selection)
  const nodesLiveRef = useRef(nodes);
  const edgesLiveRef = useRef(edges);
  nodesLiveRef.current = nodes;
  edgesLiveRef.current = edges;

  // nodeTypes is stable — never recreated, so ReactFlow never remounts nodes
  const nodeTypesWithContext = React.useMemo(() => ({
    custom: (props) => {
      // Read live values from refs at render time
      return <CustomNodes {...props} allNodes={nodesLiveRef.current} allEdges={edgesLiveRef.current} />;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // intentionally empty — stability is the goal

  const handleInspectNode = useCallback((nodeId) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node?.data?.backendNodeId) {
        setSelectedNodeId(nodeId);
        setShowDataPreview(true);
      }
      return currentNodes;
    });
  }, []);

  const handleDownloadNode = useCallback(async (nodeId) => {
    // We use a reference to nodes or find it within the setNodes to avoid dependency
    let node;
    setNodes(nds => {
        node = nds.find(n => n.id === nodeId);
        return nds;
    });

    if (!node?.data?.backendNodeId) {
      alert('Node must be executed first before download');
      return;
    }

    try {
      const blob = await downloadNodeData(node.data.backendNodeId, 'csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${node.data.backendNodeId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
  }, []);

  const handleSaveToHistory = useCallback(async (nodeId) => {
    let node;
    setNodes(nds => {
        node = nds.find(n => n.id === nodeId);
        return nds;
    });

    if (!node?.data?.backendNodeId) {
      alert('Node must be executed first');
      return;
    }

    try {
      const currentUser = authService.getUser();
      const metadata = node.data.metadata || {};
      const filename = `workflow_${workflowId}_node_${nodeId}_${new Date().toISOString().split('T')[0]}.csv`;

      await workflowApi.saveFile(
        workflowId,
        nodeId,
        node.data.backendNodeId,
        filename,
        currentUser.username,
        metadata.rows || 0,
        metadata.columns || 0
      );

      alert('File saved to history');
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  }, [workflowId]);

  const handleLabelChange = useCallback((nodeId, newLabel) => {
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
    ));
  }, []);

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleRunNode = useCallback(async (nodeId) => {
    await runSingleNode(nodeId, nodesRef.current, edgesRef.current, setNodes, true);
  }, [runSingleNode]);

  const handleClearData = useCallback(async (nodeId) => {
    if (!permissions.canEdit) return;

    if (!confirm('Are you sure you want to clear the data from this node? This action cannot be undone.')) {
      return;
    }

    try {
      // Read fresh node state via functional update — fixes stale closure (#3)
      let fileRefToClean = null;
      setNodes((nds) => {
        const node = nds.find(n => n.id === nodeId);
        if (node?.data?.fileRef) fileRefToClean = node.data.fileRef;
        return nds.map(n =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, backendNodeId: null, status: 'idle', metadata: null, fileRef: null, fileName: null } }
            : n
        );
      });

      // Clear backend data and file storage after state update
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (node?.data?.backendNodeId) {
        await clearNodeData(node.data.backendNodeId);
      }
      if (fileRefToClean) cleanupFile(fileRefToClean);
    } catch (error) {
      alert('Failed to clear data: ' + error.message);
    }
  }, [permissions.canEdit]);

  const handleUploadFile = useCallback((nodeId) => {
    if (!permissions.canRun) return;
    
    // Find the node specifically to set it as the "active" uploading node
    setNodes((currentNodes) => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node) {
        setUploadingNode(node);
        setShowFileUpload(true);
      }
      return currentNodes;
    });
  }, [permissions.canRun]);

  // ── AI mode helpers (must be after all handler definitions) ──────────────
  const attachCallbacks = useCallback((rawNodes) => {
    return rawNodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        status: n.data.status || 'idle',
        backendNodeId: n.data.backendNodeId || null,
        onInspect: handleInspectNode,
        onDelete: handleDeleteNode,
        onRun: handleRunNode,
        onUpload: handleUploadFile,
        onClearData: handleClearData,
        onDownload: handleDownloadNode,
        onSaveToHistory: handleSaveToHistory,
        onLabelChange: handleLabelChange,
      },
    }));
  }, [handleInspectNode, handleDeleteNode, handleRunNode, handleUploadFile, handleClearData, handleDownloadNode, handleSaveToHistory, handleLabelChange]);

  const handleAIWorkflowGenerated = useCallback((workflow) => {
    if (!workflow?.nodes || !workflow?.edges) return;
    const nodesWithCbs = attachCallbacks(workflow.nodes);
    setNodes(nodesWithCbs);
    setEdges(workflow.edges);
  }, [attachCallbacks, setNodes, setEdges]);

  const getWorkflowState = useCallback(() => {
    return { nodes: nodesRef.current, edges: edgesRef.current };
  }, []);

  // Check for loops in the graph
  const hasLoop = useCallback((newEdge, currentEdges) => {
    const graph = {};
    [...currentEdges, newEdge].forEach(edge => {
      if (!graph[edge.source]) graph[edge.source] = [];
      graph[edge.source].push(edge.target);
    });

    const visited = new Set();
    const recStack = new Set();

    const dfs = (node) => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      if (graph[node]) {
        for (const neighbor of graph[node]) {
          if (dfs(neighbor)) return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    return Object.keys(graph).some(node => dfs(node));
  }, []);

  // Get node input configuration
  const getNodeInputConfig = useCallback((nodeType) => {
    const multiInputNodes = ['union'];
    const twoInputNodes = ['join'];
    const noInputNodes = ['upload_csv', 'upload_excel', 'read_from_db'];

    if (noInputNodes.includes(nodeType)) return { maxInputs: 0 };
    if (twoInputNodes.includes(nodeType)) return { maxInputs: 2 };
    if (multiInputNodes.includes(nodeType)) return { maxInputs: 999 };
    return { maxInputs: 1 };
  }, []);

  // Connection validation
  const onConnect = useCallback(async (params) => {
    if (!permissions.canEdit) return;

    try {
      // Check for loops
      if (hasLoop(params, edges)) {
        setValidationError('Connection would create a loop');
        return;
      }

      // Get target node and check input limits
      const targetNode = nodes.find(n => n.id === params.target);
      if (!targetNode) return;

      const inputConfig = getNodeInputConfig(targetNode.data.nodeType);
      const existingInputs = edges.filter(e => e.target === params.target).length;

      if (existingInputs >= inputConfig.maxInputs) {
        setValidationError(`Node can only accept ${inputConfig.maxInputs} input(s)`);
        return;
      }

      // Allow connection — validation happens at execution time
      setEdges((eds) => addEdge({
        ...params,
        ...defaultEdgeOptions,
        animated: true
      }, eds));
    } catch (error) {
      setValidationError('Connection validation failed: ' + error.message);
    }
  }, [nodes, edges, permissions.canEdit, hasLoop, getNodeInputConfig]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      if (!permissions.canEdit) return;

      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const nodeConfig = JSON.parse(event.dataTransfer.getData('application/nodeconfig'));

      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Callbacks are read from refs inside each handler, so they are always fresh (#2)
      setNodes((nds) => nds.concat({
        id: `${type}_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: nodeConfig.label,
          nodeType: type,
          config: nodeConfig,
          status: 'idle',
          backendNodeId: null,
          onInspect: handleInspectNode,
          onDelete: handleDeleteNode,
          onRun: handleRunNode,
          onUpload: handleUploadFile,
          onClearData: handleClearData,
          onDownload: handleDownloadNode,
          onSaveToHistory: handleSaveToHistory,
          onLabelChange: handleLabelChange,
        },
      }));
    },
    [reactFlowInstance, permissions.canEdit, handleInspectNode, handleDeleteNode, handleRunNode, handleUploadFile, handleClearData, handleDownloadNode, handleSaveToHistory]
  );

  const handleFileUploaded = useCallback((file, metadata) => {
    if (uploadingNode) {
      const fileRef = `file_${uploadingNode.id}_${Date.now()}`;
      storeFile(fileRef, file);

      // Use edgesRef for fresh edge state — fixes stale closure (#14)
      const getDownstreamNodes = (nodeId, visited = new Set()) => {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);
        const downstream = edgesRef.current
          .filter(e => e.source === nodeId)
          .map(e => e.target);
        const all = [...downstream];
        downstream.forEach(id => all.push(...getDownstreamNodes(id, visited)));
        return all;
      };

      const downstreamNodeIds = getDownstreamNodes(uploadingNode.id);

      setNodes((nds) => nds.map(node => {
        if (node.id === uploadingNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              fileRef,
              fileName: file.name,
              backendNodeId: null,
              config: { ...node.data.config, sheet_name: metadata?.sheet_name || 'Sheet1' },
              status: 'idle',
              metadata: null,
              onInspect: handleInspectNode,
              onDelete: handleDeleteNode,
              onRun: handleRunNode,
              onUpload: handleUploadFile,
              onClearData: handleClearData,
              onDownload: handleDownloadNode,
              onSaveToHistory: handleSaveToHistory,
              onLabelChange: handleLabelChange,
            }
          };
        } else if (downstreamNodeIds.includes(node.id)) {
          return { ...node, data: { ...node.data, status: 'idle', backendNodeId: null, metadata: null } };
        }
        return node;
      }));
    }
    setShowFileUpload(false);
    setUploadingNode(null);
  }, [uploadingNode, handleInspectNode, handleDeleteNode, handleRunNode, handleUploadFile, handleClearData, handleDownloadNode, handleSaveToHistory]);

  const handleRunWorkflow = async () => {
    if (!permissions.canRun) return;

    // Check all upload nodes have files staged
    const uploadNodes = nodes.filter(n =>
      ['upload_csv', 'upload_excel'].includes(n.data.nodeType)
    );
    const missingUploads = uploadNodes.filter(n => !n.data.fileRef && !n.data.backendNodeId);

    if (missingUploads.length > 0) {
      // Prompt for the first missing upload node by name
      const first = missingUploads[0];
      alert(`Please upload a file for "${first.data.label}" before running the workflow.`);
      setNodes(nds => {
        const node = nds.find(n => n.id === first.id);
        if (node) { setUploadingNode(node); setShowFileUpload(true); }
        return nds;
      });
      return;
    }

    // Run on the real canvas — nodes update live as each executes
    let finalNodes = nodesRef.current;
    const setNodesAndCapture = (updater) => {
      const updated = typeof updater === 'function' ? updater(finalNodes) : updater;
      finalNodes = updated;
      setNodes(updated);
    };

    await runWorkflow(nodesRef.current, edgesRef.current, setNodesAndCapture);

    // Record run — only saveDataframe nodes are persisted to DB
    try {
      const currentUser = authService.getUser();
      const status = finalNodes.some(n => n.data.status === 'error') ? 'ERROR' : 'SUCCESS';
      const savedNodes = finalNodes
        .filter(n => n.data.saveDataframe && n.data.backendNodeId && n.data.status === 'success')
        .map(n => ({
          node_id: n.id,
          backend_node_id: n.data.backendNodeId,
          label: n.data.label,
          filename: `${n.data.backendNodeId}.csv`,
          rows: n.data.metadata?.row_count,
          columns: n.data.metadata?.column_count,
          saved_by: currentUser.username
        }));
      if (workflowId) {
        await workflowApi.markRun(workflowId, status).catch(() => {});
      }
      // Only create a run record if there are nodes to save
      if (savedNodes.length > 0 && workflowId) {
        const versions = await workflowApi.getVersions(workflowId).catch(() => []);
        const versionId = versions?.[0]?.id || null;
        await workflowApi.createRun(workflowId, versionId, currentUser.username, status, savedNodes).catch(() => {});
      }
    } catch (e) {
      console.error('Failed to record run:', e);
    }
  };

  const handleSaveWorkflow = () => {
    if (!permissions.canEdit) return;
    setShowSaveModal(true);
  };

  const handleExportWorkflow = () => {
    const workflowData = { nodes, edges, permissions };
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${workflowId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkflow = (event) => {
    if (!permissions.canEdit) return;
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target.result);
        // Attach all callbacks so imported nodes are fully functional
        const nodesWithCallbacks = (workflowData.nodes || []).map(node => ({
          ...node,
          data: {
            ...node.data,
            status: 'idle',
            backendNodeId: null,
            metadata: null,
            onUpload: handleUploadFile,
            onClearData: handleClearData,
            onInspect: handleInspectNode,
            onDownload: handleDownloadNode,
            onDelete: handleDeleteNode,
            onRun: handleRunNode,
            onSaveToHistory: handleSaveToHistory,
            onLabelChange: handleLabelChange,
          }
        }));
        setNodes(nodesWithCallbacks);
        setEdges(workflowData.edges || []);
      } catch (error) {
        alert('Invalid workflow file');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    event.target.value = '';
  };

  const onNodeClick = (_event, node) => {
    setSelectedNodeId(node.id);
  };

  // Clear validation error after 3 seconds
  useEffect(() => {
    if (validationError) {
      const timer = setTimeout(() => setValidationError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [validationError]);

  useEffect(() => {
    const loadWorkflow = async () => {
      if (!workflowId) return; // Guard clause

      try {
        const currentUser = authService.getUser();
        const workflows = await workflowApi.getUserWorkflows(currentUser.id);
        const workflow = workflows.find(w => w.id === workflowId);
  
        if (workflow?.workflow_data) {
          const data = JSON.parse(workflow.workflow_data);
          if (data.nodes) {
            const nodesWithCallbacks = data.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                onUpload: handleUploadFile,
                onClearData: handleClearData,
                onInspect: handleInspectNode,
                onDownload: handleDownloadNode,
                onDelete: handleDeleteNode,
                onRun: handleRunNode,
                onSaveToHistory: handleSaveToHistory,
                onLabelChange: handleLabelChange,
              }
            }));
            setNodes(nodesWithCallbacks);
          }
          if (data.edges) setEdges(data.edges);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    };
  
    loadWorkflow();
    // CRITICAL: We intentionally exclude the handlers from dependencies to prevent loops.
    // The handlers are stable enough or will be refreshed if workflowId changes.
  }, [workflowId]);

  // Load initial nodes/edges from AI generator (if provided)
  useEffect(() => {
    if (initialNodes && initialEdges) {
      const nodesWithCbs = attachCallbacks(initialNodes);
      setNodes(nodesWithCbs);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges]);

  const getPermissionIcon = () => {
    switch (permissions.role) {
      case 'owner': return <Lock className="w-4 h-4 text-purple-400" />;
      case 'editor': return <Unlock className="w-4 h-4 text-blue-400" />;
      case 'viewer': return <Eye className="w-4 h-4 text-green-400" />;
      case 'runner': return <Play className="w-4 h-4 text-orange-400" />;
      default: return <Users className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'canvas'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
          >
            Workflow Canvas
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'canvas' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Node Library or AI Chat */}
          <div className="w-80 h-full overflow-hidden sidebar border-r flex flex-col">
            {/* Tab toggle (only shown when aiMode is available) */}
            {aiMode && (
              <div className="flex border-b border-slate-700/50 flex-shrink-0">
                <button
                  onClick={() => setLeftPanel('ai')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    leftPanel === 'ai'
                      ? 'text-purple-400 bg-purple-500/10 border-b-2 border-purple-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setLeftPanel('nodes')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    leftPanel === 'nodes'
                      ? 'text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Nodes</span>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-hidden relative">
              <div className={`h-full ${leftPanel !== 'ai' ? 'hidden' : ''}`}>
                <AIChatPanel
                  onWorkflowGenerated={handleAIWorkflowGenerated}
                  getWorkflowState={getWorkflowState}
                  inputSchemas={aiInputSchemas}
                  setInputSchemas={setAiInputSchemas}
                />
              </div>
              <div className={`h-full ${leftPanel !== 'nodes' ? 'hidden' : ''}`}>
                <NodeLibrary disabled={!permissions.canEdit} />
              </div>
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={permissions.canEdit ? onNodesChange : undefined}
              onEdgesChange={permissions.canEdit ? onEdgesChange : undefined}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypesWithContext}
              connectionLineStyle={connectionLineStyle}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              fitView
              className="workflow-canvas"
              proOptions={{ hideAttribution: true }}
            >
              <Background
                color="#334155"
                gap={20}
                size={1}
                variant="dots"
              />
              <Controls
                className="glass-dark"
                showInteractive={false}
              />
              <MiniMap
                className="glass-dark"
                nodeColor={(node) => {
                  const nodeType = node.data?.nodeType;
                  let category = 'transform';

                  if (['upload_csv', 'upload_excel'].includes(nodeType)) category = 'ingestion';
                  else if (['string_case', 'string_slice', 'string_concat'].includes(nodeType)) category = 'string';
                  else if (['math_horizontal', 'math_custom'].includes(nodeType)) category = 'math';
                  else if (['linear_regression', 'logistic_prediction'].includes(nodeType)) category = 'ml';
                  else if (['drop_na', 'drop_duplicates', 'fill_missing'].includes(nodeType)) category = 'cleaning';

                  const colors = {
                    ingestion: '#10b981',
                    transform: '#3b82f6',
                    math: '#8b5cf6',
                    string: '#f59e0b',
                    ml: '#ec4899',
                    cleaning: '#ef4444'
                  };
                  return colors[category] || '#64748b';
                }}
                maskColor="rgba(15, 23, 42, 0.8)"
              />

              {/* Top Panel - Controls */}
              <Panel position="top-right" className="flex items-center space-x-2 p-4">
                {/* Permission Indicator */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg glass-dark permission-${permissions.role}`}>
                  {getPermissionIcon()}
                  <span className="text-sm font-medium capitalize">{permissions.role}</span>
                </div>

                {/* Workflow Controls */}
                {permissions.canRun && (
                  <button
                    onClick={handleRunWorkflow}
                    disabled={isRunning}
                    className="flex items-center space-x-2 btn-primary disabled:opacity-50"
                  >
                    {isRunning ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{isRunning ? 'Running...' : 'Run All'}</span>
                  </button>
                )}

                {permissions.canEdit && (
                  <>
                    <button
                      onClick={handleSaveWorkflow}
                      className="flex items-center space-x-2 btn-secondary"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>

                    <button
                      onClick={handleExportWorkflow}
                      className="flex items-center space-x-2 btn-secondary"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>

                    <label className="flex items-center space-x-2 btn-secondary cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportWorkflow}
                        className="hidden"
                      />
                    </label>
                  </>
                )}

                {permissions.canShare && (
                  <button
                    onClick={() => setShowPermissions(true)}
                    className="flex items-center space-x-2 btn-secondary"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                )}

                {permissions.canEdit && workflowId && (
                  <button
                    onClick={() => setShowScheduler(true)}
                    className="flex items-center space-x-2 btn-secondary"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Schedule</span>
                  </button>
                )}
              </Panel>

              {/* Validation Error Tooltip */}
              {validationError && (
                <Panel position="top-center">
                  <ValidationTooltip
                    message={validationError}
                    position={validationPosition}
                    onClose={() => setValidationError(null)}
                  />
                </Panel>
              )}
            </ReactFlow>
          </div>

          {/* Right Sidebar - Properties Panel */}
          <div className="w-80 sidebar border-l">
            <PropertiesPanel
              selectedNode={selectedNode}
              nodes={nodes}
              edges={edges}
              permissions={permissions}
              onUploadClick={handleUploadFile}
              onClearData={handleClearData}
              onUpdateNode={(nodeId, updates) => {
                if (!permissions.canEdit) return;
                setNodes((nds) => nds.map(node => {
                  if (node.id !== nodeId) return node;
                  // updates can be a function (receives current data) or a plain object
                  if (typeof updates === 'function') {
                    return { ...node, data: { ...node.data, ...updates(node.data) } };
                  }
                  // Legacy object form: { data: { ...node.data, config: next } }
                  return { ...node, ...updates };
                }));
              }}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showDataPreview && selectedNode && (
        <DataPreviewModal
          node={selectedNode}
          onClose={() => { setShowDataPreview(false); }}
        />
      )}

      {showFileUpload && uploadingNode && (
        <FileUploadModal
          node={uploadingNode}
          onClose={() => setShowFileUpload(false)}
          onFileUploaded={handleFileUploaded}
        />
      )}

      {showPermissions && (
        <PermissionManager
          workflowId={workflowId}
          currentPermissions={permissions}
          onClose={() => setShowPermissions(false)}
        />
      )}

      {showSaveModal && (
        <SaveWorkflowModal
          workflowId={workflowId}
          nodes={nodes}
          edges={edges}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showScheduler && workflowId && (
        <SchedulerPanel
          workflowId={workflowId}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  );
}
