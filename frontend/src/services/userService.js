import { apiGet, apiPut } from './api';

export const userService = {
  getProfile: () => apiGet('/users/profile'),
  updateProfile: (profileData) => apiPut('/users/profile', profileData),
};

export default userService;
