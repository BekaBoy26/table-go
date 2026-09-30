import axios from "axios";
import { useStore } from "./store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const GOOGLE_LOGIN_URL = `${API_URL}/auth/google`;

const RETURN_TO_KEY = "tablego:returnTo";

/** Goes to Google sign-in and remembers the current page to come back to. */
export const signInWithGoogle = () => {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, location.pathname + location.search);
  } catch {}
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the API's OAuth route, not a Next.js page
  location.href = GOOGLE_LOGIN_URL;
};

/** The page sign-in started from; only same-site paths, never "//evil.com". */
export const takeReturnTo = () => {
  let path: string | null = null;
  try {
    path = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {}
  return path?.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth/") ? path : "/";
};

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  // an expired session; a wrong password on the sign-in form is a 401 too, but there's no token then
  if (error.response?.status === 401 && useStore.getState().token) useStore.getState().logout();
  return Promise.reject(error);
});
