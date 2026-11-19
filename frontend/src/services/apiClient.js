import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('worktrack_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore if localStorage is restricted
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.error?.details?.length) {
    return data.error.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join(' · ');
  }
  return data?.error?.message || data?.message || error?.message || fallback;
}
