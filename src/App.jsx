import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { authService } from './services/auth';
import { RequireAuth, RequireRole, Require2FASetup } from './components/RouteGuards';
import ReportIssueButton from './components/ReportIssueButton';

// Pages
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import WorkflowEditorPage from './pages/WorkflowEditor';
import WorkflowRunnerPage from './pages/WorkflowRunner';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import OrgDashboard from './pages/OrgDashboard';
import UsageDashboard from './pages/UsageDashboard';
import MyTickets from './pages/MyTickets';
import PricingPage from './pages/PricingPage';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import { WorkflowProvider } from './contexts/WorkflowContext';

// Lazy-loaded optional pages
const AIWorkflowGenerator = React.lazy(() =>
  import('./pages/AIWorkflowGenerator').catch(() => ({ default: () => <Navigate to="/dashboard" /> }))
);

// ── Global Auth Context ─────────────────────────────────────────────────────
// Centralized auth state — when admin changes a user's role/permissions,
// any component can call refreshUser() to get fresh data without page reload.

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authService.verifyToken();
      setUser(u);
      setIsAuthenticated(!!u);
      return u;
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  const login = useCallback(async () => {
    const u = authService.getUser();
    setUser(u);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  // Periodic refresh — catches role changes, suspensions, org limit updates (every 5 min)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => { refreshUser(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUser]);

  // Listen for 401 events from api.js interceptor
  useEffect(() => {
    const handler = () => { setUser(null); setIsAuthenticated(false); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <ReportIssueButton />}
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <LoginScreen onLogin={login} />
        } />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected — any authenticated user */}
        <Route path="/dashboard" element={<RequireAuth><Require2FASetup><Dashboard /></Require2FASetup></RequireAuth>} />
        <Route path="/editor/:workflowId?" element={<RequireAuth><WorkflowEditorPage /></RequireAuth>} />
        <Route path="/run/:workflowId" element={<RequireAuth><WorkflowRunnerPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/org" element={<RequireAuth><OrgDashboard /></RequireAuth>} />
        <Route path="/usage" element={<RequireAuth><UsageDashboard /></RequireAuth>} />
        <Route path="/tickets" element={<RequireAuth><MyTickets /></RequireAuth>} />
        <Route path="/pricing" element={<RequireAuth><PricingPage /></RequireAuth>} />
        <Route path="/ai-generate" element={
          <RequireAuth>
            <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>}>
              <AIWorkflowGenerator />
            </React.Suspense>
          </RequireAuth>
        } />

        {/* Protected — super_admin only */}
        <Route path="/admin" element={
          <RequireAuth><RequireRole roles={['super_admin']}><AdminPanel /></RequireRole></RequireAuth>
        } />
        <Route path="/admin/tickets" element={<Navigate to="/admin" />} />

        {/* Catch-all */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <Router>
          <AppRoutes />
        </Router>
      </WorkflowProvider>
    </AuthProvider>
  );
}

export default App;
