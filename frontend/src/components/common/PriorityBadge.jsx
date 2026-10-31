import React from 'react';

export default function PriorityBadge({ priority = 'NORMAL', isEmergency = false }) {
  const norm = (priority || 'NORMAL').toUpperCase();

  const config = {
    URGENT: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      dot: 'bg-rose-600 animate-pulse',
      label: 'URGENT',
    },
    HIGH: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      label: 'HIGH PRIORITY',
    },
    NORMAL: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dot: 'bg-emerald-600',
      label: 'NORMAL',
    },
    INCOMPLETE: {
      bg: 'bg-slate-100 border-slate-200 text-slate-600',
      dot: 'bg-slate-400',
      label: 'INCOMPLETE',
    },
  }[norm] || {
    bg: 'bg-slate-100 border-slate-200 text-slate-600',
    dot: 'bg-slate-400',
    label: norm,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
      title={isEmergency ? 'Critical Emergency Red Flag Detected' : `Advisory Priority: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{isEmergency ? 'EMERGENCY' : config.label}</span>
    </span>
  );
}
