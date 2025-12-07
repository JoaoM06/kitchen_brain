import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const BASE_URL = "http://192.168.183.179:8000";
export const AUTH_KEY = "auth_token";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

let tokenCache = null;

export async function setAuthToken(token) {
  tokenCache = token;
  if (token) {
    await SecureStore.setItemAsync(AUTH_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    await SecureStore.deleteItemAsync(AUTH_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export async function loadStoredToken() {
  const stored = await SecureStore.getItemAsync(AUTH_KEY);
  if (stored) {
    tokenCache = stored;
    api.defaults.headers.common.Authorization = `Bearer ${stored}`;
  }
  return stored;
}

api.interceptors.request.use(
  (config) => {
    const token = tokenCache;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

export default api;