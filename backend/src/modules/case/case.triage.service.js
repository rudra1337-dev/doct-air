/**
 * Safety and Triage Engine
 *
 * Provides transparent, deterministic safety rules and advisory urgency stratification
 * for healthcare professional queue prioritization.
 *
 * DOCTAIR IS NOT AN AI DOCTOR.
 * This engine provides ADVISORY triage recommendations to help organize the clinical queue.
 * It NEVER makes autonomous clinical diagnoses or prescribes medical treatments.
 */

// ── Critical Emergency Warning Patterns (Deterministic Emergency Red Flags) ──
const EMERGENCY_PATTERNS = [
  /\b(chest pain|crushing pain|heart attack|myocardial infarction)\b/i,
  /\b(radiating (to|down) (left arm|jaw|neck|back))\b/i,
  /\b(shortness of breath|difficulty breathing|cannot breathe|dyspnea|gasping|suffocating)\b/i,
  /\b(sudden weakness|facial droop|slurred speech|stroke|hemiparesis|loss of vision)\b/i,
  /\b(coughing (up )?blood|hemoptysis|vomiting blood|hematemesis)\b/i,
  /\b(anaphylaxis|throat (closing|tightening)|lip swelling|tongue swelling)\b/i,
  /\b(unresponsive|loss of consciousness|fainted and won't wake|seizure)\b/i,
  /\b(severe head injury|skull fracture|uncontrolled bleeding)\b/i,
];

// ── High Urgency Patterns ───────────────────────────────────────────────────
const HIGH_URGENCY_PATTERNS = [
  /\b(high fever|fever over 103|fever > 103|temperature 104|temperature 105)\b/i,
  /\b(severe (abdominal|stomach|belly) pain)\b/i,
  /\b(severe headache|worst headache of my life|thunderclap headache)\b/i,
  /\b(stiff neck with fever|meningitis signs)\b/i,
  /\b(inability to keep fluids down|persistent vomiting)\b/i,
  /\b(black tarry stool|melena)\b/i,
  /\b(suicidal|self harm)\b/i,
];

/**
 * Checks if a string contains any recognized emergency red flags.
 * Used for real-time chat warning banners.
 *
 * @param {string} text
 * @returns {{ hasEmergency: boolean, matchedPattern: string|null }}
 */
export const detectEmergencyRedFlagsInText = (text = '') => {
  if (!text || typeof text !== 'string') {
    return { hasEmergency: false, matchedPattern: null };
  }

  for (const pattern of EMERGENCY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        hasEmergency: true,
        matchedPattern: match[0],
      };
    }
  }

  return { hasEmergency: false, matchedPattern: null };
};

/**
 * Evaluates a structured medical case and returns an advisory triage priority
 * with transparent explanations and safety warnings.
 *
 * Priority Categories:
 * - URGENT: Red flag emergency symptoms detected.
 * - HIGH: Significant acute symptoms, abnormal vitals, or severe pain.
 * - NORMAL: Stable, standard symptoms without acute warning flags.
 * - INCOMPLETE: Critical intake information missing (e.g. no chief complaint).
 *
 * @param {Object} caseData - Structured Case object
 * @returns {Object} Triage assessment
 */
export const evaluateTriage = (caseData = {}) => {
  const signals = [];
  const safetyWarnings = [];
  let isEmergencyOverride = false;
  let priority = 'NORMAL';
  let categoryReason = 'Standard clinical consultation. No acute red flag symptoms detected.';

  // 1. Gather all text to inspect (Chief complaint, symptoms, findings)
  const chiefComplaint = caseData.chiefComplaint?.text || '';
  const symptoms = Array.isArray(caseData.symptoms) ? caseData.symptoms : [];
  const vitals = Array.isArray(caseData.vitals) ? caseData.vitals : [];
  const reportFindings = Array.isArray(caseData.reportFindings) ? caseData.reportFindings : [];

  const textCorpus = [
    chiefComplaint,
    ...symptoms.map((s) => `${s.name || ''} ${s.severity || ''} ${s.location || ''}`),
    ...reportFindings.map((f) => `${f.title || ''} ${f.finding || ''}`),
  ].join(' ');

  // 2. Check for Emergency Red Flags (URGENT)
  for (const pattern of EMERGENCY_PATTERNS) {
    const match = textCorpus.match(pattern);
    if (match) {
      signals.push(`Emergency symptom detected: "${match[0]}"`);
      isEmergencyOverride = true;
    }
  }

  // Check symptoms explicitly marked 'severe'
  const severeSymptoms = symptoms.filter((s) => s.severity === 'severe');
  if (severeSymptoms.length > 0) {
    signals.push(
      `Patient reported severe intensity for: ${severeSymptoms.map((s) => s.name).join(', ')}`
    );
  }

  // 3. Inspect Vitals for objective warning signals
  for (const vital of vitals) {
    // Oxygen saturation < 92%
    if (vital.oxygenSaturation) {
      const o2 = parseFloat(vital.oxygenSaturation);
      if (!isNaN(o2) && o2 < 92) {
        signals.push(`Low oxygen saturation: ${vital.oxygenSaturation}% (< 92%)`);
        isEmergencyOverride = true;
      }
    }

    // Blood pressure: Systolic > 180 or < 85
    if (vital.bloodPressure) {
      const match = vital.bloodPressure.match(/^(\d+)\/(\d+)$/);
      if (match) {
        const systolic = parseInt(match[1], 10);
        if (systolic >= 180) {
          signals.push(`Hypertensive crisis range BP: ${vital.bloodPressure}`);
        } else if (systolic < 85) {
          signals.push(`Hypotension risk BP: ${vital.bloodPressure}`);
        }
      }
    }

    // Heart rate > 125 or < 45
    if (vital.heartRate) {
      const hr = parseInt(vital.heartRate, 10);
      if (!isNaN(hr) && (hr > 125 || hr < 45)) {
        signals.push(`Abnormal pulse rate: ${vital.heartRate} bpm`);
      }
    }

    // High temperature > 103°F (or > 39.4°C)
    if (vital.temperature) {
      const temp = parseFloat(vital.temperature);
      if (!isNaN(temp) && (temp > 103 || (temp > 39.4 && temp < 45))) {
        signals.push(`High grade fever: ${vital.temperature}`);
      }
    }
  }

  // 4. Check for High Urgency Patterns (HIGH)
  for (const pattern of HIGH_URGENCY_PATTERNS) {
    const match = textCorpus.match(pattern);
    if (match) {
      signals.push(`High urgency indicator: "${match[0]}"`);
    }
  }

  // 5. Determine Priority Category
  if (isEmergencyOverride) {
    priority = 'URGENT';
    categoryReason = 'Critical urgency signals detected matching deterministic emergency safety protocol.';
    safetyWarnings.push(
      'EMERGENCY WARNING: Patient reported symptoms that may indicate a severe or life-threatening condition. Advise immediate professional evaluation without delay.'
    );
  } else if (
    signals.some((s) => s.includes('High urgency') || s.includes('Hypertensive') || s.includes('High grade') || s.includes('severe intensity'))
  ) {
    priority = 'HIGH';
    categoryReason = 'Acute symptom presentation, high reported severity, or abnormal clinical vitals detected.';
    safetyWarnings.push(
      'Elevated priority recommended. Expedited clinical review advised.'
    );
  } else if (!chiefComplaint || symptoms.length === 0) {
    priority = 'INCOMPLETE';
    categoryReason = 'Intake information is incomplete: chief complaint or symptoms missing.';
  } else {
    priority = 'NORMAL';
    categoryReason = 'Non-emergency symptom presentation. Suitable for standard queue review.';
  }

  return {
    priority,
    signals,
    safetyWarnings,
    categoryReason,
    isEmergencyOverride,
    evaluatedAt: new Date(),
  };
};

export default {
  detectEmergencyRedFlagsInText,
  evaluateTriage,
};
