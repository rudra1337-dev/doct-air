import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import caseService from "../../../services/caseService";
import PriorityBadge from "../../../components/common/PriorityBadge";
import StatusBadge from "../../case/CaseReview/components/StatusBadge";
import "../../patient/PatientDashboard/PatientDashboard.css";

export default function ProfessionalDashboard() {
  const [stats, setStats] = useState({
    totalCases: 0,
    urgentCases: 0,
    highPriority: 0,
    normalPriority: 0,
    incompleteCases: 0,
    pendingReviews: 0,
    completedReviews: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      caseService.getCaseStats().catch(() => ({ stats: {} })),
      caseService.listCases({ limit: 6 }).catch(() => ({ cases: [] })),
    ])
      .then(([statsRes, casesRes]) => {
        if (!isMounted) return;
        if (statsRes?.stats) setStats(statsRes.stats);
        if (Array.isArray(casesRes?.cases)) setRecentCases(casesRes.cases);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load clinical workspace data.");
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
      {/* Header */}
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow" style={{ color: "#0d9488" }}>
            Healthcare Professional Portal
          </span>
          <h1 className="workspace-view__title">Clinical Triage & Review Workspace</h1>
        </div>
        <Link to="/professional/queue" className="btn-primary">
          View Intake Queue ({stats.pendingReviews || 0})
        </Link>
      </div>

      {/* Real-time Triage Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-800 font-bold mb-1">
            <span>URGENT / ESCALATED</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-rose-700">{stats.urgentCases || 0}</div>
          <span className="text-[11px] text-rose-600 mt-1">Requires immediate clinical attention</span>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col justify-between shadow-xs">
          <div className="text-xs text-amber-800 font-bold mb-1">HIGH PRIORITY</div>
          <div className="text-3xl font-bold text-amber-800">{stats.highPriority || 0}</div>
          <span className="text-[11px] text-amber-700 mt-1">Acute presentation or abnormal vitals</span>
        </div>

        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col justify-between shadow-xs">
          <div className="text-xs text-teal-800 font-bold mb-1">PENDING REVIEW</div>
          <div className="text-3xl font-bold text-teal-800">{stats.pendingReviews || 0}</div>
          <span className="text-[11px] text-teal-700 mt-1">Awaiting physician verification</span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex flex-col justify-between shadow-xs">
          <div className="text-xs text-emerald-800 font-bold mb-1">COMPLETED REVIEWS</div>
          <div className="text-3xl font-bold text-emerald-800">{stats.completedReviews || 0}</div>
          <span className="text-[11px] text-emerald-700 mt-1">Assessments signed & published</span>
        </div>
      </div>

      {/* Main Clinical Notice */}
      <div className="workspace-card workspace-card--pro mb-8">
        <div className="workspace-card__icon workspace-card__icon--pro" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#0d9488" strokeWidth="1.5" />
            <path d="M14 7v14M7 14h14" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="14" r="3.5" fill="#0d9488" fillOpacity="0.15" stroke="#0f766e" strokeWidth="1" />
          </svg>
        </div>
        <div className="workspace-card__content">
          <h2>Advisory Triage & Pre-Consultation Summary Support</h2>
          <p>
            DoctAir structures patient descriptions, document findings, and symptom progression into traceable
            intake reports. <strong>AI NEVER diagnoses or prescribes.</strong> Qualified healthcare professionals
            retain exclusive authority for clinical assessments and prescriptions.
          </p>
        </div>
      </div>

      {/* Recent Cases Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Incoming Consultation Queue</h2>
          <Link to="/professional/queue" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
            View All in Queue &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="workspace-placeholder-box">
            <div className="case-spinner" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">Loading incoming consultations...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        ) : recentCases.length === 0 ? (
          <div className="workspace-placeholder-box">
            <p className="text-slate-500">No patient cases currently in the intake queue.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentCases.map((c) => {
              const caseId = c.id || c._id;
              const patientName = c.patientId?.name || "Patient Intake";
              const priority = c.triage?.priority || "NORMAL";
              const isUrgent = priority === "URGENT";

              return (
                <div
                  key={caseId}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                    isUrgent
                      ? "border-rose-300 bg-rose-50/50 hover:bg-rose-50/70"
                      : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <PriorityBadge priority={priority} isEmergency={c.triage?.isEmergencyOverride} />
                      <StatusBadge status={c.status} />
                      <span className="text-xs font-bold text-slate-900">{patientName}</span>
                      <span className="text-xs text-slate-500 font-mono">ID: {caseId.slice(-6)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {c.chiefComplaint?.text || "Consultation Intake"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.symptoms?.length || 0} Symptoms &bull; {c.reportFindings?.length || 0} Document Findings &bull; Updated{" "}
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/professional/cases/${caseId}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
                    >
                      Review Case &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Links */}
      <div className="workspace-grid">
        <div className="workspace-grid__item">
          <h3>Prioritized Queue</h3>
          <p>Triage-sorted incoming patient summaries with safety flags and completeness indicators.</p>
          <Link to="/professional/queue" className="workspace-grid__link">
            Open Queue &rarr;
          </Link>
        </div>

        <div className="workspace-grid__item">
          <h3>Case Registry</h3>
          <p>Searchable archive of verified patient records, clinical notes, and documented reviews.</p>
          <Link to="/professional/cases" className="workspace-grid__link">
            Case Records &rarr;
          </Link>
        </div>

        <div className="workspace-grid__item">
          <h3>Clinician Profile</h3>
          <p>Manage clinical credentials, hospital/clinic team affiliation, and review notifications.</p>
          <Link to="/professional/profile" className="workspace-grid__link">
            Clinician Profile &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
