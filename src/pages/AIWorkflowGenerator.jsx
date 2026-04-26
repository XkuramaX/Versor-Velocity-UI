import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Loader } from 'lucide-react';
import WorkflowCanvas from '../components/WorkflowCanvas';
import { workflowApi } from '../services/workflow';
import { authService } from '../services/auth';
import VelocityLogo from '../components/VelocityLogo';

export default function AIWorkflowGenerator() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('AI Generated Workflow');
  const [showSaveBar, setShowSaveBar] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentUser = authService.getUser();
      const newId = Date.now().toString();
      await workflowApi.createWorkflow(newId, workflowName);

      // WorkflowCanvas stores its state internally — we need to get it via the DOM
      // The save modal inside WorkflowCanvas handles persistence, so navigate to editor
      navigate(`/editor/${newId}`);
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="h-5 w-px bg-slate-600" />
          <div className="flex items-center space-x-2">
            <VelocityLogo size={28} />
            <div>
              <h1 className="text-sm font-semibold text-white">Versor-Velocity <span className="text-purple-400">AI Studio</span></h1>
              <p className="text-[10px] text-slate-400">Chat with AI · Edit manually · Run & iterate</p>
            </div>
          </div>
        </div>
      </header>

      {/* Full WorkflowCanvas with AI mode enabled */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas
          aiMode={true}
          permissions={{ role: 'owner', canEdit: true, canRun: true, canShare: false }}
        />
      </div>
    </div>
  );
}
