import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract response data or format errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Error de conexión con el servidor. Verifica tu conexión a internet.';
    let detail = null;
    const status = error.response?.status;

    if (error.response) {
      const data = error.response.data;

      if (status === 401) {
        message = data?.message || 'Tu sesión ha expirado o no has iniciado sesión. Por favor inicia sesión nuevamente.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      } else if (data?.message) {
        message = data.message;
        detail = data.detail || null;
      } else if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        message = first?.msg ? `Error de validación: ${first.msg}` : 'Error de validación en los datos enviados';
        detail = JSON.stringify(data.detail);
      } else {
        message = `Error en el servidor (${status})`;
      }
    } else if (error.request) {
      message = 'No se pudo contactar con el servidor. Por favor intenta de nuevo en unos momentos.';
    }

    const customError = {
      message,
      detail,
      statusCode: status || 500,
    };

    return Promise.reject(customError);
  }
);

export default api;
