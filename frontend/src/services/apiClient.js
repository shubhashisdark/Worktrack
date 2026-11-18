import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.error?.details?.length) {
    return data.error.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join(' · ');
  }
  return data?.error?.message || data?.message || error?.message || fallback;
}
