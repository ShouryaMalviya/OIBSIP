import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse">
    <div className="w-full aspect-[4/3] rounded-xl bg-slate-200 mb-4" />
    <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
    <div className="h-3 bg-slate-200 rounded w-full mb-2" />
    <div className="h-3 bg-slate-200 rounded w-4/5 mb-5" />
    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
      <div className="h-6 bg-slate-200 rounded w-1/4" />
      <div className="h-9 bg-slate-200 rounded-full w-1/3" />
    </div>
  </div>
);

export const SkeletonLine = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-slate-200 rounded animate-pulse ${className}`} />
);

export default SkeletonCard;
