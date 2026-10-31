import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  Building,
  Save,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';

export default function ProfessionalProfile() {
  const { user: authUser, refreshUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialty: '',
    licenseNumber: '',
    qualifications: '',
    hospitalAffiliation: '',
    department: '',
    yearsOfExperience: '',
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    userService
      .getProfile()
      .then((res) => {
        if (!isMounted) return;
        const u = res?.user || authUser || {};
        setProfile(u);
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          specialty: u.specialty || '',
          licenseNumber: u.licenseNumber || '',
          qualifications: u.qualifications || '',
          hospitalAffiliation: u.hospitalAffiliation || '',
          department: u.department || '',
          yearsOfExperience: u.yearsOfExperience !== null && u.yearsOfExperience !== undefined ? String(u.yearsOfExperience) : '',
        });
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load clinician profile');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (!profile) return;
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      specialty: profile.specialty || '',
      licenseNumber: profile.licenseNumber || '',
      qualifications: profile.qualifications || '',
      hospitalAffiliation: profile.hospitalAffiliation || '',
      department: profile.department || '',
      yearsOfExperience: profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined ? String(profile.yearsOfExperience) : '',
    });
    setIsEditing(false);
    setErrorMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const payload = {
        name: formData.name,
        phone: formData.phone,
        specialty: formData.specialty,
        licenseNumber: formData.licenseNumber,
        qualifications: formData.qualifications,
        hospitalAffiliation: formData.hospitalAffiliation,
        department: formData.department,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : null,
      };

      const res = await userService.updateProfile(payload);
      if (res?.user) {
        setProfile(res.user);
        if (typeof refreshUser === 'function') {
          await refreshUser();
        }
        setSuccessMessage('Clinician profile & credentials updated successfully');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update credentials');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading credentials...</p>
      </div>
    );
  }

  const currentUser = profile || authUser || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Healthcare Professional Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Clinician Profile & Practice Credentials
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/professional/dashboard"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors shadow-sm"
          >
            &larr; Back to Workspace
          </Link>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Credentials</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Clinician Badge Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-950/50 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center text-teal-700 dark:text-teal-300 text-3xl font-extrabold mb-4 shadow-inner">
              {currentUser?.name ? currentUser.name.replace(/^Dr\.?\s+/i, '')[0].toUpperCase() : 'D'}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentUser?.name?.startsWith('Dr') ? currentUser.name : `Dr. ${currentUser?.name || 'Attending Clinician'}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              {currentUser?.email || 'clinician@health.gov.in'}
            </p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Verified Active Clinician
            </span>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700/60 text-left space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">Specialty:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currentUser?.specialty || 'General Medicine'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">License / Reg:</span>
                <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                  {currentUser?.licenseNumber || 'MCI-2024-88492'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">Hospital:</span>
                <span className="font-medium text-slate-900 dark:text-white text-right truncate max-w-[150px]">
                  {currentUser?.hospitalAffiliation || 'District Public Hospital'}
                </span>
              </div>
            </div>

            <div className="w-full pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={logout}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Sign Out of Workspace
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-slate-800/60 border border-teal-200/80 dark:border-slate-700 text-xs leading-relaxed text-teal-900 dark:text-slate-300">
            <strong className="block mb-1 text-teal-950 dark:text-teal-300 font-semibold">
              Clinical Signature Standard
            </strong>
            When publishing verified medical assessments or signing triage determinations, your license number and institution are permanently recorded in the immutable audit log.
          </div>
        </div>

        {/* Right Column: Editable Credentials Form & Quick Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Professional Practice Credentials
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name (with Title)
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Direct Contact Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. +91 98765 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Clinical Specialty
                  </label>
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Internal Medicine, Emergency Care"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Medical Council Reg / License No.
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. NMC-2023-45678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qualifications / Degrees
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. MBBS, MD (General Medicine)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Years of Clinical Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. 12"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Institutional Affiliation & Unit
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hospital / Health Center Name
                  </label>
                  <input
                    type="text"
                    name="hospitalAffiliation"
                    value={formData.hospitalAffiliation}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. All India Institute of Medical Sciences"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Ward
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Outpatient Triage & Emergency"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Credentials...' : 'Save Credentials'}</span>
                </button>
              </div>
            )}
          </form>

          {/* Quick Action Navigation */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Ready to review patients?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch to the live triage queue to assess pre-consultation summaries.
              </p>
            </div>
            <Link
              to="/professional/queue"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
            >
              <span>Go to Triage Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
