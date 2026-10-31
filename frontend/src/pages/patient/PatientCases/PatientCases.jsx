import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import caseService from '../../../services/caseService';
import StatusBadge from '../../case/CaseReview/components/StatusBadge';
import PriorityBadge from '../../../components/common/PriorityBadge';
import '../PatientDashboard/PatientDashboard.css';

export default function PatientCases() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    caseService
      .listCases()
      .then((res) => {
        if (isMounted && res?.success && Array.isArray(res.cases)) {
          setCases(res.cases);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to load your cases.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="workspace-view">
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow">Patient Workspace</span>
          <h1 className="workspace-view__title">My Submitted Cases</h1>
        </div>
        <Link to="/patient/dashboard" className="btn-secondary text-xs">
          &larr; Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="workspace-placeholder-box">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <h2 className="mt-2 text-slate-800">Loading your medical cases...</h2>
        </div>
      ) : error ? (
        <div className="workspace-placeholder-box">
          <h2 className="text-rose-600">Failed to load cases</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="workspace-placeholder-box">
          <div style={{ marginBottom: "1.25rem", display: "inline-block" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>No clinical cases on file yet.</h2>
          <p>
            When you complete an intake conversation or upload medical documents, your structured case summary will appear here for review.
          </p>
          <Link to="/patient/consultation" className="btn-primary">
            Start New Intake Consultation
          </Link>
        </div>
      ) : (
        <div className="workspace-grid">
          {cases.map((c) => {
            const caseId = c.id || c._id;
            const convId = c.conversationId?.toString();
            const chiefText = c.chiefComplaint?.text || 'Clinical Intake Consultation';
            const updatedDate = c.updatedAt
              ? new Date(c.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div key={caseId} className="workspace-grid__item">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <PriorityBadge
                      priority={c.triage?.priority}
                      isEmergency={c.triage?.isEmergencyOverride}
                    />
                    <StatusBadge status={c.status} />
                  </div>

                  <h3 className="mb-1.5 text-base font-bold text-slate-900 line-clamp-2">
                    {chiefText}
                  </h3>

                  <p className="text-xs text-slate-500 mb-4">
                    {c.symptoms?.length || 0} Symptoms &bull; {c.reportFindings?.length || 0} Report Findings
                    {updatedDate && ` &bull; Updated ${updatedDate}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap">
                  {c.status === 'reviewed' ? (
                    <Link
                      to={`/patient/cases/${caseId}/report`}
                      className="text-xs py-2 px-3 flex-1 text-center font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                    >
                      ✓ Doctor Report &rarr;
                    </Link>
                  ) : (
                    <Link
                      to={`/patient/cases/${caseId}/report`}
                      className="text-xs py-2 px-3 flex-1 text-center font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
                    >
                      Intake Report &rarr;
                    </Link>
                  )}
                  <Link
                    to={`/patient/cases/${caseId}`}
                    className="btn-secondary text-xs py-1.5 px-3"
                    title="Case details"
                  >
                    Case
                  </Link>
                  {convId && (
                    <Link
                      to={`/patient/consultation/${convId}`}
                      className="btn-ghost text-xs py-1.5 px-2.5"
                      title="Open Consultation Chat"
                    >
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
