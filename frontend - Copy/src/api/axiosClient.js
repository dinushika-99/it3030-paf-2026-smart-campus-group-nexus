import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status !== 401 || originalRequest._retry || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/api/auth/refresh', null, { skipAuthRefresh: true });
      }

      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('smartCampusUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default api;
