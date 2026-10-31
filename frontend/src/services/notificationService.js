import { apiGet, apiPatch, apiDelete } from './api';

export const notificationService = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.filter) query.append('filter', params.filter);
    const queryString = query.toString();
    return apiGet(`/notifications${queryString ? `?${queryString}` : ''}`);
  },
  markAsRead: (id) => apiPatch(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiPatch('/notifications/mark-all-read', {}),
  deleteNotification: (id) => apiDelete(`/notifications/${id}`),
};

export default notificationService;
