import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { BarChart3, Zap, Upload, Download, Clock, TrendingUp } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const _authHeaders = () => {
  const h = {};
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

export default function UsageDashboard() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/usage/current`, { headers: _authHeaders() }).then(r => r.json()),
      fetch(`${API}/usage/history?days=30`, { headers: _authHeaders() }).then(r => r.json()),
    ]).then(([c, h]) => {
      setCurrent(c);
      setHistory(h);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const ProgressBar = ({ value, max, label, color = 'cyan' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const colors = {
      cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400' },
      purple: { bar: 'bg-purple-500', text: 'text-purple-400' },
      emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
      amber: { bar: 'bg-amber-500', text: 'text-amber-400' },
    };
    const c = colors[color] || colors.cyan;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">{label}</span>
          <span className={c.text}>{value.toLocaleString()} / {max.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, sub, color = 'cyan' }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );

  const renderHistoryChart = () => {
    if (!history?.history) return null;
    const days = Object.keys(history.history).sort().slice(-14);
    if (days.length === 0) return <p className="text-slate-500 text-sm">No usage data yet</p>;

    const maxVal = Math.max(...days.map(d => {
      const h = history.history[d];
      return (h.node_execution || 0) + (h.file_upload || 0);
    }), 1);

    return (
      <div className="flex items-end gap-1 h-32">
        {days.map(day => {
          const h = history.history[day];
          const exec = h.node_execution || 0;
          const upload = h.file_upload || 0;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${exec + upload} events`}>
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div className="bg-cyan-500/80 rounded-t" style={{ height: `${(exec / maxVal) * 100}%`, minHeight: exec > 0 ? '2px' : 0 }} />
                <div className="bg-purple-500/80 rounded-b" style={{ height: `${(upload / maxVal) * 100}%`, minHeight: upload > 0 ? '2px' : 0 }} />
              </div>
              <span className="text-[9px] text-slate-500 -rotate-45 origin-top-left whitespace-nowrap">{day.slice(5)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Usage & Limits</h1>
            <p className="text-slate-400 text-sm">Current plan: <span className="text-cyan-400 font-medium">{current?.plan || 'Loading...'}</span></p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading usage data...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Zap} label="Executions Today" value={current?.daily?.executions || 0} color="cyan" />
              <StatCard icon={Upload} label="Uploads Today" value={current?.daily?.uploads || 0} color="purple" />
              <StatCard icon={TrendingUp} label="Monthly Executions" value={current?.monthly?.executions || 0} color="emerald" />
              <StatCard icon={Clock} label="Workflow Runs" value={current?.monthly?.workflow_runs || 0} color="amber" />
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Plan Limits</h2>
              <ProgressBar label="Daily Executions" value={current?.daily?.executions || 0} max={current?.daily?.limit_executions || 100} color="cyan" />
              <ProgressBar label="Daily Uploads" value={current?.daily?.uploads || 0} max={100} color="purple" />
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Last 14 Days</h2>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cyan-500 rounded" />Executions</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded" />Uploads</span>
              </div>
              {renderHistoryChart()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
