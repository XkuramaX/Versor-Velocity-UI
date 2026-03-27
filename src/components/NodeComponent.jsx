import React from 'react';
import { Handle, Position } from 'reactflow';
import { 
  FileText, Filter, Columns, ArrowUpDown, Type, Calculator, 
  BarChart3, Merge, Eye, Download, Settings, Upload, Scissors,
  Trash2, RefreshCw, Hash, Calendar, Target, GitMerge, Copy,
  Shuffle, ClipboardList, TrendingUp, Settings2, RotateCcw, Brain
} from 'lucide-react';

const nodeIcons = {
  'upload_csv': FileText,
  'upload_excel': FileText,
  'read_from_db': Upload,
  'filter_data': Filter,
  'select_columns': Columns,
  'drop_columns': Trash2,
  'rename_columns': Type,
  'sort_data': ArrowUpDown,
  'reorder_columns': Shuffle,
  'str_to_upper': Type,
  'str_to_lower': Type,
  'str_to_title': Type,
  'str_left': Scissors,
  'str_right': Scissors,
  'str_mid': Scissors,
  'concat_columns': Merge,
  'concat_with_literal': Type,
  'clean_string_column': RefreshCw,
  'horizontal_sum': Calculator,
  'horizontal_average': Calculator,
  'apply_custom_expression': Calculator,
  'multi_column_multiply': Calculator,
  'vector_dot_product': Target,
  'vector_linear_multiply': Calculator,
  'vector_cross_product': Target,
  'drop_na': Trash2,
  'drop_nulls': Trash2,
  'drop_duplicates': Copy,
  'fill_missing': RefreshCw,
  'cast_column': Hash,
  'extract_date_parts': Calendar,
  'join_nodes': GitMerge,
  'union_nodes': Merge,
  'group_by_agg': BarChart3,
  'filter_outliers_iqr': BarChart3,
  'col_stats_advanced': BarChart3,
  'pivot_table': ClipboardList,
  'moving_average': TrendingUp,
  'conditional_column': Settings2,
  'matrix_transpose': RotateCcw,
  'linear_regression_node': Brain,
  'logistic_regression_prediction': Brain,
};

const nodeCategories = {
  'upload_csv': 'source',
  'upload_excel': 'source',
  'read_from_db': 'source',
  'filter_data': 'transform',
  'select_columns': 'transform',
  'drop_columns': 'transform',
  'rename_columns': 'transform',
  'sort_data': 'transform',
  'reorder_columns': 'transform',
  'str_to_upper': 'transform',
  'str_to_lower': 'transform',
  'str_to_title': 'transform',
  'str_left': 'transform',
  'str_right': 'transform',
  'str_mid': 'transform',
  'concat_columns': 'transform',
  'concat_with_literal': 'transform',
  'clean_string_column': 'transform',
  'horizontal_sum': 'math',
  'horizontal_average': 'math',
  'apply_custom_expression': 'math',
  'multi_column_multiply': 'math',
  'vector_dot_product': 'math',
  'vector_linear_multiply': 'math',
  'vector_cross_product': 'math',
  'drop_na': 'transform',
  'drop_nulls': 'transform',
  'drop_duplicates': 'transform',
  'fill_missing': 'transform',
  'cast_column': 'transform',
  'extract_date_parts': 'transform',
  'join_nodes': 'advanced',
  'union_nodes': 'advanced',
  'group_by_agg': 'advanced',
  'filter_outliers_iqr': 'advanced',
  'col_stats_advanced': 'advanced',
  'pivot_table': 'advanced',
  'moving_average': 'advanced',
  'conditional_column': 'advanced',
  'matrix_transpose': 'advanced',
  'linear_regression_node': 'advanced',
  'logistic_regression_prediction': 'advanced',
};

const NodeComponent = ({ data, selected }) => {
  const { nodeType, label, metadata, onInspect, onDownload, onEdit } = data;
  const IconComponent = nodeIcons[nodeType] || Settings;
  const category = nodeCategories[nodeType] || 'transform';
  
  const glowClass = `node-glow-${category}`;
  
  return (
    <div className={`
      glass-panel p-4 min-w-[200px] border-2 transition-all duration-300
      ${selected ? 'ring-2 ring-blue-400' : ''}
      ${glowClass}
    `}>
      {/* Input Handle */}
      {nodeType !== 'upload_csv' && nodeType !== 'upload_excel' && nodeType !== 'read_from_db' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-slate-600 border-2 border-slate-400"
        />
      )}
      
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        <IconComponent className="w-5 h-5 text-slate-300" />
        <span className="font-medium text-sm text-slate-200">{label}</span>
      </div>
      
      {/* Metadata Preview */}
      {metadata && (
        <div className="text-xs text-slate-400 mb-3 space-y-1">
          <div>Columns: {metadata.column_count || 0}</div>
          {metadata.preview && metadata.preview.length > 0 && (
            <div>Rows: {metadata.preview.length}+ </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => onInspect(data.id)}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded transition-colors"
          title="Inspect Data"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDownload(data.id)}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded transition-colors"
          title="Download"
        >
          <Download className="w-3 h-3" />
        </button>
        <button
          onClick={() => onEdit(data.id, nodeType)}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded transition-colors"
          title="Edit Parameters"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-slate-600 border-2 border-slate-400"
      />
    </div>
  );
};

export default NodeComponent;