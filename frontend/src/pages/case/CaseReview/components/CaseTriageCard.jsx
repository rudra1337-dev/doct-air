import React, { useState } from 'react';
import PriorityBadge from '../../../../components/common/PriorityBadge';

export default function CaseTriageCard({
  triage = {},
  isClinician = false,
  onOverridePriority,
  isUpdating = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(triage?.priority || 'NORMAL');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  const priority = triage?.priority || 'NORMAL';
  const signals = Array.isArray(triage?.signals) ? triage.signals : [];
  const safetyWarnings = Array.isArray(triage?.safetyWarnings) ? triage.safetyWarnings : [];
  const isEmergency = Boolean(triage?.isEmergencyOverride);

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Clinical justification is required when overriding triage priority.');
      return;
    }
    setError(null);
    try {
      await onOverridePriority(selectedPriority, reason.trim());
      setIsModalOpen(false);
      setReason('');
    } catch (err) {
      setError(err.message || 'Failed to update priority.');
    }
  };

  return (
    <div className={`case-card ${isEmergency ? 'border-rose-300 bg-rose-50/40' : ''}`}>
      <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Advisory Triage & Urgency Stratification
          </h2>
          <PriorityBadge priority={priority} isEmergency={isEmergency} />
        </div>

        {isClinician && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200 transition-colors shadow-sm"
          >
            Override Priority
          </button>
        )}
      </div>

      {/* Safety Warnings Banner */}
      {safetyWarnings.length > 0 && (
        <div className="mb-4 p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-900 shadow-sm">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-950">
            <span>⚠️</span> Safety Alert
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            {safetyWarnings.map((w, idx) => (
              <li key={idx} className="text-rose-800">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Category Rationale */}
      {triage?.categoryReason && (
        <p className="text-xs text-slate-700 mb-3 leading-relaxed">
          <strong className="font-bold text-slate-900">Stratification Rationale:</strong> {triage.categoryReason}
        </p>
      )}

      {/* Urgency Signals */}
      {signals.length > 0 ? (
        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-800">Identified Signals:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {signals.map((sig, idx) => (
              <span
                key={idx}
                className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]"
              >
                {sig}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No acute urgency signals flagged.</p>
      )}

      {/* Override Info if Present */}
      {triage?.overrideReason && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-indigo-900">
          <strong className="font-bold text-indigo-950">Clinician Override:</strong> {triage.overrideReason}
          {triage?.overrideAt && (
            <span className="text-slate-400 ml-2">
              ({new Date(triage.overrideAt).toLocaleString()})
            </span>
          )}
        </div>
      )}

      {/* Override Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Override Clinical Triage Priority
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              As an authorized clinician, you may reclassify the urgency of this case. Document your clinical justification below for the audit trail.
            </p>

            {error && (
              <div className="p-3 mb-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Priority Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['URGENT', 'HIGH', 'NORMAL'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPriority(p)}
                      className={`text-xs py-2 rounded-lg border font-bold transition-all shadow-sm ${
                        selectedPriority === p
                          ? 'bg-teal-600 border-teal-700 text-white shadow'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Clinical Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Patient has underlying chronic respiratory disease; elevated priority justified."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary text-xs"
                >
                  {isUpdating ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
