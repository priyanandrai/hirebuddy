import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Shield, KeyRound, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithToken, loading } = useAuth();

  const [mode, setMode] = useState('token'); // 'token' or 'credentials'
  const [tokenInput, setTokenInput] = useState('hirebuddy_admin_secret_2026');
  const [phone, setPhone] = useState('9999999999');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleTokenLogin = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please provide an admin token key');
      return;
    }
    loginWithToken(tokenInput.trim());
    navigate('/');
  };

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleQuickDemo = () => {
    loginWithToken('hirebuddy_admin_secret_2026', {
      name: 'Super Admin',
      email: 'admin@hirebuddy.com',
      role: 'ADMIN',
    });
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">HireBuddy Admin Portal</h1>
          <p className="mt-1 text-xs text-slate-400">Operations, Verifications & Platform Management</p>
        </div>

        {/* Card */}
        <div className="rounded-[2.5rem] border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex rounded-2xl bg-slate-950/70 p-1 mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setMode('token'); setError(''); }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                mode === 'token' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Secret Key
            </button>
            <button
              type="button"
              onClick={() => { setMode('credentials'); setError(''); }}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                mode === 'credentials' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Credentials
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              {error}
            </div>
          )}

          {mode === 'token' ? (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Admin Key / Token
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter ID_VERIFY_TOKEN"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Pre-configured with local secret: <code className="text-slate-400">hirebuddy_admin_secret_2026</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
              >
                <span>Authorize & Enter</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Admin phone"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-60"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Admin'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Access Button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              <span>Instant One-Click Demo Access</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          HireBuddy Operations Portal • Restricted internal system
        </p>
      </div>
    </div>
  );
}
