import React, { useState, useEffect, useRef } from 'react';
import { SelectField, DynamicFilterField } from './FormFields';

export function SafeFilterBuilder({ nodeId, value, onChange, api }) {
  const [columnInfo, setColumnInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialise from value prop — value is always { filters: [...], logic: 'and'|'or' }
  const [filters, setFilters] = useState(
    () => (Array.isArray(value?.filters) && value.filters.length > 0)
      ? value.filters
      : [{ column: '', operation: '', value: '', column_type: 'numeric' }]
  );
  const [logic, setLogic] = useState(value?.logic || 'and');
  const isMounted = useRef(false);

  // Sync filters/logic when value prop changes (e.g. node re-selected with saved config)
  useEffect(() => {
    if (Array.isArray(value?.filters) && value.filters.length > 0) {
      setFilters(value.filters);
    }
    if (value?.logic) setLogic(value.logic);
    // Reset mount guard so the sync doesn't trigger an onChange
    isMounted.current = false;
  // Only re-sync when nodeId changes (different node selected)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  useEffect(() => {
    if (nodeId) {
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      api.get(`/nodes/${nodeId}/column_info`, { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          setColumnInfo(res.data.columns || {});
          setLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          setLoading(false);
          if (err.name === 'AbortError') {
            setError('Request timed out. Please try executing the parent node first.');
          } else if (err.response?.status === 404) {
            setError('Parent node not found. Please execute the parent node first.');
          } else {
            setError('Failed to load column information. Please execute the parent node first.');
          }
          setColumnInfo({});
        });

      return () => { clearTimeout(timeoutId); controller.abort(); };
    } else {
      setColumnInfo({});
      setLoading(false);
      setError(null);
    }
  }, [nodeId, api]);

  useEffect(() => {
    // Skip the first render — only propagate changes the user actually makes (#8)
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    onChange({ filters, logic });
  }, [filters, logic]);

  const addFilter = () => {
    setFilters([...filters, { column: '', operation: '', value: '', column_type: 'numeric' }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, field, val) => {
    const updated = [...filters];
    updated[index][field] = val;
    
    if (field === 'column' && columnInfo[val]) {
      updated[index].column_type = columnInfo[val].type;
      updated[index].operation = '';
      updated[index].value = '';
    }
    
    setFilters(updated);
  };

  const getOperations = (columnType) => {
    if (columnType === 'numeric') {
      return [
        { value: 'gt', label: '>' },
        { value: 'gte', label: '>=' },
        { value: 'lt', label: '<' },
        { value: 'lte', label: '<=' },
        { value: 'eq', label: '=' },
        { value: 'ne', label: '!=' },
        { value: 'between', label: 'Between' },
        { value: 'in', label: 'In List' }
      ];
    } else {
      return [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'starts_with', label: 'Starts With' },
        { value: 'ends_with', label: 'Ends With' },
        { value: 'in', label: 'In List' }
      ];
    }
  };

  const columns = Object.keys(columnInfo);

  if (!nodeId) {
    // Only show warning if no filters are configured yet
    if (!filters.length || filters[0].column === '') {
      return (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-sm">
          ⚠️ Please execute the parent node first to enable filter configuration.
        </div>
      );
    }
    // If filters are already configured, show them in read-only mode
    return (
      <div className="space-y-3">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
          ℹ️ Filter is configured and ready to run. Execute the workflow to apply filters.
        </div>
        {/* Show configured filters in read-only mode */}
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div key={index} className="p-2 bg-slate-700/20 border border-slate-600 rounded text-sm">
              <span className="text-slate-300">
                {filter.column} {filter.operation} {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-700/20 border border-slate-600 rounded text-slate-400 text-sm">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
          <span>Loading column information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // If filters are already configured, show them in read-only mode with error info
    if (filters.length && filters[0].column !== '') {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-sm">
            ⚠️ {error}
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-sm">
            ℹ️ Your filter configuration is preserved and will work when the workflow runs.
          </div>
          {/* Show configured filters in read-only mode */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Configured Filters</label>
            {filters.map((filter, index) => (
              <div key={index} className="p-2 bg-slate-700/20 border border-slate-600 rounded text-sm">
                <span className="text-slate-300">
                  {filter.column} {filter.operation} {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                </span>
              </div>
            ))}
            {filters.length > 1 && (
              <div className="text-xs text-slate-400">
                Combined with: {logic.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
        <div className="flex items-center justify-between">
          <span>❌ {error}</span>
          <button
            onClick={() => {
              if (nodeId) {
                setLoading(true);
                setError(null);
                api.get(`/nodes/${nodeId}/column_info`)
                  .then(res => {
                    setColumnInfo(res.data.columns || {});
                    setLoading(false);
                  })
                  .catch(() => {
                    setLoading(false);
                    setError('Failed to load column information. Please execute the parent node first.');
                  });
              }
            }}
            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-sm">
        ⚠️ No columns found. Please ensure the parent node has been executed and contains data.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-slate-300">Filters</label>
        <button
          type="button"
          onClick={addFilter}
          className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded"
        >
          + Add Filter
        </button>
      </div>

      {filters.map((filter, index) => (
        <div key={index} className="p-3 bg-slate-700/20 border border-slate-600 rounded space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Filter {index + 1}</span>
            {filters.length > 1 && (
              <button
                type="button"
                onClick={() => removeFilter(index)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>

          <SelectField
            label="Column"
            value={filter.column}
            onChange={(val) => updateFilter(index, 'column', val)}
            options={columns.map(col => ({ value: col, label: col }))}
          />

          {filter.column && (
            <SelectField
              label="Operation"
              value={filter.operation}
              onChange={(val) => updateFilter(index, 'operation', val)}
              options={getOperations(filter.column_type)}
            />
          )}

          {filter.column && filter.operation && (
            filter.operation === 'between' ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Min</label>
                  <input
                    type="number"
                    value={filter.value?.[0] || ''}
                    onChange={(e) => updateFilter(index, 'value', [parseFloat(e.target.value), filter.value?.[1] || 0])}
                    className="w-full px-2 py-1 bg-slate-700/30 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Max</label>
                  <input
                    type="number"
                    value={filter.value?.[1] || ''}
                    onChange={(e) => updateFilter(index, 'value', [filter.value?.[0] || 0, parseFloat(e.target.value)])}
                    className="w-full px-2 py-1 bg-slate-700/30 border border-slate-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            ) : filter.operation === 'in' ? (
              <DynamicFilterField
                label="Values"
                value={filter.value}
                onChange={(val) => updateFilter(index, 'value', val)}
                availableValues={columnInfo[filter.column]?.unique_values || []}
                operator="in"
              />
            ) : filter.column_type === 'numeric' ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Value</label>
                <input
                  type="number"
                  value={filter.value || ''}
                  onChange={(e) => updateFilter(index, 'value', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 bg-slate-700/30 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Value</label>
                <input
                  type="text"
                  value={filter.value || ''}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="w-full px-2 py-1 bg-slate-700/30 border border-slate-600 rounded text-white text-sm"
                />
              </div>
            )
          )}
        </div>
      ))}

      {filters.length > 1 && (
        <SelectField
          label="Combine Filters With"
          value={logic}
          onChange={setLogic}
          options={[
            { value: 'and', label: 'AND (all must match)' },
            { value: 'or', label: 'OR (any can match)' }
          ]}
        />
      )}
    </div>
  );
}
