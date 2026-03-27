import React, { useState, useEffect } from 'react';
import { X, Trash2, Crown, User } from 'lucide-react';
import { workflowApi } from '../services/workflow';
import { authService } from '../services/auth';

export default function SaveWorkflowModal({ workflowId, nodes, edges, onClose }) {
  const [workflowName, setWorkflowName] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getUser();

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      const workflows = await workflowApi.getUserWorkflows(currentUser.id);
      const wf = workflows.find(w => w.id === workflowId);
      
      if (wf) {
        setWorkflow(wf);
        setWorkflowName(wf.name);
      } else {
        setWorkflowName(`Workflow ${workflowId}`);
      }

      const perms = await workflowApi.getPermissions(workflowId);
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      setWorkflowName(`Workflow ${workflowId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!confirm('Are you sure you want to save this workflow?')) return;
    
    try {
      const workflowData = JSON.stringify({ nodes, edges });
      
      // Check if workflow exists, if not create it
      if (!workflow) {
        await workflowApi.createWorkflow(workflowId, workflowName, currentUser.id, currentUser.username);
      }
      
      // Check if workflow has changed
      if (workflow?.workflow_data) {
        const currentData = JSON.parse(workflow.workflow_data);
        const newData = { nodes, edges };
        
        if (JSON.stringify(currentData) === JSON.stringify(newData)) {
          alert('No changes detected. Workflow not saved.');
          return;
        }
      }
      
      await workflowApi.updateWorkflow(workflowId, { name: workflowName, workflow_data: workflowData });
      
      await workflowApi.saveVersion(workflowId, workflowData, currentUser.username, '');
      
      alert('Workflow saved successfully');
      onClose();
    } catch (error) {
      alert('Failed to save workflow: ' + error.message);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm('Remove this user from the workflow?')) return;
    
    try {
      await workflowApi.removePermission(workflowId, userId);
      setPermissions(perms => perms.filter(p => p.user_id !== userId));
    } catch (error) {
      alert('Failed to remove user: ' + error.message);
    }
  };

  const handleTransferOwnership = async (userId, username) => {
    if (!confirm(`Transfer ownership to ${username}? You will become an editor.`)) return;
    
    try {
      // Update workflow creator
      await workflowApi.transferOwnership(workflowId, userId, username, currentUser.id);
      alert('Ownership transferred successfully');
      onClose();
      window.location.reload();
    } catch (error) {
      alert('Failed to transfer ownership: ' + error.message);
    }
  };

  const isCreator = workflow?.role === 'creator';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Save Workflow</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : (
          <>
            {/* Workflow Name */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-cyan-500 outline-none"
                placeholder="Enter workflow name..."
              />
            </div>

            {/* Users with Access */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Users with Access</h4>
              
              {/* Creator */}
              {workflow && (
                <div className="bg-slate-700/50 p-4 rounded-lg mb-3 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{workflow.owner}</div>
                        <div className="text-sm text-purple-400">Creator (Owner)</div>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">Cannot be removed</div>
                  </div>
                </div>
              )}

              {/* Other Users */}
              {permissions.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  No other users have access to this workflow
                </div>
              ) : (
                <div className="space-y-2">
                  {permissions.map(perm => (
                    <div key={perm.user_id} className="bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{perm.username}</div>
                          <div className="text-sm text-slate-400 capitalize">{perm.permission_level}</div>
                        </div>
                      </div>
                      
                      {isCreator && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTransferOwnership(perm.user_id, perm.username)}
                            className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded text-sm flex items-center space-x-1"
                            title="Transfer ownership"
                          >
                            <Crown className="w-3 h-3" />
                            <span>Make Owner</span>
                          </button>
                          <button
                            onClick={() => handleRemoveUser(perm.user_id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded"
                            title="Remove user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Save Workflow
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
