import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import caseService from '../../../services/caseService';
import './MedicalReportPage.css';

export const CONSENT_STATEMENT =
  'I have reviewed the information in this report to the best of my knowledge. I understand that it will be shared with an authorized healthcare professional for review. I understand that this AI-generated report is not a medical diagnosis.';

/**
 * Medical Intake & Doctor's Official Assessment View
 *
 * In-app structured view of clinical intake information collected during
 * a patient consultation conversation, AND the official Doctor's Assessment & Prescriptions
 * when completed by an attending healthcare professional.
 */
export default function MedicalReportPage({ role = 'patient' }) {
  const { caseId, conversationId } = useParams();
  const { user } = useAuth();
  const isPatient = role === 'patient' || user?.role === 'PATIENT';

  const [report, setReport] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'assessment'
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Patient Consent Form State
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [consentError, setConsentError] = useState(null);

  // Check URL query parameters for view=assessment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'assessment' || params.get('tab') === 'assessment') {
      setActiveTab('assessment');
    }
  }, []);

  // Load report, case, and clinical assessment
  const loadReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let res;
      if (caseId) {
        res = await caseService.getReportByCaseId(caseId);
      } else if (conversationId) {
        res = await caseService.getReportByConversation(conversationId);
      } else {
        throw new Error('No Case ID or Conversation ID provided.');
      }

      if (res?.success && res.report) {
        setReport(res.report);
        const resolvedCaseId = res.report.caseId || caseId;

        if (resolvedCaseId) {
          // Fetch case details for consent and triage info
          caseService
            .getCaseById(resolvedCaseId)
            .then((cRes) => {
              if (cRes?.success && cRes.case) setCaseData(cRes.case);
            })
            .catch(() => {});

          // Fetch official doctor's assessment
          caseService
            .getAssessment(resolvedCaseId)
            .then((aRes) => {
              if (aRes?.success && aRes.assessment) {
                setAssessment(aRes.assessment);
                if (aRes.assessment.status === 'published') {
                  setActiveTab('assessment');
                }
              }
            })
            .catch(() => {});
        }
      } else {
        throw new Error('Report data not returned.');
      }
    } catch (err) {
      if (err.status === 404) {
        setError('No medical intake report is available for this consultation yet.');
      } else if (err.status === 403) {
        setError('You do not have authorization to view this medical intake report.');
      } else {
        setError(err.message || 'Failed to load medical intake report.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [caseId, conversationId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Handle Report Regeneration
  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      setNotification(null);

      let res;
      const targetConvId = conversationId || report?.conversationId;
      const targetCaseId = caseId || report?.caseId;

      if (targetConvId) {
        res = await caseService.generateReport(targetConvId);
      } else if (targetCaseId) {
        res = await caseService.generateReportByCaseId(targetCaseId);
      }

      if (res?.success && res.report) {
        setReport(res.report);
        setNotification({
          type: 'success',
          message: `Medical intake report updated to version ${res.report.version}.`,
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to regenerate report. The previous report remains active.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle Explicit Patient Consent & Submission
  const handleConsentAndSubmit = async () => {
    if (!consentChecked) {
      setConsentError('You must review the report and agree to the consent statement before submission.');
      return;
    }
    const targetCaseId = caseId || report?.caseId || caseData?.id || caseData?._id;
    if (!targetCaseId) return;

    try {
      setIsSubmittingConsent(true);
      setConsentError(null);
      const res = await caseService.consentAndSubmit(targetCaseId, CONSENT_STATEMENT);
      if (res?.success && res.case) {
        setCaseData(res.case);
        setNotification({
          type: 'success',
          message: 'Your case has been submitted for clinical review. Attending healthcare professionals have been notified.',
        });
      }
    } catch (err) {
      setConsentError(err.message || 'Failed to submit case for review.');
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  const sections = report?.sections;
  const overview = sections?.consultationOverview;
  const completeness = report?.completenessSnapshot;
  const isDraft = report?.status === 'draft';

  // Back Navigation URL
  const targetConvId = conversationId || report?.conversationId;
  const targetCaseId = caseId || report?.caseId;

  const consultationBackUrl = isPatient
    ? targetConvId
      ? `/patient/consultation/${targetConvId}`
      : '/patient/dashboard'
    : '/professional/queue';

  const caseReviewUrl = isPatient
    ? targetCaseId
      ? `/patient/cases/${targetCaseId}`
      : targetConvId
      ? `/patient/cases/conversation/${targetConvId}`
      : null
    : targetCaseId
    ? `/professional/cases/${targetCaseId}`
    : null;

  if (isLoading) {
    return (
      <div className="medical-report-page">
        <div className="report-loading-container">
          <div className="report-spinner" />
          <p className="report-loading-text">Loading Medical Report & Clinical Records...</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="medical-report-page">
        <div className="report-top-bar">
          <Link to={consultationBackUrl} className="btn-report-back">
            &larr; Return to Consultation
          </Link>
        </div>
        <div className="report-error-card">
          <div className="report-error-icon">&excl;</div>
          <h2>Medical Report Unavailable</h2>
          <p>{error}</p>
          {conversationId && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="btn-report-primary"
            >
              {isRegenerating ? 'Generating Intake Report...' : 'Generate Medical Intake Report'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="medical-report-page">
      {/* Navigation Top Bar */}
      <div className="report-top-bar">
        <div className="report-top-bar__left">
          <Link to={consultationBackUrl} className="btn-report-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Consultation</span>
          </Link>

          {caseReviewUrl && (
            <Link to={caseReviewUrl} className="btn-report-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Structured Case</span>
            </Link>
          )}
        </div>

        <div className="report-top-bar__right">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-report-back cursor-pointer"
            title="Print or save as PDF"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="btn-report-refresh"
            title="Regenerate an updated version of this medical intake report"
          >
            <svg
              className={isRegenerating ? 'report-spin-icon' : ''}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isRegenerating ? 'Regenerating...' : 'Refresh Report'}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`report-notification report-notification--${notification.type}`}>
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="report-notification__close"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Document Selection Tabs (When doctor has published assessment) */}
      {assessment?.status === 'published' && (
        <div className="report-tab-nav">
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`report-tab-btn ${activeTab === 'assessment' ? 'report-tab-btn--active' : ''}`}
          >
            <span>📋 Doctor's Official Assessment & Orders</span>
            <span className="report-tab-badge">Verified by Clinician</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`report-tab-btn ${activeTab === 'report' ? 'report-tab-btn--active' : ''}`}
          >
            <span>🤖 AI Medical Intake Report</span>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW 1: OFFICIAL DOCTOR ASSESSMENT & PRESCRIPTIONS ─────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assessment' && assessment?.status === 'published' && (
        <div className="doctor-assessment-view">
          {/* Header Banner */}
          <div className="p-6 rounded-xl bg-white border border-emerald-200 shadow-xs">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Official Healthcare Professional Report & Orders
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  Clinical Assessment & Prescription
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Case ID: #{assessment.caseId ? assessment.caseId.toString().slice(-6) : 'N/A'} &bull;{' '}
                  Published:{' '}
                  {assessment.publishedAt
                    ? new Date(assessment.publishedAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Recent'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Attending Clinician:</span>
                <span className="text-base font-bold text-slate-900 block">
                  {assessment.professionalName}
                </span>
                <span className="text-xs text-teal-700 font-semibold block">
                  {assessment.professionalTitle || 'Licensed Healthcare Professional'}
                </span>
              </div>
            </div>

            {/* Doctor Acknowledgement Confirmation Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <span className="text-base text-emerald-700 font-bold">✓</span>
              <div>
                <strong className="text-emerald-950">Clinician Review Acknowledgement:</strong>
                <p className="italic text-emerald-800 mt-0.5">
                  "{assessment.doctorAcknowledgement?.acknowledgementText ||
                    'I have personally reviewed and verified the information and clinical recommendations in this report. I am responsible for the assessment and recommendations I am submitting.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis & Clinical Assessment */}
          <div className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">1</span>
              Clinical Assessment & Diagnosis
            </h2>

            {assessment.diagnosis && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs uppercase font-bold text-emerald-800 block mb-1">
                  Primary Working Diagnosis
                </span>
                <p className="text-lg font-bold text-slate-900">{assessment.diagnosis}</p>
              </div>
            )}

            {assessment.clinicalAssessment ? (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {assessment.clinicalAssessment}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No clinical assessment narrative provided.</p>
            )}
          </div>

          {/* Clinical Observations */}
          {assessment.observations && (
            <div className="report-section">
              <h2 className="report-section-title">
                <span className="report-section-num">2</span>
                Clinical Observations
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {assessment.observations}
              </div>
            </div>
          )}

          {/* Prescriptions Table */}
          <div className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">3</span>
              Prescriptions & Medication Orders ({assessment.prescriptions?.length || 0})
            </h2>

            {assessment.prescriptions?.length > 0 ? (
              <div className="doctor-rx-table-container">
                <table className="doctor-rx-table">
                  <thead>
                    <tr>
                      <th>Medicine & Strength</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Special Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.prescriptions.map((rx, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-teal-700">{rx.medicineName}</td>
                        <td>{rx.dosage || 'As directed'}</td>
                        <td>{rx.frequency || 'Daily'}</td>
                        <td>{rx.duration || 'Standard course'}</td>
                        <td className="text-slate-600">{rx.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="report-empty-state">No pharmacological prescriptions issued.</p>
            )}
          </div>

          {/* Recommended Investigations */}
          {assessment.recommendedInvestigations?.length > 0 && (
            <div className="report-section">
              <h2 className="report-section-title">
                <span className="report-section-num">4</span>
                Recommended Diagnostic Investigations
              </h2>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700">
                {assessment.recommendedInvestigations.map((inv, idx) => (
                  <li key={idx} className="font-medium text-slate-900">
                    {inv}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General Advice & Lifestyle Guidance */}
          {assessment.generalAdvice && (
            <div className="report-section">
              <h2 className="report-section-title">
                <span className="report-section-num">5</span>
                General Advice & Care Instructions
              </h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {assessment.generalAdvice}
              </div>
            </div>
          )}

          {/* Follow-up & Referral */}
          <div className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">6</span>
              Follow-Up & Specialist Referral
            </h2>

            <div className="space-y-3">
              {assessment.followUpInstructions && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Follow-up Instructions:
                  </span>
                  <p className="text-sm text-slate-700">{assessment.followUpInstructions}</p>
                </div>
              )}

              {assessment.referral?.recommended ? (
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block mb-1">
                    Specialist Referral Recommended
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    Specialty: {assessment.referral.specialty || 'General Specialist'}
                  </p>
                  {assessment.referral.notes && (
                    <p className="text-xs text-slate-600 mt-1">
                      Reason / Clinical Notes: {assessment.referral.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specialist referral indicated.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW 2: AI MEDICAL INTAKE REPORT ───────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'report' && (
        <>
          {/* Non-Diagnostic Clinical Safety Disclaimer Banner */}
          <div className="report-safety-banner">
            <div className="report-safety-banner__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="report-safety-banner__body">
              <span className="report-safety-banner__title">Non-Diagnostic Clinical Intake Summary</span>
              <p className="report-safety-banner__text">
                This document organizes patient-reported statements and uploaded medical report findings for clinician review.
                It does not constitute a medical diagnosis, triage score, or treatment recommendation. Information must be clinically evaluated.
              </p>
            </div>
          </div>

          {/* ── Patient Consent & Submission Box (Patient Portal) ─────── */}
          {isPatient && (
            <div>
              {caseData?.consent?.consentGiven ? (
                <div className="report-consent-card report-consent-card--confirmed">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Explicit Patient Consent Confirmed & Logged</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    You reviewed and submitted this intake report on{' '}
                    <strong className="text-slate-800">{new Date(caseData.consent.consentedAt).toLocaleString()}</strong>.
                    Attending clinicians have been notified.
                  </p>
                  <p className="text-xs text-slate-600 italic mt-2 border-l-2 border-emerald-500 pl-2.5">
                    "{caseData.consent.statement}"
                  </p>
                </div>
              ) : (
                <div className="report-consent-card">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <span>🔒</span> Review & Submit Case for Clinical Evaluation
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">
                    Please inspect your structured intake report below. By providing your explicit consent, your medical intake will be queued for attending doctors to evaluate.
                  </p>

                  {completeness?.canSubmitForReview === false ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-950 mb-1">
                        <span>⚠️</span>
                        <span>Clinical Intake Incomplete</span>
                      </div>
                      <p>
                        Some required medical information has not yet been collected. Please return to the consultation chat to answer outstanding questions before submitting for doctor review.
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleConsentAndSubmit();
                      }}
                    >
                      {consentError && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                          {consentError}
                        </div>
                      )}

                      <div
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer mb-4 ${
                          consentChecked
                            ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-1 ring-teal-500/20'
                            : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
                        }`}
                        onClick={() => setConsentChecked(!consentChecked)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="patient-consent-checkbox"
                            checked={consentChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              setConsentChecked(e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-5 h-5 rounded-md border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer flex-shrink-0"
                          />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span aria-hidden="true">🛡️</span> Patient Informed Consent & Legal Authorization
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  consentChecked
                                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {consentChecked ? '✓ Consent Acknowledged' : 'Required to Submit'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed italic">
                              &quot;{CONSENT_STATEMENT}&quot;
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-[11px] text-slate-500">
                          Mandatory requirement: Cases are not queued for review without explicit patient consent.
                        </span>
                        <button
                          type="submit"
                          disabled={!consentChecked || isSubmittingConsent}
                          className="btn-report-primary whitespace-nowrap text-xs font-semibold py-2.5 px-5 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingConsent ? (
                            <span>Submitting Case...</span>
                          ) : (
                            <>
                              <span>Submit Case for Clinical Review</span>
                              <span aria-hidden="true">&rarr;</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Section 1: Consultation Overview ──────────────────────────────── */}
          <section className="report-section report-section--overview">
            <div className="report-overview-header">
              <div className="report-overview-header__title-block">
                <div className="report-overview-badges">
                  <span className={`report-status-badge report-status-badge--${report.status}`}>
                    {isDraft ? 'DRAFT REPORT' : 'READY FOR REVIEW'}
                  </span>
                  <span className="report-version-badge">Version {report.version}</span>
                  <span className="report-meta-pill">Case Status: {overview?.caseStatus || 'in_progress'}</span>
                </div>
                <h1 className="report-title">Medical Intake Report</h1>
                <p className="report-subtitle">
                  Generated:{' '}
                  {new Date(report.generatedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {overview?.patientName && ` • Patient: ${overview.patientName}`}
                </p>
              </div>

              {/* Completeness Meter */}
              {completeness && (
                <div className="report-completeness-gauge">
                  <div className="report-completeness-gauge__score">
                    {completeness.completionPercentage}%
                  </div>
                  <div className="report-completeness-gauge__label">Intake Completeness</div>
                  <div className="report-progress-bar">
                    <div
                      className="report-progress-bar__fill"
                      style={{ width: `${completeness.completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {overview?.summaryText && (
              <div className="report-overview-summary">
                <p>{overview.summaryText}</p>
              </div>
            )}
          </section>

          {/* ── Section 2: Chief Complaint ───────────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">1</span>
              Chief Complaint
            </h2>
            {sections?.chiefComplaint?.text ? (
              <div className="report-card report-card--highlight">
                <p className="report-card__text">{sections.chiefComplaint.text}</p>
                {sections.chiefComplaint.source && (
                  <div className="report-source-tag">
                    Source:{' '}
                    {sections.chiefComplaint.source.sourceType === 'document'
                      ? 'Medical Document'
                      : 'Patient Statement'}
                  </div>
                )}
              </div>
            ) : (
              <div className="report-empty-state">No chief complaint documented.</div>
            )}
          </section>

          {/* ── Section 3: History of Present Illness (HPI) ────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">2</span>
              History of Present Illness (HPI)
            </h2>
            <div className="report-hpi-grid">
              <div className="report-prop-box">
                <span className="report-prop-label">Onset & Timing:</span>
                <span className="report-prop-value">{sections?.hpi?.onset || 'Not specified'}</span>
              </div>
              <div className="report-prop-box">
                <span className="report-prop-label">Duration:</span>
                <span className="report-prop-value">{sections?.hpi?.duration || 'Not specified'}</span>
              </div>
              <div className="report-prop-box">
                <span className="report-prop-label">Severity:</span>
                <span className="report-prop-value">
                  {sections?.hpi?.severity
                    ? `${sections.hpi.severity.toUpperCase()}${sections.hpi.severityScore ? ` (${sections.hpi.severityScore}/10)` : ''}`
                    : 'Not specified'}
                </span>
              </div>
              <div className="report-prop-box">
                <span className="report-prop-label">Course:</span>
                <span className="report-prop-value">{sections?.hpi?.course || 'Not specified'}</span>
              </div>
            </div>

            {sections?.hpi?.narrative && (
              <div className="report-hpi-narrative">
                <h3 className="report-subheading">Clinical Intake Narrative:</h3>
                <p>{sections.hpi.narrative}</p>
              </div>
            )}
          </section>

          {/* ── Section 4: Symptoms ──────────────────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">3</span>
              Documented Symptoms ({(sections?.symptoms?.items || []).length})
            </h2>
            {(sections?.symptoms?.items || []).length > 0 ? (
              <div className="report-items-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Symptom</th>
                      <th>Location</th>
                      <th>Severity</th>
                      <th>Duration</th>
                      <th>Character</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.symptoms.items.map((sym, idx) => (
                      <tr key={idx}>
                        <td className="report-td-bold">{sym.name}</td>
                        <td>{sym.location || '—'}</td>
                        <td>
                          {sym.severity ? (
                            <span className={`report-sev-pill report-sev-pill--${sym.severity.toLowerCase()}`}>
                              {sym.severity}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{sym.duration || '—'}</td>
                        <td>{sym.character || '—'}</td>
                        <td className="report-td-source">{sym.source?.sourceType || 'conversation'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="report-empty-state">No symptoms recorded.</div>
            )}
          </section>

          {/* ── Section 5: Medical Background ────────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">4</span>
              Medical Background
            </h2>
            {(sections?.medicalBackground?.items || []).length > 0 ? (
              <ul className="report-bullet-list">
                {sections.medicalBackground.items.map((item, idx) => (
                  <li key={idx} className="report-bullet-item">
                    <strong>{item.condition}</strong>
                    {item.notes && <span> — {item.notes}</span>}
                    <span className="report-source-tag ml-2">
                      {item.source?.sourceType === 'document' ? 'Document' : 'Patient'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="report-empty-state">No prior medical history reported.</div>
            )}
          </section>

          {/* ── Section 6: Current Medications ──────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">5</span>
              Current Medications
            </h2>
            {(sections?.currentMedications?.items || []).length > 0 ? (
              <ul className="report-bullet-list">
                {sections.currentMedications.items.map((med, idx) => (
                  <li key={idx} className="report-bullet-item">
                    <strong>{med.name}</strong>
                    {med.dose && <span> &bull; Dose: {med.dose}</span>}
                    {med.frequency && <span> &bull; Frequency: {med.frequency}</span>}
                    {med.route && <span> &bull; Route: {med.route}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="report-empty-state">No current medications reported.</div>
            )}
          </section>

          {/* ── Section 7: Allergies ────────────────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">6</span>
              Allergies & Adverse Reactions
            </h2>
            {(sections?.allergies?.items || []).length > 0 ? (
              <ul className="report-bullet-list">
                {sections.allergies.items.map((all, idx) => (
                  <li key={idx} className="report-bullet-item">
                    <strong className="text-rose-300">{all.allergen}</strong>
                    {all.reaction && <span> &bull; Reaction: {all.reaction}</span>}
                    {all.severity && <span> &bull; Severity: {all.severity}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="report-empty-state">No known allergies reported.</div>
            )}
          </section>

          {/* ── Section 8: Diagnostic Findings from Uploaded PDFs ──────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">7</span>
              Diagnostic Report Findings ({(sections?.diagnosticFindings?.items || []).length})
            </h2>
            {(sections?.diagnosticFindings?.items || []).length > 0 ? (
              <div className="report-findings-grid">
                {sections.diagnosticFindings.items.map((df, idx) => (
                  <div key={idx} className="report-finding-card">
                    <div className="report-finding-header">
                      <h3 className="report-finding-title">{df.title}</h3>
                      {df.documentTitle && (
                        <span className="report-finding-doc">Doc: {df.documentTitle}</span>
                      )}
                    </div>
                    <p className="report-finding-body">{df.finding}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="report-empty-state">No diagnostic reports attached.</div>
            )}
          </section>

          {/* ── Section 9: Discrepancies & Conflicting Information ──────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">8</span>
              Discrepancies & Conflicting Assertions ({(sections?.discrepancies?.items || []).length})
            </h2>
            {(sections?.discrepancies?.items || []).length > 0 ? (
              <div className="report-discrepancies-list">
                {sections.discrepancies.items.map((disc, idx) => (
                  <div key={idx} className="report-discrepancy-card">
                    <div className="report-discrepancy-top">
                      <h3 className="report-discrepancy-topic">{disc.topic}</h3>
                      <span className={`report-disc-badge report-disc-badge--${disc.status}`}>
                        {disc.status}
                      </span>
                    </div>
                    <div className="report-discrepancy-split">
                      <div className="report-disc-col">
                        <span className="report-disc-label">Patient Assertion:</span>
                        <p>{disc.patientStatement?.statement || '—'}</p>
                      </div>
                      <div className="report-disc-col">
                        <span className="report-disc-label">Document Assertion:</span>
                        <p>{disc.documentEvidence?.evidenceText || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="report-empty-state report-empty-state--positive">
                No clinical discrepancies or conflicting statements detected.
              </div>
            )}
          </section>

          {/* ── Section 10: Missing Information ─────────────────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">9</span>
              Missing & Incomplete Information
            </h2>
            <div className="report-missing-container">
              {(sections?.missingAndIncompleteInformation?.missingRequired || []).length > 0 ? (
                <div className="report-missing-block report-missing-block--required">
                  <h3 className="report-missing-subtitle">Missing Required Information (Blocks Review):</h3>
                  <ul>
                    {sections.missingAndIncompleteInformation.missingRequired.map((mr, idx) => (
                      <li key={idx}>
                        <strong>{mr.label || mr.field}:</strong> {mr.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="report-empty-state report-empty-state--positive">
                  All essential required fields documented.
                </div>
              )}

              {(sections?.missingAndIncompleteInformation?.missingOptional || []).length > 0 && (
                <div className="report-missing-block">
                  <h3 className="report-missing-subtitle">Optional Clinical Intake Fields Uncollected:</h3>
                  <ul>
                    {sections.missingAndIncompleteInformation.missingOptional.map((mo, idx) => (
                      <li key={idx}>
                        <strong>{mo.label || mo.field}:</strong> {mo.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* ── Section 11: Source Evidence & Provenance ───────────────────── */}
          <section className="report-section">
            <h2 className="report-section-title">
              <span className="report-section-num">10</span>
              Source Evidence & Provenance
            </h2>
            <div className="report-sources-grid">
              <div className="report-sources-col">
                <h3 className="report-sources-header">Consultation Messages Cited</h3>
                {(sections?.sourceReferences?.messages || []).length > 0 ? (
                  <div className="report-sources-list">
                    {sections.sourceReferences.messages.map((m, idx) => (
                      <div key={m.messageId || idx} className="report-source-item">
                        <div className="report-source-item__top">
                          <span className="report-source-role">{m.role}</span>
                          <span className="report-source-time">
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className="report-source-snippet">"{m.snippet}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="report-empty-state">No message references cited.</p>
                )}
              </div>

              <div className="report-sources-col">
                <h3 className="report-sources-header">Medical Documents Cited</h3>
                {(sections?.sourceReferences?.documents || []).length > 0 ? (
                  <div className="report-sources-list">
                    {sections.sourceReferences.documents.map((d, idx) => (
                      <div key={d.documentId || idx} className="report-source-item">
                        <div className="report-source-item__top">
                          <span className="report-source-filename">{d.filename}</span>
                          <span className="report-source-pages">{d.pageCount} page(s)</span>
                        </div>
                        <span className="report-source-time">
                          Uploaded {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="report-empty-state">No documents attached.</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
