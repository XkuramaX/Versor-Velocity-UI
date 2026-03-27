import React, { useState, useEffect } from 'react';
import { X, Users, Lock, Unlock, Eye, Play, Plus, Trash2, Crown } from 'lucide-react';
import { workflowApi } from '../services/workflow.js';
import { authService } from '../services/auth.js';

export default function PermissionManager({ workflowId, currentPermissions, onClose }) {
  const [permissions, setPermissions] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getUser();

  useEffect(() => {
    loadData();
  }, [workflowId]);

  const loadData = async () => {
    try {
      const workflows = await workflowApi.getUserWorkflows(currentUser.id);
      const wf = workflows.find(w => w.id === workflowId);
      setWorkflow(wf);
      
      const perms = await workflowApi.getPermissions(workflowId);
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
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

  const handleAddUser = async (user) => {
    try {
      await workflowApi.addPermission(workflowId, user.id, user.username, selectedRole);
      setSearchQuery('');
      setSearchResults([]);
      loadData();
    } catch (error) {
      alert('Failed to add user: ' + error.message);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm('Remove this user from the workflow?')) return;
    try {
      await workflowApi.removePermission(workflowId, userId);
      loadData();
    } catch (error) {
      alert('Failed to remove user: ' + error.message);
    }
  };

  const handleLeaveWorkflow = async () => {
    if (!confirm('Leave this workflow? You will lose access.')) return;
    try {
      await workflowApi.removePermission(workflowId, currentUser.id);
      alert('You have left the workflow');
      onClose();
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Failed to leave workflow: ' + error.message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const user = permissions.find(p => p.user_id === userId);
      await workflowApi.addPermission(workflowId, userId, user.username, newRole);
      loadData();
    } catch (error) {
      alert('Failed to update role: ' + error.message);
    }
  };

  const isCreator = workflow?.role === 'creator';
  const canManagePermissions = isCreator || workflow?.role === 'editor';

  const roleIcons = {
    creator: Crown,
    editor: Unlock,
    viewer: Eye,
    runner: Play
  };

  const roleColors = {
    creator: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    editor: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    viewer: 'text-green-400 bg-green-500/20 border-green-500/30',
    runner: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Manage Access</h2>
              <p className="text-sm text-slate-400">Workflow {workflowId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current User (Owner) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Owner</label>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{workflow?.owner || currentUser.username}</p>
                  <p className="text-xs text-slate-400">Full access</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded text-xs border text-purple-400 bg-purple-500/20 border-purple-500/30">
                Creator
              </span>
            </div>
          </div>

          {/* Shared Users */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Shared with</label>
            {permissions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No users have access yet</p>
            ) : (
              <div className="space-y-2">
                {permissions.map((permission) => {
                  const RoleIcon = roleIcons[permission.permission_level] || Eye;
                  const roleColor = roleColors[permission.permission_level] || roleColors.viewer;
                  return (
                    <div key={permission.user_id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleColor}`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white">{permission.username}</p>
                          <p className="text-xs text-slate-400 capitalize">{permission.permission_level} access</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canManagePermissions ? (
                          <>
                            <select
                              value={permission.permission_level}
                              onChange={(e) => handleUpdateRole(permission.user_id, e.target.value)}
                              className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="runner">Runner</option>
                            </select>
                            <button
                              onClick={() => handleRemoveUser(permission.user_id)}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-sm capitalize">{permission.permission_level}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New User */}
          {canManagePermissions && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Add User</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search by username or email..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="runner">Runner</option>
                  </select>
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {searchResults.map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{user.username}</div>
                          <div className="text-slate-400 text-sm">{user.email}</div>
                        </div>
                        <button
                          onClick={() => handleAddUser(user)}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Role Descriptions */}
          <div className="bg-slate-700/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Permission Levels</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <div><span className="text-green-400">Viewer:</span> Can view workflow and results</div>
              <div><span className="text-blue-400">Editor:</span> Can modify workflow structure</div>
              <div><span className="text-orange-400">Runner:</span> Can execute workflows</div>
              <div><span className="text-purple-400">Owner:</span> Full access and sharing rights</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            {!canManagePermissions && (
              <button
                onClick={handleLeaveWorkflow}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Leave Workflow
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              {canManagePermissions ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}