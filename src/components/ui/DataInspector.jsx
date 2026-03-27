import React, { useState, useMemo } from 'react'
import { X, Download, Database, Hash, Type, Calendar, ToggleLeft } from 'lucide-react'
import { FixedSizeGrid as Grid } from 'react-window'

const DataInspector = ({ data, onClose, nodeId, onDownload }) => {
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedFormat, setSelectedFormat] = useState('csv')

  const { schema, preview, column_count, node_id } = data
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
    const type = schema[column]?.toLowerCase() || ''
    if (type.includes('int') || type.includes('float')) return 'number'
    if (type.includes('bool')) return 'boolean'
    if (type.includes('date') || type.includes('time')) return 'date'
    return 'text'
  }

  const getTypeIcon = (column) => {
    const type = getDataType(column)
    switch (type) {
      case 'number': return <Hash size={14} className="text-blue-400" />
      case 'boolean': return <ToggleLeft size={14} className="text-purple-400" />
      case 'date': return <Calendar size={14} className="text-orange-400" />
      default: return <Type size={14} className="text-green-400" />
    }
  }

  const formatValue = (value, column) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">null</span>
    }
    
    const type = getDataType(column)
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }
    if (type === 'boolean') {
      return <span className={value ? 'text-green-400' : 'text-red-400'}>{String(value)}</span>
    }
    
    const str = String(value)
    return str.length > 50 ? `${str.substring(0, 50)}...` : str
  }

  // Virtualized table cell renderer
  const Cell = ({ columnIndex, rowIndex, style }) => {
    if (rowIndex === 0) {
      // Header row
      const column = columns[columnIndex]
      return (
        <div
          style={style}
          className="flex items-center gap-2 p-2 bg-slate-800 border-r border-slate-700 cursor-pointer hover:bg-slate-700"
          onClick={() => handleSort(column)}
        >
          {getTypeIcon(column)}
          <span className="text-white font-medium text-sm truncate">{column}</span>
          {sortColumn === column && (
            <span className="text-blue-400 text-xs">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      )
    }

    // Data row
    const dataIndex = rowIndex - 1
    const row = sortedData[dataIndex]
    const column = columns[columnIndex]
    const value = row?.[column]

    return (
      <div
        style={style}
        className="p-2 border-r border-slate-800 text-slate-300 text-sm truncate"
      >
        {formatValue(value, column)}
      </div>
    )
  }

  const handleDownload = (format) => {
    onDownload(nodeId || node_id, format)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-7xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <Database className="text-blue-400" size={24} />
            <div>
              <h3 className="text-xl font-semibold text-white">Data Inspector</h3>
              <p className="text-slate-400 text-sm">
                {preview?.length || 0} rows × {column_count} columns • Node: {nodeId || node_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-sm"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="parquet">Parquet</option>
            </select>
            <button
              onClick={() => handleDownload(selectedFormat)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2"
            >
              <Download size={16} />
              Download
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Schema Summary */}
        <div className="p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex flex-wrap gap-2">
            {columns.slice(0, 10).map(column => (
              <div key={column} className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded text-xs">
                {getTypeIcon(column)}
                <span className="text-white font-medium">{column}</span>
                <span className="text-slate-400">{schema[column]}</span>
              </div>
            ))}
            {columns.length > 10 && (
              <div className="text-slate-400 text-xs px-2 py-1">
                +{columns.length - 10} more columns
              </div>
            )}
          </div>
        </div>

        {/* Virtualized Table */}
        <div className="flex-1 overflow-hidden">
          {sortedData && sortedData.length > 0 ? (
            <Grid
              columnCount={columns.length}
              columnWidth={150}
              height={400}
              rowCount={sortedData.length + 1} // +1 for header
              rowHeight={40}
              width="100%"
            >
              {Cell}
            </Grid>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 text-center">
          <p className="text-slate-400 text-sm">
            Showing {Math.min(preview?.length || 0, 50)} preview rows. 
            Download for complete dataset.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DataInspector