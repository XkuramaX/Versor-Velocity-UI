import React, { createContext, useContext, useReducer } from 'react';

const WorkflowContext = createContext();

const initialState = {
  nodes: [],
  edges: [],
  selectedNode: null,
  executionState: {},
  workflows: [],
  currentWorkflow: null,
  isRunning: false
};

function workflowReducer(state, action) {
  switch (action.type) {
    case 'SET_NODES':
      return { ...state, nodes: action.payload };
    case 'SET_EDGES':
      return { ...state, edges: action.payload };
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload] };
    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id ? { ...node, ...action.payload } : node
        )
      };
    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
        edges: state.edges.filter(edge => 
          edge.source !== action.payload && edge.target !== action.payload
        )
      };
    case 'SET_SELECTED_NODE':
      return { ...state, selectedNode: action.payload };
    case 'UPDATE_EXECUTION_STATE':
      return {
        ...state,
        executionState: { ...state.executionState, [action.payload.nodeId]: action.payload.state }
      };
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload };
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'RESET_WORKFLOW':
      return { ...initialState, workflows: state.workflows };
    default:
      return state;
  }
}

export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}