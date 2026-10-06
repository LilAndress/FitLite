import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
apiClient.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('fitlite_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.id) {
        const idStr = String(user.id);
        if (typeof config.headers.set === 'function') {
          config.headers.set('X-User-Id', idStr);
        }
        config.headers['X-User-Id'] = idStr;
      }
      if (user.rol) {
        const rolStr = String(user.rol);
        if (typeof config.headers.set === 'function') {
          config.headers.set('X-User-Role', rolStr);
        }
        config.headers['X-User-Role'] = rolStr;
      }
    }
  } catch (err) {
    console.error('Error reading active user for request headers:', err);
  }
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error de conexión con el servidor';
    console.error('API Error:', message, error);
    return Promise.reject(error);
  }
);
