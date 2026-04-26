import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, ArrowLeft } from 'lucide-react';
import NavBar from '../components/NavBar';
import { authService } from '../services/auth';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const _authHeaders = (json = false) => {
  const h = {};
  const token = localStorage.getItem('token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const TIER_COLORS = {
  free: 'border-slate-600', starter: 'border-cyan-500', pro: 'border-purple-500', enterprise: 'border-amber-500',
};
const TIER_BADGES = {
  free: 'bg-slate-700 text-slate-300', starter: 'bg-cyan-500/20 text-cyan-400', pro: 'bg-purple-500/20 text-purple-400', enterprise: 'bg-amber-500/20 text-amber-400',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const user = authService.getUser();

  useEffect(() => {
    fetch(`${API}/billing/plans`).then(r => r.json()).then(setPlans).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier) => {
    if (!user?.org_id) { alert('You must belong to an organization to upgrade.'); return; }
    setUpgrading(tier);
    try {
      const r = await fetch(`${API}/billing/checkout`, {
        method: 'POST', headers: _authHeaders(true),
        body: JSON.stringify({ plan_tier: tier, org_id: user.org_id }),
      });
      if (r.ok) {
        const data = await r.json();
        window.location.href = data.checkout_url;
      } else {
        const err = await r.json().catch(() => ({}));
        alert(err.detail || 'Failed to start checkout');
      }
    } catch (e) { alert('Failed: ' + e.message); }
    setUpgrading(null);
  };

  const handleManage = async () => {
    if (!user?.org_id) return;
    try {
      const r = await fetch(`${API}/billing/portal`, {
        method: 'POST', headers: _authHeaders(true),
        body: JSON.stringify({ org_id: user.org_id }),
      });
      if (r.ok) {
        const data = await r.json();
        window.location.href = data.portal_url;
      } else {
        const err = await r.json().catch(() => ({}));
        alert(err.detail || 'Failed to open portal');
      }
    } catch (e) { alert('Failed: ' + e.message); }
  };

  const fmt = (v) => v >= 999999 ? '∞' : v.toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-slate-400">Scale your data engineering workflows with the right plan.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading plans...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => (
              <div key={plan.tier} className={`bg-slate-800/50 border-2 ${TIER_COLORS[plan.tier] || 'border-slate-700'} rounded-2xl p-6 flex flex-col`}>
                <div className="mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TIER_BADGES[plan.tier]}`}>{plan.name}</span>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="text-sm text-slate-400 space-y-2">
                    <div className="flex justify-between"><span>Workflows / user</span><span className="text-white font-medium">{fmt(plan.limits.max_workflows_per_user)}</span></div>
                    <div className="flex justify-between"><span>Executions / day</span><span className="text-white font-medium">{fmt(plan.limits.max_executions_day)}</span></div>
                    <div className="flex justify-between"><span>File size</span><span className="text-white font-medium">{fmt(plan.limits.max_file_size_mb)} MB</span></div>
                    <div className="flex justify-between"><span>Saves / workflow</span><span className="text-white font-medium">{fmt(plan.limits.max_saved_nodes)}</span></div>
                    <div className="flex justify-between"><span>Team members</span><span className="text-white font-medium">{fmt(plan.limits.max_users)}</span></div>
                  </div>

                  <div className="border-t border-slate-700 pt-3 space-y-1.5">
                    {Object.entries(plan.features).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-sm">
                        {v ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                        <span className={v ? 'text-slate-300' : 'text-slate-600'}>{k.replace('feature_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-500">
                    Nodes: {plan.node_groups.includes('all') ? 'All' : plan.node_groups.join(', ')}
                  </div>
                </div>

                <div className="mt-6">
                  {plan.tier === 'free' ? (
                    <div className="text-center text-sm text-slate-500 py-2">Current free tier</div>
                  ) : (
                    <button onClick={() => handleUpgrade(plan.tier)} disabled={!!upgrading}
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                        upgrading === plan.tier ? 'bg-slate-700 text-slate-400' :
                        plan.tier === 'pro' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' :
                        'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}>
                      {upgrading === plan.tier ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {user?.platform_role === 'admin' && (
          <div className="text-center mt-8">
            <button onClick={handleManage} className="text-cyan-400 hover:text-cyan-300 text-sm underline">
              Manage existing subscription →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
