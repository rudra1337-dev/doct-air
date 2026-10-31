import asyncHandler from '../../utils/asyncHandler.js';
import * as notificationService from '../../services/notification.service.js';

export const getNotificationsHandler = asyncHandler(async (req, res) => {
  const { page, limit, filter } = req.query;
  const result = await notificationService.getUserNotifications(req.user.id, {
    page,
    limit,
    filter,
  });

  res.status(200).json({
    success: true,
    ...result,
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

export const deleteNotificationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await notificationService.deleteNotification(id, req.user.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }
  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});
