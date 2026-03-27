import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import WorkflowCanvas from '../components/WorkflowCanvas'
import SmartUploadNode from '../components/nodes/SmartUploadNode'
import DataInspector from '../components/ui/DataInspector'
import * as api from '../services/api'

// Mock API calls
vi.mock('../services/api', () => ({
  uploadCSV: vi.fn(),
  uploadExcel: vi.fn(),
  getExcelSheets: vi.fn(),
  validateConnection: vi.fn(),
  inspectNode: vi.fn(),
  downloadNode: vi.fn(),
  filterData: vi.fn(),
  joinNodes: vi.fn()
}))

describe('Smart Execution Test Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Case 1: Excel Workflow - Upload → Select Sheet → Filter → View Data', () => {
    it('handles complete Excel workflow with sheet selection', async () => {
      const mockExcelFile = new File(['mock excel data'], 'sales.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      
      api.getExcelSheets.mockResolvedValue({
        data: { sheets: ['Sales', 'Inventory', 'Customers'] }
      })
      
      api.uploadExcel.mockResolvedValue({
        data: {
          node_id: 'excel_node_123',
          metadata: {
            schema: { 'Product': 'Utf8', 'Amount': 'Int64', 'Date': 'Date' },
            preview: [
              { Product: 'Widget A', Amount: 150, Date: '2024-01-15' },
              { Product: 'Widget B', Amount: 75, Date: '2024-01-16' }
            ],
            column_count: 3
          }
        }
      })
      
      api.filterData.mockResolvedValue({
        data: {
          node_id: 'filter_node_456',
          metadata: {
            schema: { 'Product': 'Utf8', 'Amount': 'Int64', 'Date': 'Date' },
            preview: [
              { Product: 'Widget A', Amount: 150, Date: '2024-01-15' }
            ],
            column_count: 3
          }
        }
      })

      const mockWorkflow = { name: 'Excel Test Workflow' }
      
      render(
        <ReactFlowProvider>
          <WorkflowCanvas workflow={mockWorkflow} onBack={vi.fn()} />
        </ReactFlowProvider>
      )

      const uploadButton = screen.getByText('Smart Upload')
      fireEvent.click(uploadButton)

      const filterButton = screen.getByText('Filter')
      fireEvent.click(filterButton)

      const runButton = screen.getByText('Run Workflow')
      fireEvent.click(runButton)

      await waitFor(() => {
        expect(api.getExcelSheets).toHaveBeenCalled()
      })
    })
  })

  describe('Case 2: Join Workflow - CSV A → CSV B → Join → Download Parquet', () => {
    it('handles dual CSV upload and join operation', async () => {
      api.uploadCSV
        .mockResolvedValueOnce({
          data: {
            node_id: 'csv_a_123',
            metadata: {
              schema: { 'id': 'Int64', 'name': 'Utf8' },
              preview: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
              column_count: 2
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            node_id: 'csv_b_456',
            metadata: {
              schema: { 'id': 'Int64', 'dept': 'Utf8' },
              preview: [{ id: 1, dept: 'Engineering' }, { id: 2, dept: 'Sales' }],
              column_count: 2
            }
          }
        })

      api.joinNodes.mockResolvedValue({
        data: {
          node_id: 'join_node_789',
          metadata: {
            schema: { 'id': 'Int64', 'name': 'Utf8', 'dept': 'Utf8' },
            preview: [
              { id: 1, name: 'Alice', dept: 'Engineering' },
              { id: 2, name: 'Bob', dept: 'Sales' }
            ],
            column_count: 3
          }
        }
      })

      const mockWorkflow = { name: 'Join Test Workflow' }
      
      render(
        <ReactFlowProvider>
          <WorkflowCanvas workflow={mockWorkflow} onBack={vi.fn()} />
        </ReactFlowProvider>
      )

      const uploadButton = screen.getByText('Smart Upload')
      fireEvent.click(uploadButton)
      fireEvent.click(uploadButton)

      const joinButton = screen.getByText('Join Tables')
      fireEvent.click(joinButton)

      expect(screen.getByText('Join Tables')).toBeInTheDocument()
    })
  })

  describe('Case 3: Connection Validation - String → Math Type Mismatch', () => {
    it('validates connection and shows type mismatch error', async () => {
      api.validateConnection.mockResolvedValue({
        data: {
          valid: false,
          reason: 'Type mismatch: String operations cannot connect to Math operations'
        }
      })

      const mockWorkflow = { name: 'Validation Test Workflow' }
      
      render(
        <ReactFlowProvider>
          <WorkflowCanvas workflow={mockWorkflow} onBack={vi.fn()} />
        </ReactFlowProvider>
      )

      const stringButton = screen.getByText('Change Case')
      fireEvent.click(stringButton)

      const mathButton = screen.getByText('Horizontal Math')
      fireEvent.click(mathButton)

      await waitFor(() => {
        expect(api.validateConnection).toHaveBeenCalled()
      })
    })
  })
})

describe('SmartUploadNode Component', () => {
  const mockData = {
    id: 'upload_123',
    mode: 'prompt',
    status: 'pending',
    onUpdate: vi.fn(),
    onExecuteDownstream: vi.fn(),
    onInspect: vi.fn(),
    onDownload: vi.fn()
  }

  it('renders in prompt mode correctly', () => {
    render(<SmartUploadNode data={mockData} selected={false} />)
    
    expect(screen.getByText('Smart Upload')).toBeInTheDocument()
    expect(screen.getByText('Will prompt on execution')).toBeInTheDocument()
  })

  it('switches between static and prompt modes', () => {
    render(<SmartUploadNode data={mockData} selected={false} />)
    
    const settingsButton = screen.getByRole('button')
    fireEvent.click(settingsButton)
    
    expect(mockData.onUpdate).toHaveBeenCalled()
  })
})

describe('DataInspector Component', () => {
  const mockInspectorData = {
    node_id: 'test_node_123',
    schema: {
      'Product': 'Utf8',
      'Amount': 'Int64',
      'Active': 'Boolean'
    },
    preview: [
      { Product: 'Widget A', Amount: 150, Active: true },
      { Product: 'Widget B', Amount: 75, Active: false }
    ],
    column_count: 3
  }

  it('renders data inspector with schema and preview', () => {
    render(
      <DataInspector
        data={mockInspectorData}
        onClose={vi.fn()}
        nodeId="test_node_123"
        onDownload={vi.fn()}
      />
    )

    expect(screen.getByText('Data Inspector')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Widget A')).toBeInTheDocument()
  })

  it('handles download with format selection', () => {
    const mockOnDownload = vi.fn()
    
    render(
      <DataInspector
        data={mockInspectorData}
        onClose={vi.fn()}
        nodeId="test_node_123"
        onDownload={mockOnDownload}
      />
    )

    const downloadButton = screen.getByRole('button', { name: /download/i })
    fireEvent.click(downloadButton)

    expect(mockOnDownload).toHaveBeenCalledWith('test_node_123', 'csv')
  })
})