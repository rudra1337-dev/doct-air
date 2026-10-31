import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/User.js';
import Conversation from '../src/modules/conversation/models/Conversation.js';
import Case from '../src/modules/case/models/Case.js';
import ProfessionalAssessment from '../src/modules/case/models/ProfessionalAssessment.js';
import Notification from '../src/models/Notification.js';
import AuditLog from '../src/models/AuditLog.js';
import { evaluateTriage, detectEmergencyRedFlagsInText } from '../src/modules/case/case.triage.service.js';
import * as caseService from '../src/modules/case/case.service.js';

let mongod;
let patientUser;
let doctorUser;
let unauthorizedPatient;
let testConversation;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  patientUser = await User.create({
    name: 'Alice Patient',
    email: 'alice.triage@example.com',
    passwordHash: 'dummy_hash',
    role: 'PATIENT',
    isActive: true,
  });

  unauthorizedPatient = await User.create({
    name: 'Bob Patient',
    email: 'bob.triage@example.com',
    passwordHash: 'dummy_hash',
    role: 'PATIENT',
    isActive: true,
  });

  doctorUser = await User.create({
    name: 'Dr. Evelyn Reed, MD',
    email: 'dr.reed@example.com',
    passwordHash: 'dummy_hash',
    role: 'PROFESSIONAL',
    isActive: true,
  });

  testConversation = await Conversation.create({
    userId: patientUser._id,
    title: 'Triage Evaluation Consultation',
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('Safety, Triage & Professional Assessment Test Suite', async (t) => {
  await t.test('1. detectEmergencyRedFlagsInText catches critical red flag keywords', () => {
    const res1 = detectEmergencyRedFlagsInText('Patient has sudden crushing chest pain radiating to left arm');
    assert.equal(res1.hasEmergency, true);
    assert.ok(res1.matchedPattern);

    const res2 = detectEmergencyRedFlagsInText('Mild headache and sneezing for two days');
    assert.equal(res2.hasEmergency, false);
    assert.equal(res2.matchedPattern, null);
  });

  await t.test('2. evaluateTriage marks emergency case as URGENT with safety warnings', () => {
    const urgentCase = {
      chiefComplaint: { text: 'Crushing chest pain and difficulty breathing' },
      symptoms: [{ name: 'Chest pain', severity: 'severe' }],
      vitals: [{ oxygenSaturation: '89' }],
    };

    const triage = evaluateTriage(urgentCase);
    assert.equal(triage.priority, 'URGENT');
    assert.equal(triage.isEmergencyOverride, true);
    assert.ok(triage.safetyWarnings.length > 0);
    assert.match(triage.safetyWarnings[0], /EMERGENCY WARNING/);
  });

  await t.test('3. evaluateTriage assigns HIGH priority for acute vitals or severe non-emergency symptoms', () => {
    const highCase = {
      chiefComplaint: { text: 'High grade fever with severe stomach pain' },
      symptoms: [{ name: 'Stomach pain', severity: 'severe' }],
      vitals: [{ bloodPressure: '185/105' }],
    };

    const triage = evaluateTriage(highCase);
    assert.equal(triage.priority, 'HIGH');
    assert.equal(triage.isEmergencyOverride, false);
  });

  await t.test('4. evaluateTriage assigns NORMAL for standard non-acute symptoms and INCOMPLETE if empty', () => {
    const normalCase = {
      chiefComplaint: { text: 'Mild sore throat and runny nose' },
      symptoms: [{ name: 'Sore throat', severity: 'mild' }],
    };
    assert.equal(evaluateTriage(normalCase).priority, 'NORMAL');

    const emptyCase = { chiefComplaint: null, symptoms: [] };
    assert.equal(evaluateTriage(emptyCase).priority, 'INCOMPLETE');
  });

  await t.test('5. Patient explicit consent transitions case to ready_for_review and logs audit trail', async () => {
    const newCase = await Case.create({
      patientId: patientUser._id,
      conversationId: testConversation._id,
      status: 'in_progress',
      chiefComplaint: { text: 'Persistent dry cough for 5 days' },
      symptoms: [{ name: 'Cough', severity: 'mild', duration: '5 days', onset: '5 days ago' }],
      onset: { value: '5 days ago' },
      duration: { value: '5 days' },
      severity: { value: 'mild' },
    });

    const submitted = await caseService.consentAndSubmitCase({
      caseId: newCase._id.toString(),
      userId: patientUser._id.toString(),
      userRole: 'PATIENT',
      statement: 'I explicitly confirm this medical intake is accurate to my knowledge.',
    });

    assert.equal(submitted.consent.consentGiven, true);
    assert.ok(submitted.consent.consentedAt);
    assert.equal(submitted.triage.priority, 'NORMAL');
    assert.equal(submitted.status, 'ready_for_review');

    // Verify audit log was recorded
    const audit = await AuditLog.findOne({
      resourceId: newCase._id.toString(),
      action: 'CONSENT_AND_SUBMIT',
    });
    assert.ok(audit, 'Audit log was created');
    assert.equal(audit.userId.toString(), patientUser._id.toString());

    // Verify notification was sent
    const notif = await Notification.findOne({
      userId: patientUser._id,
      type: 'case_update',
    });
    assert.ok(notif, 'Notification was created');
  });

  await t.test('6. Clinician can override priority with mandatory clinical reason', async () => {
    const caseDoc = await Case.findOne({ conversationId: testConversation._id });

    // Missing reason must be rejected
    await assert.rejects(
      async () => {
        await caseService.overrideCasePriority({
          caseId: caseDoc._id.toString(),
          professionalId: doctorUser._id.toString(),
          professionalRole: 'PROFESSIONAL',
          priority: 'HIGH',
          reason: '',
        });
      },
      { statusCode: 400 }
    );

    // Valid override succeeds
    const overridden = await caseService.overrideCasePriority({
      caseId: caseDoc._id.toString(),
      professionalId: doctorUser._id.toString(),
      professionalRole: 'PROFESSIONAL',
      priority: 'HIGH',
      reason: 'Patient has underlying chronic COPD; elevated priority warranted.',
    });

    assert.equal(overridden.triage.priority, 'HIGH');
    assert.equal(overridden.triage.overrideReason, 'Patient has underlying chronic COPD; elevated priority warranted.');
    assert.equal(overridden.triage.overrideBy.toString(), doctorUser._id.toString());
  });

  await t.test('7. Clinician saves draft assessment and patient cannot view until published', async () => {
    const caseDoc = await Case.findOne({ conversationId: testConversation._id });

    // Doctor saves draft
    const draft = await caseService.saveDraftAssessment({
      caseId: caseDoc._id.toString(),
      professionalId: doctorUser._id.toString(),
      professionalName: doctorUser.name,
      userRole: 'PROFESSIONAL',
      assessmentData: {
        observations: 'Clear lung sounds bilaterally. Patient in no acute distress.',
        clinicalAssessment: 'Subacute post-viral bronchitis.',
        diagnosis: 'Acute Bronchitis, uncomplicated',
        recommendedInvestigations: ['Chest X-ray if symptoms persist past 14 days'],
        prescriptions: [
          {
            medication: 'Dextromethorphan HBr',
            dosage: '15 mg',
            frequency: 'Every 6 hours as needed',
            duration: '5 days',
            instructions: 'Take with plenty of water',
          },
        ],
        generalAdvice: 'Rest, increase oral hydration, use a cool-mist humidifier.',
      },
    });

    assert.equal(draft.status, 'draft');
    assert.equal(draft.diagnosis, 'Acute Bronchitis, uncomplicated');

    // Patient attempts to fetch draft assessment -> must return null
    const patientView = await caseService.getAssessmentByCaseId({
      caseId: caseDoc._id.toString(),
      userId: patientUser._id.toString(),
      userRole: 'PATIENT',
    });
    assert.equal(patientView, null, 'Draft assessment must be invisible to patient');
  });

  await t.test('8. Doctor publishes assessment with mandatory acknowledgement and notifies patient', async () => {
    const caseDoc = await Case.findOne({ conversationId: testConversation._id });

    // Attempting publish without acknowledgement is rejected
    await assert.rejects(
      async () => {
        await caseService.publishAssessment({
          caseId: caseDoc._id.toString(),
          professionalId: doctorUser._id.toString(),
          professionalName: doctorUser.name,
          userRole: 'PROFESSIONAL',
          acknowledgement: { confirmed: false },
        });
      },
      { statusCode: 400 }
    );

    // Publishing with acknowledgement succeeds
    const published = await caseService.publishAssessment({
      caseId: caseDoc._id.toString(),
      professionalId: doctorUser._id.toString(),
      professionalName: doctorUser.name,
      userRole: 'PROFESSIONAL',
      acknowledgement: {
        confirmed: true,
        statement: 'I have personally reviewed and verified the information and clinical recommendations in this report.',
      },
    });

    assert.equal(published.status, 'published');
    assert.ok(published.publishedAt);
    assert.equal(published.doctorAcknowledgement.confirmed, true);

    // Case status transitions to reviewed
    const updatedCase = await Case.findById(caseDoc._id);
    assert.equal(updatedCase.status, 'reviewed');

    // Patient can now view the published assessment
    const patientView = await caseService.getAssessmentByCaseId({
      caseId: caseDoc._id.toString(),
      userId: patientUser._id.toString(),
      userRole: 'PATIENT',
    });
    assert.ok(patientView);
    assert.equal(patientView.diagnosis, 'Acute Bronchitis, uncomplicated');

    // Patient received notification
    const reportNotif = await Notification.findOne({
      userId: patientUser._id,
      type: 'report_published',
    });
    assert.ok(reportNotif, 'Patient received report published notification');
  });

  await t.test('9. Clinician can verify an extracted fact and update source attribution', async () => {
    const caseDoc = await Case.findOne({ conversationId: testConversation._id });
    const symptomId = caseDoc.symptoms[0]._id.toString();

    const verifiedCase = await caseService.verifyCaseFact({
      caseId: caseDoc._id.toString(),
      professionalId: doctorUser._id.toString(),
      userRole: 'PROFESSIONAL',
      category: 'symptoms',
      factId: symptomId,
    });

    const verifiedSymptom = verifiedCase.symptoms.id(symptomId);
    assert.equal(verifiedSymptom.source.sourceType, 'clinician');
    assert.equal(verifiedSymptom.source.sourceId, doctorUser._id.toString());
    assert.equal(verifiedSymptom.source.confidence, 1.0);
  });
});
