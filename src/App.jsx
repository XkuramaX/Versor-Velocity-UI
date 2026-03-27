import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { authService } from './services/auth';
import WorkflowEditorPage from './pages/WorkflowEditor';
import WorkflowRunnerPage from './pages/WorkflowRunner';
import Dashboard from './pages/Dashboard';
import AIWorkflowGenerator from './pages/AIWorkflowGenerator';
import FeatureTicketsDashboard from './pages/FeatureTicketsDashboard';
import { WorkflowProvider } from './contexts/WorkflowContext';
import LoginScreen from './pages/LoginScreen.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.verifyToken();
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <WorkflowProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginScreen onLogin={() => setIsAuthenticated(true)} />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/editor/:workflowId?"
            element={isAuthenticated ? <WorkflowEditorPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/run/:workflowId"
            element={isAuthenticated ? <WorkflowRunnerPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/ai-generate"
            element={isAuthenticated ? <AIWorkflowGenerator /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/tickets"
            element={isAuthenticated ? <FeatureTicketsDashboard /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </WorkflowProvider>
  );
}

export default App;
