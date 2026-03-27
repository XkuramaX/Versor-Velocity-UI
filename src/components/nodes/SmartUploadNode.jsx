import React, { useRef } from 'react'
import { Handle, Position } from 'reactflow'
import { Upload, Eye, Download } from 'lucide-react'
import * as api from '../../services/api'

const SmartUploadNode = ({ data, selected, id }) => {
  const fileInputRef = useRef()

  const handleFileUpload = async (file) => {
    if (!file) return
    
    console.log('Uploading file:', file.name)
    
    try {
      const response = file.name.endsWith('.csv') 
        ? await api.uploadCSV(file)
        : await api.uploadExcel(file)
      
      console.log('Upload response:', response.data)
      
      // Update node with backend nodeId using the correct node id
      data.onUpdate?.(id, { 
        nodeId: response.data.node_id,
        fileName: file.name,
        status: 'ready'
      })
      
      console.log('Node updated with nodeId:', response.data.node_id)
      
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div className={`
      bg-slate-900 border-2 rounded-lg p-3 min-w-[200px] shadow-lg
      border-green-500 bg-green-500/10
      ${selected ? 'ring-2 ring-blue-400' : ''}
    `}>
      
      <div className="flex items-center gap-2 mb-2">
        <Upload size={16} className="text-green-400" />
        <span className="text-white font-medium text-sm">Upload File</span>
      </div>

      {data.nodeId ? (
        <div className="text-xs text-green-400 mb-2">
          File: {data.fileName} ✓
        </div>
      ) : (
        <div className="text-xs text-slate-400 mb-2">
          No file uploaded
        </div>
      )}

      <div className="flex gap-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-600 hover:bg-green-700 p-1 rounded text-white"
        >
          <Upload size={12} />
        </button>
        
        {data.nodeId && (
          <>
            <button
              onClick={() => {
                console.log('Inspect clicked with nodeId:', data.nodeId)
                data.onInspect?.(data.nodeId)
              }}
              className="bg-slate-800 hover:bg-slate-700 p-1 rounded text-slate-300"
            >
              <Eye size={12} />
            </button>
            <button
              onClick={() => {
                console.log('Download clicked with nodeId:', data.nodeId)
                data.onDownload?.(data.nodeId)
              }}
              className="bg-slate-800 hover:bg-slate-700 p-1 rounded text-slate-300"
            >
              <Download size={12} />
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
      />
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  )
}

export default SmartUploadNode