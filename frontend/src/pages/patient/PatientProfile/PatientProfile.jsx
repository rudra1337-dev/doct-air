import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../PatientDashboard/PatientDashboard.css';

export default function PatientProfile() {
  const { user, logout } = useAuth();
  const [emergencyName, setEmergencyName] = useState('Family Contact');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 98765 43210');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="workspace-view">
      <div className="workspace-view__header">
        <div>
          <span className="workspace-view__eyebrow">Patient Workspace</span>
          <h1 className="workspace-view__title">Patient Profile & Settings</h1>
        </div>
        <Link to="/patient/dashboard" className="btn-secondary text-xs">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 text-3xl font-extrabold mb-3">
            {user?.name ? user.name[0].toUpperCase() : 'P'}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Patient'}</h2>
          <p className="text-xs text-slate-500 mb-3">{user?.email || 'patient@doctair.org'}</p>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider mb-6">
            Verified Patient Account
          </span>

          <div className="w-full pt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={logout}
              className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
            >
              Sign Out of Account
            </button>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="md:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Personal & Emergency Preferences
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            These details are referenced for identity verification and emergency escalation protocols.
          </p>

          {savedSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>Preferences saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || 'Patient User'}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Managed via authentication provider</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'patient@doctair.org'}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm cursor-not-allowed"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone Number
                </label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Data is protected under healthcare privacy standards.
              </span>
              <button
                type="submit"
                className="btn-primary text-xs"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
