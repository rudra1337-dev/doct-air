import Case from './models/Case.js';

/**
 * Data access layer for structured Case persistence
 */

export const createCase = async (caseData) => {
  return Case.create(caseData);
};

export const findCaseById = async (id) => {
  return Case.findById(id);
};

export const findCaseByConversationId = async (conversationId) => {
  return Case.findOne({ conversationId });
};

export const findCaseByIdAndPatientId = async (id, patientId) => {
  return Case.findOne({ _id: id, patientId });
};

export const findCasesByPatientId = async (patientId, { limit = 50, sort = { updatedAt: -1 } } = {}) => {
  return Case.find({ patientId }).sort(sort).limit(limit);
};

export const findAllCases = async (query = {}, { limit = 50, sort = { updatedAt: -1 } } = {}) => {
  return Case.find(query).sort(sort).limit(limit);
};

/**
 * Advanced query for professional triage queue with priority ordering, filtering, and search.
 */
export const findQueueCases = async ({
  status = null,
  priority = null,
  search = null,
  limit = 50,
} = {}) => {
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (priority && priority !== 'all') {
    filter['triage.priority'] = priority;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { 'chiefComplaint.text': { $regex: term, $options: 'i' } },
      { 'symptoms.name': { $regex: term, $options: 'i' } },
    ];
  }

  // Fetch cases and sort in memory using clinical priority weight:
  // 1. URGENT, 2. HIGH, 3. NORMAL, 4. INCOMPLETE
  const cases = await Case.find(filter)
    .populate('patientId', 'name email role')
    .sort({ updatedAt: -1 })
    .limit(limit);

  const priorityWeight = {
    URGENT: 1,
    HIGH: 2,
    NORMAL: 3,
    INCOMPLETE: 4,
  };

  return cases.sort((a, b) => {
    const pA = priorityWeight[a.triage?.priority] || 3;
    const pB = priorityWeight[b.triage?.priority] || 3;
    if (pA !== pB) return pA - pB;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
};

/**
 * Aggregates clinical statistics for the professional dashboard.
 */
export const getCaseStats = async () => {
  const [
    totalCases,
    urgentCases,
    highPriority,
    normalPriority,
    incompleteCases,
    queuedCases,
    reviewedCases,
    inProgressCases,
  ] = await Promise.all([
    Case.countDocuments({}),
    Case.countDocuments({ 'triage.priority': 'URGENT' }),
    Case.countDocuments({ 'triage.priority': 'HIGH' }),
    Case.countDocuments({ 'triage.priority': 'NORMAL' }),
    Case.countDocuments({
      $or: [{ 'triage.priority': 'INCOMPLETE' }, { status: 'in_progress' }],
    }),
    Case.countDocuments({ status: { $in: ['queued', 'ready_for_review', 'in_review'] } }),
    Case.countDocuments({ status: { $in: ['reviewed', 'completed'] } }),
    Case.countDocuments({ status: 'in_progress' }),
  ]);

  return {
    totalCases,
    urgentCases,
    highPriority,
    normalPriority,
    incompleteCases,
    pendingReviews: queuedCases,
    completedReviews: reviewedCases,
    inProgressCases,
  };
};

export const updateCaseById = async (id, updateData) => {
  return Case.findByIdAndUpdate(
    id,
    updateData,
    { returnDocument: 'after', runValidators: true }
  );
};

export const deleteCaseById = async (id) => {
  return Case.findByIdAndDelete(id);
};

export default {
  createCase,
  findCaseById,
  findCaseByConversationId,
  findCaseByIdAndPatientId,
  findCasesByPatientId,
  findAllCases,
  findQueueCases,
  getCaseStats,
  updateCaseById,
  deleteCaseById,
};
