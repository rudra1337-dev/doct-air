import ProfessionalAssessment from './models/ProfessionalAssessment.js';
import Case from './models/Case.js';
import { logAuditEvent } from '../../utils/auditLogger.js';
import { createNotification } from '../../services/notification.service.js';

export const DOCTOR_ACKNOWLEDGEMENT_STATEMENT =
  'I have personally reviewed and verified the information and clinical recommendations in this report. I am responsible for the assessment and recommendations I am submitting.';

/**
 * Retrieves the professional assessment associated with a case.
 * Enforces role and authorization constraints:
 * - Patients can only access published assessments for their own cases.
 * - Clinicians and Admins can access draft or published assessments.
 */
export const getAssessmentByCaseId = async ({ caseId, userId, userRole }) => {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'PATIENT' && caseDoc.patientId.toString() !== userId.toString()) {
    const error = new Error('Case not found');
    error.statusCode = 404;
    throw error;
  }

  const query = { caseId };
  if (userRole === 'PATIENT') {
    query.status = 'published';
  }

  const assessment = await ProfessionalAssessment.findOne(query).sort({ version: -1 });
  return assessment;
};

/**
 * Saves or updates a draft professional assessment for a case.
 * Only clinicians or admins may author assessments.
 */
export const saveDraftAssessment = async ({
  caseId,
  professionalId,
  professionalName,
  userRole,
  assessmentData = {},
  req = null,
}) => {
  if (userRole !== 'PROFESSIONAL' && userRole !== 'ADMIN') {
    const error = new Error('Only authorized healthcare professionals may author clinical assessments');
    error.statusCode = 403;
    throw error;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.statusCode = 404;
    throw error;
  }

  let assessment = await ProfessionalAssessment.findOne({ caseId, status: 'draft' });

  if (!assessment) {
    assessment = new ProfessionalAssessment({
      caseId: caseDoc._id,
      conversationId: caseDoc.conversationId,
      patientId: caseDoc.patientId,
      professionalId,
      professionalName: professionalName || 'Attending Clinician',
      status: 'draft',
    });
  }

  // Update clinical fields
  const allowedFields = [
    'observations',
    'clinicalAssessment',
    'diagnosis',
    'recommendedInvestigations',
    'prescriptions',
    'generalAdvice',
    'followUpInstructions',
    'referral',
    'additionalNotes',
    'professionalTitle',
  ];

  for (const field of allowedFields) {
    if (assessmentData[field] !== undefined) {
      assessment[field] = assessmentData[field];
    }
  }

  assessment.professionalId = professionalId;
  if (professionalName) assessment.professionalName = professionalName;

  await assessment.save();

  // If case is queued or ready_for_review, move it to in_review
  if (caseDoc.status === 'queued' || caseDoc.status === 'ready_for_review') {
    caseDoc.status = 'in_review';
    await caseDoc.save();
  }

  await logAuditEvent({
    userId: professionalId,
    userRole,
    action: 'ASSESSMENT_DRAFTED',
    resourceType: 'ProfessionalAssessment',
    resourceId: assessment._id.toString(),
    details: { caseId: caseDoc._id.toString(), version: assessment.version },
    req,
  });

  return assessment;
};

/**
 * Publishes the final professional assessment after clinician explicit acknowledgement.
 */
export const publishAssessment = async ({
  caseId,
  professionalId,
  professionalName,
  userRole,
  acknowledgement = {},
  assessmentData = {},
  req = null,
}) => {
  if (userRole !== 'PROFESSIONAL' && userRole !== 'ADMIN') {
    const error = new Error('Only authorized healthcare professionals may publish clinical assessments');
    error.statusCode = 403;
    throw error;
  }

  if (!acknowledgement?.confirmed) {
    const error = new Error(
      'Professional review confirmation is mandatory before publishing the final report.'
    );
    error.statusCode = 400;
    throw error;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.statusCode = 404;
    throw error;
  }

  let assessment = await ProfessionalAssessment.findOne({ caseId, status: 'draft' });

  if (!assessment) {
    assessment = new ProfessionalAssessment({
      caseId: caseDoc._id,
      conversationId: caseDoc.conversationId,
      patientId: caseDoc.patientId,
      professionalId,
      professionalName: professionalName || 'Attending Clinician',
    });
  }

  // Update fields if provided in publish payload
  const allowedFields = [
    'observations',
    'clinicalAssessment',
    'diagnosis',
    'recommendedInvestigations',
    'prescriptions',
    'generalAdvice',
    'followUpInstructions',
    'referral',
    'additionalNotes',
    'professionalTitle',
  ];

  for (const field of allowedFields) {
    if (assessmentData[field] !== undefined) {
      assessment[field] = assessmentData[field];
    }
  }

  assessment.status = 'published';
  assessment.publishedAt = new Date();
  assessment.professionalId = professionalId;
  if (professionalName) assessment.professionalName = professionalName;
  assessment.doctorAcknowledgement = {
    confirmed: true,
    timestamp: new Date(),
    statement: acknowledgement.statement || DOCTOR_ACKNOWLEDGEMENT_STATEMENT,
  };

  await assessment.save();

  // Update case status to 'reviewed'
  caseDoc.status = 'reviewed';
  await caseDoc.save();

  // Write audit trail
  await logAuditEvent({
    userId: professionalId,
    userRole,
    action: 'ASSESSMENT_PUBLISHED',
    resourceType: 'ProfessionalAssessment',
    resourceId: assessment._id.toString(),
    details: {
      caseId: caseDoc._id.toString(),
      diagnosis: assessment.diagnosis || 'None provided',
      prescriptionsCount: assessment.prescriptions?.length || 0,
    },
    req,
  });

  // Notify patient
  await createNotification({
    userId: caseDoc.patientId,
    title: 'Final Clinical Assessment Available',
    message: `${assessment.professionalName} has published your final medical consultation assessment and recommendations.`,
    type: 'report_published',
    caseId: caseDoc._id,
    conversationId: caseDoc.conversationId,
  });

  return assessment;
};

/**
 * Allows a clinician to verify or correct an extracted clinical fact.
 */
export const verifyCaseFact = async ({
  caseId,
  professionalId,
  userRole,
  category,
  factId,
  req = null,
}) => {
  if (userRole !== 'PROFESSIONAL' && userRole !== 'ADMIN') {
    const error = new Error('Only authorized professionals may verify clinical facts');
    error.statusCode = 403;
    throw error;
  }

  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.statusCode = 404;
    throw error;
  }

  let verified = false;

  const validCategories = ['symptoms', 'vitals', 'relevantMedicalHistory', 'reportFindings', 'medications', 'allergies'];
  if (!validCategories.includes(category)) {
    const error = new Error(`Invalid category for fact verification. Must be one of: ${validCategories.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (Array.isArray(caseDoc[category])) {
    const item = caseDoc[category].id(factId);
    if (item) {
      item.source = {
        sourceType: 'clinician',
        sourceId: professionalId.toString(),
        recordedAt: new Date(),
        confidence: 1.0,
      };
      verified = true;
    }
  }

  if (!verified) {
    const error = new Error(`Fact with ID ${factId} not found in category ${category}`);
    error.statusCode = 404;
    throw error;
  }

  await caseDoc.save();

  await logAuditEvent({
    userId: professionalId,
    userRole,
    action: 'FACT_VERIFIED',
    resourceType: 'Case',
    resourceId: caseDoc._id.toString(),
    details: { category, factId },
    req,
  });

  return caseDoc;
};

export default {
  getAssessmentByCaseId,
  saveDraftAssessment,
  publishAssessment,
  verifyCaseFact,
  DOCTOR_ACKNOWLEDGEMENT_STATEMENT,
};
