import axios from 'axios';
import { API_BASE } from './runtime';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
