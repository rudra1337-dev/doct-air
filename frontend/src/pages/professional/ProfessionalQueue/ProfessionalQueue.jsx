import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import caseService from "../../../services/caseService";
import PriorityBadge from "../../../components/common/PriorityBadge";
import StatusBadge from "../../case/CaseReview/components/StatusBadge";
import "../../patient/PatientDashboard/PatientDashboard.css";

export default function ProfessionalQueue() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await caseService.listCases({
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res?.success && Array.isArray(res.cases)) {
        setCases(res.cases);
      } else {
        setCases([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load clinical intake queue.");
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter, statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQueue();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadQueue]);

  return (
    <div className="workspace-view">
      {/* Header */}
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow" style={{ color: "#0d9488" }}>
            Healthcare Professional Portal
          </span>
          <h1 className="workspace-view__title">Clinical Triage & Intake Queue</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadQueue} className="btn-ghost text-xs">
            ↻ Refresh Queue
          </button>
          <Link to="/professional/dashboard" className="btn-ghost text-xs">
            &larr; Workspace
          </Link>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 text-xs text-teal-900 flex items-center justify-between gap-4 mb-6 shadow-xs">
        <span>
          <strong>Advisory Triage Order:</strong> Cases are prioritized by clinical urgency signals (URGENT &rarr; HIGH &rarr; NORMAL &rarr; INCOMPLETE) to support timely professional assessment.
        </span>
        <span className="shrink-0 text-teal-700 font-bold">{cases.length} cases in queue</span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by patient name, chief complaint, or symptoms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
          />
        </div>

        {/* Priority Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar touch-scroll overscroll-contain">
          {[
            { id: "all", label: "All Priorities" },
            { id: "URGENT", label: "Urgent" },
            { id: "HIGH", label: "High" },
            { id: "NORMAL", label: "Normal" },
            { id: "INCOMPLETE", label: "Incomplete" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPriorityFilter(tab.id)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                priorityFilter === tab.id
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "All Statuses" },
            { id: "ready_for_review", label: "Pending" },
            { id: "in_review", label: "In Review" },
            { id: "reviewed", label: "Reviewed" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Content */}
      {isLoading ? (
        <div className="workspace-placeholder-box">
          <div className="case-spinner" aria-hidden="true" />
          <h2 className="mt-4">Loading clinical triage queue...</h2>
        </div>
      ) : error ? (
        <div className="workspace-placeholder-box">
          <h2 className="text-rose-600 font-bold">Failed to load queue</h2>
          <p>{error}</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="workspace-placeholder-box">
          <h2>No cases match the selected triage filters.</h2>
          <p>Incoming patient consultations submitted for clinical review will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const caseId = c.id || c._id;
            const patientName = c.patientId?.name || "Patient Consultation";
            const patientEmail = c.patientId?.email || "";
            const priority = c.triage?.priority || "NORMAL";
            const isUrgent = priority === "URGENT";
            const isHigh = priority === "HIGH";
            const missingCount = c.missingInformation?.length || 0;

            return (
              <div
                key={caseId}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-xs ${
                  isUrgent
                    ? "border-rose-300 bg-rose-50/70 hover:bg-rose-50/90 hover:shadow-orbital-md hover:-translate-y-1.5"
                    : isHigh
                    ? "border-amber-300 bg-amber-50/50 hover:bg-amber-50/70 hover:shadow-orbital-md hover:-translate-y-1.5"
                    : "border-slate-200/90 bg-white/90 hover:border-teal-300/80 hover:bg-white hover:shadow-orbital-md hover:-translate-y-1.5"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <PriorityBadge priority={priority} isEmergency={c.triage?.isEmergencyOverride} />
                    <StatusBadge status={c.status} />
                    <span className="text-sm font-bold text-slate-900">{patientName}</span>
                    {patientEmail && <span className="text-xs text-slate-500 font-mono">({patientEmail})</span>}
                    <span className="text-xs text-slate-500 font-mono">ID: {caseId.slice(-6)}</span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                    {c.chiefComplaint?.text || "Consultation Intake Summary"}
                  </h3>

                  {c.triage?.categoryReason && (
                    <p className="text-xs text-slate-500 mb-2 italic">
                      Triage Rationale: {c.triage.categoryReason}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span>
                      <strong className="text-slate-800">Symptoms:</strong> {c.symptoms?.length || 0} reported
                    </span>
                    <span>
                      <strong className="text-slate-800">Findings:</strong> {c.reportFindings?.length || 0} documents
                    </span>
                    {missingCount > 0 && (
                      <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⚠ {missingCount} missing item{missingCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span>
                      <strong className="text-slate-800">Updated:</strong>{" "}
                      {new Date(c.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/professional/cases/${caseId}`}
                    className={`text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                      isUrgent
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 hover:-translate-y-0.5 hover:shadow-md"
                        : "btn-primary"
                    }`}
                  >
                    <span>Open Case Review</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
