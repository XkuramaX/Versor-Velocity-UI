import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Shield, ShieldCheck, ShieldOff, Key, Copy, Download, AlertCircle, CheckCircle } from 'lucide-react';
import NavBar from '../components/NavBar';
import { authService } from '../services/auth';
import { useAuth } from '../App';

export default function Profile() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [user, setUser] = useState(authService.getUser());
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Account
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || '');

  // Password
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwTotp, setPwTotp] = useState('');

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.totp_enabled || false);
  const [setupData, setSetupData] = useState(null); // {secret, qr_code_base64, manual_entry_key}
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [disableCode, setDisableCode] = useState('');

  const flash = (setter, message) => { setter(message); setTimeout(() => setter(''), 5000); };

  // ── Account ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    try {
      const updates = {};
      if (username !== user.username) updates.username = username;
      if (email !== user.email) updates.email = email;
      if (fullName !== user.full_name) updates.full_name = fullName;
      if (Object.keys(updates).length === 0) return flash(setMsg, 'No changes');
      const updated = await authService.updateProfile(updates);
      setUser(updated);
      await refreshUser();
      flash(setMsg, 'Profile updated');
    } catch (e) { flash(setErr, e.message); }
  };

  // ── Password ────────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    try {
      await authService.changePassword(curPw, newPw, confirmPw, pwTotp || null);
      setCurPw(''); setNewPw(''); setConfirmPw(''); setPwTotp('');
      flash(setMsg, 'Password changed');
    } catch (e) { flash(setErr, e.message); }
  };

  // ── 2FA Setup ───────────────────────────────────────────────────────────
  const handleSetup2FA = async () => {
    try {
      const data = await authService.setup2FA();
      setSetupData(data);
    } catch (e) { flash(setErr, e.message); }
  };

  const handleVerify2FA = async () => {
    try {
      const data = await authService.verify2FA(verifyCode);
      setBackupCodes(data.codes);
      setTwoFAEnabled(true);
      setSetupData(null);
      setVerifyCode('');
      // Update local user
      const u = authService.getUser();
      u.totp_enabled = true;
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      await refreshUser();
      flash(setMsg, '2FA enabled! Save your backup codes.');
    } catch (e) { flash(setErr, e.message); }
  };

  const handleDisable2FA = async () => {
    try {
      await authService.disable2FA(disableCode);
      setTwoFAEnabled(false);
      setDisableCode('');
      const u = authService.getUser();
      u.totp_enabled = false;
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      await refreshUser();
      flash(setMsg, '2FA disabled');
    } catch (e) { flash(setErr, e.message); }
  };

  const copyBackupCodes = () => {
    if (backupCodes) {
      navigator.clipboard.writeText(backupCodes.join('\n'));
      flash(setMsg, 'Backup codes copied');
    }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const btnPrimary = "w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all";
  const btnDanger = "w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-all";
  const sectionCls = "bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-white">Profile Settings</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user?.platform_role === 'super_admin' ? 'bg-purple-500/20 text-purple-300' :
              user?.platform_role === 'admin' ? 'bg-blue-500/20 text-blue-300' :
              'bg-slate-500/20 text-slate-300'
            }`}>{user?.platform_role}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Flash messages */}
        {msg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{msg}</div>}
        {err && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</div>}

        {/* ── Account ── */}
        <div className={sectionCls}>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Account</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
            </div>
            <button onClick={handleSaveProfile} className={btnPrimary}>Save Changes</button>
          </div>
        </div>

        {/* ── Password ── */}
        <div className={sectionCls}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>
          <div className="space-y-3">
            <input type="password" placeholder="Current password" value={curPw} onChange={e => setCurPw(e.target.value)} className={inputCls} />
            <input type="password" placeholder="New password (8+ chars, uppercase, number)" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputCls} />
            <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputCls} />
            {twoFAEnabled && (
              <input placeholder="2FA code (required)" value={pwTotp} onChange={e => setPwTotp(e.target.value)} className={inputCls} />
            )}
            <button onClick={handleChangePassword} className={btnPrimary}>Change Password</button>
          </div>
        </div>

        {/* ── 2FA ── */}
        <div className={sectionCls}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
          </div>

          {!twoFAEnabled && !setupData && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">Add an extra layer of security with a TOTP authenticator app (Google Authenticator, Authy, 1Password).</p>
              <button onClick={handleSetup2FA} className={btnPrimary}>
                <span className="flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" />Enable 2FA</span>
              </button>
            </div>
          )}

          {setupData && !backupCodes && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">Scan this QR code with your authenticator app:</p>
              <div className="flex justify-center">
                <img src={`data:image/png;base64,${setupData.qr_code_base64}`} alt="2FA QR Code" className="w-48 h-48 rounded-lg bg-white p-2" />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Or enter this key manually:</p>
                <code className="text-sm text-cyan-400 bg-slate-800 px-3 py-1 rounded font-mono">{setupData.manual_entry_key}</code>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Enter the 6-digit code from your app:</label>
                <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="000000" maxLength={6}
                  className={inputCls + " text-center text-2xl tracking-[0.5em] font-mono"} />
              </div>
              <button onClick={handleVerify2FA} disabled={verifyCode.length !== 6} className={btnPrimary + " disabled:opacity-50"}>Verify & Enable</button>
            </div>
          )}

          {backupCodes && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-400 font-medium mb-2">⚠️ Save your backup codes!</p>
                <p className="text-amber-300 text-sm">These codes can be used to log in if you lose access to your authenticator. Each code can only be used once.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="bg-slate-800 px-3 py-2 rounded font-mono text-sm text-white text-center">{code}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={copyBackupCodes} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
                  <Copy className="w-4 h-4" />Copy
                </button>
                <button onClick={() => {
                  const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                  a.download = 'versor-backup-codes.txt'; a.click();
                }} className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
                  <Download className="w-4 h-4" />Download
                </button>
              </div>
              <button onClick={() => setBackupCodes(null)} className="w-full text-slate-400 hover:text-white text-sm py-2">I've saved my codes</button>
            </div>
          )}

          {twoFAEnabled && !setupData && !backupCodes && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">2FA is enabled</span>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Enter 2FA code to disable:</label>
                <input value={disableCode} onChange={e => setDisableCode(e.target.value)} placeholder="000000" maxLength={6}
                  className={inputCls + " text-center font-mono"} />
              </div>
              <button onClick={handleDisable2FA} disabled={disableCode.length < 6} className={btnDanger + " disabled:opacity-50"}>
                <span className="flex items-center justify-center gap-2"><ShieldOff className="w-4 h-4" />Disable 2FA</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-4">Once you delete your account, there is no going back.</p>
          <button className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 py-2 px-4 rounded-lg text-sm">Delete Account</button>
        </div>
      </main>
    </div>
  );
}
