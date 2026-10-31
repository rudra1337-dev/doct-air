import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { MONGO_URI } from '../config/env.js';
import User from '../models/User.js';
import Conversation from '../modules/conversation/models/Conversation.js';
import Message from '../modules/conversation/models/Message.js';
import Document from '../modules/document/models/Document.js';
import Case from '../modules/case/models/Case.js';
import MedicalReport from '../modules/case/models/MedicalReport.js';
import ProfessionalAssessment from '../modules/case/models/ProfessionalAssessment.js';
import Notification from '../models/Notification.js';

export const seedDemoScenarios = async () => {
  console.log('Seeding DoctAir Hackathon Demo Scenarios...');

  if (mongoose.connection.readyState === 0) {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is required to run seed script');
    }
    await mongoose.connect(MONGO_URI);
  }

  // 1. Ensure Standard Demo Accounts Exist
  const patientHash = await bcrypt.hash('Patient123!', 10);
  const doctorHash = await bcrypt.hash('Doctor123!', 10);

  let patient = await User.findOne({ email: 'patient@doctair.org' });
  if (!patient) {
    patient = await User.create({
      name: 'Jane Doe',
      email: 'patient@doctair.org',
      passwordHash: patientHash,
      role: 'PATIENT',
      isActive: true,
    });
  }

  let doctor = await User.findOne({ email: 'dr.chen@doctair.org' });
  if (!doctor) {
    doctor = await User.create({
      name: 'Dr. Sarah Chen, MD',
      email: 'dr.chen@doctair.org',
      passwordHash: doctorHash,
      role: 'PROFESSIONAL',
      isActive: true,
    });
  }

  console.log(`Demo Users: Patient (${patient.email}), Doctor (${doctor.email})`);

  // Clean previous demo conversations for Jane Doe
  const existingConvs = await Conversation.find({ userId: patient._id });
  for (const c of existingConvs) {
    await Message.deleteMany({ conversationId: c._id });
    await Case.deleteMany({ conversationId: c._id });
    await MedicalReport.deleteMany({ conversationId: c._id });
    await ProfessionalAssessment.deleteMany({ conversationId: c._id });
    await Document.deleteMany({ conversationId: c._id });
  }
  await Conversation.deleteMany({ userId: patient._id });
  await Notification.deleteMany({ userId: patient._id });

  // ── Scenario 1: Normal General-Symptom Consultation (Ready for Review) ──
  console.log('Creating Scenario 1: Normal Seasonal Allergies Consultation...');
  const conv1 = await Conversation.create({
    userId: patient._id,
    title: 'Seasonal Allergies & Mild Sinusitis',
    status: 'completed',
    lastMessageAt: new Date(Date.now() - 3600000 * 4),
  });

  const m1_1 = await Message.create({
    conversationId: conv1._id,
    role: 'user',
    content: 'Hi, I have been having itchy eyes, runny nose, and frequent sneezing for the past 4 days.',
    createdAt: new Date(Date.now() - 3600000 * 4),
  });
  const m1_2 = await Message.create({
    conversationId: conv1._id,
    role: 'assistant',
    content: 'Hello Jane. I understand you have been dealing with itchy watery eyes and sneezing for 4 days. How severe are these symptoms, and have you noticed any fever or headache?',
    createdAt: new Date(Date.now() - 3600000 * 3.9),
  });
  const m1_3 = await Message.create({
    conversationId: conv1._id,
    role: 'user',
    content: 'The sneezing is mild to moderate. No fever, no shortness of breath, just clear nasal discharge and mild sinus fullness.',
    createdAt: new Date(Date.now() - 3600000 * 3.8),
  });
  const m1_4 = await Message.create({
    conversationId: conv1._id,
    role: 'assistant',
    content: 'Thank you for clarifying. Are you currently taking any over-the-counter antihistamines or other medications?',
    createdAt: new Date(Date.now() - 3600000 * 3.7),
  });
  const m1_5 = await Message.create({
    conversationId: conv1._id,
    role: 'user',
    content: 'I took one cetirizine tablet yesterday which helped slightly. I have no known drug allergies.',
    createdAt: new Date(Date.now() - 3600000 * 3.6),
  });

  const case1 = await Case.create({
    patientId: patient._id,
    conversationId: conv1._id,
    status: 'ready_for_review',
    chiefComplaint: {
      text: 'Sneezing, itchy watery eyes, and clear nasal discharge for 4 days',
      source: { sourceType: 'patient_report', sourceId: m1_1._id.toString() },
    },
    symptoms: [
      {
        name: 'Sneezing and rhinorrhea',
        severity: 'mild',
        location: 'Nasal passages',
        onset: '4 days ago',
        duration: '4 days',
        status: 'active',
        source: { sourceType: 'patient_report', sourceId: m1_1._id.toString() },
      },
      {
        name: 'Itchy watery eyes',
        severity: 'mild',
        location: 'Ocular bilaterally',
        onset: '4 days ago',
        duration: '4 days',
        status: 'active',
        source: { sourceType: 'patient_report', sourceId: m1_1._id.toString() },
      },
    ],
    onset: { value: '4 days ago', source: { sourceType: 'patient_report' } },
    duration: { value: '4 days', source: { sourceType: 'patient_report' } },
    severity: { value: 'mild', source: { sourceType: 'patient_report' } },
    medications: [
      {
        name: 'Cetirizine',
        dosage: '10 mg',
        frequency: 'As needed',
        status: 'current',
        source: { sourceType: 'patient_report', sourceId: m1_5._id.toString() },
      },
    ],
    allergies: [
      {
        substance: 'No known drug allergies (NKDA)',
        severity: 'mild',
        source: { sourceType: 'patient_report', sourceId: m1_5._id.toString() },
      },
    ],
    processedMessageIds: [m1_1._id, m1_2._id, m1_3._id, m1_4._id, m1_5._id],
    consent: {
      consentGiven: true,
      consentedAt: new Date(Date.now() - 3600000 * 3.5),
      reportVersion: 1,
      statement: 'I have reviewed the information in this report to the best of my knowledge.',
      consentedBy: patient._id,
    },
    triage: {
      priority: 'NORMAL',
      signals: ['Standard seasonal allergic rhinitis presentation', 'No respiratory distress or fever'],
      safetyWarnings: [],
      categoryReason: 'Standard clinical consultation. No acute red flag symptoms detected.',
      isEmergencyOverride: false,
      evaluatedAt: new Date(Date.now() - 3600000 * 3.5),
    },
  });

  // ── Scenario 2: Case Requiring Additional Information (Follow-up) ──
  console.log('Creating Scenario 2: Abdominal Discomfort Requiring Follow-up...');
  const conv2 = await Conversation.create({
    userId: patient._id,
    title: 'Intermittent Abdominal Cramping',
    status: 'active',
    lastMessageAt: new Date(Date.now() - 3600000 * 2),
  });

  const m2_1 = await Message.create({
    conversationId: conv2._id,
    role: 'user',
    content: 'I have been experiencing stomach pain and feeling slightly nauseous.',
    createdAt: new Date(Date.now() - 3600000 * 2),
  });
  const m2_2 = await Message.create({
    conversationId: conv2._id,
    role: 'assistant',
    content: 'I am sorry to hear you are having stomach pain, Jane. When did this abdominal pain first begin, and does it feel constant or does it come and go?',
    createdAt: new Date(Date.now() - 3600000 * 1.9),
  });

  const case2 = await Case.create({
    patientId: patient._id,
    conversationId: conv2._id,
    status: 'in_progress',
    chiefComplaint: {
      text: 'Stomach pain and nausea',
      source: { sourceType: 'patient_report', sourceId: m2_1._id.toString() },
    },
    symptoms: [
      {
        name: 'Abdominal pain',
        severity: 'unspecified',
        location: 'Abdomen unspecified',
        onset: null,
        duration: null,
        status: 'active',
        source: { sourceType: 'patient_report', sourceId: m2_1._id.toString() },
      },
    ],
    missingInformation: [
      {
        category: 'onset',
        description: 'Time or day when abdominal cramping first started',
        importance: 'important',
      },
      {
        category: 'severity',
        description: 'Intensity or severity of abdominal cramping',
        importance: 'important',
      },
    ],
    followUpQuestions: [
      {
        questionKey: 'onset_timing',
        targetField: 'onset',
        category: 'required',
        questionText: 'When did the abdominal discomfort first begin, and is it constant or crampy?',
        status: 'asked',
        askedAt: new Date(Date.now() - 3600000 * 1.9),
      },
    ],
    triage: {
      priority: 'INCOMPLETE',
      signals: ['Missing symptom onset, duration, and pain severity scale'],
      safetyWarnings: ['Intake information incomplete; follow-up questions pending patient response.'],
      categoryReason: 'Intake information is incomplete: timing details missing.',
      isEmergencyOverride: false,
      evaluatedAt: new Date(Date.now() - 3600000 * 1.9),
    },
  });

  // ── Scenario 3: Emergency Warning Signal & Escalation (URGENT) ──
  console.log('Creating Scenario 3: Acute Chest Pain & Shortness of Breath (URGENT)...');
  const conv3 = await Conversation.create({
    userId: patient._id,
    title: 'Acute Severe Chest Pressure',
    status: 'completed',
    lastMessageAt: new Date(Date.now() - 1800000),
  });

  const m3_1 = await Message.create({
    conversationId: conv3._id,
    role: 'user',
    content: 'I have intense crushing chest pain that started 30 minutes ago, radiating down my left arm and I am having trouble breathing.',
    createdAt: new Date(Date.now() - 1800000),
  });
  const m3_2 = await Message.create({
    conversationId: conv3._id,
    role: 'assistant',
    content: '⚠️ **IMMEDIATE ATTENTION RECOMMENDED**: Based on the symptoms described ("crushing chest pain radiating down left arm"), this is a critical medical emergency. Please call emergency services (112) or go to the nearest emergency room immediately.\n\nDo not drive yourself. Sit down in a comfortable position and seek emergency assistance right away.',
    createdAt: new Date(Date.now() - 1750000),
  });

  const case3 = await Case.create({
    patientId: patient._id,
    conversationId: conv3._id,
    status: 'escalated',
    chiefComplaint: {
      text: 'Intense crushing retrosternal chest pain radiating to left arm with dyspnea',
      source: { sourceType: 'patient_report', sourceId: m3_1._id.toString() },
    },
    symptoms: [
      {
        name: 'Crushing chest pain',
        severity: 'severe',
        location: 'Retrosternal radiating to left arm',
        onset: '30 minutes ago',
        duration: '30 minutes',
        status: 'worsening',
        source: { sourceType: 'patient_report', sourceId: m3_1._id.toString() },
      },
      {
        name: 'Shortness of breath / dyspnea',
        severity: 'severe',
        location: 'Respiratory',
        onset: '30 minutes ago',
        duration: '30 minutes',
        status: 'active',
        source: { sourceType: 'patient_report', sourceId: m3_1._id.toString() },
      },
    ],
    onset: { value: '30 minutes ago', source: { sourceType: 'patient_report' } },
    duration: { value: '30 minutes', source: { sourceType: 'patient_report' } },
    severity: { value: 'severe', source: { sourceType: 'patient_report' } },
    vitals: [
      {
        bloodPressure: '168/98',
        heartRate: '112',
        oxygenSaturation: '93',
        source: { sourceType: 'patient_report' },
      },
    ],
    consent: {
      consentGiven: true,
      consentedAt: new Date(Date.now() - 1700000),
      reportVersion: 1,
      statement: 'I understand this is an advisory report and emergency care is needed.',
      consentedBy: patient._id,
    },
    triage: {
      priority: 'URGENT',
      signals: [
        'Emergency symptom detected: "crushing chest pain"',
        'Radiation to left arm detected',
        'Severe acute dyspnea detected',
        'Patient reported severe intensity',
      ],
      safetyWarnings: [
        'EMERGENCY WARNING: Patient reported symptoms that may indicate a severe or life-threatening condition (Acute Coronary Syndrome). Advise immediate emergency transport.',
      ],
      categoryReason: 'Critical urgency signals detected matching deterministic emergency safety protocol.',
      isEmergencyOverride: true,
      evaluatedAt: new Date(Date.now() - 1700000),
    },
  });

  // ── Scenario 4: Uploaded Lab Report & Published Doctor Assessment ──
  console.log('Creating Scenario 4: Type 2 Diabetes Review with Lab Report & Doctor Assessment...');
  const conv4 = await Conversation.create({
    userId: patient._id,
    title: 'Type 2 Diabetes Routine Review with CBC Report',
    status: 'completed',
    lastMessageAt: new Date(Date.now() - 86400000),
  });

  // Synthetic Document Record
  const doc4 = await Document.create({
    userId: patient._id,
    conversationId: conv4._id,
    originalName: 'CBC_Metabolic_Panel.pdf',
    storageKey: `demo_cbc_${Date.now()}.pdf`,
    storagePath: 'uploads/documents/demo_cbc_metabolic.pdf',
    fileSize: 42100,
    mimeType: 'application/pdf',
    status: 'processed',
    extractedText: 'LABORATORY REPORT - METABOLIC & HEMATOLOGY PANEL\nPatient: Jane Doe | Age: 42 | Gender: Female\nHemoglobin: 13.8 g/dL (Reference: 12.0 - 15.5)\nWBC: 6.2 x10^3/uL (Reference: 4.5 - 11.0)\nPlatelets: 245 x10^3/uL (Reference: 150 - 450)\nFasting Blood Glucose: 118 mg/dL (Reference: 70 - 99)\nHbA1c: 6.8% (Target for T2D: < 7.0%)\nSerum Creatinine: 0.85 mg/dL (Reference: 0.6 - 1.2)\neGFR: > 90 mL/min/1.73m2',
    pageCount: 1,
    characterCount: 420,
    processedAt: new Date(Date.now() - 86400000),
  });

  const m4_1 = await Message.create({
    conversationId: conv4._id,
    role: 'user',
    content: 'Here is my latest blood report. I have mild fatigue in the afternoons, otherwise managing my diabetes with diet.',
    attachments: [
      {
        documentId: doc4._id,
        originalName: doc4.originalName,
        fileSize: doc4.fileSize,
      },
    ],
    createdAt: new Date(Date.now() - 86400000),
  });

  const m4_2 = await Message.create({
    conversationId: conv4._id,
    role: 'assistant',
    content: 'Thank you for sharing your CBC and metabolic panel, Jane. I can see your hemoglobin is normal at 13.8 g/dL and your HbA1c is 6.8%, which is within your clinician\'s target range. How long have you experienced the afternoon fatigue?',
    createdAt: new Date(Date.now() - 86350000),
  });

  const case4 = await Case.create({
    patientId: patient._id,
    conversationId: conv4._id,
    status: 'reviewed',
    chiefComplaint: {
      text: 'Routine diabetic follow-up and afternoon fatigue evaluation with attached lab report',
      source: { sourceType: 'patient_report', sourceId: m4_1._id.toString() },
    },
    symptoms: [
      {
        name: 'Afternoon fatigue',
        severity: 'mild',
        location: 'Generalized',
        onset: '3 weeks ago',
        duration: '3 weeks',
        status: 'improving',
        source: { sourceType: 'patient_report', sourceId: m4_1._id.toString() },
      },
    ],
    relevantMedicalHistory: [
      {
        condition: 'Type 2 Diabetes Mellitus',
        diagnosedApprox: '3 years ago',
        status: 'active',
        source: { sourceType: 'patient_report' },
      },
    ],
    medications: [
      {
        name: 'Metformin Hydrochloride',
        dosage: '500 mg',
        frequency: 'Twice daily with meals',
        status: 'current',
        source: { sourceType: 'patient_report' },
      },
    ],
    reportFindings: [
      {
        title: 'Complete Blood Count (CBC) Normal',
        finding: 'Hemoglobin 13.8 g/dL, WBC 6.2 x10^3/uL, Platelets 245 x10^3/uL. No evidence of anemia or acute infection.',
        documentId: doc4._id,
        source: { sourceType: 'document', sourceId: doc4._id.toString() },
      },
      {
        title: 'Glycemic Control (HbA1c & Fasting Glucose)',
        finding: 'HbA1c 6.8% (favorable glycemic control < 7.0%). Fasting blood glucose 118 mg/dL.',
        documentId: doc4._id,
        source: { sourceType: 'document', sourceId: doc4._id.toString() },
      },
      {
        title: 'Renal Function Profile',
        finding: 'Serum creatinine 0.85 mg/dL, eGFR > 90 mL/min/1.73m2. Normal baseline renal clearance.',
        documentId: doc4._id,
        source: { sourceType: 'document', sourceId: doc4._id.toString() },
      },
    ],
    processedMessageIds: [m4_1._id, m4_2._id],
    processedDocumentIds: [doc4._id],
    consent: {
      consentGiven: true,
      consentedAt: new Date(Date.now() - 86000000),
      reportVersion: 1,
      statement: 'I confirm that this summary accurately reflects my consultation and lab panel.',
      consentedBy: patient._id,
    },
    triage: {
      priority: 'NORMAL',
      signals: ['Normal CBC panel', 'Favorable HbA1c 6.8%', 'Mild non-acute fatigue'],
      safetyWarnings: [],
      categoryReason: 'Stable chronic condition review with normal lab parameters.',
      isEmergencyOverride: false,
      evaluatedAt: new Date(Date.now() - 86000000),
    },
  });

  // Official Doctor's Final Assessment & Report (Authored by Dr. Sarah Chen, MD)
  const assessment4 = await ProfessionalAssessment.create({
    caseId: case4._id,
    conversationId: conv4._id,
    patientId: patient._id,
    professionalId: doctor._id,
    professionalName: 'Dr. Sarah Chen, MD',
    professionalTitle: 'Attending Physician, Internal Medicine',
    version: 1,
    status: 'published',
    observations: 'Patient is pleasant, well-hydrated, and motivated. Reviewed recent CBC and metabolic panel from LabCorp. No signs of pallor, respiratory distress, or peripheral edema.',
    clinicalAssessment: 'Excellent glycemic stability on current Metformin monotherapy with HbA1c at 6.8%. Normal hematology confirms mild afternoon fatigue is likely secondary to circadian work schedule rather than anemia or metabolic decompensation.',
    diagnosis: 'Type 2 Diabetes Mellitus, well controlled without microvascular complications. Mild physiological fatigue.',
    recommendedInvestigations: [
      'Repeat Fasting Lipid Panel in 3 months',
      'Annual dilated eye examination (retinopathy screening)',
      'Follow-up HbA1c in 6 months',
    ],
    prescriptions: [
      {
        medication: 'Metformin Hydrochloride',
        dosage: '500 mg',
        frequency: 'Twice daily',
        duration: '90 days (1 refill)',
        instructions: 'Take oral tablet with morning and evening meals.',
      },
      {
        medication: 'Multivitamin with B-Complex',
        dosage: '1 tablet',
        frequency: 'Once daily',
        duration: '60 days',
        instructions: 'Take in the morning with breakfast.',
      },
    ],
    generalAdvice: 'Maintain active physical exercise (30 minutes of brisk walking 5 times weekly). Continue low glycemic index meal planning. Ensure adequate hydration (2.5L water daily) to mitigate afternoon energy lulls.',
    followUpInstructions: 'Routine follow-up in Internal Medicine clinic in 3 months. Contact clinic or visit urgent care if experiencing persistent hyperglycemia (> 200 mg/dL), fever, or dizziness.',
    referral: {
      recommended: false,
      notes: 'No specialist referral indicated at this time. Routine primary care surveillance.',
    },
    additionalNotes: 'Patient counseled on self-monitoring of blood glucose 2-3 times per week fasting.',
    doctorAcknowledgement: {
      confirmed: true,
      timestamp: new Date(Date.now() - 80000000),
      statement: 'I have personally reviewed and verified the information and clinical recommendations in this report. I am responsible for the assessment and recommendations I am submitting.',
    },
    publishedAt: new Date(Date.now() - 80000000),
  });

  // Create notifications for Patient
  await Notification.create({
    userId: patient._id,
    title: 'Dr. Sarah Chen Published Final Assessment',
    message: 'Dr. Sarah Chen, MD has reviewed your consultation and lab report, and published your final medical assessment and prescription.',
    type: 'report_published',
    caseId: case4._id,
    conversationId: conv4._id,
    isRead: false,
    createdAt: new Date(Date.now() - 80000000),
  });

  await Notification.create({
    userId: patient._id,
    title: 'Consultation Escalated to Emergency Priority',
    message: 'Your chest pain consultation has been flagged URGENT. Please seek immediate emergency medical care.',
    type: 'triage_alert',
    caseId: case3._id,
    conversationId: conv3._id,
    isRead: false,
    createdAt: new Date(Date.now() - 1700000),
  });

  console.log('✅ Demo scenarios seeded successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Patient:      patient@doctair.org / Patient123!');
  console.log('  Professional: dr.chen@doctair.org / Doctor123!');
  console.log('--------------------------------------------------');
};

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seedDemoScenarios.js')) {
  seedDemoScenarios()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
