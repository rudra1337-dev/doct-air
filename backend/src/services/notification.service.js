import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  recipient,
  role = 'all',
  title,
  message,
  type = 'general',
  link = null,
  caseId = null,
  conversationId = null,
}) => {
  try {
    const targetUserId = userId || recipient;
    return await Notification.create({
      userId: targetUserId,
      role,
      title,
      message,
      type,
      link,
      caseId,
      conversationId,
    });
  } catch (err) {
    console.warn('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
};

export const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, filter = 'all' } = {}
) => {
  const query = { userId };

  if (filter === 'unread') {
    query.isRead = false;
  } else if (filter === 'clinical') {
    query.type = { $in: ['triage_alert', 'clinical_alert', 'report_published'] };
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page: numericPage,
    limit: numericLimit,
    totalPages: Math.ceil(total / numericLimit) || 1,
  };
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, isRead: false });
};

export const markNotificationAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { returnDocument: 'after' }
  );
};

export const markAllNotificationsAsRead = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

export const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, userId });
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
