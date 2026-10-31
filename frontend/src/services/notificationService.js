import { apiGet, apiPatch } from './api';

export const notificationService = {
  getNotifications: () => apiGet('/notifications'),
  markAsRead: (id) => apiPatch(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiPatch('/notifications/read-all', {}),
};

export default notificationService;
