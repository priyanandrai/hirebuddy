import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition-all duration-200 hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-white">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-500">{trend.label || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}
