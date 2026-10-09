import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Activity, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';

export default function Navbar({ onRefresh }) {
  const location = useLocation();
  const { adminToken } = useAuth();
  const [backendOnline, setBackendOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const routeTitles = {
    '/': 'Dashboard Overview',
    '/verifications': 'Helper ID Verifications',
    '/helpers': 'Service Helpers Directory',
    '/users': 'Customers & Users',
    '/tasks': 'Task Operations Center',
    '/categories': 'Category Management',
    '/analytics': 'Platform Performance & Metrics',
    '/settings': 'System Settings',
  };

  const currentTitle = routeTitles[location.pathname] || 'Admin Portal';

  const checkStatus = async () => {
    setChecking(true);
    try {
      const isUp = await adminApi.checkHealth();
      setBackendOnline(isUp);
    } catch {
      setBackendOnline(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8 backdrop-blur-md">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>HireBuddy Operations</span>
          <span>/</span>
          <span className="font-medium text-slate-200">{currentTitle}</span>
        </div>
        <h1 className="mt-0.5 text-xl font-bold text-white">{currentTitle}</h1>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Backend API Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs">
          <span className="relative flex h-2 w-2">
            {backendOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="font-medium text-slate-300">
            {backendOnline ? 'API Connected (:8080)' : 'API Disconnected'}
          </span>
          <button 
            onClick={checkStatus} 
            title="Check API Status"
            className="text-slate-500 hover:text-slate-300 transition"
          >
            <Activity className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Admin Token Badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300">
          <KeyRound className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] truncate max-w-[120px]">
            {adminToken ? `${adminToken.slice(0, 12)}...` : 'No Token'}
          </span>
        </div>

        {/* Global Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
}
