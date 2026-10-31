import React, { useState, useEffect } from 'react';
import caseService from '../../../../services/caseService';

export const ACKNOWLEDGEMENT_TEXT =
  'I have personally reviewed and verified the information and clinical recommendations in this report. I am responsible for the assessment and recommendations I am submitting.';

export default function DoctorAssessmentCard({
  caseId,
  isClinician = false,
  onAssessmentPublished,
}) {
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [observations, setObservations] = useState('');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [investigationsText, setInvestigationsText] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [referralRecommended, setReferralRecommended] = useState(false);
  const [referralSpecialty, setReferralSpecialty] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    let isMounted = true;
    setIsLoading(true);

    caseService
      .getAssessment(caseId)
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && res.assessment) {
          const a = res.assessment;
          setAssessment(a);
          setObservations(a.observations || '');
          setClinicalAssessment(a.clinicalAssessment || '');
          setDiagnosis(a.diagnosis || '');
          setInvestigationsText((a.recommendedInvestigations || []).join('\n'));
          setPrescriptions(Array.isArray(a.prescriptions) ? a.prescriptions : []);
          setGeneralAdvice(a.generalAdvice || '');
          setFollowUpInstructions(a.followUpInstructions || '');
          setReferralRecommended(Boolean(a.referral?.recommended));
          setReferralSpecialty(a.referral?.specialty || '');
          setReferralNotes(a.referral?.notes || '');
          setAdditionalNotes(a.additionalNotes || '');
          setIsAcknowledged(Boolean(a.doctorAcknowledgement?.confirmed));
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load clinical assessment.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  // Prescription management
  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleUpdatePrescription = (index, field, value) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const handleRemovePrescription = (index) => {
    setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
  };

  const preparePayload = () => {
    const investigations = investigationsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const validPrescriptions = prescriptions.filter((p) => p.medication && p.medication.trim());

    return {
      observations: observations.trim(),
      clinicalAssessment: clinicalAssessment.trim(),
      diagnosis: diagnosis.trim(),
      recommendedInvestigations: investigations,
      prescriptions: validPrescriptions,
      generalAdvice: generalAdvice.trim(),
      followUpInstructions: followUpInstructions.trim(),
      referral: {
        recommended: referralRecommended,
        specialty: referralSpecialty.trim(),
        notes: referralNotes.trim(),
      },
      additionalNotes: additionalNotes.trim(),
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = preparePayload();
      const res = await caseService.saveDraftAssessment(caseId, payload);
      if (res?.success && res.assessment) {
        setAssessment(res.assessment);
        setSuccessMsg('Clinical assessment draft saved successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save assessment draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Report
  const handlePublish = async () => {
    if (!isAcknowledged) {
      setError('You must confirm the review acknowledgement before publishing.');
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);
      setSuccessMsg(null);

      const payload = preparePayload();
      const res = await caseService.publishAssessment(caseId, {
        confirmed: true,
        statement: ACKNOWLEDGEMENT_TEXT,
      }, payload);

      if (res?.success && res.assessment) {
        setAssessment(res.assessment);
        setSuccessMsg('Official clinical report published and patient notified.');
        if (onAssessmentPublished) onAssessmentPublished(res.assessment);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish clinical assessment.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="case-card">
        <p className="text-xs text-slate-500">Loading clinical assessment...</p>
      </div>
    );
  }

  const isPublished = assessment?.status === 'published';

  // Read-only view for Patients or Published state
  if (!isClinician && !isPublished) {
    return null; // Not visible to patient while still in draft
  }

  if (!isClinician && isPublished) {
    return (
      <div className="case-card border-emerald-200 bg-emerald-50/20 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
              Verified Medical Decision
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Doctor's Final Clinical Assessment & Prescriptions
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            ✓ Published by Clinician
          </span>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div>
            <span className="font-semibold text-slate-900 block mb-1">Attending Clinician:</span>
            <p className="text-slate-600">
              {assessment.professionalName} &bull; Published on{' '}
              {new Date(assessment.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {assessment.diagnosis && (
            <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs">
              <span className="font-semibold text-emerald-800 block mb-1">Physician Diagnosis:</span>
              <p className="text-sm font-bold text-slate-900">{assessment.diagnosis}</p>
            </div>
          )}

          {assessment.clinicalAssessment && (
            <div>
              <span className="font-semibold text-slate-900 block mb-1">Clinical Assessment:</span>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{assessment.clinicalAssessment}</p>
            </div>
          )}

          {Array.isArray(assessment.prescriptions) && assessment.prescriptions.length > 0 && (
            <div>
              <span className="font-semibold text-slate-900 block mb-2">Prescriptions Authored by Physician:</span>
              <div className="space-y-2">
                {assessment.prescriptions.map((rx, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="font-semibold text-slate-900 text-xs">{rx.medication}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rx.dosage && `Dosage: ${rx.dosage} `}
                      {rx.frequency && `• Frequency: ${rx.frequency} `}
                      {rx.duration && `• Duration: ${rx.duration}`}
                    </div>
                    {rx.instructions && (
                      <div className="text-[11px] text-teal-800 bg-teal-50/50 p-2 rounded-lg border border-teal-100 mt-2">
                        <strong>Instructions:</strong> {rx.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {assessment.generalAdvice && (
            <div>
              <span className="font-semibold text-slate-900 block mb-1">General Advice:</span>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{assessment.generalAdvice}</p>
            </div>
          )}

          {assessment.followUpInstructions && (
            <div>
              <span className="font-semibold text-slate-900 block mb-1">Follow-up Instructions:</span>
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{assessment.followUpInstructions}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Clinician Authoring Form
  return (
    <div className="case-card border-teal-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider">
            Physician Final Report
          </span>
          <h2 className="text-base font-bold text-slate-900">
            Doctor's Final Assessment & Prescriptions
          </h2>
        </div>
        {isPublished && (
          <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            ✓ Published & Patient Notified
          </span>
        )}
      </div>

      <div className="p-3.5 mb-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-900 leading-relaxed">
        <strong>Important Healthcare Boundary:</strong> AI only collects and organizes information. Diagnoses,
        investigations, and medications must be authored and verified exclusively by you as the qualified clinician.
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          {successMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Observations */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Clinical Observations
          </label>
          <textarea
            rows={2}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Document physical exam notes, patient presentation, or verified findings..."
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Clinical Assessment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Clinical Assessment
          </label>
          <textarea
            rows={3}
            value={clinicalAssessment}
            onChange={(e) => setClinicalAssessment(e.target.value)}
            placeholder="Your clinical assessment of the patient's symptoms and condition..."
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Clinician-Authored Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Official clinical diagnosis (e.g. Acute Pharyngitis, Type 2 Diabetes)..."
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Recommended Investigations */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Recommended Investigations & Tests (One per line)
          </label>
          <textarea
            rows={2}
            value={investigationsText}
            onChange={(e) => setInvestigationsText(e.target.value)}
            placeholder="e.g. Complete Blood Count (CBC)&#10;Chest X-ray (PA view)&#10;Serum Creatinine"
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
          />
        </div>

        {/* Prescriptions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block">
                Prescription Instructions (Clinician-Authored Only)
              </label>
              <span className="text-[11px] text-slate-500">
                Author official medications, dosing, and patient instructions.
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddPrescription}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-semibold transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Medication</span>
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              No medications added yet. Click &quot;Add Medication&quot; above to author a prescription.
            </p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      Medication #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        Drug / Medicine *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amoxicillin"
                        value={rx.medication}
                        onChange={(e) => handleUpdatePrescription(idx, 'medication', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg"
                        value={rx.dosage}
                        onChange={(e) => handleUpdatePrescription(idx, 'dosage', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        Frequency
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TID / 3x daily"
                        value={rx.frequency}
                        onChange={(e) => handleUpdatePrescription(idx, 'frequency', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7 days"
                        value={rx.duration}
                        onChange={(e) => handleUpdatePrescription(idx, 'duration', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                      Special Administration Instructions / Timing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Take after meals with full glass of water; complete entire prescribed course"
                      value={rx.instructions}
                      onChange={(e) => handleUpdatePrescription(idx, 'instructions', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General Advice & Follow-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              General Patient Advice
            </label>
            <textarea
              rows={2}
              value={generalAdvice}
              onChange={(e) => setGeneralAdvice(e.target.value)}
              placeholder="Lifestyle, hydration, rest, or dietary advice..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Follow-up Instructions
            </label>
            <textarea
              rows={2}
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
              placeholder="Return timing or red-flag warning signs..."
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Specialist Referral Section */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={referralRecommended}
              onChange={(e) => setReferralRecommended(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Recommend Specialist Referral
              </span>
              <span className="text-[11px] text-slate-500 leading-normal block">
                Indicate whether this patient requires formal follow-up or care escalation to a medical specialist.
              </span>
            </div>
          </label>

          {referralRecommended && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 animate-fade-up">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Specialty *
                </label>
                <input
                  type="text"
                  value={referralSpecialty}
                  onChange={(e) => setReferralSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology, Pulmonology, ENT"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Referral Reason & Clinical Notes
                </label>
                <input
                  type="text"
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="e.g. Persistent symptoms require echocardiogram evaluation"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Doctor Review Confirmation Checkbox */}
        <div
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            isAcknowledged
              ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-1 ring-teal-500/20'
              : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
          }`}
          onClick={() => setIsAcknowledged(!isAcknowledged)}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="doctor-acknowledgement-checkbox"
              checked={isAcknowledged}
              onChange={(e) => {
                e.stopPropagation();
                setIsAcknowledged(e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 w-5 h-5 rounded-md border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer flex-shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span aria-hidden="true">🛡️</span> Mandatory Clinician Verification & Responsibility
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isAcknowledged
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isAcknowledged ? '✓ Confirmed by Attending Clinician' : 'Required to Publish'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                &quot;{ACKNOWLEDGEMENT_TEXT}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Draft...' : 'Save Assessment Draft'}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving || isPublishing || !isAcknowledged}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            {isPublishing ? 'Publishing...' : 'Sign & Publish Final Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
