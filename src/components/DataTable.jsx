import React, { useState, useMemo } from 'react'
import { X, Download, Database, Hash } from 'lucide-react'

const DataTable = ({ data, onClose, nodeId, onDownload }) => {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

  const { schema, preview, column_count } = data

  const columns = useMemo(() => Object.keys(schema || {}), [schema])
  
  const sortedData = useMemo(() => {
    if (!sortColumn || !preview) return preview
    
    return [...preview].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      let comparison = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [preview, sortColumn, sortDirection])

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getDataType = (column) => {
    const type = schema[column]
    if (type.includes('Int') || type.includes('Float')) return 'number'
    if (type.includes('Bool')) return 'boolean'
    if (type.includes('Date') || type.includes('Time')) return 'date'
    return 'text'
  }

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return <span className="text-slate-500 italic">null</span>
    
    const type = getDataType(column)
    if (type === 'number') {
      return typeof value === 'number' ? value.toLocaleString() : value
    }
    if (type === 'boolean') {
      return <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
    }
    
    const str = String(value)
    return str.length > 50 ? `${str.substring(0, 50)}...` : str
  }

  const getTypeIcon = (column) => {
    const type = getDataType(column)
    switch (type) {
      case 'number': return <Hash size={14} className="text-blue-400" />
      case 'boolean': return <div className="w-3 h-3 rounded-full bg-purple-400" />
      case 'date': return <div className="w-3 h-3 rounded bg-orange-400" />
      default: return <div className="w-3 h-3 bg-green-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-7xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Database className="text-blue-400" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-white">Data Preview</h3>
              <p className="text-slate-400 text-sm">
                {preview?.length || 0} rows × {column_count} columns • Node: {nodeId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(nodeId, 'csv')}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => onDownload(nodeId, 'excel')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2"
            >
              <Download size={16} />
              Excel
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Schema Info */}
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex flex-wrap gap-3">
            {columns.map(column => (
              <div key={column} className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded">
                {getTypeIcon(column)}
                <span className="text-white text-sm font-medium">{column}</span>
                <span className="text-slate-400 text-xs">{schema[column]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="text-left p-3 text-slate-300 font-medium w-12">#</th>
                {columns.map(column => (
                  <th
                    key={column}
                    className="text-left p-3 text-slate-300 font-medium cursor-pointer hover:bg-slate-700 transition-colors min-w-[120px]"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2">
                      {getTypeIcon(column)}
                      <span>{column}</span>
                      {sortColumn === column && (
                        <span className="text-blue-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData?.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 text-slate-500 font-mono text-xs">{index + 1}</td>
                  {columns.map(column => (
                    <td key={column} className="p-3 text-slate-300 max-w-xs">
                      {formatValue(row[column], column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
          <p className="text-slate-400 text-sm">
            Showing {preview?.length || 0} preview rows. Download for complete dataset.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DataTable