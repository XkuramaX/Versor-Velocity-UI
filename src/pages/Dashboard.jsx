import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, FolderOpen, Share2, Eye, Mail, Sparkles } from 'lucide-react';
import { useWorkflow } from '../contexts/WorkflowContext';
import { workflowApi } from '../services/workflow.js';
import NavBar from '../components/NavBar';
import { authService } from '../services/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { state, dispatch } = useWorkflow();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPermission, setSelectedPermission] = useState('viewer');
  const [currentUser, setCurrentUser] = useState(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const user = authService.getUser();
    setCurrentUser(user);
    if (user && !user.is_verified) {
      setShowVerificationBanner(true);
    }
    // Fetch plan for feature flags
    const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API}/me/plan`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null).then(setPlan).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadWorkflows();
    }
  }, [currentUser]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getUserWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      alert('Failed to load workflows: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateWorkflow = async () => {
    const newId = Date.now().toString();
    try {
      await workflowApi.createWorkflow(newId, 'Untitled Workflow');
      navigate(`/editor/${newId}`);
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleOpenWorkflow = (workflowId) => {
    navigate(`/editor/${workflowId}`);
  };

  const handleDeleteWorkflow = async (workflowId, role) => {
    if (role !== 'creator') {
      alert('Only the creator can delete this workflow');
      return;
    }
    if (!confirm('Delete this workflow?')) return;
    
    try {
      await workflowApi.deleteWorkflow(workflowId);
      loadWorkflows();
    } catch (error) {
      alert('Failed to delete workflow');
    }
  };

  const handleShareWorkflow = (workflow) => {
    setShareModal(workflow);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await authService.searchUsers(query);
      setSearchResults(results.filter(u => u.id !== currentUser.id));
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddPermission = async (user) => {
    try {
      await workflowApi.addPermission(shareModal.id, user.id, user.username, selectedPermission);
      alert(`Added ${user.username} as ${selectedPermission}`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      alert('Failed to add permission');
    }
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification(currentUser.email);
      setResendMessage('Verification email sent! Check your inbox.');
      setTimeout(() => setResendMessage(''), 5000);
    } catch (error) {
      alert('Failed to send verification email');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-400 bg-green-400/10';
      case 'ERROR': return 'text-red-400 bg-red-400/10';
      case 'RUNNING': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      creator: 'bg-purple-500/20 text-purple-300',
      editor: 'bg-blue-500/20 text-blue-300',
      runner: 'bg-green-500/20 text-green-300',
      viewer: 'bg-slate-500/20 text-slate-300'
    };
    return colors[role] || colors.viewer;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <NavBar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Verification Banner */}
        {showVerificationBanner && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-medium">Email not verified</p>
                  <p className="text-slate-400 text-sm">Please verify your email to access all features</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {resendMessage ? (
                  <span className="text-green-400 text-sm">{resendMessage}</span>
                ) : (
                  <button
                    onClick={handleResendVerification}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Resend Email
                  </button>
                )}
                <button
                  onClick={() => setShowVerificationBanner(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Workflows</h2>
            <p className="text-slate-400">Manage and execute your data pipelines</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateWorkflow}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>New Workflow</span>
            </button>
            {plan?.feature_ai_generator !== false && (
              <button
                onClick={() => navigate('/ai-generate')}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                <span>AI Generate</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No workflows yet</h3>
            <p className="text-slate-400 mb-6">Create your first data pipeline to get started</p>
            <button
              onClick={handleCreateWorkflow}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2">
                    {workflow.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(workflow.role)}`}>
                      {workflow.role}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.lastRun)}`}>
                      {workflow.lastRun}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Owner:</span>
                  <span className="text-slate-300">{workflow.owner}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Modified:</span>
                  <span className="text-slate-300">
                    {new Date(workflow.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {(workflow.role === 'creator' || workflow.role === 'editor') && (
                  <button
                    onClick={() => navigate(`/editor/${workflow.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}

                {(workflow.role === 'creator' || workflow.role === 'editor' || workflow.role === 'runner') && (
                  <button
                    onClick={() => navigate(`/run/${workflow.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </button>
                )}

                {workflow.role === 'viewer' && (
                  <button
                    onClick={() => navigate(`/run/${workflow.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                )}
                
                {(workflow.role === 'creator' || workflow.role === 'editor') && (
                  <button
                    onClick={() => handleShareWorkflow(workflow)}
                    className="flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 p-2 rounded-lg transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
                
                {workflow.role === 'creator' && (
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id, workflow.role)}
                    className="flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Share Modal */}
        {shareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Share Workflow</h3>
              <p className="text-slate-400 mb-4">{shareModal.name}</p>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Permission Level</label>
                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 outline-none"
                >
                  <option value="viewer">Viewer - View only</option>
                  <option value="runner">Runner - View & Run</option>
                  <option value="editor">Editor - Full access</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Search Users</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Type username or email..."
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-cyan-500 outline-none"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{user.username}</div>
                        <div className="text-slate-400 text-sm">{user.email}</div>
                      </div>
                      <button
                        onClick={() => handleAddPermission(user)}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShareModal(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}