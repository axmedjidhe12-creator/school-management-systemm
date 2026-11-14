const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('sms_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

export default apiRequest;
