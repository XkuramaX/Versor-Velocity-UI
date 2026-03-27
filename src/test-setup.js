import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock React Flow
vi.mock('reactflow', () => ({
  ReactFlowProvider: ({ children }) => children,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
  Controls: () => null,
  Background: () => null,
  MiniMap: () => null,
  Panel: ({ children }) => children,
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' }
}))

// Mock window methods
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(),
    revokeObjectURL: vi.fn()
  }
})
