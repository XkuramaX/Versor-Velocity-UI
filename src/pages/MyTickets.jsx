import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { Ticket, MessageSquare, Clock, AlertCircle, CheckCircle, Filter, ChevronRight, Send } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const _authHeaders = (json = false) => {
  const h = {};
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTickets = async (status = '') => {
    setLoading(true);
    const url = status ? `${API}/tickets?status=${status}` : `${API}/tickets`;
    const r = await fetch(url, { headers: _authHeaders() });
    if (r.ok) {
      const d = await r.json();
      setTickets(d.tickets || []);
      setTotal(d.total || 0);
    }
    setLoading(false);
  };

  const loadDetail = async (id) => {
    const r = await fetch(`${API}/tickets/${id}`, { headers: _authHeaders() });
    if (r.ok) setDetail(await r.json());
  };

  const addComment = async () => {
    if (!comment.trim() || !detail) return;
    await fetch(`${API}/tickets/${detail.id}/comments`, {
      method: 'POST',
      headers: _authHeaders(true),
      body: JSON.stringify({ comment: comment.trim() }),
    });
    setComment('');
    loadDetail(detail.id);
  };

  useEffect(() => { loadTickets(filter); }, [filter]);

  const statusIcon = (s) => ({
    open: <Clock className="w-4 h-4 text-yellow-400" />,
    in_progress: <AlertCircle className="w-4 h-4 text-blue-400" />,
    resolved: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    closed: <CheckCircle className="w-4 h-4 text-slate-400" />,
  }[s] || <Clock className="w-4 h-4 text-slate-400" />);

  const statusCls = (s) => ({
    open: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-emerald-500/20 text-emerald-400',
    closed: 'bg-slate-500/20 text-slate-400',
  }[s] || 'bg-slate-500/20 text-slate-400');

  const priorityCls = (p) => ({
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-slate-400',
  }[p] || 'text-slate-400');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Tickets</h1>
            <p className="text-slate-400 text-sm">{total} total tickets</p>
          </div>
          <div className="flex gap-1">
            {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Ticket list */}
          <div className="flex-1 space-y-2">
            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No tickets found</p>
                <p className="text-slate-500 text-sm mt-1">Use the 🐛 button to report issues</p>
              </div>
            ) : tickets.map(t => (
              <button key={t.id} onClick={() => { setSelected(t.id); loadDetail(t.id); }}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected === t.id
                    ? 'bg-slate-700/50 border-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusCls(t.status)}`}>{t.status}</span>
                      <span className={`text-xs ${priorityCls(t.priority)}`}>● {t.priority}</span>
                      <span className="text-xs text-slate-500">#{t.id}</span>
                    </div>
                    <p className="text-white font-medium truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{t.type} · {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {detail && (
            <div className="w-96 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4 sticky top-20 self-start max-h-[80vh] overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {statusIcon(detail.status)}
                  <span className={`px-2 py-0.5 rounded text-xs ${statusCls(detail.status)}`}>{detail.status}</span>
                  <span className={`text-xs ${priorityCls(detail.priority)}`}>{detail.priority}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{detail.title}</h3>
                <p className="text-xs text-slate-500 mt-1">#{detail.id} · {detail.type} · {detail.created_at ? new Date(detail.created_at).toLocaleString() : ''}</p>
              </div>

              {detail.description && (
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}

              {detail.error_details && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{detail.error_details}</p>
                </div>
              )}

              {/* Comments */}
              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />Comments ({detail.comments?.length || 0})
                </h4>
                <div className="space-y-3 mb-3">
                  {(detail.comments || []).map(c => (
                    <div key={c.id} className={`p-3 rounded-lg text-sm ${c.is_internal ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/30'}`}>
                      <p className="text-slate-300">{c.comment}</p>
                      <p className="text-xs text-slate-500 mt-1">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:border-cyan-500 focus:outline-none" />
                  <button onClick={addComment} disabled={!comment.trim()}
                    className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
