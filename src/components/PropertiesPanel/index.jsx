import React, { useState, useEffect, useCallback } from 'react';
import {
  FormField, SelectField, TextAreaField, CheckboxField,
  JSONField, DynamicFilterField,
  ColumnDropdownField, ColumnPickerField, OrderedColumnPickerField,
  RenameMappingField, GroupByAggsField, ConditionalBuilder, LogisticWeightsField
} from './FormFields';
import { SafeFilterBuilder } from './SafeFilterBuilder';
import { nodeConfigs } from './nodeConfigs';
import { Upload, Trash2, FileText, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getNodeColumns, getColumnValues } from '../../services/api';
import axios from 'axios';

export function PropertiesPanel({ selectedNode, onUpdateNode, onUploadClick, onClearData, nodes, edges }) {
  const [config, setConfig] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [columnValues, setColumnValues] = useState([]);

  // ── Sync config when node changes ────────────────────────────────────────
  useEffect(() => {
    // Clear columns immediately on node change — prevents stale columns
    // from a previously selected node showing on a newly selected unconnected node
    setAvailableColumns([]);
    setColumnValues([]);

    if (selectedNode?.data?.config) {
      setConfig(selectedNode.data.config);
    } else {
      const nodeConfig = nodeConfigs[selectedNode?.data?.nodeType];
      const defaults = {};
      nodeConfig?.fields?.forEach(f => { if (f.default !== undefined) defaults[f.key] = f.default; });
      setConfig(defaults);
    }
  }, [selectedNode?.id]);

  // ── Fetch parent columns ──────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      if (!selectedNode) return;
      const parentEdge = edges.find(e => e.target === selectedNode.id);
      if (!parentEdge) { setAvailableColumns([]); return; }
      const parentNode = nodes.find(n => n.id === parentEdge.source);
      if (!parentNode?.data?.backendNodeId) { setAvailableColumns([]); return; }
      try {
        const res = await getNodeColumns(parentNode.data.backendNodeId);
        setAvailableColumns(res.columns || []);
      } catch { setAvailableColumns([]); }
    };
    fetch();
  }, [selectedNode?.id, nodes, edges]);

  // ── Fetch column values for filter node ──────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      if (selectedNode?.data?.nodeType !== 'filter' || !config.column) {
        setColumnValues([]); return;
      }
      const parentEdge = edges.find(e => e.target === selectedNode.id);
      const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.source) : null;
      if (!parentNode?.data?.backendNodeId) { setColumnValues([]); return; }
      try {
        const res = await getColumnValues(parentNode.data.backendNodeId, config.column);
        setColumnValues(res.values || []);
      } catch { setColumnValues([]); }
    };
    fetch();
  }, [config.column, selectedNode?.id, nodes, edges]);

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      // Only reset value when column changes on the legacy filter node
      if (key === 'column' && selectedNode?.data?.nodeType === 'filter') {
        next.value = next.operator === 'in' ? [] : '';
      } else if (key === 'operator' && selectedNode?.data?.nodeType === 'filter') {
        next.value = value === 'in' ? [] : '';
      }
      // Use functional update in onUpdateNode to avoid stale selectedNode.data
      onUpdateNode?.(selectedNode.id, (nodeData) => ({ ...nodeData, config: next }));
      return next;
    });
  }, [selectedNode?.id, selectedNode?.data?.nodeType, onUpdateNode]);

  if (!selectedNode) {
    return (
      <div className="h-full bg-slate-900/50 p-4 flex flex-col items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }

  const nodeType = selectedNode.data.nodeType;
  const nodeConfig = nodeConfigs[nodeType];
  const isUploadNode = ['upload_csv', 'upload_excel'].includes(nodeType);
  const isDbNode = nodeType === 'read_from_db';
  const isSourceNode = isUploadNode || isDbNode;

  // ── Status badge ──────────────────────────────────────────────────────────
  const StatusBadge = () => {
    const s = selectedNode.data.status || 'idle';
    const map = {
      success: { cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', icon: <CheckCircle className="w-3 h-3" /> },
      error:   { cls: 'bg-red-500/10 border-red-500/30 text-red-400',             icon: <AlertCircle className="w-3 h-3" /> },
      running: { cls: 'bg-blue-500/10 border-blue-500/30 text-blue-400',           icon: <Clock className="w-3 h-3 animate-spin" /> },
      pending: { cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',     icon: <Clock className="w-3 h-3" /> },
      stale:   { cls: 'bg-orange-500/10 border-orange-500/30 text-orange-400',     icon: null },
      idle:    { cls: 'bg-slate-800/50 border-slate-700 text-slate-400',           icon: null },
    };
    const { cls, icon } = map[s] || map.idle;
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 border rounded text-xs font-medium capitalize ${cls}`}>
        {icon}{s}
      </div>
    );
  };

  // ── Field renderer ────────────────────────────────────────────────────────
  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <FormField key={field.key} label={field.label} required={field.required}
            value={config[field.key] || ''} onChange={v => updateConfig(field.key, v)}
            placeholder={field.placeholder} helpText={field.helpText} />
        );

      case 'number':
        return (
          <FormField key={field.key} label={field.label} required={field.required} type="number"
            value={config[field.key] ?? field.default ?? ''}
            onChange={v => updateConfig(field.key, parseFloat(v) || 0)}
            placeholder={field.placeholder} step={field.step} helpText={field.helpText} />
        );

      case 'select': {
        const val = config[field.key] !== undefined ? config[field.key] : field.default;
        return (
          <SelectField key={field.key} label={field.label} required={field.required}
            value={val} onChange={v => updateConfig(field.key, v)} options={field.options || []} />
        );
      }

      case 'column_dropdown':
        return (
          <ColumnDropdownField key={field.key} label={field.label} required={field.required}
            value={config[field.key] || ''} onChange={v => updateConfig(field.key, v)}
            availableColumns={availableColumns} placeholder={field.placeholder} helpText={field.helpText} />
        );

      case 'column_picker':
        return (
          <ColumnPickerField key={field.key} label={field.label} required={field.required}
            value={config[field.key] || []} onChange={v => updateConfig(field.key, v)}
            availableColumns={availableColumns} placeholder={field.placeholder} helpText={field.helpText} />
        );

      case 'ordered_column_picker':
        return (
          <OrderedColumnPickerField key={field.key} label={field.label} required={field.required}
            value={config[field.key] || []} onChange={v => updateConfig(field.key, v)}
            availableColumns={availableColumns} helpText={field.helpText} />
        );

      case 'rename_mapping':
        return (
          <RenameMappingField key={field.key} label={field.label} required={field.required}
            value={config[field.key] ?? {}} onChange={v => updateConfig(field.key, v)}
            availableColumns={availableColumns} />
        );

      case 'groupby_aggs':
        return (
          <GroupByAggsField key={field.key} label={field.label} required={field.required}
            value={config[field.key] ?? {}} onChange={v => updateConfig(field.key, v)}
            availableColumns={availableColumns} />
        );

      case 'conditional_builder': {
        const condValue = {
          col: config._cond_col || '', op: config._cond_op || 'gt',
          threshold: config._cond_threshold || '', then_val: config.then_val || '',
          else_val: config.else_val || '', new_col: config.new_col || ''
        };
        return (
          <div key={field.key}>
            <label className="block text-sm text-slate-300 mb-2">
              {field.label} {field.required && <span className="text-red-400">*</span>}
            </label>
            <ConditionalBuilder value={condValue} availableColumns={availableColumns}
              onChange={val => {
                const next = {
                  ...config,
                  _cond_col: val.col, _cond_op: val.op, _cond_threshold: val.threshold,
                  then_val: val.then_val, else_val: val.else_val, new_col: val.new_col
                  // No condition_expr — backend builds it safely
                };
                setConfig(next);
                onUpdateNode?.(selectedNode.id, (d) => ({ ...d, config: next }));
              }} />
          </div>
        );
      }

      case 'logistic_weights': {
        const logValue = { features: config.features || [], weights: config.weights || [] };
        return (
          <LogisticWeightsField key={field.key} value={logValue} availableColumns={availableColumns}
            onChange={val => {
              const next = { ...config, features: val.features, weights: val.weights };
              setConfig(next);
              onUpdateNode?.(selectedNode.id, (d) => ({ ...d, config: next }));
            }} />
        );
      }

      case 'dynamic_filter':
        return (
          <DynamicFilterField key={field.key} label={field.label} required={field.required}
            value={config[field.key]} onChange={v => updateConfig(field.key, v)}
            availableValues={columnValues} operator={config.operator} />
        );

      case 'safe_filter_builder': {
        const parentEdge = edges.find(e => e.target === selectedNode.id);
        const parentNode = parentEdge ? nodes.find(n => n.id === parentEdge.source) : null;
        const parentBackendId = parentNode?.data?.backendNodeId;

        // Reconstruct the { filters, logic } object from the two separate config keys
        // config.filters = the filters array, config.logic = 'and'|'or'
        const sfValue = {
          filters: Array.isArray(config.filters) ? config.filters : [],
          logic: config.logic || 'and'
        };

        if (!parentBackendId) {
          return (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm text-slate-300">{field.label}</label>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs">
                ⚠️ Execute the parent node first to load column information.
                {sfValue.filters?.length > 0 && sfValue.filters[0]?.column && (
                  <div className="mt-1 text-amber-300">📋 Your saved filters are preserved.</div>
                )}
              </div>
              {/* Show saved filters in read-only mode so user knows they are configured */}
              {sfValue.filters?.length > 0 && sfValue.filters[0]?.column && (
                <div className="space-y-1">
                  {sfValue.filters.map((f, i) => (
                    <div key={i} className="px-2 py-1 bg-slate-700/30 border border-slate-600 rounded text-xs text-slate-300 font-mono">
                      {f.column} {f.operation} {Array.isArray(f.value) ? f.value.join(', ') : f.value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <SafeFilterBuilder
            key={`${field.key}_${parentBackendId}`}
            nodeId={parentBackendId}
            value={sfValue}
            onChange={val => {
              // Store filters and logic as separate keys in config
              const next = { ...config, filters: val.filters, logic: val.logic };
              setConfig(next);
              onUpdateNode?.(selectedNode.id, (d) => ({ ...d, config: next }));
            }}
            api={axios}
          />
        );
      }

      case 'textarea':
        return (
          <TextAreaField key={field.key} label={field.label} required={field.required}
            value={config[field.key] || ''} onChange={v => updateConfig(field.key, v)}
            placeholder={field.placeholder} rows={field.rows} helpText={field.helpText} />
        );

      case 'checkbox':
        return (
          <CheckboxField key={field.key} label={field.label}
            checked={config[field.key] || false} onChange={v => updateConfig(field.key, v)} />
        );

      case 'json':
        return (
          <JSONField key={field.key} label={field.label} required={field.required}
            value={config[field.key] ?? field.default} onChange={v => updateConfig(field.key, v)}
            placeholder={field.placeholder} helpText={field.helpText} />
        );

      case 'hidden':
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-slate-900/50 border-l border-slate-700/50 flex flex-col overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-white">Properties</h2>
        <StatusBadge />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Node name (always editable) ── */}
        <div className="space-y-1">
          <label className="block text-xs text-slate-500 uppercase tracking-wider">Node Name</label>
          <input
            type="text"
            defaultValue={selectedNode.data.label}
            key={selectedNode.id + '_label'}
            onBlur={e => {
              const v = e.target.value.trim();
              if (v && v !== selectedNode.data.label) {
                onUpdateNode?.(selectedNode.id, (d) => ({ ...d, label: v }));
              }
            }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none transition-colors"
            placeholder="Node name"
          />
          <p className="text-xs text-slate-500">Press Enter or click away to rename</p>
        </div>

        {/* ── Node identity ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Node Type</span>
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{nodeType}</span>
          </div>
          {selectedNode.data.backendNodeId && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Backend ID</span>
              <span className="text-xs font-mono text-slate-400 truncate max-w-[160px]">{selectedNode.data.backendNodeId}</span>
            </div>
          )}
          {availableColumns.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Input Columns ({availableColumns.length})</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {availableColumns.slice(0, 12).map(c => (
                  <span key={c} className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">{c}</span>
                ))}
                {availableColumns.length > 12 && (
                  <span className="text-xs text-slate-500">+{availableColumns.length - 12} more</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50" />

        {/* ── Upload node section ── */}
        {isUploadNode && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">File</h3>

            {selectedNode.data.fileName ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-blue-300 truncate">{selectedNode.data.fileName}</span>
                </div>
                {selectedNode.data.backendNodeId && selectedNode.data.metadata && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>Rows: <span className="text-white">{selectedNode.data.metadata.row_count?.toLocaleString() ?? '—'}</span></span>
                    <span>Cols: <span className="text-white">{selectedNode.data.metadata.column_count ?? '—'}</span></span>
                  </div>
                )}
                {!selectedNode.data.backendNodeId && (
                  <p className="text-xs text-blue-400">Click ▶ on the node to execute</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs text-orange-300">
                No file uploaded yet
              </div>
            )}

            <button
              onClick={() => onUploadClick?.(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              {selectedNode.data.fileName ? 'Replace File' : 'Upload File'}
            </button>

            {selectedNode.data.backendNodeId && (
              <button
                onClick={() => onClearData?.(selectedNode.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-600/80 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />Clear Data
              </button>
            )}

            {/* Excel sheet name */}
            {nodeType === 'upload_excel' && (
              <FormField label="Sheet Name" value={config.sheet_name || 'Sheet1'}
                onChange={v => updateConfig('sheet_name', v)} placeholder="Sheet1"
                helpText="Sheet to read from the Excel file" />
            )}
          </div>
        )}

        {/* ── DB node section ── */}
        {isDbNode && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database</h3>
            {selectedNode.data.backendNodeId && selectedNode.data.metadata && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 space-y-1">
                <div>Rows: <span className="text-white">{selectedNode.data.metadata.row_count?.toLocaleString() ?? '—'}</span></div>
                <div>Cols: <span className="text-white">{selectedNode.data.metadata.column_count ?? '—'}</span></div>
              </div>
            )}
          </div>
        )}

        {/* ── Save dataframe toggle (all nodes) ── */}
        {nodeType && (
          <>
            <div className="border-t border-slate-700/50" />
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm text-slate-300 font-medium">Save output on run</div>
                <div className="text-xs text-slate-500">Viewable in version history</div>
              </div>
              <div
                onClick={() => onUpdateNode?.(selectedNode.id, (d) => ({ ...d, saveDataframe: !d.saveDataframe }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  selectedNode.data.saveDataframe ? 'bg-teal-500' : 'bg-slate-600'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  selectedNode.data.saveDataframe ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
            </label>
          </>
        )}

        {/* ── Configuration fields ── */}
        {nodeConfig && nodeConfig.fields.length > 0 && (
          <>
            <div className="border-t border-slate-700/50" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Configuration</h3>
              <div className="space-y-4">
                {nodeConfig.fields.map(renderField)}
              </div>
            </div>
          </>
        )}

        {/* ── Execution result summary ── */}
        {selectedNode.data.status === 'success' && selectedNode.data.metadata && (
          <>
            <div className="border-t border-slate-700/50" />
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Output</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-800/50 rounded text-center">
                  <div className="text-lg font-bold text-white">{selectedNode.data.metadata.row_count?.toLocaleString() ?? '—'}</div>
                  <div className="text-xs text-slate-400">Rows</div>
                </div>
                <div className="p-2 bg-slate-800/50 rounded text-center">
                  <div className="text-lg font-bold text-white">{selectedNode.data.metadata.column_count ?? '—'}</div>
                  <div className="text-xs text-slate-400">Columns</div>
                </div>
              </div>
              {selectedNode.data.metadata.columns && (
                <div className="flex flex-wrap gap-1">
                  {selectedNode.data.metadata.columns.slice(0, 10).map(c => (
                    <span key={c} className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">{c}</span>
                  ))}
                  {selectedNode.data.metadata.columns.length > 10 && (
                    <span className="text-xs text-slate-500">+{selectedNode.data.metadata.columns.length - 10} more</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Error detail ── */}
        {selectedNode.data.status === 'error' && selectedNode.data.error && (
          <>
            <div className="border-t border-slate-700/50" />
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Execution Error</span>
              </div>
              <p className="text-xs text-red-300">{selectedNode.data.error}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
