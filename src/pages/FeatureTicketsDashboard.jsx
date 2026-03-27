import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Ticket, ThumbsUp, Tag, RefreshCw, BarChart3,
  CheckCircle, Clock, Circle, AlertTriangle, Filter, ChevronDown, Loader,
} from 'lucide-react';
import { getFeatureTickets, voteFeatureTicket } from '../services/api';
import { authService } from '../services/auth';
import VelocityLogo from '../components/VelocityLogo';

const STATUS_META = {
  open:        { label: 'Open',        icon: Circle,       color: 'text-slate-400',  bg: 'bg-slate-500/20 border-slate-500/30' },
  in_progress: { label: 'In Progress', icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/20 border-amber-500/30' },
  done:        { label: 'Done',        icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/20 border-green-500/30' },
};

const CATEGORY_COLORS = {
  'Machine Learning':      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Visualization':         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Statistics':            'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Data Transformation':   'bg-green-500/20 text-green-300 border-green-500/30',
  'IO':                    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Other':                 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function patchTicketStatus(id, status) {
  const fd = new FormData();
  fd.append('status', status);
  const res = await fetch(`${API_BASE}/ai/tickets/${id}/status`, { method: 'PATCH', body: fd });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Category bar ──────────────────────────────────────────────────────────────
function CategoryBar({ tickets }) {
  const counts = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Requests by Category</h3>
      </div>
      <div className="space-y-3">
        {sorted.map(([cat, count]) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']}`}>{cat}</span>
              <span className="text-xs text-slate-400">{count}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ticket row ────────────────────────────────────────────────────────────────
function TicketRow({ ticket, rank, onStatusChange, onVote }) {
  const [expanded, setExpanded] = useState(false);
  const [localVotes, setLocalVotes] = useState(ticket.vote_count);
  const [voted, setVoted] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusMeta = STATUS_META[ticket.status] || STATUS_META.open;
  const StatusIcon = statusMeta.icon;

  const handleVote = async (e) => {
    e.stopPropagation();
    if (voted) return;
    try {
      const updated = await voteFeatureTicket(ticket.id);
      setLocalVotes(updated.vote_count);
      setVoted(true);
      onVote(ticket.id, updated.vote_count);
    } catch { /* silent */ }
  };

  const handleStatus = async (newStatus) => {
    setStatusOpen(false);
    try {
      const updated = await patchTicketStatus(ticket.id, newStatus);
      onStatusChange(ticket.id, updated.status);
    } catch { /* silent */ }
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center space-x-4 p-4 text-left hover:bg-slate-700/20 transition-colors"
      >
        {/* Rank */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">#{rank}</span>
        </div>

        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{ticket.title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS['Other']}`}>
              {ticket.category}
            </span>
            <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Votes */}
        <button
          onClick={handleVote}
          disabled={voted}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
            voted ? 'bg-purple-500/30 text-purple-300' : 'bg-slate-700/50 text-slate-300 hover:bg-purple-500/20 hover:text-purple-300'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>{localVotes}</span>
        </button>

        {/* Status dropdown */}
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setStatusOpen(v => !v)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${statusMeta.bg}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${statusMeta.color}`} />
            <span className={statusMeta.color}>{statusMeta.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 overflow-hidden">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button key={key} onClick={() => handleStatus(key)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs hover:bg-slate-700 transition-colors">
                    <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    <span className="text-slate-300">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-3">
          <p className="text-sm text-slate-300">{ticket.description}</p>
          {ticket.missing_capability && (
            <div className="flex items-start space-x-2">
              <Tag className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-500 font-mono">{ticket.missing_capability}</span>
            </div>
          )}
          {ticket.use_case && (
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">Original user request:</p>
              <p className="text-xs text-slate-400 italic line-clamp-3">{ticket.use_case}</p>
            </div>
          )}
          <p className="text-xs text-slate-600">Ticket ID: #{ticket.id}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FeatureTicketsDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing]   = useState(false);

  // Admin guard
  useEffect(() => {
    const user = authService.getUser();
    if (!user?.is_superuser && user?.username !== 'admin') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeatureTickets();
      setTickets(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleStatusChange = (id, newStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleVote = (id, newCount) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, vote_count: newCount } : t));
  };

  const categories = ['all', ...Array.from(new Set(tickets.map(t => t.category)))];

  const filtered = tickets
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .filter(t => filterCategory === 'all' || t.category === filterCategory);

  const totalVotes  = tickets.reduce((s, t) => s + t.vote_count, 0);
  const openCount   = tickets.filter(t => t.status === 'open').length;
  const doneCount   = tickets.filter(t => t.status === 'done').length;
  const topCategory = (() => {
    const counts = tickets.reduce((a, t) => { a[t.category] = (a[t.category] || 0) + t.vote_count; return a; }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  })();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /><span>Dashboard</span>
            </button>
            <div className="h-6 w-px bg-slate-600" />
            <div className="flex items-center space-x-3">
              <VelocityLogo size={32} />
              <div>
                <h1 className="text-xl font-semibold text-white">Versor-Velocity <span className="text-red-400 text-base font-normal">Feature Requests</span></h1>
                <p className="text-xs text-slate-400">Admin view — missing capabilities backlog</p>
              </div>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Tickets" value={tickets.length} sub="unique missing features" color="text-white" />
          <StatCard label="Total Votes" value={totalVotes} sub="demand signals" color="text-purple-400" />
          <StatCard label="Open" value={openCount} sub="awaiting development" color="text-amber-400" />
          <StatCard label="Most Requested" value={topCategory} sub="by vote count" color="text-cyan-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category breakdown */}
          <div className="lg:col-span-1">
            <CategoryBar tickets={tickets} />
          </div>

          {/* Ticket list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500">
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500">
                {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
              </select>
              <span className="text-xs text-slate-500 ml-auto">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader className="w-6 h-6 animate-spin mr-2" />
                <span>Loading tickets…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <Ticket className="w-12 h-12 mx-auto mb-3" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((ticket, i) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    rank={i + 1}
                    onStatusChange={handleStatusChange}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
