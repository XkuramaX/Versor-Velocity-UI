import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';

export default function TwoFactorChallenge({ tempToken, onSuccess, onBack }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login2FA(tempToken, code);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-slate-400 text-sm">
            {useBackup
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
              placeholder={useBackup ? 'A1B2C3D4' : '000000'}
              maxLength={useBackup ? 8 : 6}
              autoFocus
              className={`w-full px-4 py-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center ${
                useBackup ? 'text-lg tracking-widest font-mono' : 'text-3xl tracking-[0.5em] font-mono'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < (useBackup ? 8 : 6)}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setUseBackup(!useBackup); setCode(''); setError(''); }}
              className="text-cyan-400 hover:text-cyan-300">
              {useBackup ? 'Use authenticator code' : 'Use a backup code'}
            </button>
            <button type="button" onClick={onBack} className="text-slate-400 hover:text-white">
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
