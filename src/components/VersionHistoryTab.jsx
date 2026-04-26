import React, { useState, useEffect } from 'react';
import { GitBranch, Clock, User, ChevronRight, CheckCircle, XCircle, Download, X, Play } from 'lucide-react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, ConnectionMode } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNodes from './CustomNodes';
import { workflowApi } from '../services/workflow';
import { downloadNodeData } from '../services/api';

const nodeTypes = { custom: CustomNodes };

export default function VersionHistoryTab({ workflowId }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    workflowApi.getVersions(workflowId)
      .then(setVersions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workflowId]);

  if (selectedVersion) {
    return (
      <VersionCanvasView
        workflowId={workflowId}
        version={selectedVersion}
        onBack={() => setSelectedVersion(null)}
      />
    );
  }

  return (
    <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Version History</h2>
          <p className="text-slate-400 text-sm">Click a version to view its workflow and run history</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No versions saved yet</h3>
            <p className="text-slate-400">Save the workflow to create the first version</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version, idx) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/40 hover:bg-slate-700/50 transition-all text-left"
              >
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-medium">Version {version.version_number}</span>
                  {idx === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full">Latest</span>
                  )}
                  {version.comment && (
                    <span className="text-slate-400 text-sm">— {version.comment}</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{version.created_by}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(version.created_at).toLocaleString()}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionCanvasView({ workflowId, version, onBack }) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [clickedNode, setClickedNode] = useState(null);
  const [versionData, setVersionData] = useState(null);
  const [downloadingNode, setDownloadingNode] = useState(null);

  // savedNodeIds for the selected run
  const savedNodes = selectedRun ? JSON.parse(selectedRun.saved_nodes || '[]') : [];
  const savedNodeIds = new Set(savedNodes.map(s => s.node_id));

  useEffect(() => {
    // Load version workflow data and runs in parallel
    Promise.all([
      workflowApi.downloadVersion(workflowId, version.id).then(b => b.text()).then(JSON.parse),
      workflowApi.getVersionRuns(workflowId, version.id)
    ]).then(([data, runList]) => {
      setVersionData(data);
      setRuns(runList);
      buildCanvas(data, new Set());
    }).catch(console.error);
  }, [version.id]);

  // Rebuild canvas whenever selectedRun changes
  useEffect(() => {
    if (!versionData) return;
    // Recompute savedNodeIds here so the effect always uses the current selectedRun (#15)
    const currentSavedNodes = selectedRun ? JSON.parse(selectedRun.saved_nodes || '[]') : [];
    const currentSavedNodeIds = new Set(currentSavedNodes.map(s => s.node_id));
    buildCanvas(versionData, currentSavedNodeIds);
  }, [selectedRun, versionData]);

  const buildCanvas = (data, highlightedIds) => {
    if (!data?.nodes) return;
    const mapped = data.nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        status: highlightedIds.has(n.id) ? 'saved' : 'idle',
        backendNodeId: null,
        onInspect: () => {}, onDownload: () => {}, onUpload: () => {},
        onDelete: () => {}, onRun: () => {}, onClearData: () => {}, onSaveToHistory: () => {},
      },
      style: n.data?.saveDataframe
        ? { ...n.style, border: '2px solid #14b8a6', boxShadow: '0 0 10px rgba(20,184,166,0.35)', cursor: 'pointer' }
        : n.style,
    }));
    setNodes(mapped);
    setEdges(data.edges || []);
  };

  const onNodeClick = (_, node) => {
    if (!node.data?.saveDataframe) return;
    const saved = savedNodes.find(s => s.node_id === node.id);
    if (saved) setClickedNode({ ...saved, label: node.data.label });
  };

  const handleDownload = async (savedNode) => {
    if (downloadingNode) return;
    setDownloadingNode(savedNode.backend_node_id);
    try {
      const blob = await downloadNodeData(savedNode.backend_node_id, 'csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = savedNode.filename || `${savedNode.backend_node_id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Download failed: ' + e.message);
    } finally {
      setDownloadingNode(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/70 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← Back</button>
          <div className="h-4 w-px bg-slate-600" />
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-medium">Version {version.version_number}</span>
          {version.comment && <span className="text-slate-400 text-sm">— {version.comment}</span>}
        </div>

        {/* Run selector */}
        <div className="flex items-center space-x-2">
          {runs.length > 0 ? (
            <>
              <span className="text-slate-400 text-xs">View run:</span>
              <select
                value={selectedRun?.id || ''}
                onChange={e => {
                  const run = runs.find(r => r.id === parseInt(e.target.value));
                  setSelectedRun(run || null);
                  setClickedNode(null);
                }}
                className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1"
              >
                <option value="">— workflow only —</option>
                {runs.map(r => (
                  <option key={r.id} value={r.id}>
                    Run #{r.id} · {r.status} · {new Date(r.run_at).toLocaleString()}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="text-slate-500 text-xs">No runs recorded for this version</span>
          )}
          {nodes.some(n => n.data?.saveDataframe) && (
            <span className="text-teal-400 text-xs ml-2">Teal = save enabled — click to download</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#334155" gap={20} size={1} variant="dots" />
          <Controls className="glass-dark" showInteractive={false} />
        </ReactFlow>

        {/* File download panel */}
        {clickedNode && (
          <div className="absolute bottom-6 right-6 bg-slate-800 border border-teal-500/40 rounded-xl p-5 w-72 shadow-2xl z-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">{clickedNode.label}</h4>
              <button onClick={() => setClickedNode(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-sm text-slate-400 mb-4">
              <p><span className="text-slate-300">File:</span> {clickedNode.filename}</p>
              {clickedNode.rows && <p><span className="text-slate-300">Rows:</span> {Number(clickedNode.rows).toLocaleString()}</p>}
              {clickedNode.columns && <p><span className="text-slate-300">Columns:</span> {clickedNode.columns}</p>}
              <p><span className="text-slate-300">Saved by:</span> {clickedNode.saved_by}</p>
            </div>
            <button
              onClick={() => handleDownload(clickedNode)}
              disabled={!!downloadingNode}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${downloadingNode ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
            >
              {downloadingNode ? (
                <><div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />Downloading...</>
              ) : (
                <><Download className="w-4 h-4" />Download CSV</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
