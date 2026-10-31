import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Heart,
  AlertCircle,
  CheckCircle,
  Save,
  Edit2,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import userService from '../../../services/userService';

export default function PatientProfile() {
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
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    allergies: '',
    chronicConditions: '',
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
          dateOfBirth: u.dateOfBirth || '',
          gender: u.gender || '',
          bloodGroup: u.bloodGroup || '',
          address: u.address || '',
          emergencyName: u.emergencyContact?.name || '',
          emergencyPhone: u.emergencyContact?.phone || '',
          emergencyRelationship: u.emergencyContact?.relationship || '',
          allergies: Array.isArray(u.allergies) ? u.allergies.join(', ') : '',
          chronicConditions: Array.isArray(u.chronicConditions)
            ? u.chronicConditions.join(', ')
            : '',
        });
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load profile');
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
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      bloodGroup: profile.bloodGroup || '',
      address: profile.address || '',
      emergencyName: profile.emergencyContact?.name || '',
      emergencyPhone: profile.emergencyContact?.phone || '',
      emergencyRelationship: profile.emergencyContact?.relationship || '',
      allergies: Array.isArray(profile.allergies) ? profile.allergies.join(', ') : '',
      chronicConditions: Array.isArray(profile.chronicConditions)
        ? profile.chronicConditions.join(', ')
        : '',
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
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        allergies: formData.allergies
          ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        chronicConditions: formData.chronicConditions
          ? formData.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await userService.updateProfile(payload);
      if (res?.user) {
        setProfile(res.user);
        if (typeof refreshUser === 'function') {
          await refreshUser();
        }
        setSuccessMessage('Profile saved successfully');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading patient profile...</p>
      </div>
    );
  }

  const currentUser = profile || authUser || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Patient Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Personal Profile & Clinical Preferences
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/patient/dashboard"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors shadow-sm"
          >
            &larr; Back to Dashboard
          </Link>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
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

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Identity & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-950/50 border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center text-teal-700 dark:text-teal-300 text-3xl font-extrabold mb-4 shadow-inner">
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'P'}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentUser?.name || 'Patient'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              {currentUser?.email || 'patient@doctair.org'}
            </p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 mb-6">
              <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Verified Patient
            </span>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700/60 text-left space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">Phone:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {currentUser?.phone || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">Blood Group:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {currentUser?.bloodGroup || 'Unspecified'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500">Gender / DOB:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {[currentUser?.gender, currentUser?.dateOfBirth].filter(Boolean).join(' • ') || 'Not specified'}
                </span>
              </div>
            </div>

            <div className="w-full pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="button"
                onClick={logout}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Sign Out of Account
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-slate-800/60 border border-teal-200/80 dark:border-slate-700 text-xs leading-relaxed text-teal-900 dark:text-slate-300">
            <strong className="block mb-1 text-teal-950 dark:text-teal-300 font-semibold">
              Clinical Privacy Standard
            </strong>
            Your profile information is only shared with verified medical personnel during an active clinical consultation. Emergency contacts are used for escalation protocols.
          </div>
        </div>

        {/* Right Column: Editable Profile Forms */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Personal Details Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. 124 Health Lane, City"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Escalation Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Emergency Escalation Contact
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. +91 99887 76655"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergencyRelationship"
                    value={formData.emergencyRelationship}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Spouse / Parent"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Baseline Clinical History (Optional)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Known Drug / Food Allergies
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Penicillin, Peanuts (comma separated)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Separate multiple items with commas</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    name="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="e.g. Hypertension, Asthma (comma separated)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Pre-existing diagnosed conditions</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
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
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
