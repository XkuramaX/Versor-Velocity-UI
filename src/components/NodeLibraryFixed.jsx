import React, { useState } from 'react';
import { 
  Upload, Filter, Columns, ArrowUpDown, Edit3, Type, Calculator, 
  BarChart3, Brain, Database, Trash2, GitMerge, Grid3x3, 
  Calendar, Shuffle, TrendingUp, Target, Layers, Search, Hash,
  FlaskConical, PieChart, LineChart, Activity, TestTube2
} from 'lucide-react';

const nodeCategories = {
  'Data Ingestion': [
    { type: 'upload_csv', label: 'Upload CSV', icon: Upload, color: 'from-emerald-500 to-green-500' },
    { type: 'upload_excel', label: 'Upload Excel', icon: Upload, color: 'from-blue-500 to-cyan-500' },
    { type: 'read_from_db', label: 'Read from Database', icon: Database, color: 'from-purple-500 to-indigo-500' }
  ],
  'Data Transformation': [
    { type: 'safe_filter', label: 'Safe Filter ⭐', icon: Filter, color: 'from-green-500 to-emerald-500' },
    { type: 'filter', label: 'Filter (Deprecated)', icon: Filter, color: 'from-gray-500 to-slate-500', deprecated: true },
    { type: 'select', label: 'Select Columns', icon: Columns, color: 'from-cyan-500 to-blue-500' },
    { type: 'drop', label: 'Drop Columns', icon: Trash2, color: 'from-red-500 to-pink-500' },
    { type: 'sort', label: 'Sort Data', icon: ArrowUpDown, color: 'from-purple-500 to-indigo-500' },
    { type: 'rename', label: 'Rename Columns', icon: Edit3, color: 'from-teal-500 to-cyan-500' },
    { type: 'reorder', label: 'Reorder Columns', icon: Shuffle, color: 'from-orange-500 to-red-500' }
  ],
  'String Operations': [
    { type: 'string_case',          label: 'Change Case',       icon: Type, color: 'from-amber-500 to-orange-500' },
    { type: 'string_slice',         label: 'String Slice',      icon: Type, color: 'from-yellow-500 to-amber-500' },
    { type: 'string_mid',           label: 'String Mid',        icon: Type, color: 'from-orange-500 to-red-500' },
    { type: 'string_concat',        label: 'Concatenate',       icon: Type, color: 'from-pink-500 to-rose-500' },
    { type: 'string_prefix_suffix', label: 'Add Prefix/Suffix', icon: Type, color: 'from-rose-500 to-pink-500' },
    { type: 'string_clean',         label: 'Clean String',      icon: Type, color: 'from-green-500 to-emerald-500' }
  ],
  'Math Operations': [
    { type: 'math_horizontal', label: 'Horizontal Math', icon: Calculator, color: 'from-purple-500 to-violet-500' },
    { type: 'math_custom', label: 'Custom Expression', icon: Calculator, color: 'from-violet-500 to-purple-500' },
    { type: 'math_multiply_bulk', label: 'Bulk Multiply', icon: Calculator, color: 'from-indigo-500 to-purple-500' }
  ],
  'Vector Operations': [
    { type: 'vector_dot_product', label: 'Dot Product', icon: Target, color: 'from-cyan-500 to-blue-500' },
    { type: 'vector_linear_multiply', label: 'Linear Multiply', icon: Target, color: 'from-blue-500 to-indigo-500' },
    { type: 'vector_cross_product', label: 'Cross Product', icon: Target, color: 'from-indigo-500 to-purple-500' }
  ],
  'Data Cleaning': [
    { type: 'drop_na', label: 'Drop NA Values', icon: Trash2, color: 'from-red-500 to-rose-500' },
    { type: 'drop_nulls', label: 'Drop All Nulls', icon: Trash2, color: 'from-rose-500 to-red-500' },
    { type: 'drop_duplicates', label: 'Drop Duplicates', icon: Trash2, color: 'from-pink-500 to-red-500' },
    { type: 'fill_missing', label: 'Fill Missing', icon: Search, color: 'from-green-500 to-emerald-500' }
  ],
  'Data Types': [
    { type: 'cast', label: 'Cast Column Type', icon: Hash, color: 'from-teal-500 to-cyan-500' }
  ],
  'Date/Time': [
    { type: 'extract_date_parts', label: 'Extract Date Parts', icon: Calendar, color: 'from-orange-500 to-yellow-500' }
  ],
  'Joins & Combine': [
    { type: 'join', label: 'Join Datasets', icon: GitMerge, color: 'from-purple-500 to-pink-500' },
    { type: 'union', label: 'Union Datasets', icon: Layers, color: 'from-pink-500 to-rose-500' }
  ],
  'Advanced Analytics': [
    { type: 'outliers', label: 'Remove Outliers', icon: BarChart3, color: 'from-blue-500 to-purple-500' },
    { type: 'groupby', label: 'Group By', icon: BarChart3, color: 'from-cyan-500 to-blue-500' },
    { type: 'stats', label: 'Statistics', icon: TrendingUp, color: 'from-green-500 to-teal-500' },
    { type: 'pivot', label: 'Pivot Table', icon: Grid3x3, color: 'from-indigo-500 to-blue-500' },
    { type: 'moving_average', label: 'Moving Average', icon: TrendingUp, color: 'from-teal-500 to-cyan-500' },
    { type: 'conditional', label: 'Conditional Column', icon: Filter, color: 'from-yellow-500 to-orange-500' }
  ],
  'Matrix Operations': [
    { type: 'transpose', label: 'Matrix Transpose', icon: Shuffle, color: 'from-purple-500 to-indigo-500' }
  ],
  'Machine Learning': [
    { type: 'linear_regression',  label: 'Linear Regression',  icon: Brain, color: 'from-pink-500 to-rose-500' },
    { type: 'logistic_prediction',label: 'Logistic Prediction', icon: Brain, color: 'from-rose-500 to-pink-500' },
    { type: 'correlation',        label: 'Correlation Matrix',  icon: TrendingUp, color: 'from-violet-500 to-purple-500' },
  ],
  'Utility': [
    { type: 'add_literal_column', label: 'Add Constant Column', icon: Hash, color: 'from-emerald-500 to-teal-500' },
    { type: 'range_bucket',       label: 'Range Bucket',        icon: BarChart3, color: 'from-teal-500 to-cyan-500' },
    { type: 'date_offset',        label: 'Date Offset',         icon: Calendar, color: 'from-orange-500 to-amber-500' },
    { type: 'crosstab',           label: 'Cross Tabulation',    icon: Grid3x3, color: 'from-indigo-500 to-blue-500' },
    { type: 'cumulative_product', label: 'Cumulative Product',  icon: TrendingUp, color: 'from-purple-500 to-violet-500' },
  ],
  'Statistical Tests': [
    { type: 'ols_regression',     label: 'OLS Regression (Full)',icon: Brain, color: 'from-pink-500 to-rose-500' },
    { type: 't_test',             label: 'T-Test',              icon: TestTube2, color: 'from-blue-500 to-indigo-500' },
    { type: 'f_test',             label: 'F-Test',              icon: TestTube2, color: 'from-indigo-500 to-purple-500' },
    { type: 'chi_square_test',    label: 'Chi-Square Test',     icon: FlaskConical, color: 'from-purple-500 to-pink-500' },
    { type: 'dw_test',            label: 'Durbin-Watson Test',  icon: Activity, color: 'from-teal-500 to-cyan-500' },
    { type: 'anova_test',         label: 'ANOVA',               icon: FlaskConical, color: 'from-orange-500 to-red-500' },
  ],
  'Visualization': [
    { type: 'chart',              label: 'Chart',               icon: BarChart3, color: 'from-cyan-500 to-blue-500' },
  ]
};

export default function NodeLibraryFixed({ disabled = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(nodeCategories).reduce((acc, category) => ({ ...acc, [category]: true }), {})
  );

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const onDragStart = (event, nodeType, nodeConfig) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodeconfig', JSON.stringify(nodeConfig));
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = Object.entries(nodeCategories).reduce((acc, [category, nodes]) => {
    const filteredNodes = nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredNodes.length > 0) {
      acc[category] = filteredNodes;
    }
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-3">Node Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(filteredCategories).map(([category, nodes]) => (
          <div key={category} className="space-y-2">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between text-left text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span>{category}</span>
              <span className={`transform transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>

            {expandedCategories[category] && (
              <div className="space-y-2 ml-2">
                {nodes.map((node) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.type}
                      draggable={!disabled}
                      onDragStart={(event) => onDragStart(event, node.type, node)}
                      className={`group flex items-center space-x-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500/50 rounded-lg transition-all duration-200 ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                      } ${node.deprecated ? 'opacity-40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${node.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {node.label}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {node.deprecated
                            ? <span className="text-orange-400">deprecated</span>
                            : <span className="font-mono">{node.type}</span>
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No nodes found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}