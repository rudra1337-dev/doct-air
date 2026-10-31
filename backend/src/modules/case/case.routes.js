import { Router } from 'express';
import {
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
} from './case.controller.js';
import {
  validateCaseIdParam,
  validateConversationIdParam,
  validateCreateCase,
  validateUpdateCase,
  validateUpdateCaseStatus,
  validateDocumentAndConversationParams,
} from './case.validator.js';
import { authenticateUser } from '../../middleware/authMiddleware.js';

const router = Router({ mergeParams: true });

// All case routes require authentication
router.use(authenticateUser);

// Clinical statistics for workspace
router.route('/stats').get(getCaseStatsHandler);

router
  .route('/')
  .get(listCasesHandler)
  .post(validateCreateCase, createCaseHandler);

router
  .route('/conversation/:conversationId')
  .get(validateConversationIdParam, getCaseByConversationHandler);

router
  .route('/conversation/:conversationId/follow-up')
  .get(validateConversationIdParam, getFollowUpStatusHandler);

router
  .route('/conversation/:conversationId/follow-up/ask')
  .post(validateConversationIdParam, askFollowUpQuestionHandler);

router
  .route('/conversation/:conversationId/follow-up/answer')
  .post(validateConversationIdParam, answerFollowUpQuestionHandler);

router
  .route('/conversation/:conversationId/extract')
  .post(validateConversationIdParam, extractCaseHandler);

router
  .route('/conversation/:conversationId/documents/:documentId/extract')
  .post(validateDocumentAndConversationParams, extractDocumentCaseHandler);

// ── Medical Intake Report Endpoints ─────────────────────────────────────────
router
  .route('/conversation/:conversationId/report')
  .get(validateConversationIdParam, getReportByConversationHandler);

router
  .route('/conversation/:conversationId/report/generate')
  .post(validateConversationIdParam, generateReportHandler);

router
  .route('/conversation/:conversationId/report/version/:version')
  .get(validateConversationIdParam, getReportByVersionHandler);

router
  .route('/:id/report')
  .get(validateCaseIdParam, getReportByCaseHandler);

router
  .route('/:id/report/generate')
  .post(validateCaseIdParam, generateReportHandler);

// ── Triage, Consent, Assessment & Review Endpoints ─────────────────────────
router
  .route('/:id/consent-and-submit')
  .post(validateCaseIdParam, consentAndSubmitCaseHandler);

router
  .route('/:id/priority')
  .patch(validateCaseIdParam, overridePriorityHandler);

router
  .route('/:id/assessment')
  .get(validateCaseIdParam, getAssessmentHandler)
  .post(validateCaseIdParam, saveDraftAssessmentHandler);

router
  .route('/:id/assessment/publish')
  .post(validateCaseIdParam, publishAssessmentHandler);

router
  .route('/:id/facts/verify')
  .post(validateCaseIdParam, verifyFactHandler);

router
  .route('/:id')
  .get(validateCaseIdParam, getCaseHandler)
  .patch(validateUpdateCase, updateCaseHandler);

router
  .route('/:id/completeness')
  .get(validateCaseIdParam, getCaseCompletenessHandler);

router
  .route('/:id/status')
  .patch(validateUpdateCaseStatus, updateCaseStatusHandler);

export default router;
