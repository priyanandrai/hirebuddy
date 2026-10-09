import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Wrench, 
  Users, 
  CheckSquare, 
  Grid, 
  BarChart3, 
  Settings,
  Sparkles,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ pendingCount = 0 }) {
  const { logout, adminUser } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verifications', label: 'ID Verifications', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : null },
    { to: '/helpers', label: 'Helpers', icon: Wrench },
    { to: '/users', label: 'Users & Customers', icon: Users },
    { to: '/tasks', label: 'All Tasks', icon: CheckSquare },
    { to: '/categories', label: 'Categories', icon: Grid },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-18 items-center gap-3 border-b border-slate-800/80 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-white">HireBuddy</span>
            <span className="rounded-md bg-blue-500/20 px-1.5 py-0.2 text-[10px] font-bold text-blue-400">ADMIN</span>
          </div>
          <p className="text-[11px] text-slate-400">Operations Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className="flex h-5 items-center justify-center rounded-full bg-amber-500 px-2 text-[10px] font-extrabold text-slate-950 shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          External Apps
        </div>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="h-4 w-4 text-slate-500" />
            <span>Customer App</span>
          </div>
          <span className="text-[11px] text-slate-600">:3000</span>
        </a>
      </nav>

      {/* Admin Profile Footer */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-blue-400 border border-slate-700">
              {adminUser?.name ? adminUser.name[0].toUpperCase() : 'A'}
            </div>
            <div className="truncate">
              <p className="truncate text-xs font-bold text-white">{adminUser?.name || 'Administrator'}</p>
              <p className="truncate text-[10px] text-slate-400">{adminUser?.email || 'admin@hirebuddy.com'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
