import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Play, Eye, Trash2, Upload, AlertCircle, CheckCircle, Clock, Loader,
  Zap, Database, Filter, Calculator, Type, Brain, Trash, GitMerge, Download,
  Lock
} from 'lucide-react';

const NODE_META = {
  upload_csv:            { inputs: 0, category: 'ingestion' },
  upload_excel:          { inputs: 0, category: 'ingestion' },
  read_from_db:          { inputs: 0, category: 'ingestion' },
  join:                  { inputs: 2, category: 'transform' },
  union:                 { inputs: 'multiple', category: 'transform' },
  filter:                { inputs: 1, category: 'transform' },
  safe_filter:           { inputs: 1, category: 'transform' },
  select:                { inputs: 1, category: 'transform' },
  sort:                  { inputs: 1, category: 'transform' },
  rename:                { inputs: 1, category: 'transform' },
  drop:                  { inputs: 1, category: 'transform' },
  reorder:               { inputs: 1, category: 'transform' },
  string_case:           { inputs: 1, category: 'string' },
  string_slice:          { inputs: 1, category: 'string' },
  string_mid:            { inputs: 1, category: 'string' },
  string_concat:         { inputs: 1, category: 'string' },
  string_prefix_suffix:  { inputs: 1, category: 'string' },
  string_clean:          { inputs: 1, category: 'string' },
  math_horizontal:       { inputs: 1, category: 'math' },
  math_custom:           { inputs: 1, category: 'math' },
  math_multiply_bulk:    { inputs: 1, category: 'math' },
  vector_dot_product:    { inputs: 1, category: 'math' },
  vector_linear_multiply:{ inputs: 1, category: 'math' },
  vector_cross_product:  { inputs: 1, category: 'math' },
  drop_na:               { inputs: 1, category: 'cleaning' },
  drop_nulls:            { inputs: 1, category: 'cleaning' },
  drop_duplicates:       { inputs: 1, category: 'cleaning' },
  fill_missing:          { inputs: 1, category: 'cleaning' },
  cast:                  { inputs: 1, category: 'transform' },
  extract_date_parts:    { inputs: 1, category: 'transform' },
  outliers:              { inputs: 1, category: 'transform' },
  groupby:               { inputs: 1, category: 'transform' },
  stats:                 { inputs: 1, category: 'transform' },
  pivot:                 { inputs: 1, category: 'transform' },
  moving_average:        { inputs: 1, category: 'transform' },
  conditional:           { inputs: 1, category: 'transform' },
  transpose:             { inputs: 1, category: 'transform' },
  linear_regression:     { inputs: 1, category: 'ml' },
  logistic_prediction:   { inputs: 1, category: 'ml' },
  correlation:           { inputs: 1, category: 'ml' },
};

const CATEGORY_ICONS = {
  ingestion: Database,
  transform: Filter,
  math: Calculator,
  string: Type,
  ml: Brain,
  cleaning: Trash,
};

export default function CustomNode({ data, selected, id, allNodes, allEdges }) {
  const {
    label, nodeType, status = 'idle', backendNodeId, fileRef, fileName,
    onInspect, onDelete, onRun, onUpload, saveDataframe,
  } = data;

  const meta = NODE_META[nodeType] || { inputs: 1, category: 'transform' };
  const CategoryIcon = CATEGORY_ICONS[meta.category] || Filter;

  const isUploadNode = ['upload_csv', 'upload_excel'].includes(nodeType);
  const isDbNode = nodeType === 'read_from_db';
  const isSourceNode = meta.inputs === 0;

  // ── Label editing ──────────────────────────────────────────────────────
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(label);

  const commitLabel = () => {
    const trimmed = labelDraft.trim();
    if (trimmed && trimmed !== label) {
      data.onLabelChange?.(id, trimmed);
    } else {
      setLabelDraft(label);
    }
    setEditingLabel(false);
  };

  // ── Readiness logic ──────────────────────────────────────────────────────
  // A node is "ready to run" when all required parent nodes have been executed.
  // For upload nodes: ready when a file has been staged (fileRef set).
  // For db nodes: always ready (config drives it).
  // For single-input nodes: parent must have backendNodeId.
  // For join (2 inputs): both parents must have backendNodeId.
  // For union (multiple): at least 2 parents must have backendNodeId.

  let isReady = false;
  let lockReason = '';

  if (isUploadNode) {
    isReady = !!(fileRef || backendNodeId);
    if (!isReady) lockReason = 'Upload a file first';
  } else if (isDbNode) {
    isReady = !!(data.config?.connection_string && data.config?.query);
    if (!isReady) lockReason = 'Configure connection & query';
  } else {
    // Find parent edges from the passed-in allEdges (or data.allEdges fallback)
    const edges = allEdges || data._allEdges || [];
    const nodes = allNodes || data._allNodes || [];
    const parentEdges = edges.filter(e => e.target === id);

    if (meta.inputs === 1) {
      const parent = nodes.find(n => n.id === parentEdges[0]?.source);
      isReady = !!(parent?.data?.backendNodeId);
      if (!isReady) lockReason = 'Execute parent node first';
    } else if (meta.inputs === 2) {
      const parents = parentEdges.map(e => nodes.find(n => n.id === e.source));
      const readyCount = parents.filter(p => p?.data?.backendNodeId).length;
      isReady = readyCount >= 2;
      if (!isReady) lockReason = `${readyCount}/2 inputs executed`;
    } else if (meta.inputs === 'multiple') {
      const parents = parentEdges.map(e => nodes.find(n => n.id === e.source));
      const readyCount = parents.filter(p => p?.data?.backendNodeId).length;
      isReady = readyCount >= 2 && readyCount === parentEdges.length;
      if (!isReady) lockReason = `${readyCount}/${parentEdges.length} inputs executed`;
    }
  }

  const isRunning = status === 'running';
  const isPending = status === 'pending';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isStale = status === 'stale';
  const canInspect = !!(backendNodeId && isSuccess);

  // ── Status styling ────────────────────────────────────────────────────────
  const getNodeClasses = () => {
    const cat = `node-${meta.category}`;
    const st = {
      idle: 'status-idle',
      pending: 'status-pending',
      running: 'status-running',
      success: 'status-success',
      error: 'status-error',
      stale: 'status-stale',
    }[status] || 'status-idle';
    return `${cat} ${st}`;
  };

  const getStatusIcon = () => {
    if (isSuccess) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (isError)   return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (isRunning) return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
    if (isPending) return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
    if (isStale)   return <Zap className="w-4 h-4 text-orange-400" />;
    return null;
  };

  // ── Input handles ─────────────────────────────────────────────────────────
  const renderInputHandles = () => {
    if (meta.inputs === 0) return null;
    if (meta.inputs === 1) return (
      <Handle type="target" position={Position.Left}
        className="w-3 h-3 bg-slate-600 border-2 border-slate-400 hover:border-cyan-400 transition-colors" />
    );
    if (meta.inputs === 2) return (
      <>
        <Handle type="target" position={Position.Left} id="input1" style={{ top: '30%' }}
          className="w-3 h-3 bg-slate-600 border-2 border-slate-400 hover:border-cyan-400 transition-colors" />
        <Handle type="target" position={Position.Left} id="input2" style={{ top: '70%' }}
          className="w-3 h-3 bg-slate-600 border-2 border-slate-400 hover:border-cyan-400 transition-colors" />
      </>
    );
    return (
      <Handle type="target" position={Position.Left}
        className="w-4 h-8 bg-slate-600 border-2 border-slate-400 rounded-r-full hover:border-cyan-400 transition-colors" />
    );
  };

  return (
    <div className={`
      relative min-w-[220px] rounded-xl border-2 backdrop-blur-sm transition-all duration-300
      ${getNodeClasses()}
      ${selected ? 'ring-2 ring-cyan-400/50 shadow-glow' : ''}
      ${isStale ? 'opacity-75' : ''}
      hover:shadow-lg
    `}>
      {renderInputHandles()}

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-current/20">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-current/20 flex items-center justify-center flex-shrink-0">
            <CategoryIcon className="w-4 h-4" />
          </div>
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={e => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setLabelDraft(label); setEditingLabel(false); } }}
              className="flex-1 bg-slate-700 border border-cyan-500 rounded px-1 py-0.5 text-white text-sm focus:outline-none min-w-0"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <h3
              className="font-semibold text-white text-sm truncate max-w-[130px] cursor-text hover:text-cyan-300 transition-colors"
              title="Double-click to rename"
              onDoubleClick={e => { e.stopPropagation(); setLabelDraft(label); setEditingLabel(true); }}
            >
              {label}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {saveDataframe && (
            <div title="Output saved on run" className="w-4 h-4 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-teal-400" />
            </div>
          )}
          {getStatusIcon()}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* File staged indicator */}
        {isUploadNode && fileRef && !backendNodeId && (
          <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">
            <span className="truncate block">📁 {fileName}</span>
            <span className="text-blue-400">Ready — click ▶ to execute</span>
          </div>
        )}

        {/* Upload required */}
        {isUploadNode && !fileRef && !backendNodeId && (
          <div className="p-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300 animate-pulse">
            <Upload className="w-3 h-3 inline mr-1" />Upload required
          </div>
        )}

        {/* Locked indicator */}
        {!isSourceNode && !isReady && !isSuccess && !isError && (
          <div className="p-2 bg-slate-700/50 border border-slate-600 rounded text-xs text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />{lockReason}
          </div>
        )}

        {/* Stale */}
        {isStale && (
          <div className="p-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300">
            <Zap className="w-3 h-3 inline mr-1" />Needs re-execution
          </div>
        )}

        {/* Error */}
        {isError && data.error && (
          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            <span className="line-clamp-2">{data.error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Upload button — always visible for upload nodes */}
            {isUploadNode && (
              <button
                onClick={() => onUpload?.(id)}
                className="flex items-center justify-center w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all hover:scale-110"
                title={fileRef || backendNodeId ? 'Replace file' : 'Upload file'}
              >
                <Upload className="w-4 h-4" />
              </button>
            )}

            {/* Run button — visible when ready or already executed */}
            {(isReady || isSuccess || isError || isStale) && (
              <button
                onClick={() => onRun?.(id)}
                disabled={isRunning || isPending}
                className="flex items-center justify-center w-8 h-8 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
                title={isSuccess ? 'Re-run node' : 'Run node'}
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {/* View button */}
            {canInspect && (
              <button
                onClick={() => onInspect?.(id)}
                className="flex items-center justify-center w-8 h-8 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all hover:scale-110"
                title="View data"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {/* Download button */}
            {backendNodeId && (
              <button
                onClick={() => data.onDownload?.(id)}
                className="flex items-center justify-center w-8 h-8 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all hover:scale-110"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Delete button — only when onDelete is provided */}
          {data.onDelete && (
            <button
              onClick={() => onDelete?.(id)}
              className="flex items-center justify-center w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all hover:scale-110"
              title="Delete node"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Backend ID */}
        {backendNodeId && (
          <div className="pt-1 border-t border-current/20">
            <div className="text-xs text-slate-500 font-mono truncate">{backendNodeId}</div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right}
        className="w-3 h-3 bg-slate-600 border-2 border-slate-400 hover:border-cyan-400 transition-colors" />
    </div>
  );
}
