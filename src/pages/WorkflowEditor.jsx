import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Lock } from 'lucide-react';
import { useWorkflow } from '../contexts/WorkflowContext';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { workflowApi } from '../services/workflow.js';
import { authService } from '../services/auth.js';
import VelocityLogo from '../components/VelocityLogo';

export default function WorkflowEditor() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useWorkflow();
  const [permissions, setPermissions] = useState({
    role: 'viewer',
    canEdit: false,
    canRun: false,
    canShare: false
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const currentUser = authService.getUser();
        const access = await workflowApi.checkAccess(workflowId, currentUser.id);
        const role = access.access;

        // Redirect non-editors to the run page
        if (role !== 'creator' && role !== 'editor') {
          navigate(`/run/${workflowId}`, { replace: true });
          return;
        }

        setPermissions({
          role,
          canEdit: access.can_edit,
          canRun: access.can_run,
          canShare: access.can_edit
        });
      } catch (error) {
        console.error('Failed to load workflow permissions:', error);
      }
    };
    loadPermissions();
  }, [workflowId, navigate]);

  const getPermissionColor = () => {
    const colors = {
      creator: 'from-purple-500 to-pink-500',
      editor: 'from-blue-500 to-cyan-500', 
      viewer: 'from-green-500 to-emerald-500',
      runner: 'from-orange-500 to-yellow-500'
    };
    return colors[permissions.role] || colors.viewer;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="header px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="h-6 w-px bg-slate-600"></div>
            <div className="flex items-center space-x-3">
              <VelocityLogo size={32} />
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Versor-Velocity <span className="text-cyan-400 text-base font-normal">Editor</span>
                </h1>
                <p className="text-sm text-slate-400">
                  {workflowId} • {permissions.role.charAt(0).toUpperCase() + permissions.role.slice(1)} Access
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg glass-dark permission-${permissions.role}`}>
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{permissions.role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workflow Canvas */}
      <div className="flex-1">
        <WorkflowCanvas 
          workflowId={workflowId}
          permissions={permissions}
        />
      </div>
    </div>
  );
}