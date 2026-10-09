import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Sliders,
  Database,
  Radio,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi, getStoredToken } from '../services/api';

export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const [tokenInput, setTokenInput] = useState(getStoredToken());
  const [tokenSaved, setTokenSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ping test
  const [pingStatus, setPingStatus] = useState(null); // 'testing' | 'online' | 'offline'
  const [pingLatency, setPingLatency] = useState(null);
  const [tokenTestStatus, setTokenTestStatus] = useState(null); // 'valid' | 'invalid'

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

  const testConnection = async () => {
    setPingStatus('testing');
    const start = performance.now();
    try {
      const ok = await adminApi.checkHealth();
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
      setPingStatus(ok ? 'online' : 'offline');
    } catch {
      setPingStatus('offline');
      setPingLatency(null);
    }
  };

  const testToken = async () => {
    setTokenTestStatus('testing');
    try {
      const res = await adminApi.getPendingIdSubmissions(tokenInput);
      if (res && res.success !== undefined) {
        setTokenTestStatus('valid');
      } else {
        setTokenTestStatus('invalid');
      }
    } catch {
      setTokenTestStatus('invalid');
    }
  };

  const saveToken = () => {
    localStorage.setItem('hirebuddy_admin_token', tokenInput.trim());
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2500);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Platform Settings & Security
        </h1>
        <p className="text-sm text-slate-400">
          Configure API endpoints, manage admin verification credentials, and inspect system health.
        </p>
      </div>

      {/* Grid: Health Status & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend API Connection Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Backend API Connection
            </h2>
            <button
              onClick={testConnection}
              disabled={pingStatus === 'testing'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pingStatus === 'testing' ? 'animate-spin text-emerald-400' : ''}`} />
              Ping Test
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Endpoint Target:</span>
              <span className="text-white font-mono">{apiBase}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Live Status:</span>
              <div className="flex items-center gap-2">
                {pingStatus === 'testing' ? (
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                  </span>
                ) : pingStatus === 'online' ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online {pingLatency ? `(${pingLatency}ms)` : ''}
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <XCircle className="w-3.5 h-3.5" /> Offline
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">WebSocket Host:</span>
              <span className="text-slate-300 font-mono">ws://localhost:8080</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Search Engine:</span>
              <span className="text-slate-300 font-mono">Elasticsearch (Active)</span>
            </div>
          </div>
        </div>

        {/* Admin Verification Token */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              ID Verification Secret
            </h2>
            <button
              onClick={testToken}
              disabled={tokenTestStatus === 'testing'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              Test Token
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Matches <code className="text-emerald-400 font-mono">ID_VERIFY_TOKEN</code> configured in HireBuddy backend for authorizing helper approvals.
            </p>

            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full pl-3 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleCopy(tokenInput)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={saveToken}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {tokenSaved ? 'Saved to LocalStorage!' : 'Save Token'}
              </button>

              {tokenTestStatus && (
                <div className="text-xs">
                  {tokenTestStatus === 'testing' ? (
                    <span className="text-slate-400">Testing...</span>
                  ) : tokenTestStatus === 'valid' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Token Authorized (200 OK)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Invalid Token (403 Forbidden)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Architecture & Build Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Environment & System Diagnostics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Admin Client</span>
            <p className="text-white font-semibold mt-1">React 19 + Vite 6</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Styling Engine</span>
            <p className="text-emerald-400 font-semibold mt-1">Tailwind CSS v4</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Client Port</span>
            <p className="text-purple-400 font-mono font-semibold mt-1">3001 (Isolated)</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Webapp Customer Port</span>
            <p className="text-blue-400 font-mono font-semibold mt-1">3000</p>
          </div>
        </div>
      </div>

      {/* Admin Session & Sign Out */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Active Admin Session</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Signed in as <span className="text-white font-medium">{admin?.name || 'Super Admin'}</span> ({admin?.email || 'admin@hirebuddy.local'})
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 self-start sm:self-center"
        >
          <LogOut className="w-4 h-4" />
          End Admin Session
        </button>
      </div>
    </div>
  );
}
