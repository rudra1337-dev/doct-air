import asyncHandler from '../../utils/asyncHandler.js';
import * as notificationService from '../../services/notification.service.js';

export const getNotificationsHandler = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  res.status(200).json({
    success: true,
    notifications,
  });
});

export const markNotificationReadHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await notificationService.markNotificationAsRead(id, req.user.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }
  res.status(200).json({
    success: true,
    notification: updated,
  });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user.id);
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
