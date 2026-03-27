// nodeConfigs.js — field definitions aligned to backend API (NodesApiComplete.py)
// Field types: text | number | select | checkbox | textarea | json | hidden
//              column_dropdown | column_picker | ordered_column_picker
//              rename_mapping | groupby_aggs | conditional_builder | logistic_weights
//              dynamic_filter | safe_filter_builder

export const nodeConfigs = {

  // ── DATA INGESTION ────────────────────────────────────────────────────────
  // upload_csv: file handled by the upload section in PropertiesPanel, no extra fields
  upload_csv: { fields: [] },

  // upload_excel: sheet_name rendered directly in the upload section
  upload_excel: { fields: [] },

  read_from_db: {
    fields: [
      {
        key: 'connection_string',
        label: 'Connection String',
        type: 'text',
        required: true,
        placeholder: 'postgresql://user:pass@host:5432/dbname',
        helpText: 'Supports PostgreSQL, MySQL, SQLite'
      },
      {
        key: 'query',
        label: 'SQL Query',
        type: 'textarea',
        required: true,
        placeholder: 'SELECT * FROM employees WHERE department = \'Engineering\'',
        rows: 4,
        helpText: 'Only SELECT queries are allowed'
      }
    ]
  },

  // ── TRANSFORM ─────────────────────────────────────────────────────────────
  safe_filter: {
    fields: [
      { key: 'filters', label: 'Filter Conditions', type: 'safe_filter_builder', required: true },
      { key: 'logic',   label: 'Logic',             type: 'hidden' }
    ]
  },

  // Legacy filter — kept for backwards compatibility
  filter: {
    deprecated: true,
    fields: [
      {
        key: 'column', label: 'Column', type: 'column_dropdown', required: true
      },
      {
        key: 'operator', label: 'Operator', type: 'select', required: true, default: '==',
        options: [
          { value: '==',          label: 'Equals (==)' },
          { value: '!=',          label: 'Not Equals (!=)' },
          { value: '>',           label: 'Greater Than (>)' },
          { value: '<',           label: 'Less Than (<)' },
          { value: '>=',          label: 'Greater or Equal (>=)' },
          { value: '<=',          label: 'Less or Equal (<=)' },
          { value: 'contains',    label: 'Contains' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with',   label: 'Ends With' },
          { value: 'in',          label: 'Is In (multi-select)' },
        ]
      },
      { key: 'value', label: 'Value', type: 'dynamic_filter', required: true }
    ]
  },

  select: {
    fields: [
      {
        key: 'columns', label: 'Columns to Keep', type: 'column_picker', required: true,
        helpText: 'Only selected columns will appear in the output'
      }
    ]
  },

  drop: {
    fields: [
      {
        key: 'columns', label: 'Columns to Drop', type: 'column_picker', required: true,
        helpText: 'Selected columns will be removed from the output'
      }
    ]
  },

  sort: {
    fields: [
      {
        key: 'by', label: 'Sort By', type: 'column_picker', required: true,
        helpText: 'Select one or more columns to sort by (order matters)'
      },
      { key: 'descending', label: 'Descending Order', type: 'checkbox', default: false }
    ]
  },

  rename: {
    fields: [
      {
        key: 'mapping', label: 'Rename Columns', type: 'rename_mapping', required: true, default: {},
        helpText: 'Map old column names → new column names'
      }
    ]
  },

  reorder: {
    fields: [
      {
        key: 'ordered_cols', label: 'Column Order', type: 'ordered_column_picker', required: true,
        helpText: 'Drag ↑↓ to set the desired column order'
      }
    ]
  },

  // ── STRING OPERATIONS ─────────────────────────────────────────────────────
  string_case: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'mode', label: 'Case Mode', type: 'select', required: true, default: 'upper',
        options: [
          { value: 'upper', label: 'UPPER CASE' },
          { value: 'lower', label: 'lower case' },
          { value: 'title', label: 'Title Case' },
        ]
      },
      {
        key: 'new_col', label: 'Output Column Name', type: 'text',
        placeholder: 'Leave empty to overwrite original',
        helpText: 'Optional — creates a new column instead of overwriting'
      }
    ]
  },

  string_slice: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'mode', label: 'Direction', type: 'select', required: true, default: 'left',
        options: [{ value: 'left', label: 'Left (from start)' }, { value: 'right', label: 'Right (from end)' }]
      },
      {
        key: 'n_chars', label: 'Number of Characters', type: 'number', required: true,
        placeholder: '3', helpText: 'How many characters to extract'
      },
      { key: 'new_col', label: 'Output Column Name', type: 'text', placeholder: 'Optional' }
    ]
  },

  string_mid: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'start', label: 'Start Position', type: 'number', required: true, default: 1,
        helpText: '1-indexed (like Excel MID)'
      },
      { key: 'length', label: 'Length', type: 'number', required: true, default: 1 },
      { key: 'new_col', label: 'Output Column Name', type: 'text', placeholder: 'Optional' }
    ]
  },

  string_concat: {
    fields: [
      {
        key: 'columns', label: 'Columns to Concatenate', type: 'column_picker', required: true,
        helpText: 'Columns will be joined in the order selected'
      },
      { key: 'separator', label: 'Separator', type: 'text', default: ' ', placeholder: 'Space, comma, etc.' },
      { key: 'new_col', label: 'Output Column Name', type: 'text', required: true, placeholder: 'full_name' }
    ]
  },

  string_prefix_suffix: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'USER_', helpText: 'Text added before each value' },
      { key: 'suffix', label: 'Suffix', type: 'text', placeholder: '_ACTIVE', helpText: 'Text added after each value' },
      { key: 'new_col', label: 'Output Column Name', type: 'text', placeholder: 'Optional' }
    ]
  },

  string_clean: {
    fields: [
      {
        key: 'column', label: 'Column', type: 'column_dropdown', required: true,
        helpText: 'Trims whitespace and normalises the string'
      }
    ]
  },

  // ── MATH OPERATIONS ───────────────────────────────────────────────────────
  math_horizontal: {
    fields: [
      {
        key: 'columns', label: 'Columns', type: 'column_picker', required: true,
        helpText: 'Numeric columns to aggregate row-wise'
      },
      {
        key: 'op', label: 'Operation', type: 'select', required: true, default: 'sum',
        options: [{ value: 'sum', label: 'Sum' }, { value: 'average', label: 'Average' }]
      },
      { key: 'new_col', label: 'Result Column Name', type: 'text', required: true, placeholder: 'total' }
    ]
  },

  math_custom: {
    fields: [
      {
        key: 'left_cols', label: 'Left Columns', type: 'column_picker', required: true,
        helpText: 'Each selected column will be operated on'
      },
      {
        key: 'op', label: 'Operator', type: 'select', required: true, default: '*',
        options: [
          { value: '+', label: 'Add (+)' }, { value: '-', label: 'Subtract (-)' },
          { value: '*', label: 'Multiply (×)' }, { value: '/', label: 'Divide (÷)' }
        ]
      },
      {
        key: 'right_val', label: 'Right Value', type: 'number', required: true,
        placeholder: '1.1', step: 'any', helpText: 'Constant applied to each selected column'
      },
      {
        key: 'new_suffix', label: 'New Column Suffix', type: 'text', required: true,
        placeholder: '_adjusted', helpText: 'Appended to each original column name'
      }
    ]
  },

  math_multiply_bulk: {
    fields: [
      { key: 'columns', label: 'Columns to Multiply', type: 'column_picker', required: true },
      {
        key: 'factor', label: 'Multiplication Factor', type: 'number', required: true,
        placeholder: '1.08', step: 'any'
      },
      {
        key: 'suffix', label: 'New Column Suffix', type: 'text', required: true,
        placeholder: '_inflated', helpText: 'e.g. salary → salary_inflated'
      }
    ]
  },

  // ── VECTOR OPERATIONS ─────────────────────────────────────────────────────
  vector_dot_product: {
    fields: [
      {
        key: 'vec_a', label: 'Vector A Columns', type: 'column_picker', required: true,
        helpText: 'Must have the same number of columns as Vector B'
      },
      { key: 'vec_b', label: 'Vector B Columns', type: 'column_picker', required: true },
      { key: 'new_col', label: 'Result Column Name', type: 'text', required: true, placeholder: 'dot_product' }
    ]
  },

  vector_linear_multiply: {
    fields: [
      { key: 'vec_a', label: 'Vector A Columns', type: 'column_picker', required: true },
      {
        key: 'vec_b', label: 'Vector B Columns', type: 'column_picker', required: true,
        helpText: 'Element-wise multiplication — must match Vector A length'
      },
      {
        key: 'suffix', label: 'Result Column Suffix', type: 'text', required: true,
        placeholder: '_product'
      }
    ]
  },

  vector_cross_product: {
    fields: [
      {
        key: 'vec_a', label: 'Vector A (3 columns)', type: 'column_picker', required: true,
        helpText: 'Must select exactly 3 columns'
      },
      { key: 'vec_b', label: 'Vector B (3 columns)', type: 'column_picker', required: true },
      {
        key: 'prefix', label: 'Result Column Prefix', type: 'text', required: true,
        placeholder: 'cross', helpText: 'Creates cross_x, cross_y, cross_z'
      }
    ]
  },

  // ── DATA CLEANING ─────────────────────────────────────────────────────────
  drop_na: {
    fields: [
      {
        key: 'subset', label: 'Columns to Check (optional)', type: 'column_picker',
        helpText: 'Leave empty to check all columns for null values'
      }
    ]
  },

  drop_nulls: { fields: [] },

  drop_duplicates: {
    fields: [
      {
        key: 'subset', label: 'Columns to Check (optional)', type: 'column_picker',
        helpText: 'Leave empty to check all columns for duplicates'
      }
    ]
  },

  fill_missing: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'value', label: 'Fill Value', type: 'text', required: true,
        placeholder: '0 or N/A or mean', helpText: 'Value used to replace null/missing entries'
      }
    ]
  },

  // ── DATA TYPES ────────────────────────────────────────────────────────────
  cast: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'dtype', label: 'Target Data Type', type: 'select', required: true, default: 'str',
        options: [
          { value: 'int',   label: 'Integer (Int64)' },
          { value: 'float', label: 'Float (Float64)' },
          { value: 'str',   label: 'String (Utf8)' },
          { value: 'bool',  label: 'Boolean' },
        ]
      }
    ]
  },

  // ── DATE / TIME ───────────────────────────────────────────────────────────
  extract_date_parts: {
    fields: [
      {
        key: 'column', label: 'Date Column', type: 'column_dropdown', required: true,
        helpText: 'Creates {col}_year, {col}_month, {col}_day columns'
      }
    ]
  },

  // ── JOINS & COMBINE ───────────────────────────────────────────────────────
  join: {
    fields: [
      {
        key: 'on', label: 'Join Column', type: 'text', required: true,
        placeholder: 'employee_id',
        helpText: 'Column name that exists in both datasets (left input = top handle)'
      },
      {
        key: 'how', label: 'Join Type', type: 'select', required: true, default: 'inner',
        options: [
          { value: 'inner', label: 'Inner — only matching rows' },
          { value: 'left',  label: 'Left — all left rows' },
          { value: 'outer', label: 'Outer — all rows from both' },
          { value: 'semi',  label: 'Semi — left rows that match' },
          { value: 'anti',  label: 'Anti — left rows that don\'t match' },
        ]
      }
    ]
  },

  // union: auto-resolves from all connected input edges — no config needed
  union: { fields: [] },

  // ── ADVANCED ANALYTICS ────────────────────────────────────────────────────
  outliers: {
    fields: [
      {
        key: 'column', label: 'Column', type: 'column_dropdown', required: true,
        helpText: 'Removes rows outside Q1−1.5×IQR and Q3+1.5×IQR'
      }
    ]
  },

  groupby: {
    fields: [
      {
        key: 'group_cols', label: 'Group By Columns', type: 'column_picker', required: true,
        helpText: 'Rows with the same values in these columns are grouped together'
      },
      {
        key: 'aggs', label: 'Aggregations per Column', type: 'groupby_aggs', required: true, default: {},
        helpText: 'Choose which aggregation functions to apply to each column'
      }
    ]
  },

  stats: {
    fields: [
      {
        key: 'columns', label: 'Columns', type: 'column_picker', required: true,
        helpText: 'Output: tidy DF with column_name, metric, value rows (mean/std/median/min/max/q1/q3/count/null_count)'
      }
    ]
  },

  pivot: {
    fields: [
      { key: 'values', label: 'Values Column', type: 'column_dropdown', required: true, helpText: 'Numeric column to aggregate' },
      { key: 'index',  label: 'Index Columns', type: 'column_picker',   required: true, helpText: 'Columns that become row labels' },
      { key: 'on',     label: 'Pivot Column',  type: 'column_dropdown', required: true, helpText: 'Unique values become new column headers' },
      {
        key: 'agg', label: 'Aggregation', type: 'select', default: 'sum',
        options: [
          { value: 'sum',   label: 'Sum' },
          { value: 'mean',  label: 'Mean' },
          { value: 'count', label: 'Count' },
          { value: 'max',   label: 'Max' },
          { value: 'min',   label: 'Min' },
        ]
      }
    ]
  },

  moving_average: {
    fields: [
      { key: 'column', label: 'Column', type: 'column_dropdown', required: true },
      {
        key: 'window', label: 'Window Size', type: 'number', required: true, default: 7,
        placeholder: '7', helpText: 'Number of rows in the rolling window'
      }
    ]
  },

  conditional: {
    fields: [
      {
        key: '_conditional', label: 'IF / THEN / ELSE', type: 'conditional_builder', required: true
      }
    ]
  },

  // ── MATRIX ────────────────────────────────────────────────────────────────
  transpose: { fields: [] },

  // ── MACHINE LEARNING ──────────────────────────────────────────────────────
  linear_regression: {
    fields: [
      {
        key: 'target', label: 'Target Column (Y)', type: 'column_dropdown', required: true,
        helpText: 'The column to predict. Output: original DF + predicted_{target} column'
      },
      {
        key: 'features', label: 'Feature Columns (X)', type: 'column_picker', required: true,
        helpText: 'Numeric predictor columns used to fit OLS regression'
      }
    ]
  },

  logistic_prediction: {
    fields: [
      {
        key: '_logistic', label: 'Feature Columns & Weights', type: 'logistic_weights', required: true
      }
    ]
  },

  correlation: {
    fields: [
      {
        key: 'columns', label: 'Columns to Correlate', type: 'column_picker', required: true,
        helpText: 'Select ≥2 numeric columns. Output: tidy DF with col_a, col_b, correlation columns'
      }
    ]
  },
};
