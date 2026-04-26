import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Workflow, User, Shield, Building2, BarChart3, Ticket, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { authService } from '../services/auth';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { path: '/dashboard', label: 'Workflows', icon: LayoutDashboard },
    { path: '/usage', label: 'Usage', icon: BarChart3 },
    { path: '/tickets', label: 'Tickets', icon: Ticket },
    { path: '/org', label: 'Organization', icon: Building2 },
  ];

  if (authService.isSuperAdmin()) {
    navItems.push({ path: '/admin', label: 'Admin', icon: Shield });
  }

  const roleBadge = {
    super_admin: { cls: 'bg-purple-500/20 text-purple-300', label: 'Super Admin' },
    admin: { cls: 'bg-blue-500/20 text-blue-300', label: 'Admin' },
    user: { cls: 'bg-slate-500/20 text-slate-300', label: 'User' },
  }[user.platform_role] || { cls: 'bg-slate-500/20 text-slate-300', label: 'User' };

  return (
    <nav className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg" />
              <span className="text-white font-bold text-lg hidden sm:block">Versor</span>
            </button>

            <div className="flex items-center gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: User menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors">
              <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm hidden sm:block">{user.username}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadge.cls} hidden sm:block`}>{roleBadge.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-1">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-white font-medium text-sm">{user.full_name}</p>
                    <p className="text-slate-400 text-xs">{user.email}</p>
                  </div>
                  <button onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white">
                    <User className="w-4 h-4" />Profile Settings
                  </button>
                  <button onClick={() => { navigate('/org'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white">
                    <Building2 className="w-4 h-4" />Organization
                  </button>
                  {user.totp_enabled && (
                    <div className="px-4 py-1">
                      <span className="text-xs text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" />2FA Enabled</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 mt-1">
                    <button onClick={() => { authService.logout(); window.location.href = '/login'; }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                      <LogOut className="w-4 h-4" />Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
