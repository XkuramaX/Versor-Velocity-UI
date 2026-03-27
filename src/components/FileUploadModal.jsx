import React, { useState, useRef } from 'react';
import { X, Upload, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { uploadCSV, uploadExcel, getExcelSheets } from '../services/api';

export default function FileUploadModal({ node, onClose, onFileUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [excelSheets, setExcelSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('Sheet1');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // If it's an Excel file, get the sheet names
    if (selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls')) {
      try {
        const result = await getExcelSheets(selectedFile);
        setExcelSheets(result.sheets || []);
        setSelectedSheet(result.sheets?.[0] || 'Sheet1');
      } catch (err) {
        setError('Failed to read Excel sheets: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Just pass the file and sheet info, don't execute the upload yet
      onFileUploaded(file, { sheet_name: selectedSheet });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleFileSelect({ target: { files: [droppedFile] } });
    }
  };

  const getFileIcon = () => {
    if (!file) return Upload;
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.csv')) return FileText;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return FileSpreadsheet;
    return FileText;
  };

  const FileIcon = getFileIcon();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {node?.data?.backendNodeId ? 'Replace File for Node' : 'Upload File for Node'}
              </h2>
              <p className="text-sm text-cyan-400 font-medium">{node?.data?.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-slate-500 rounded-lg p-8 text-center cursor-pointer transition-colors"
          >
            <FileIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white mb-2">Drop your file here or click to browse</p>
                <p className="text-sm text-slate-400">Supports CSV and Excel files</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Excel Sheet Selection */}
          {excelSheets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Sheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {excelSheets.map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Upload Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{node?.data?.backendNodeId ? 'Replace' : 'Upload'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}