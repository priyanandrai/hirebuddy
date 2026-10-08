"use client";

import React from "react";
import HireButton from "../hire/HireButton";

export default function HelperCard({ helper, onViewProfile }) {
  const [imgError, setImgError] = React.useState(false);
  const skills = Array.isArray(helper.skills)
    ? helper.skills
    : (helper.skills ? String(helper.skills).split(',').map(s => s.trim()).filter(Boolean) : []);

  const rawPrice = helper.hourlyRate ?? helper.price;
  const displayPrice = rawPrice ? (rawPrice > 1000 ? Math.round(rawPrice / 100) : rawPrice) : 200;
  const rating = Number(helper.averageRating || helper.rating || 4.8).toFixed(1);
  const reviewCount = helper.totalReviews ?? helper.reviews ?? 0;
  const initials = (helper.name || 'H').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200 rounded-xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 min-h-[250px] h-full group">
      <div>
        <div className="flex items-start gap-4">
          {helper.image && !imgError ? (
            <img
              src={helper.image}
              alt={helper.name}
              onError={() => setImgError(true)}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-md">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-white text-base font-semibold truncate group-hover:text-emerald-400 transition-colors">
                {helper.name}
              </h3>
              {helper.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  ✓ Verified
                </span>
              ) : null}
              {helper.isAvailable ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  Busy
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>📍 {helper.city || helper.location || 'Local Area'}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                ★ {rating}
                {reviewCount > 0 && <span className="text-slate-400 font-normal ml-0.5">({reviewCount})</span>}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.slice(0, 3).map((s, i) => (
                <span key={i} className="text-xs bg-slate-800 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md">
                  {s}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded-md">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <div className="text-xl text-white font-bold tracking-tight">₹{displayPrice}</div>
          <div className="text-slate-400 text-xs">per hour</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile && onViewProfile(helper)}
            className="inline-flex items-center justify-center h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 text-xs font-medium text-slate-200 transition-colors"
          >
            View Profile
          </button>
          <HireButton
            helperId={helper.id}
            helperName={helper.name}
            defaultBudget={displayPrice}
            disabled={!helper.isAvailable}
            className="inline-flex items-center justify-center h-9 rounded-lg px-3.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-sm transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
