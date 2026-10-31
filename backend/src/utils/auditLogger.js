import AuditLog from '../models/AuditLog.js';

/**
 * Persists an immutable audit log record for security, consent, and clinical actions.
 *
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} [params.userRole]
 * @param {string} params.action - e.g. CONSENT_GIVEN, CASE_SUBMITTED, ASSESSMENT_PUBLISHED
 * @param {string} params.resourceType - e.g. Case, ProfessionalAssessment, MedicalReport
 * @param {string} [params.resourceId]
 * @param {Object} [params.details]
 * @param {Object} [params.req] - Express request for IP address extraction
 * @returns {Promise<Object>} Created audit log record
 */
export const logAuditEvent = async ({
  userId = null,
  userRole = 'ANONYMOUS',
  action,
  resourceType,
  resourceId = null,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    return await AuditLog.create({
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
    });
  } catch (err) {
    // Audit logging should not crash the primary operational request
    console.warn(`[AuditLogger] Failed to write audit event ${action}:`, err.message);
    return null;
  }
};

export default logAuditEvent;
