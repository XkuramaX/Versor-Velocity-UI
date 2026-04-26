import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, ShieldOff, Trash2, Key, Clock, ChevronLeft, ChevronRight, Building2, Workflow, BarChart3, Search, Ticket, MessageSquare, Send, X, ExternalLink, FolderOpen } from 'lucide-react';
import { authService } from '../services/auth';
import NavBar from '../components/NavBar';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const _authHeaders = (json = false) => {
  const h = {};
  const token = authService.getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const SearchBox = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none w-64" />
  </div>
);

const FilterSelect = ({ value, onChange, options, label }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none">
    <option value="">{label}</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Paginator = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="p-2 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const currentUser = authService.getUser();

  useEffect(() => { if (!authService.isSuperAdmin()) navigate('/dashboard'); }, []);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'orgs', label: 'Organizations' },
    { key: 'workflows', label: 'Workflows' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'audit', label: 'Audit Log' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <header className="bg-slate-800/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab currentUser={currentUser} />}
        {tab === 'orgs' && <OrgsTab />}
        {tab === 'workflows' && <WorkflowsTab />}
        {tab === 'tickets' && <TicketsTab />}
        {tab === 'audit' && <AuditTab />}
      </main>
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [orgUsage, setOrgUsage] = useState(null);
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: _authHeaders() }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => {});
    fetch(`${API}/admin/usage/by-user?days=7&limit=10`, { headers: _authHeaders() }).then(r => r.ok ? r.json() : null).then(setUsage).catch(() => {});
    fetch(`${API}/admin/usage/by-org?days=7`, { headers: _authHeaders() }).then(r => r.ok ? r.json() : null).then(setOrgUsage).catch(() => {});
    authService.adminListOrgs().then(setOrgs).catch(() => {});
  }, []);

  // Build org name lookup
  const orgNames = {};
  orgs.forEach(o => { orgNames[o.id] = o.name; });

  if (!stats) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CPU', value: stats.system?.cpu_percent + '%' },
          { label: 'Memory', value: stats.system?.memory_percent + '%', sub: `${stats.system?.memory_used_gb}/${stats.system?.memory_total_gb} GB` },
          { label: 'Disk', value: stats.system?.disk_percent + '%', sub: `${stats.system?.disk_used_gb}/${stats.system?.disk_total_gb} GB` },
          { label: 'Cache', value: stats.application?.cache_size_mb + ' MB' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            {s.sub && <p className="text-xs text-slate-500">{s.sub}</p>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workflows', value: stats.application?.total_workflows },
          { label: 'Executions Today', value: stats.application?.today_executions },
          { label: 'Executions (7d)', value: stats.application?.week_executions },
          { label: 'Open Tickets', value: stats.application?.open_tickets },
        ].map((s, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value?.toLocaleString() ?? '—'}</p>
          </div>
        ))}
      </div>
      {usage?.users?.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" />Top Users (7 days)</h3>
          <table className="w-full">
            <thead><tr className="text-xs text-slate-400 uppercase">
              <th className="px-3 py-2 text-left">User ID</th><th className="px-3 py-2 text-right">Executions</th>
              <th className="px-3 py-2 text-right">Uploads</th><th className="px-3 py-2 text-right">Runs</th><th className="px-3 py-2 text-right">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {usage.users.map(u => (
                <tr key={u.user_id} className="hover:bg-slate-700/20 text-sm">
                  <td className="px-3 py-2 text-white font-mono">#{u.user_id}</td>
                  <td className="px-3 py-2 text-right text-cyan-400">{u.executions}</td>
                  <td className="px-3 py-2 text-right text-purple-400">{u.uploads}</td>
                  <td className="px-3 py-2 text-right text-amber-400">{u.runs}</td>
                  <td className="px-3 py-2 text-right text-white font-semibold">{u.total_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orgUsage?.orgs?.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" />Usage by Organization (7 days)</h3>
          <table className="w-full">
            <thead><tr className="text-xs text-slate-400 uppercase">
              <th className="px-3 py-2 text-left">Organization</th><th className="px-3 py-2 text-right">Executions</th>
              <th className="px-3 py-2 text-right">Uploads</th><th className="px-3 py-2 text-right">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-700/50">
              {orgUsage.orgs.map(o => (
                <tr key={o.org_id} className="hover:bg-slate-700/20 text-sm">
                  <td className="px-3 py-2 text-white">{orgNames[o.org_id] || `Org #${o.org_id}`}</td>
                  <td className="px-3 py-2 text-right text-cyan-400">{o.executions}</td>
                  <td className="px-3 py-2 text-right text-purple-400">{o.uploads}</td>
                  <td className="px-3 py-2 text-right text-white font-semibold">{o.total_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', full_name: '', platform_role: 'user', org_id: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
    authService.adminListOrgs().then(setOrgs).catch(() => {});
  }, []);
  const loadUsers = async () => {
    try { setUsers(await authService.adminListUsers()); } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const orgNames = {};
  orgs.forEach(o => { orgNames[o.id] = o.name; });

  const filtered = users.filter(u => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.platform_role !== roleFilter) return false;
    if (orgFilter && String(u.org_id) !== orgFilter) return false;
    return true;
  });

  const handleRoleChange = async (userId, role) => { try { await authService.adminSetRole(userId, role); loadUsers(); } catch (e) { alert(e.message); } };
  const handleSuspend = async (userId) => { try { await authService.adminSuspendUser(userId); loadUsers(); } catch (e) { alert(e.message); } };
  const handleDelete = async (userId, username) => { if (!confirm(`Delete "${username}"?`)) return; try { await authService.adminDeleteUser(userId); loadUsers(); } catch (e) { alert(e.message); } };
  const handleReset2FA = async (userId, username) => { if (!confirm(`Reset 2FA for "${username}"?`)) return; try { await authService.adminReset2FA(userId); loadUsers(); } catch (e) { alert(e.message); } };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.org_id) return;
    setCreating(true);
    try {
      await authService.adminCreateUser({ ...newUser, org_id: parseInt(newUser.org_id) });
      setNewUser({ username: '', email: '', password: '', full_name: '', platform_role: 'user', org_id: '' });
      setShowCreate(false);
      loadUsers();
    } catch (e) { alert(e.message); }
    setCreating(false);
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5" />{filtered.length} Users</h2>
        <div className="flex gap-2 flex-wrap">
          <SearchBox value={search} onChange={setSearch} placeholder="Search users..." />
          <FilterSelect value={roleFilter} onChange={setRoleFilter} label="All Roles"
            options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }, { value: 'super_admin', label: 'Super Admin' }]} />
          <FilterSelect value={orgFilter} onChange={setOrgFilter} label="All Orgs"
            options={orgs.map(o => ({ value: String(o.id), label: o.name }))} />
          <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg">+ Create User</button>
        </div>
      </div>

      {showCreate && (
        <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-5 space-y-3">
          <h3 className="text-white font-semibold">Create User / Admin</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="Username *"
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
            <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="Email *"
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
            <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Password *"
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
            <input value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} placeholder="Full Name"
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
            <select value={newUser.org_id} onChange={e => setNewUser(p => ({ ...p, org_id: e.target.value }))}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none">
              <option value="">Select Organization *</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <select value={newUser.platform_role} onChange={e => setNewUser(p => ({ ...p, platform_role: e.target.value }))}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateUser} disabled={creating || !newUser.username || !newUser.email || !newUser.password || !newUser.org_id}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-700/50 text-xs text-slate-400 uppercase">
            <th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Org</th>
            <th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-center">2FA</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-700/50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-700/20">
                <td className="px-4 py-3"><div className="text-white font-medium">{u.username}</div><div className="text-xs text-slate-500">{u.full_name}</div></td>
                <td className="px-4 py-3 text-sm text-slate-300">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{u.org_id ? (orgNames[u.org_id] || `#${u.org_id}`) : '—'}</td>
                <td className="px-4 py-3">
                  <select value={u.platform_role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={u.id === currentUser?.id}
                    className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1 disabled:opacity-50">
                    <option value="user">User</option><option value="admin">Admin</option><option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">{u.totp_enabled ? <Shield className="w-4 h-4 text-emerald-400 mx-auto" /> : <ShieldOff className="w-4 h-4 text-slate-500 mx-auto" />}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs ${u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                <td className="px-4 py-3">{u.id !== currentUser?.id && (
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleSuspend(u.id)} title={u.is_active ? 'Suspend' : 'Activate'} className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white">{u.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}</button>
                    {u.totp_enabled && <button onClick={() => handleReset2FA(u.id, u.username)} title="Reset 2FA" className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><Key className="w-4 h-4" /></button>}
                    <button onClick={() => handleDelete(u.id, u.username)} title="Delete" className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Organizations Tab ────────────────────────────────────────────────────────

const ALL_NODE_GROUPS = ['io','transform','string','math','vector','clean','dtype','datetime','combine','advanced','matrix','ml','stats','timeseries','simulation','viz','rollrate','util'];

function OrgsTab() {
  const [orgs, setOrgs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newOrgName, setNewOrgName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { loadOrgs(); }, []);
  const loadOrgs = async () => {
    try { setOrgs(await authService.adminListOrgs()); } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    try {
      await authService.createOrg(newOrgName.trim());
      setNewOrgName(''); setShowCreate(false); loadOrgs();
    } catch (e) { alert(e.message); }
  };

  const filtered = orgs.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (org) => {
    setEditing(org.id);
    setEditForm({
      max_users: org.max_users, max_workflows: org.max_workflows,
      max_workflows_per_user: org.max_workflows_per_user ?? 5,
      max_executions_day: org.max_executions_day ?? 100,
      max_file_size_mb: org.max_file_size_mb ?? 10,
      allowed_node_groups: org.allowed_node_groups || ['all'],
      feature_ai_generator: org.feature_ai_generator ?? false,
      feature_scheduler: org.feature_scheduler ?? false,
      feature_export: org.feature_export ?? true,
      feature_api_triggers: org.feature_api_triggers ?? false,
      show_org_details: org.show_org_details ?? true,
      show_org_name: org.show_org_name ?? true,
      max_saved_nodes: org.max_saved_nodes ?? 10,
    });
  };
  const saveEdit = async (orgId) => {
    try {
      await authService.adminUpdateOrg(orgId, editForm);
      // Sync quota fields to backend QuotaOverride
      await fetch(`${API}/admin/quotas`, {
        method: 'PUT', headers: _authHeaders(true),
        body: JSON.stringify({
          org_id: orgId, user_id: null,
          max_executions_day: editForm.max_executions_day,
          max_workflows: editForm.max_workflows,
          max_file_size_mb: editForm.max_file_size_mb,
          allowed_node_groups: editForm.allowed_node_groups,
        }),
      });
      setEditing(null);
      loadOrgs();
    } catch (e) { alert(e.message); }
  };
  const toggleNodeGroup = (group) => {
    setEditForm(f => {
      const current = f.allowed_node_groups || ['all'];
      if (group === 'all') return { ...f, allowed_node_groups: ['all'] };
      let next = current.filter(g => g !== 'all');
      next = next.includes(group) ? next.filter(g => g !== group) : [...next, group];
      return { ...f, allowed_node_groups: next.length === 0 ? ['all'] : next };
    });
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 className="w-5 h-5" />{filtered.length} Organizations</h2>
        <div className="flex gap-2">
          <SearchBox value={search} onChange={setSearch} placeholder="Search orgs..." />
          <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg">+ New Org</button>
        </div>
      </div>
      {showCreate && (
        <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-4 flex gap-2">
          <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Organization name"
            onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
          <button onClick={handleCreateOrg} disabled={!newOrgName.trim()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg disabled:opacity-50">Create</button>
          <button onClick={() => setShowCreate(false)} className="px-3 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{orgs.length === 0 ? 'No organizations created yet' : 'No matches'}</div>
      ) : filtered.map(o => (
        <div key={o.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium text-lg">{o.name}</span>
              <span className="text-slate-500 text-sm ml-2">{o.slug}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${o.member_count >= o.max_users ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{o.member_count}/{o.max_users} members</span>
              <span className="text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</span>
            </div>
          </div>

          {editing === o.id ? (
            <div className="space-y-3 pt-2 border-t border-slate-700/50">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[{k:'max_users',l:'Max Users'},{k:'max_workflows',l:'Max Workflows'},{k:'max_workflows_per_user',l:'WF/User'},{k:'max_executions_day',l:'Exec/Day'},{k:'max_file_size_mb',l:'File MB'},{k:'max_saved_nodes',l:'Saves/WF'}].map(f => (
                  <div key={f.k}>
                    <label className="text-xs text-slate-400 block mb-1">{f.l}</label>
                    <input type="number" value={editForm[f.k] ?? ''} onChange={e => setEditForm(prev => ({ ...prev, [f.k]: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-2 py-1.5" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Feature Flags</label>
                <div className="flex flex-wrap gap-2">
                  {[{k:'feature_ai_generator',l:'AI Generator'},{k:'feature_scheduler',l:'Scheduler'},{k:'feature_export',l:'Export'},{k:'feature_api_triggers',l:'API Triggers'}].map(f => (
                    <button key={f.k} onClick={() => setEditForm(prev => ({ ...prev, [f.k]: !prev[f.k] }))}
                      className={`px-2.5 py-1 rounded text-xs border transition-colors ${editForm[f.k] ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50' : 'bg-slate-700/50 text-slate-500 border-slate-600'}`}>
                      {editForm[f.k] ? '✓' : '✗'} {f.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Visibility</label>
                <div className="flex flex-wrap gap-2">
                  {[{k:'show_org_name',l:'Show Org Name'},{k:'show_org_details',l:'Show Org Details'}].map(f => (
                    <button key={f.k} onClick={() => setEditForm(prev => ({ ...prev, [f.k]: !prev[f.k] }))}
                      className={`px-2.5 py-1 rounded text-xs border transition-colors ${editForm[f.k] ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' : 'bg-slate-700/50 text-slate-500 border-slate-600'}`}>
                      {editForm[f.k] ? '✓' : '✗'} {f.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Allowed Node Groups</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => toggleNodeGroup('all')}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${editForm.allowed_node_groups?.includes('all') ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'}`}>All</button>
                  {ALL_NODE_GROUPS.map(g => (
                    <button key={g} onClick={() => toggleNodeGroup(g)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${!editForm.allowed_node_groups?.includes('all') && editForm.allowed_node_groups?.includes(g) ? 'bg-purple-500/30 text-purple-300 border-purple-500/50' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveEdit(o.id)} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded">Save</button>
                <button onClick={() => setEditing(null)} className="px-4 py-1.5 text-slate-400 hover:text-white text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                <span>WF/User: <span className="text-slate-300">{o.max_workflows_per_user ?? '∞'}</span></span>
                <span>Exec/day: <span className="text-slate-300">{o.max_executions_day ?? '∞'}</span></span>
                <span>File: <span className="text-slate-300">{o.max_file_size_mb ?? 10}MB</span></span>
                <span>Saves/WF: <span className="text-slate-300">{o.max_saved_nodes === 0 ? 'None' : (o.max_saved_nodes ?? 10)}</span></span>
                <span>Flags: {[o.feature_ai_generator && 'AI', o.feature_scheduler && 'Sched', o.feature_export && 'Export', o.feature_api_triggers && 'API'].filter(Boolean).join(', ') || 'Basic'}</span>
                {!o.show_org_name && <span className="text-amber-400">Name hidden</span>}
                {!o.show_org_details && <span className="text-amber-400">Details hidden</span>}
              </div>
              <button onClick={() => startEdit(o)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded">Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Workflows Tab ────────────────────────────────────────────────────────────

function WorkflowsTab() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWorkflows(); }, [page, search]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      let url = `${API}/admin/workflows?page=${page}&per_page=30`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const r = await fetch(url, { headers: _authHeaders() });
      if (r.ok) setData(await r.json());
    } catch {}
    setLoading(false);
  };

  const handleSearch = () => { setPage(1); setSearch(searchInput); };

  const handleDelete = async (wfId, name) => {
    if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`${API}/workflows/${wfId}`, { method: 'DELETE', headers: _authHeaders() });
      if (r.ok) loadWorkflows();
      else alert('Failed to delete');
    } catch { alert('Failed to delete'); }
  };

  const statusColor = (s) => ({
    SUCCESS: 'bg-emerald-500/20 text-emerald-400', ERROR: 'bg-red-500/20 text-red-400', RUNNING: 'bg-blue-500/20 text-blue-400',
  }[s] || 'bg-slate-500/20 text-slate-400');

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Workflow className="w-5 h-5" />{data?.total ?? 0} Workflows</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search name or creator..."
              className="pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none w-64" />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg">Search</button>
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-700/50 text-xs text-slate-400 uppercase">
            <th className="px-4 py-3 text-left">Workflow</th><th className="px-4 py-3 text-left">Creator</th>
            <th className="px-4 py-3 text-center">Runs</th><th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-left">Modified</th><th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading && !data ? <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr> : (data?.workflows || []).map(wf => (
              <tr key={wf.id} className="hover:bg-slate-700/20">
                <td className="px-4 py-3"><div className="text-white font-medium truncate max-w-[220px]">{wf.name}</div><div className="text-xs text-slate-500 font-mono">{wf.id}</div></td>
                <td className="px-4 py-3 text-sm text-slate-300">{wf.creator_username}<div className="text-xs text-slate-500">uid:{wf.creator_id}</div></td>
                <td className="px-4 py-3 text-center text-sm text-slate-300">{wf.run_count}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(wf.last_run)}`}>{wf.last_run}</span></td>
                <td className="px-4 py-3 text-xs text-slate-400">{wf.updated_at ? new Date(wf.updated_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => navigate(`/editor/${wf.id}`)} title="Open in Editor"
                      className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><FolderOpen className="w-4 h-4" /></button>
                    <button onClick={() => navigate(`/run/${wf.id}`)} title="View Runs"
                      className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white"><ExternalLink className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(wf.id, wf.name)} title="Delete"
                      className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && (!data?.workflows || data.workflows.length === 0) && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No workflows</td></tr>}
          </tbody>
        </table>
      </div>
      <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}


// ── Tickets Tab ──────────────────────────────────────────────────────────────

function TicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, [page, statusFilter, typeFilter, priorityFilter, search]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let url = `${API}/tickets?page=${page}&per_page=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const r = await fetch(url, { headers: _authHeaders() });
      if (r.ok) { const d = await r.json(); setTickets(d.tickets || []); setTotal(d.total || 0); }
    } catch {}
    setLoading(false);
  };

  const loadDetail = async (id) => {
    const r = await fetch(`${API}/tickets/${id}`, { headers: _authHeaders() });
    if (r.ok) setDetail(await r.json());
  };

  const updateTicket = async (id, updates) => {
    await fetch(`${API}/tickets/${id}`, { method: 'PUT', headers: _authHeaders(true), body: JSON.stringify(updates) });
    loadDetail(id);
    loadTickets();
  };

  const addComment = async () => {
    if (!comment.trim() || !detail) return;
    await fetch(`${API}/tickets/${detail.id}/comments`, { method: 'POST', headers: _authHeaders(true), body: JSON.stringify({ comment: comment.trim() }) });
    setComment('');
    loadDetail(detail.id);
  };

  const handleSearch = () => { setPage(1); setSearch(searchInput); };

  const statusCls = (s) => ({ open: 'bg-yellow-500/20 text-yellow-400', in_progress: 'bg-blue-500/20 text-blue-400', resolved: 'bg-emerald-500/20 text-emerald-400', closed: 'bg-slate-500/20 text-slate-400', wont_fix: 'bg-red-500/20 text-red-400' }[s] || 'bg-slate-500/20 text-slate-400');
  const priorityCls = (p) => ({ critical: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-slate-400' }[p] || 'text-slate-400');
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Ticket className="w-5 h-5" />{total} Tickets</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search title..." className="pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none w-48" />
          </div>
          <FilterSelect value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} label="All Statuses"
            options={[{ value: 'open', label: 'Open' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }, { value: 'wont_fix', label: "Won't Fix" }]} />
          <FilterSelect value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} label="All Types"
            options={[{ value: 'bug', label: 'Bug' }, { value: 'feature_request', label: 'Feature' }, { value: 'ai_feature_request', label: 'AI Feature' }, { value: 'question', label: 'Question' }, { value: 'performance', label: 'Performance' }]} />
          <FilterSelect value={priorityFilter} onChange={v => { setPriorityFilter(v); setPage(1); }} label="All Priorities"
            options={[{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Ticket list */}
        <div className="flex-1 space-y-2 min-w-0">
          {loading ? <div className="text-center py-12 text-slate-400">Loading...</div> : tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No tickets found</div>
          ) : tickets.map(t => (
            <button key={t.id} onClick={() => { setSelected(t.id); loadDetail(t.id); }}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${selected === t.id ? 'bg-slate-700/50 border-cyan-500/30' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs ${statusCls(t.status)}`}>{t.status}</span>
                <span className={`text-xs ${priorityCls(t.priority)}`}>● {t.priority}</span>
                <span className="text-xs text-slate-500">#{t.id}</span>
                <span className="text-xs text-slate-500">user:{t.user_id}</span>
              </div>
              <p className="text-white font-medium truncate">{t.title}</p>
              <p className="text-xs text-slate-500 mt-1">{t.type} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</p>
            </button>
          ))}
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="w-[420px] bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4 sticky top-20 self-start max-h-[80vh] overflow-y-auto flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{detail.title}</h3>
                <p className="text-xs text-slate-500 mt-1">#{detail.id} · {detail.type} · user:{detail.user_id} · {detail.created_at ? new Date(detail.created_at).toLocaleString() : ''}</p>
              </div>
              <button onClick={() => { setDetail(null); setSelected(null); }} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* Editable status & priority */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Status</label>
                <select value={detail.status} onChange={e => updateTicket(detail.id, { status: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-2 py-1.5">
                  <option value="open">Open</option><option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option><option value="closed">Closed</option><option value="wont_fix">Won't Fix</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select value={detail.priority} onChange={e => updateTicket(detail.id, { priority: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded px-2 py-1.5">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {detail.description && <div className="p-3 bg-slate-700/30 rounded-lg"><p className="text-sm text-slate-300 whitespace-pre-wrap">{detail.description}</p></div>}
            {detail.error_details && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{detail.error_details}</p></div>}

            {detail.type === 'ai_feature_request' && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-1">
                <p className="text-xs text-purple-400 font-semibold">AI Feature Request</p>
                {detail.category && <p className="text-xs text-slate-400">Category: <span className="text-slate-300">{detail.category}</span></p>}
                {detail.missing_capability && <p className="text-xs text-slate-400">Missing: <span className="text-slate-300 font-mono">{detail.missing_capability}</span></p>}
                {detail.vote_count > 0 && <p className="text-xs text-slate-400">Votes: <span className="text-amber-400 font-semibold">{detail.vote_count}</span></p>}
                {detail.use_case && <p className="text-xs text-slate-500 italic mt-1">"{detail.use_case}"</p>}
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1"><MessageSquare className="w-4 h-4" />Comments ({detail.comments?.length || 0})</h4>
              <div className="space-y-3 mb-3">
                {(detail.comments || []).map(c => (
                  <div key={c.id} className={`p-3 rounded-lg text-sm ${c.is_internal ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/30'}`}>
                    <p className="text-slate-300">{c.comment}</p>
                    <p className="text-xs text-slate-500 mt-1">user:{c.user_id} · {c.created_at ? new Date(c.created_at).toLocaleString() : ''}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Add a comment..." className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
                <button onClick={addComment} disabled={!comment.trim()} className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50"><Send className="w-4 h-4 text-white" /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Audit Log Tab ────────────────────────────────────────────────────────────

function AuditTab() {
  const [auditLog, setAuditLog] = useState({ entries: [], total: 0, page: 1 });
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  useEffect(() => { loadAuditLog(1); }, [actionFilter, userIdFilter]);

  const loadAuditLog = async (page = 1) => {
    try { setAuditLog(await authService.adminAuditLog(page, 50, actionFilter, userIdFilter)); } catch (e) { alert(e.message); }
  };

  const totalPages = Math.ceil(auditLog.total / 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Clock className="w-5 h-5" />Audit Log ({auditLog.total})</h2>
        <div className="flex gap-2">
          <FilterSelect value={actionFilter} onChange={setActionFilter} label="All Actions"
            options={['login', 'login_failed', 'signup', 'password_change', '2fa_enable', '2fa_disable', 'role_change', 'user_suspend', 'user_delete', 'org_create', 'org_invite', 'org_join', 'org_remove_member', '2fa_admin_reset', 'profile_update'].map(a => ({ value: a, label: a }))} />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} placeholder="User ID..."
              className="pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none w-32" />
          </div>
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-700/50 text-xs text-slate-400 uppercase">
            <th className="px-4 py-3 text-left">Time</th><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Action</th>
            <th className="px-4 py-3 text-left">Target</th><th className="px-4 py-3 text-left">Details</th><th className="px-4 py-3 text-left">IP</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-700/50">
            {auditLog.entries.map(e => (
              <tr key={e.id} className="hover:bg-slate-700/20 text-sm">
                <td className="px-4 py-2 text-slate-400 text-xs">{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-2 text-slate-300">{e.user_id || '—'}</td>
                <td className="px-4 py-2"><span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-white">{e.action}</span></td>
                <td className="px-4 py-2 text-slate-400 text-xs">{e.target_type ? `${e.target_type}:${e.target_id}` : '—'}</td>
                <td className="px-4 py-2 text-slate-500 text-xs truncate max-w-[200px]">{e.details || '—'}</td>
                <td className="px-4 py-2 text-slate-500 text-xs font-mono">{e.ip_address || '—'}</td>
              </tr>
            ))}
            {auditLog.entries.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No audit entries</td></tr>}
          </tbody>
        </table>
      </div>
      <Paginator page={auditLog.page} totalPages={totalPages} onPageChange={p => loadAuditLog(p)} />
    </div>
  );
}
