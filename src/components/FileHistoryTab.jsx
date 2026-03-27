import React, { useState, useEffect } from 'react';
import { Download, FileText, Clock, User } from 'lucide-react';
import { workflowApi } from '../services/workflow';

export default function FileHistoryTab({ workflowId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFileHistory();
  }, [workflowId]);

  const loadFileHistory = async () => {
    try {
      const data = await workflowApi.getFileHistory(workflowId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load file history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const blob = await workflowApi.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed: ' + error.message);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">File History</h2>
          <p className="text-slate-400">Saved dataframes from workflow executions</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading file history...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No files saved yet</h3>
            <p className="text-slate-400">Execute workflow nodes and save outputs to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-semibold text-white">{file.filename}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="font-medium">Workflow ID:</span>
                        <span className="text-slate-300 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">
                          {file.workflow_id}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="font-medium">Node ID:</span>
                        <span className="text-slate-300 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">
                          {file.node_id}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="font-medium">Backend Node:</span>
                        <span className="text-slate-300 font-mono bg-slate-700/50 px-2 py-1 rounded text-xs">
                          {file.backend_node_id}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <User className="w-4 h-4" />
                          <span>{file.saved_by}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(file.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {file.rows && (
                      <div className="mt-2 text-sm text-slate-400">
                        <span className="font-medium">Rows:</span> {file.rows.toLocaleString()}
                        {file.columns && <span className="ml-4"><span className="font-medium">Columns:</span> {file.columns}</span>}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(file.id, file.filename)}
                    className="ml-4 flex items-center space-x-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
