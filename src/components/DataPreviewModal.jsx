import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Eye } from 'lucide-react';
import { inspectNode, downloadNodeData } from '../services/api';

export default function DataPreviewModal({ node, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(50);

  useEffect(() => {
    if (node?.data?.backendNodeId) {
      loadData();
    }
  }, [node]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await inspectNode(node.data.backendNodeId, 1000);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format = 'csv') => {
    try {
      const blob = await downloadNodeData(node.data.backendNodeId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'excel' ? 'xlsx' : format;
      a.download = `${node.data.backendNodeId}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download data: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (!node) return null;

  const totalRows = data?.preview?.length || 0;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startRow = currentPage * rowsPerPage;
  const endRow = Math.min(startRow + rowsPerPage, totalRows);
  const currentData = data?.preview?.slice(startRow, endRow) || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Data Preview</h2>
              <p className="text-sm text-slate-400">{node.data.label} - {node.data.backendNodeId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownload('excel')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-400">Loading data...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-red-400 mb-2">Error loading data</p>
                <p className="text-slate-400 text-sm">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {data && !loading && !error && (
            <>
              {/* Stats */}
              <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Rows:</span>
                    <span className="ml-2 text-white font-medium">{data.shape?.[0] || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Columns:</span>
                    <span className="ml-2 text-white font-medium">{data.shape?.[1] || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Memory:</span>
                    <span className="ml-2 text-white font-medium">{data.memory_usage || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Type:</span>
                    <span className="ml-2 text-white font-medium">DataFrame</span>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto">
                {currentData.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-slate-700/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider border-r border-slate-600">
                          #
                        </th>
                        {Object.keys(currentData[0] || {}).map((column) => (
                          <th
                            key={column}
                            className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider border-r border-slate-600 min-w-[120px]"
                          >
                            <div className="flex flex-col">
                              <span className="truncate">{column}</span>
                              <span className="text-xs text-slate-500 normal-case">
                                {data.schema?.[column] || 'Unknown'}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {currentData.map((row, index) => (
                        <tr key={startRow + index} className="hover:bg-slate-700/30">
                          <td className="px-4 py-3 text-sm text-slate-400 border-r border-slate-700">
                            {startRow + index + 1}
                          </td>
                          {Object.entries(row).map(([column, value]) => (
                            <td
                              key={column}
                              className="px-4 py-3 text-sm text-slate-300 border-r border-slate-700 max-w-[200px]"
                            >
                              <div className="truncate" title={String(value)}>
                                {value === null || value === undefined ? (
                                  <span className="text-slate-500 italic">null</span>
                                ) : (
                                  String(value)
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-400">No data available</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    Showing {startRow + 1} to {endRow} of {totalRows} rows
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-400">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}