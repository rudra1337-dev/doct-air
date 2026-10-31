import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  caseId = null,
  conversationId = null,
}) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      caseId,
      conversationId,
    });
  } catch (err) {
    console.warn('[NotificationService] Failed to create notification:', err.message);
    return null;
  }
};

export const getUserNotifications = async (userId, { limit = 20 } = {}) => {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
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

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
