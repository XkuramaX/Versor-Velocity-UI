import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { authService } from '../services/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setError('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authService.verifyEmail(token);
      setStatus('success');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setStatus('error');
      setError(err.message);
      if (err.message.includes('expired')) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    try {
      await authService.resendVerification(email);
      setStatus('resent');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 w-full max-w-md text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
            <p className="text-slate-400">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'resent' && (
          <>
            <Mail className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white mb-2">Verification Email Sent</h1>
            <p className="text-slate-400 mb-4">Check your inbox for a new verification link</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-6 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-slate-400 mb-4">{error}</p>
            
            {showResend ? (
              <form onSubmit={handleResend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-6 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
                >
                  Resend Verification Email
                </button>
              </form>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-6 rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
              >
                Go to Login
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
