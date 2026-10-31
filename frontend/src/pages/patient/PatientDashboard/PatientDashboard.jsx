import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import caseService from '../../../services/caseService';
import notificationService from '../../../services/notificationService';
import PriorityBadge from '../../../components/common/PriorityBadge';
import StatusBadge from '../../case/CaseReview/components/StatusBadge';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      caseService.listCases().catch(() => ({ success: false, cases: [] })),
      notificationService.getNotifications().catch(() => ({ success: false, notifications: [] })),
    ])
      .then(([casesRes, notifRes]) => {
        if (!isMounted) return;
        if (casesRes?.success && Array.isArray(casesRes.cases)) {
          setCases(casesRes.cases);
        }
        if (notifRes?.success && Array.isArray(notifRes.notifications)) {
          setNotifications(notifRes.notifications.filter((n) => !n.read));
        }
      })
      .catch((err) => {
        if (!isMounted) setError(err.message || 'Failed to load dashboard data.');
      })
      .finally(() => {
        if (!isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismissNotification = async (notifId) => {
    try {
      await notificationService.markAsRead(notifId);
      setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== notifId));
    } catch {
      setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== notifId));
    }
  };

  const activeCase = cases.find((c) =>
    ['in_progress', 'needs_information', 'ready_for_review'].includes(c.status)
  );

  const reviewedCasesCount = cases.filter((c) => c.status === 'reviewed').length;
  const inReviewCasesCount = cases.filter((c) =>
    ['queued', 'in_review', 'escalated'].includes(c.status)
  ).length;

  return (
    <div className="workspace-view">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow">Patient Care Portal</span>
          <h1 className="workspace-view__title">
            Welcome back, {user?.name || 'Patient'}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeCase?.conversationId && (
            <Link
              to={`/patient/consultation/${activeCase.conversationId}`}
              className="px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-sm border border-teal-200 transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              Resume Active Consultation
            </Link>
          )}
          <Link
            to="/patient/consultation"
            className="btn-primary"
          >
            + Start New Consultation
          </Link>
        </div>
      </div>

      {/* ── Real-Time Notifications Banner ────────────────────────── */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2.5">
          {notifications.map((notif) => {
            const notifId = notif.id || notif._id;
            const isAssessment = notif.type === 'assessment_published';
            return (
              <div
                key={notifId}
                className={`p-4 rounded-xl border flex items-start justify-between gap-3 shadow-sm ${
                  isAssessment
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{isAssessment ? '📋' : '🔔'}</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{notif.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    {notif.caseId && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <Link
                          to={`/patient/cases/${notif.caseId}/report`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm inline-flex items-center gap-1.5"
                        >
                          <span>View Doctor Assessment & Prescription</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismissNotification(notifId)}
                  className="text-slate-400 hover:text-slate-600 text-lg p-1 leading-none"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Emergency Safety Advisory Banner ─────────────────────── */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">⚠️</span>
          <span className="leading-relaxed">
            <strong className="font-bold">Emergency Advisory:</strong> DoctAir is an AI-assisted intake coordination tool and does NOT provide emergency medical diagnosis or treatment. For acute chest pain, severe breathlessness, or immediate medical emergencies, call <strong className="font-bold">112 / 911</strong> or visit your nearest emergency room immediately.
          </span>
        </div>
        <Link to="/safety" className="font-semibold text-amber-800 underline whitespace-nowrap hover:text-amber-950">
          Safety Protocols
        </Link>
      </div>

      {/* ── Workspace Summary Metrics ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Consultations</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1.5">{cases.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Intake sessions on file</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Awaiting Clinical Review</span>
          <div className="text-3xl font-extrabold text-amber-600 mt-1.5">{inReviewCasesCount}</div>
          <span className="text-xs text-slate-500 mt-1 block">Queued with attending healthcare team</span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Doctor Assessments Ready</span>
          <div className="text-3xl font-extrabold text-teal-600 mt-1.5">{reviewedCasesCount}</div>
          <span className="text-xs text-slate-500 mt-1 block">Official reports & prescriptions ready</span>
        </div>
      </div>

      {/* ── Recent Consultations & Medical Cases ─────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Your Medical Consultations ({cases.length})
          </h2>
          {cases.length > 0 && (
            <Link to="/patient/cases" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              View All Cases &rarr;
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-slate-500 border border-slate-200 rounded-xl bg-white shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading consultation records...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 border border-rose-200 rounded-xl bg-rose-50 shadow-sm">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-white shadow-sm">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-xl">
              💬
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No Consultations Started Yet
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
              Begin a conversational intake session with Gemma 4 to capture your symptoms, attach medical reports, and submit them directly to attending clinicians.
            </p>
            <Link
              to="/patient/consultation"
              className="btn-primary text-xs"
            >
              Start Your First Consultation Intake
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.slice(0, 6).map((c) => {
              const caseId = c.id || c._id;
              const chiefComplaint = c.chiefComplaint?.text || 'Clinical Consultation Intake';
              const isReviewed = c.status === 'reviewed';
              const isReadyToSubmit =
                c.status === 'ready_for_review' ||
                (c.completeness?.canSubmitForReview && !c.consent?.consentGiven);
              const formattedDate = c.updatedAt
                ? new Date(c.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null;

              return (
                <div
                  key={caseId}
                  className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <PriorityBadge
                        priority={c.triage?.priority}
                        isEmergency={c.triage?.isEmergencyOverride}
                      />
                      <StatusBadge status={c.status} />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                      {chiefComplaint}
                    </h3>

                    <p className="text-xs text-slate-500 mb-4">
                      {c.symptoms?.length || 0} Symptoms &bull;{' '}
                      {c.reportFindings?.length || 0} Lab findings
                      {formattedDate && ` &bull; ${formattedDate}`}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    {isReviewed ? (
                      <Link
                        to={`/patient/cases/${caseId}/report`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                      >
                        ✓ View Doctor Report & Rx
                      </Link>
                    ) : isReadyToSubmit ? (
                      <Link
                        to={`/patient/cases/${caseId}/report`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
                      >
                        Review & Give Consent &rarr;
                      </Link>
                    ) : (
                      <Link
                        to={`/patient/consultation/${c.conversationId}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-200"
                      >
                        Continue Intake Chat &rarr;
                      </Link>
                    )}

                    <Link
                      to={`/patient/cases/${caseId}`}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Case Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Feature Highlights ───────────────────────────────────── */}
      <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-teal-600 text-xl mb-1.5">💬</div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Gemma 4 Guided Intake
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Conversational AI organizes chief complaints, timing, and severity into structured clinical cases ready for medical staff.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-indigo-600 text-xl mb-1.5">📄</div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Diagnostic PDF Extraction
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Upload blood work, radiological findings, and discharge summaries to automatically extract verified laboratory facts.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-emerald-600 text-xl mb-1.5">🔒</div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Explicit Patient Consent
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            You maintain full sovereignty. Cases are submitted to attending doctors only after your explicit review and acknowledgement.
          </p>
        </div>
      </div>
    </div>
  );
}
