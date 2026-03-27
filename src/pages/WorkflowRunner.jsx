import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader } from 'lucide-react';
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState, ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNodes from '../components/CustomNodes';
import DataPreviewModal from '../components/DataPreviewModal';
import FileUploadModal from '../components/FileUploadModal';
import VersionHistoryTab from '../components/VersionHistoryTab';
import { useWorkflowRunner } from '../hooks/useWorkflowRunner';
import { workflowApi } from '../services/workflow.js';
import { authService } from '../services/auth.js';
import { storeFile } from '../utils/fileStorage';
import { downloadNodeData } from '../services/api';

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#64748b' },
  type: 'smoothstep',
};

export default function WorkflowRunnerPage() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null;
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingNode, setUploadingNode] = useState(null);
  const [permissions, setPermissions] = useState({ role: 'runner', canEdit: false, canRun: true });
  const [activeTab, setActiveTab] = useState('canvas');
  const [activeVersionId, setActiveVersionId] = useState(null);
  const { runWorkflow, runSingleNode, isRunning } = useWorkflowRunner();

  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // Inject context for readiness computation in CustomNodes
  const nodesLiveRef = useRef(nodes);
  const edgesLiveRef = useRef(edges);
  nodesLiveRef.current = nodes;
  edgesLiveRef.current = edges;

  const nodeTypesWithContext = useMemo(() => ({
    custom: (props) => <CustomNodes {...props} allNodes={nodesLiveRef.current} allEdges={edgesLiveRef.current} />
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []); // stable — never recreated

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
    let node;
    setNodes(nds => { node = nds.find(n => n.id === nodeId); return nds; });
    if (!node?.data?.backendNodeId) { alert('Node must be executed first'); return; }
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

  const handleUploadFile = useCallback((nodeId) => {
    setNodes((currentNodes) => {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node) { setUploadingNode(node); setShowFileUpload(true); }
      return currentNodes;
    });
  }, []);

  const handleRunNode = useCallback(async (nodeId) => {
    let currentNodes, currentEdges;
    setNodes(nds => { currentNodes = nds; return nds; });
    setEdges(eds => { currentEdges = eds; return eds; });
    await runSingleNode(nodeId, currentNodes, currentEdges, setNodes, true);
  }, [runSingleNode]);

  const handleFileUploaded = useCallback((file) => {
    if (uploadingNode) {
      const fileRef = `file_${uploadingNode.id}_${Date.now()}`;
      storeFile(fileRef, file);
      setNodes((nds) => nds.map(node =>
        node.id === uploadingNode.id
          ? { ...node, data: { ...node.data, fileRef, fileName: file.name, status: 'idle', metadata: null } }
          : node
      ));
    }
    setShowFileUpload(false);
    setUploadingNode(null);
  }, [uploadingNode]);

  const handleRunWorkflow = async () => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const uploadNodes = currentNodes.filter(n => ['upload_csv', 'upload_excel'].includes(n.data.nodeType));
    const missingUploads = uploadNodes.filter(n => !n.data.fileRef && !n.data.backendNodeId);
    if (missingUploads.length > 0) {
      const first = missingUploads[0];
      alert(`Please upload a file for "${first.data.label}" before running`);
      setUploadingNode(first);
      setShowFileUpload(true);
      return;
    }

    let finalNodes = currentNodes;
    const setNodesAndCapture = (updater) => {
      const updated = typeof updater === 'function' ? updater(finalNodes) : updater;
      finalNodes = updated;
      setNodes(updated);
    };

    await runWorkflow(currentNodes, currentEdges, setNodesAndCapture, workflowId);

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
      await workflowApi.createRun(workflowId, activeVersionId, currentUser.username, status, savedNodes);
    } catch (e) {
      console.error('Failed to record run:', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!workflowId) return;
      try {
        const currentUser = authService.getUser();
        const [access, workflows, versions] = await Promise.all([
          workflowApi.checkAccess(workflowId, currentUser.id),
          workflowApi.getUserWorkflows(currentUser.id),
          workflowApi.getVersions(workflowId)
        ]);
        setPermissions({ role: access.access, canEdit: false, canRun: access.can_run });

        // Track the latest version id for run recording
        if (versions?.length > 0) {
          setActiveVersionId(versions[0].id); // versions are ordered desc
        }

        const workflow = workflows.find(w => w.id === workflowId);
        if (workflow?.workflow_data) {
          const data = JSON.parse(workflow.workflow_data);
          if (data.nodes) {
            setNodes(data.nodes.map(node => ({
              ...node,
              data: {
                ...node.data,
                backendNodeId: null,
                status: 'idle',
                metadata: null,
                onInspect: handleInspectNode,
                onDownload: handleDownloadNode,
                onUpload: handleUploadFile,
                onRun: handleRunNode,
                onDelete: null,
                onClearData: null,
                onSaveToHistory: () => {},
                onLabelChange: null,
              }
            })));
          }
          if (data.edges) setEdges(data.edges);
        }
      } catch (error) {
        console.error('Failed to load workflow:', error);
      }
    };
    load();
  }, [workflowId]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-slate-600" />
          <div>
            <h1 className="text-xl font-semibold text-white">Run Workflow</h1>
            <p className="text-sm text-slate-400">{workflowId} • {permissions.role} access</p>
          </div>
        </div>

        <button
          onClick={handleRunWorkflow}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {isRunning ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Running...' : 'Run Workflow'}</span>
        </button>
      </header>

      <div className="flex items-center space-x-1 px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        {['canvas', 'versions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab === 'canvas' ? 'Workflow' : 'Versions & History'}
          </button>
        ))}
      </div>

      {activeTab === 'canvas' && (
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypesWithContext}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            fitView
            className="workflow-canvas"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#334155" gap={20} size={1} variant="dots" />
            <Controls className="glass-dark" showInteractive={false} />
            <MiniMap className="glass-dark" maskColor="rgba(15, 23, 42, 0.8)" />
          </ReactFlow>
        </div>
      )}
      {activeTab === 'versions' && (
        <VersionHistoryTab workflowId={workflowId} nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />
      )}

      {showDataPreview && selectedNode && (
        <DataPreviewModal node={selectedNode} onClose={() => setShowDataPreview(false)} />
      )}

      {showFileUpload && uploadingNode && (
        <FileUploadModal
          node={uploadingNode}
          onClose={() => setShowFileUpload(false)}
          onFileUploaded={handleFileUploaded}
        />
      )}
    </div>
  );
}
