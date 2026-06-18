import axios from 'axios';

const DEVICE_ID_KEY = 'lingban:deviceId';
const TOKEN_KEY = 'lingban:token';
const USER_ID_KEY = 'lingban:userId';
const API_BASE_KEY = 'lingban:apiBase';

const defaultApiBase =
  import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:3001' : '');

function getStoredBase() {
  return localStorage.getItem(API_BASE_KEY) || defaultApiBase;
}

export const api = axios.create({
  baseURL: getStoredBase(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export function setApiBase(base: string) {
  localStorage.setItem(API_BASE_KEY, base);
  api.defaults.baseURL = base;
}

export function getApiBase() {
  return api.defaults.baseURL || defaultApiBase;
}

function generateDeviceId() {
  return `lb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, userId: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ID_KEY, String(userId));
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  delete api.defaults.headers.common['Authorization'];
}

// 初始化时如果有 token 就设置上
const token = getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
