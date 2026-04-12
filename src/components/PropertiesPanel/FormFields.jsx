import React from 'react';

export function FormField({ label, required, type = 'text', value, onChange, placeholder, helpText, step }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
        placeholder={placeholder}
        step={step}
      />
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}

export function SelectField({ label, required, value, onChange, options = [] }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white focus:border-cyan-500 focus:outline-none transition-colors"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Single column dropdown — picks from available columns or falls back to text input
export function ColumnDropdownField({ label, required, value, onChange, availableColumns = [], placeholder, helpText }) {
  if (availableColumns.length === 0) {
    return (
      <FormField
        label={label}
        required={required}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder || 'column_name'}
        helpText={helpText || 'Connect & execute parent node to pick from list'}
      />
    );
  }
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white focus:border-cyan-500 focus:outline-none transition-colors"
      >
        <option value="">Select column</option>
        {availableColumns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}

// Multi-column picker — checkboxes when columns available, textarea fallback
export function ColumnPickerField({ label, required, value = [], onChange, availableColumns = [], placeholder, helpText }) {
  if (availableColumns.length === 0) {
    return (
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <textarea
          value={Array.isArray(value) ? value.join(', ') : value}
          onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
          placeholder={placeholder}
          rows={2}
        />
        {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
        <p className="text-xs text-slate-500 mt-1">Connect & execute parent node to pick from list</p>
      </div>
    );
  }

  const selected = Array.isArray(value) ? value : [];
  const toggle = (col) => {
    const next = selected.includes(col) ? selected.filter(c => c !== col) : [...selected, col];
    onChange(next);
  };
  const selectAll = () => onChange([...availableColumns]);
  const clearAll = () => onChange([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs text-cyan-400 hover:text-cyan-300">All</button>
          <button type="button" onClick={clearAll} className="text-xs text-slate-400 hover:text-slate-300">None</button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto bg-slate-700/30 border border-slate-600 rounded p-2 space-y-1">
        {availableColumns.map(col => (
          <label key={col} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-slate-600/30 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(col)}
              onChange={() => toggle(col)}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500"
            />
            <span className="text-sm text-slate-300">{col}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1">{selected.length} of {availableColumns.length} selected{helpText ? ` · ${helpText}` : ''}</p>
    </div>
  );
}

// Ordered column picker — drag-to-reorder list
export function OrderedColumnPickerField({ label, required, value = [], onChange, availableColumns = [], placeholder, helpText }) {
  if (availableColumns.length === 0) {
    return (
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <textarea
          value={Array.isArray(value) ? value.join(', ') : value}
          onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
          placeholder={placeholder}
          rows={2}
        />
        {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
      </div>
    );
  }

  const selected = Array.isArray(value) && value.length > 0 ? value : [...availableColumns];
  const move = (from, to) => {
    const arr = [...selected];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="max-h-48 overflow-y-auto bg-slate-700/30 border border-slate-600 rounded p-2 space-y-1">
        {selected.map((col, i) => (
          <div key={col} className="flex items-center gap-2 px-2 py-1 bg-slate-600/30 rounded text-sm text-slate-300">
            <span className="flex-1 truncate">{col}</span>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="text-slate-400 hover:text-white disabled:opacity-30 text-xs">↑</button>
              <button type="button" disabled={i === selected.length - 1} onClick={() => move(i, i + 1)} className="text-slate-400 hover:text-white disabled:opacity-30 text-xs">↓</button>
            </div>
          </div>
        ))}
      </div>
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}

// Rename mapping — key-value pairs UI
export function RenameMappingField({ label, required, value = {}, onChange, availableColumns = [] }) {
  const entries = Object.entries(value);

  const addRow = () => {
    // Don't add a row with an empty key — it corrupts the mapping
    const newKey = availableColumns.find(c => !Object.keys(value).includes(c)) || `col_${Object.keys(value).length + 1}`;
    onChange({ ...value, [newKey]: '' });
  };
  const removeRow = (key) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };
  const updateKey = (oldKey, newKey) => {
    if (!newKey.trim()) return; // Block empty keys
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey.trim() : k] = v;
    }
    onChange(next);
  };
  const updateVal = (key, val) => {
    if (!val.trim()) return; // Block empty values
    onChange({ ...value, [key]: val.trim() });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-slate-300">{label} {required && <span className="text-red-400">*</span>}</label>
        <button type="button" onClick={addRow} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
      </div>
      <div className="space-y-2">
        {entries.map(([key, val], i) => (
          <div key={i} className="flex gap-2 items-center">
            {availableColumns.length > 0 ? (
              <select
                value={key}
                onChange={(e) => updateKey(key, e.target.value)}
                className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Old name</option>
                {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input
                value={key}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder="old_name"
                className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            )}
            <span className="text-slate-400 text-sm">→</span>
            <input
              value={val}
              onChange={(e) => updateVal(key, e.target.value)}
              placeholder="new_name"
              className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
            />
            <button type="button" onClick={() => removeRow(key)} className="text-red-400 hover:text-red-300 text-sm">×</button>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-slate-500">Click "+ Add" to add a rename mapping</p>
        )}
      </div>
    </div>
  );
}

// GroupBy aggregations UI
export function GroupByAggsField({ label, required, value = {}, onChange, availableColumns = [] }) {
  const AGG_OPTIONS = ['sum', 'mean', 'count', 'max', 'min', 'std', 'median'];
  const entries = Object.entries(value);

  const addRow = () => {
    const firstUnused = availableColumns.find(c => !value[c]) || '';
    onChange({ ...value, [firstUnused]: ['sum'] });
  };
  const removeRow = (key) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };
  const updateKey = (oldKey, newKey) => {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  };
  const toggleAgg = (key, agg) => {
    const current = value[key] || [];
    const next = current.includes(agg) ? current.filter(a => a !== agg) : [...current, agg];
    onChange({ ...value, [key]: next });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-slate-300">{label} {required && <span className="text-red-400">*</span>}</label>
        <button type="button" onClick={addRow} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add Column</button>
      </div>
      <div className="space-y-3">
        {entries.map(([key, aggs], i) => (
          <div key={i} className="p-2 bg-slate-700/20 border border-slate-600 rounded space-y-2">
            <div className="flex gap-2 items-center">
              {availableColumns.length > 0 ? (
                <select
                  value={key}
                  onChange={(e) => updateKey(key, e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Select column</option>
                  {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  value={key}
                  onChange={(e) => updateKey(key, e.target.value)}
                  placeholder="column_name"
                  className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              )}
              <button type="button" onClick={() => removeRow(key)} className="text-red-400 hover:text-red-300 text-sm">×</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {AGG_OPTIONS.map(agg => (
                <button
                  key={agg}
                  type="button"
                  onClick={() => toggleAgg(key, agg)}
                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                    (aggs || []).includes(agg)
                      ? 'bg-cyan-600 border-cyan-500 text-white'
                      : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {agg}
                </button>
              ))}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-slate-500">Click "+ Add Column" to configure aggregations</p>
        )}
      </div>
    </div>
  );
}

// Conditional column builder — dynamic IF/THEN/ELSE with column-or-literal choice
export function ConditionalBuilder({ value = {}, onChange, availableColumns = [] }) {
  const { col = '', op = 'gt', threshold = '', then_val = '', else_val = '', new_col = '' } = value;
  // Track whether THEN/ELSE are column refs or literal values
  const [thenMode, setThenMode] = React.useState(
    availableColumns.includes(then_val) ? 'column' : 'literal'
  );
  const [elseMode, setElseMode] = React.useState(
    availableColumns.includes(else_val) ? 'column' : 'literal'
  );

  const OPS = [
    { value: 'gt',  label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt',  label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq',  label: '=' },
    { value: 'ne',  label: '≠' },
  ];

  const OP_SYMBOLS = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '==', ne: '!=' };

  const update = (patch) => {
    onChange({ col, op, threshold, then_val, else_val, new_col, ...patch });
  };

  const inputCls = 'w-full px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none';
  const selectCls = inputCls;
  const pillActive = 'bg-cyan-600 text-white border-cyan-500';
  const pillInactive = 'bg-slate-700/30 text-slate-400 border-slate-600 hover:border-slate-500';

  // Value input that can be column dropdown or text input
  const ValueInput = ({ mode, setMode, val, onValChange, label }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400 font-medium">{label}</label>
        {availableColumns.length > 0 && (
          <div className="flex rounded overflow-hidden border border-slate-600">
            <button type="button"
              onClick={() => { setMode('literal'); onValChange(''); }}
              className={`px-2 py-0.5 text-[10px] font-medium border-r border-slate-600 transition-colors ${mode === 'literal' ? pillActive : pillInactive}`}
            >Value</button>
            <button type="button"
              onClick={() => { setMode('column'); onValChange(''); }}
              className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${mode === 'column' ? pillActive : pillInactive}`}
            >Column</button>
          </div>
        )}
      </div>
      {mode === 'column' && availableColumns.length > 0 ? (
        <select value={val} onChange={e => onValChange(e.target.value)} className={selectCls}>
          <option value="">Select column</option>
          {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input value={val} onChange={e => onValChange(e.target.value)}
          placeholder={label === 'THEN' ? 'e.g. High or 100' : 'e.g. Low or 0'}
          className={inputCls} />
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* ── IF condition ── */}
      <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">IF</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          {/* Column */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Column</label>
            {availableColumns.length > 0 ? (
              <select value={col} onChange={e => update({ col: e.target.value })} className={selectCls}>
                <option value="">Select column</option>
                {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={col} onChange={e => update({ col: e.target.value })} placeholder="column" className={inputCls} />
            )}
          </div>
          {/* Operator */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Op</label>
            <select value={op} onChange={e => update({ op: e.target.value })} className={selectCls + ' w-16 text-center'}>
              {OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {/* Threshold */}
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Value</label>
            <input value={threshold} onChange={e => update({ threshold: e.target.value })}
              placeholder="e.g. 90000" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── THEN / ELSE ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">THEN</span>
          </div>
          <ValueInput mode={thenMode} setMode={setThenMode} val={then_val}
            onValChange={v => update({ then_val: v })} label="THEN" />
        </div>
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">ELSE</span>
          </div>
          <ValueInput mode={elseMode} setMode={setElseMode} val={else_val}
            onValChange={v => update({ else_val: v })} label="ELSE" />
        </div>
      </div>

      {/* ── Output column name ── */}
      <div>
        <label className="block text-xs text-slate-400 mb-1 font-medium">Output Column Name</label>
        <input value={new_col} onChange={e => update({ new_col: e.target.value })}
          placeholder="e.g. performance_band" className={inputCls} />
      </div>

      {/* ── Live preview ── */}
      {col && threshold !== '' && (
        <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono leading-relaxed">
          <span className="text-cyan-400">IF</span>{' '}
          <span className="text-white">{col}</span>{' '}
          <span className="text-yellow-400">{OP_SYMBOLS[op]}</span>{' '}
          <span className="text-white">{threshold}</span>
          <br />
          <span className="text-emerald-400">  → THEN</span>{' '}
          <span className="text-white">{then_val || '...'}</span>
          {thenMode === 'column' && <span className="text-slate-500"> (col)</span>}
          <br />
          <span className="text-red-400">  → ELSE</span>{' '}
          <span className="text-white">{else_val || '...'}</span>
          {elseMode === 'column' && <span className="text-slate-500"> (col)</span>}
          {new_col && (
            <>
              <br />
              <span className="text-slate-500">  → into</span>{' '}
              <span className="text-cyan-300">{new_col}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Logistic weights — paired column + weight rows
export function LogisticWeightsField({ value = { features: [], weights: [] }, onChange, availableColumns = [] }) {
  const features = value.features || [];
  const weights = value.weights || [];

  const addRow = () => onChange({ features: [...features, ''], weights: [...weights, 0] });
  const removeRow = (i) => onChange({
    features: features.filter((_, idx) => idx !== i),
    weights: weights.filter((_, idx) => idx !== i)
  });
  const updateFeature = (i, col) => {
    const f = [...features]; f[i] = col;
    onChange({ features: f, weights });
  };
  const updateWeight = (i, w) => {
    const ws = [...weights]; ws[i] = parseFloat(w) || 0;
    onChange({ features, weights: ws });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-slate-300">Features & Weights</label>
        <button type="button" onClick={addRow} className="text-xs text-cyan-400 hover:text-cyan-300">+ Add</button>
      </div>
      <div className="space-y-2">
        {features.map((feat, i) => (
          <div key={i} className="flex gap-2 items-center">
            {availableColumns.length > 0 ? (
              <select value={feat} onChange={e => updateFeature(i, e.target.value)}
                className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none">
                <option value="">Column</option>
                {availableColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input value={feat} onChange={e => updateFeature(i, e.target.value)} placeholder="column"
                className="flex-1 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none" />
            )}
            <input type="number" step="any" value={weights[i] ?? 0} onChange={e => updateWeight(i, e.target.value)}
              className="w-20 px-2 py-1.5 bg-slate-700/30 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none" />
            <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-300 text-sm">×</button>
          </div>
        ))}
        {features.length === 0 && <p className="text-xs text-slate-500">Click "+ Add" to add feature-weight pairs</p>}
      </div>
    </div>
  );
}

export function DynamicFilterField({ label, required, value, onChange, availableValues = [], operator }) {
  const isMultiSelect = operator === 'in';
  const [selectedValues, setSelectedValues] = React.useState([]);

  React.useEffect(() => {
    if (isMultiSelect && Array.isArray(value)) {
      setSelectedValues(value);
    } else if (!isMultiSelect) {
      setSelectedValues([]);
    }
  }, [value, isMultiSelect]);

  const handleCheckboxChange = (val) => {
    const newSelected = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    setSelectedValues(newSelected);
    onChange(newSelected);
  };

  if (isMultiSelect) {
    return (
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="max-h-48 overflow-y-auto bg-slate-700/30 border border-slate-600 rounded p-2">
          {availableValues.length === 0 ? (
            <div className="text-slate-500 text-sm p-2">Select a column first</div>
          ) : (
            availableValues.map((val, idx) => (
              <label key={`${val}-${idx}`} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-slate-600/30 px-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(val)}
                  onChange={() => handleCheckboxChange(val)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500"
                />
                <span className="text-slate-300 text-sm">{val === null || val === undefined ? 'null' : String(val)}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">{selectedValues.length} selected</p>
      </div>
    );
  }

  return (
    <FormField
      label={label}
      required={required}
      value={value || ''}
      onChange={onChange}
      placeholder="Enter value"
    />
  );
}

export function TextAreaField({ label, required, value, onChange, placeholder, rows = 3, helpText }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
        placeholder={placeholder}
        rows={rows}
      />
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}

export function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
      />
      <span className="text-slate-300 text-sm">{label}</span>
    </label>
  );
}

export function MultiColumnField({ label, required, value, onChange, placeholder, helpText }) {
  const handleChange = (text) => {
    const columns = text.split(',').map(s => s.trim()).filter(Boolean);
    onChange(columns);
  };

  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
        placeholder={placeholder}
        rows={2}
      />
      {helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}

export function JSONField({ label, required, value, onChange, placeholder, helpText }) {
  const [error, setError] = React.useState('');
  
  const handleChange = (text) => {
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setError('');
    } catch (e) {
      setError('Invalid JSON');
      onChange(text);
    }
  };

  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <textarea
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full px-3 py-2 bg-slate-700/30 border rounded text-white placeholder-slate-500 focus:outline-none transition-colors resize-none font-mono text-xs ${
          error ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-cyan-500'
        }`}
        placeholder={placeholder}
        rows={4}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {!error && helpText && <p className="text-xs text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
}
