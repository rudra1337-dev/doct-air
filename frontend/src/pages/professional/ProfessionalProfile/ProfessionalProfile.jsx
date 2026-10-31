import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../../patient/PatientDashboard/PatientDashboard.css";

export default function ProfessionalProfile() {
  const { user } = useAuth();

  return (
    <div className="workspace-view">
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow" style={{ color: "#0d9488" }}>
            Healthcare Professional Portal
          </span>
          <h1 className="workspace-view__title">Clinician Profile & Credentials</h1>
        </div>
        <Link to="/professional/dashboard" className="btn-ghost">
          &larr; Back to Workspace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Clinician Identity Card */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-teal-700 text-2xl font-bold mb-4 shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : "Dr"}
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-0.5">
            {user?.name || "Dr. Attending Clinician"}
          </h2>
          <span className="text-xs text-slate-500 mb-3">{user?.email || "clinician@health.gov.in"}</span>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified Active Clinician
          </div>

          <div className="w-full pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">User Role:</span>
              <span className="font-semibold text-slate-800">{user?.role || "PROFESSIONAL"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Council Reg No:</span>
              <span className="font-mono font-semibold text-slate-800">MCI-2024-88492</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Affiliation:</span>
              <span className="font-semibold text-slate-800">District Public Hospital</span>
            </div>
          </div>
        </div>

        {/* Credentials & Clinical Practice Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Professional Credentials & Practice Privileges
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-medium block mb-1">Primary Specialty</span>
                <span className="font-bold text-slate-900 text-sm">General Medicine & Acute Care</span>
                <p className="text-[11px] text-slate-500 mt-1">Authorized for ambulatory triage and emergency escalation review.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-medium block mb-1">Issuing Authority</span>
                <span className="font-bold text-slate-900 text-sm">National Medical Commission</span>
                <p className="text-[11px] text-slate-500 mt-1">Verified with digital license status in active standing.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 leading-relaxed">
              <strong className="block mb-1 text-teal-950 font-bold">Clinical Verification Standard:</strong>
              When signing and publishing clinical reports in DoctAir, your name and professional registration are securely stamped onto the patient record. Artificial intelligence acts exclusively as an intake organizing assistant and never makes diagnostic commitments.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Clinical Queue Access</h4>
              <p className="text-xs text-slate-500 mt-0.5">Proceed to review incoming pre-consultation patient summaries.</p>
            </div>
            <Link to="/professional/queue" className="btn-primary text-xs py-2 px-4 shadow-xs">
              Open Triage Queue &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
