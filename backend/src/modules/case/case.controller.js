import asyncHandler from '../../utils/asyncHandler.js';
import * as caseService from './case.service.js';
import * as caseExtractionService from './case.extraction.service.js';
import * as caseReportService from './case.report.service.js';

/**
 * @route   POST /api/cases OR POST /api/conversations/:conversationId/case
 * @desc    Create or initialize a structured case for a conversation
 * @access  Private (Patient or Clinician)
 */
export const createCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const conversationId = req.params.conversationId || req.body.conversationId;

  const caseDoc = await caseService.createOrInitializeCase({
    conversationId,
    userId,
    userRole,
    initialData: req.body,
  });

  const jsonCase = caseDoc?.toJSON ? caseDoc.toJSON() : { ...caseDoc };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(caseDoc);

  res.status(201).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   GET /api/cases/:id
 * @desc    Get structured case by case ID
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const caseDoc = await caseService.getCaseById({
    caseId,
    userId,
    userRole,
  });

  const jsonCase = caseDoc?.toJSON ? caseDoc.toJSON() : { ...caseDoc };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(caseDoc);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   GET /api/conversations/:conversationId/case OR GET /api/cases/conversation/:conversationId
 * @desc    Get structured case associated with a specific conversation
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getCaseByConversationHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId } = req.params;

  const caseDoc = await caseService.getCaseByConversationId({
    conversationId,
    userId,
    userRole,
  });

  const jsonCase = caseDoc?.toJSON ? caseDoc.toJSON() : { ...caseDoc };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(caseDoc);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   PATCH /api/cases/:id
 * @desc    Update permitted structured fields of a case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const updateCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const updatedCase = await caseService.updateCase({
    caseId,
    userId,
    userRole,
    updateData: req.body,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   PATCH /api/cases/:id/status
 * @desc    Update the lifecycle status of a medical case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const updateCaseStatusHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;
  const { status } = req.body;

  const updatedCase = await caseService.updateCaseStatus({
    caseId,
    userId,
    userRole,
    status,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   POST /api/cases/conversation/:conversationId/extract OR POST /api/conversations/:conversationId/case/extract
 * @desc    Extract clinical facts from conversation messages and merge into Case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const extractCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const conversationId = req.params.conversationId || req.body.conversationId;
  const { messageId } = req.body || {};

  const updatedCase = await caseExtractionService.extractAndMergeCaseForConversation({
    conversationId,
    userId,
    userRole,
    messageId,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   POST /api/cases/conversation/:conversationId/documents/:documentId/extract OR POST /api/conversations/:conversationId/case/documents/:documentId/extract
 * @desc    Extract clinical findings from a processed document and merge into Case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const extractDocumentCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId, documentId } = req.params;

  const updatedCase = await caseExtractionService.extractAndMergeCaseForDocument({
    conversationId,
    userId,
    userRole,
    documentId,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
  });
});

/**
 * @route   GET /api/cases
 * @desc    List structured cases accessible to the authenticated user
 * @access  Private
 */
export const listCasesHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { status, priority, search, q, limit } = req.query;

  const cases = await caseService.listCases({
    userId,
    userRole,
    status,
    priority,
    search: search || q,
    limit: limit ? parseInt(limit, 10) : 50,
  });

  res.status(200).json({
    success: true,
    cases,
  });
});

/**
 * @route   GET /api/cases/:id/completeness
 * @desc    Get completeness and missing information evaluation for a case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getCaseCompletenessHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const result = await caseService.getCaseCompleteness({
    caseId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    caseId: result.caseId,
    completeness: result.completeness,
  });
});

/**
 * @route   GET /api/cases/conversation/:conversationId/follow-up
 * @desc    Get current follow-up question status for a conversation
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getFollowUpStatusHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId } = req.params;

  const result = await caseService.getFollowUpStatus({
    conversationId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/cases/conversation/:conversationId/follow-up/ask
 * @desc    Idempotently ask or retrieve the next follow-up question
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const askFollowUpQuestionHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId } = req.params;

  const result = await caseService.askOrGetFollowUpQuestion({
    conversationId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/cases/conversation/:conversationId/follow-up/answer
 * @desc    Integrate a patient answer to the active follow-up question
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const answerFollowUpQuestionHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId } = req.params;
  const { messageId } = req.body;

  const result = await caseService.integratePatientAnswer({
    conversationId,
    userId,
    userRole,
    messageId,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * @route   POST /api/cases/conversation/:conversationId/report/generate OR POST /api/cases/:id/report/generate
 * @desc    Generate or regenerate a versioned Medical Intake Report for a consultation or case
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const generateReportHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  let conversationId = req.params.conversationId;

  if (!conversationId && req.params.id) {
    const caseDoc = await caseService.getCaseById({
      caseId: req.params.id,
      userId,
      userRole,
    });
    conversationId = caseDoc.conversationId.toString();
  }

  const report = await caseReportService.generateOrRegenerateReport({
    conversationId,
    userId,
    userRole,
  });

  res.status(201).json({
    success: true,
    report,
  });
});

/**
 * @route   GET /api/cases/conversation/:conversationId/report OR GET /api/conversations/:conversationId/case/report
 * @desc    Get the latest Medical Intake Report for a conversation
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getReportByConversationHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId } = req.params;

  const report = await caseReportService.getLatestReportByConversation({
    conversationId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    report,
  });
});

/**
 * @route   GET /api/cases/:id/report
 * @desc    Get the latest Medical Intake Report by case ID
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getReportByCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const report = await caseReportService.getLatestReportByCaseId({
    caseId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    report,
  });
});

/**
 * @route   GET /api/cases/conversation/:conversationId/report/version/:version
 * @desc    Get a specific version of a Medical Intake Report
 * @access  Private (Authorized Patient owner or Clinician)
 */
export const getReportByVersionHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { conversationId, version } = req.params;

  const report = await caseReportService.getReportByVersion({
    conversationId,
    version,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    report,
  });
});

/**
 * @route   POST /api/cases/:id/consent-and-submit
 * @desc    Patient provides explicit consent and submits case to prioritized queue
 * @access  Private (Patient owner)
 */
export const consentAndSubmitCaseHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;
  const { statement } = req.body;

  const updatedCase = await caseService.consentAndSubmitCase({
    caseId,
    userId,
    userRole,
    statement,
    req,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
    message: 'Medical intake report consented and submitted to clinical review queue.',
  });
});

/**
 * @route   PATCH /api/cases/:id/priority
 * @desc    Professional overrides case priority with documented clinical rationale
 * @access  Private (Clinician or Admin)
 */
export const overridePriorityHandler = asyncHandler(async (req, res) => {
  const professionalId = req.user._id || req.user.id;
  const professionalRole = req.user.role;
  const { id: caseId } = req.params;
  const { priority, reason } = req.body;

  const updatedCase = await caseService.overrideCasePriority({
    caseId,
    professionalId,
    professionalRole,
    priority,
    reason,
    req,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
    message: `Case priority successfully updated to ${priority}.`,
  });
});

/**
 * @route   GET /api/cases/stats
 * @desc    Get aggregated clinical statistics for professional workspace
 * @access  Private (Clinician or Admin)
 */
export const getCaseStatsHandler = asyncHandler(async (_req, res) => {
  const stats = await caseService.getCaseStats();
  res.status(200).json({
    success: true,
    stats,
  });
});

/**
 * @route   GET /api/cases/:id/assessment
 * @desc    Get professional assessment for a case
 * @access  Private (Authorized Patient owner if published; Clinician if draft/published)
 */
export const getAssessmentHandler = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const assessment = await caseService.getAssessmentByCaseId({
    caseId,
    userId,
    userRole,
  });

  res.status(200).json({
    success: true,
    assessment: assessment || null,
  });
});

/**
 * @route   POST /api/cases/:id/assessment
 * @desc    Save draft of doctor's clinical assessment
 * @access  Private (Clinician or Admin)
 */
export const saveDraftAssessmentHandler = asyncHandler(async (req, res) => {
  const professionalId = req.user._id || req.user.id;
  const professionalName = req.user.name;
  const userRole = req.user.role;
  const { id: caseId } = req.params;

  const assessment = await caseService.saveDraftAssessment({
    caseId,
    professionalId,
    professionalName,
    userRole,
    assessmentData: req.body,
    req,
  });

  res.status(200).json({
    success: true,
    assessment,
    message: 'Clinical assessment draft saved.',
  });
});

/**
 * @route   POST /api/cases/:id/assessment/publish
 * @desc    Publish final doctor's report with explicit clinician acknowledgement
 * @access  Private (Clinician or Admin)
 */
export const publishAssessmentHandler = asyncHandler(async (req, res) => {
  const professionalId = req.user._id || req.user.id;
  const professionalName = req.user.name;
  const userRole = req.user.role;
  const { id: caseId } = req.params;
  const { acknowledgement, assessmentData } = req.body;

  const assessment = await caseService.publishAssessment({
    caseId,
    professionalId,
    professionalName,
    userRole,
    acknowledgement,
    assessmentData,
    req,
  });

  res.status(200).json({
    success: true,
    assessment,
    message: 'Final clinical assessment verified and published to patient.',
  });
});

/**
 * @route   POST /api/cases/:id/facts/verify
 * @desc    Clinician verifies or confirms an extracted fact
 * @access  Private (Clinician or Admin)
 */
export const verifyFactHandler = asyncHandler(async (req, res) => {
  const professionalId = req.user._id || req.user.id;
  const userRole = req.user.role;
  const { id: caseId } = req.params;
  const { category, factId } = req.body;

  const updatedCase = await caseService.verifyCaseFact({
    caseId,
    professionalId,
    userRole,
    category,
    factId,
    req,
  });

  const jsonCase = updatedCase?.toJSON ? updatedCase.toJSON() : { ...updatedCase };
  jsonCase.completeness = caseService.evaluateCaseCompleteness(updatedCase);

  res.status(200).json({
    success: true,
    case: jsonCase,
    message: 'Clinical fact verified.',
  });
});

export default {
  createCaseHandler,
  getCaseHandler,
  getCaseByConversationHandler,
  listCasesHandler,
  getCaseCompletenessHandler,
  getFollowUpStatusHandler,
  askFollowUpQuestionHandler,
  answerFollowUpQuestionHandler,
  updateCaseHandler,
  updateCaseStatusHandler,
  extractCaseHandler,
  extractDocumentCaseHandler,
  generateReportHandler,
  getReportByConversationHandler,
  getReportByCaseHandler,
  getReportByVersionHandler,
  consentAndSubmitCaseHandler,
  overridePriorityHandler,
  getCaseStatsHandler,
  getAssessmentHandler,
  saveDraftAssessmentHandler,
  publishAssessmentHandler,
  verifyFactHandler,
};
