import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, Building2, CheckCircle, AlertCircle, Shield, Crown } from 'lucide-react';
import NavBar from '../components/NavBar';
import { authService } from '../services/auth';
import { useAuth } from '../App';

export default function OrgDashboard() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [user, setUser] = useState(authService.getUser());
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', full_name: '', platform_role: 'user' });
  const [creating, setCreating] = useState(false);

  const flash = (setter, message) => { setter(message); setTimeout(() => setter(''), 5000); };

  useEffect(() => { loadOrg(); }, []);

  const loadOrg = async () => {
    setLoading(true);
    try {
      const fresh = await refreshUser();
      if (fresh) setUser(fresh);
      const u = fresh || user;
      if (u?.org_id) {
        const o = await authService.getOrg(u.org_id);
        setOrg(o);
        if (u.platform_role === 'admin' || u.platform_role === 'super_admin') {
          const m = await authService.getOrgMembers(u.org_id);
          setMembers(m);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) return;
    setCreating(true);
    try {
      await authService.adminCreateUser({ ...newUser, org_id: org.id });
      flash(setMsg, `${newUser.platform_role === 'admin' ? 'Admin' : 'User'} "${newUser.username}" created`);
      setNewUser({ username: '', email: '', password: '', full_name: '', platform_role: 'user' });
      loadOrg();
    } catch (e) { flash(setErr, e.message); }
    setCreating(false);
  };

  const handleRemoveMember = async (userId, username) => {
    if (!confirm(`Remove ${username} from the organization?`)) return;
    try { await authService.removeOrgMember(org.id, userId); flash(setMsg, `${username} removed`); loadOrg(); } catch (e) { flash(setErr, e.message); }
  };

  const handleRoleChange = async (userId, role) => {
    try { await authService.updateOrgMember(org.id, userId, role); flash(setMsg, 'Role updated'); loadOrg(); } catch (e) { flash(setErr, e.message); }
  };

  const handleTransferOwnership = async (userId, username) => {
    if (!confirm(`Transfer org ownership to ${username}?`)) return;
    try { await authService.transferOrg(org.id, userId); flash(setMsg, `Ownership transferred to ${username}`); loadOrg(); } catch (e) { flash(setErr, e.message); }
  };

  const isAdmin = user?.platform_role === 'admin';
  const isSuperAdmin = user?.platform_role === 'super_admin';
  const canManage = isAdmin || isSuperAdmin;

  // Visibility flags from org settings (default to true for admins)
  const showDetails = canManage || (org?.show_org_details !== false);
  const showName = canManage || (org?.show_org_name !== false);

  const inputCls = "w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm";
  const sectionCls = "bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <header className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-semibold text-white">{showName ? 'Organization' : 'Your Plan'}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {msg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{msg}</div>}
        {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : isSuperAdmin ? (
          <div className={sectionCls}>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Super Admin</h2>
            </div>
            <p className="text-slate-400 text-sm">Manage all organizations from the <button onClick={() => navigate('/admin')} className="text-cyan-400 hover:underline">Admin Panel</button>.</p>
          </div>
        ) : org ? (
          <>
            {/* Plan summary — always visible */}
            <div className={sectionCls}>
              {showName && <h2 className="text-xl font-bold text-white">{org.name}</h2>}
              {!showName && <h2 className="text-xl font-bold text-white">Your Plan</h2>}

              {showDetails && (
                <p className="text-sm text-slate-400">{org.member_count} members · Max {org.max_users >= 999999 ? '∞' : org.max_users}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-700/50">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Workflows / User</p>
                  <p className="text-lg font-bold text-white">{(org.max_workflows_per_user || 999999) >= 999999 ? '∞' : org.max_workflows_per_user}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Executions / Day</p>
                  <p className="text-lg font-bold text-white">{org.max_executions_day >= 999999 ? '∞' : org.max_executions_day}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Max File Size</p>
                  <p className="text-lg font-bold text-white">{(org.max_file_size_mb || 10240) >= 999999 ? '∞' : (org.max_file_size_mb || 10) + ' MB'}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Saves / Workflow</p>
                  <p className="text-lg font-bold text-white">{(org.max_saved_nodes ?? 10) === 0 ? 'None' : (org.max_saved_nodes ?? 10) >= 999999 ? '∞' : org.max_saved_nodes}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Features</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {org.feature_ai_generator && <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">AI</span>}
                    {org.feature_scheduler && <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-xs">Scheduler</span>}
                    {org.feature_export && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs">Export</span>}
                    {org.feature_api_triggers && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">API</span>}
                    {!org.feature_ai_generator && !org.feature_scheduler && !org.feature_api_triggers && <span className="text-xs text-slate-500">Basic</span>}
                  </div>
                </div>
              </div>

              {showDetails && org.allowed_node_groups && !org.allowed_node_groups.includes('all') && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Allowed Node Groups</p>
                  <div className="flex flex-wrap gap-1">
                    {org.allowed_node_groups.map(g => (
                      <span key={g} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {!showDetails && <p className="text-xs text-slate-500 pt-1"><button onClick={() => navigate('/pricing')} className="text-cyan-400 hover:underline">View plans & upgrade →</button></p>}
            </div>

            {/* Members (admin only) */}
            {canManage && (
              <div className={sectionCls}>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5" />Members</h3>
                <div className="space-y-2">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{m.username}</span>
                        <span className="text-slate-400 text-sm ml-2">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.id !== user.id ? (
                          <>
                            <select value={m.platform_role} onChange={e => handleRoleChange(m.id, e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1">
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            {isAdmin && m.platform_role === 'admin' && (
                              <button onClick={() => handleTransferOwnership(m.id, m.username)} title="Transfer org ownership"
                                className="p-1 text-purple-400 hover:text-purple-300"><Crown className="w-4 h-4" /></button>
                            )}
                            <button onClick={() => handleRemoveMember(m.id, m.username)}
                              className="p-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs ${m.platform_role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-500/20 text-slate-300'}`}>
                            {m.platform_role} (you)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create User (admin only) */}
            {canManage && (
              <div className={sectionCls}>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><UserPlus className="w-5 h-5" />Create User</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="Username *" className={inputCls} />
                  <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Email *" className={inputCls} />
                  <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Password *" className={inputCls} />
                  <input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} placeholder="Full Name" className={inputCls} />
                </div>
                <div className="flex items-center gap-3">
                  <select value={newUser.platform_role} onChange={e => setNewUser(p => ({ ...p, platform_role: e.target.value }))}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={handleCreateUser} disabled={creating || !newUser.username || !newUser.email || !newUser.password}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            )}

            {/* Regular user in B2B org with name visible */}
            {!canManage && showName && showDetails && (
              <div className={sectionCls}>
                <p className="text-slate-400 text-sm">Contact your organization admin for account changes.</p>
              </div>
            )}
          </>
        ) : (
          <div className={sectionCls}>
            <h3 className="text-lg font-semibold text-white">No Organization</h3>
            <p className="text-slate-400 text-sm">You are not part of any organization. Contact your administrator.</p>
          </div>
        )}
      </main>
    </div>
  );
}
