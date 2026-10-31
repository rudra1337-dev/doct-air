import React from 'react';

const STATUS_CONFIG = {
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    description: 'Intake and data collection currently active',
  },
  ready_for_review: {
    label: 'Ready for Review',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    description: 'Intake complete, awaiting clinical evaluation',
  },
  queued: {
    label: 'In Clinical Queue',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotClass: 'bg-indigo-500',
    description: 'Submitted and queued for attending doctor',
  },
  in_review: {
    label: 'In Review',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    description: 'Currently being reviewed by a clinician',
  },
  needs_information: {
    label: 'Needs Information',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    dotClass: 'bg-orange-500',
    description: 'Additional clinical clarification required',
  },
  escalated: {
    label: 'Escalated / Urgent',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-600 animate-pulse',
    description: 'Acute emergency priority detected',
  },
  reviewed: {
    label: 'Clinician Reviewed',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-600',
    description: 'Reviewed and verified by healthcare professional',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    dotClass: 'bg-teal-600',
    description: 'Care consultation finalized',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    description: 'Consultation cancelled',
  },
};

export default function StatusBadge({ status = 'in_progress', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.in_progress;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
      title={config.description}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
