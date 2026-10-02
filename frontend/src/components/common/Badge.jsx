import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variants = {
    default: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    cyan: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    indigo: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    rose: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}
    >
      {children}
    </span>
  );
};
