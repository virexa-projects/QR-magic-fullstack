import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

// ─── Axios instance ──────────────────────────────────────────────────────────
// withCredentials=true → httpOnly cookies (accessToken / refreshToken) are
// sent automatically on every request — no JS token storage needed.
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send & receive httpOnly cookies
});

// ─── Request interceptor ─────────────────────────────────────────────────────
// The backend also returns the accessToken in the response body for cases
// where the Authorization header is needed (e.g. mobile / non-cookie clients).
// We store it in a module-level variable (memory only — never localStorage).
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Response interceptor — silent refresh on 401 ────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  );
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = original?.url || "";
    const status = error.response?.status;

    // Ignore unauthenticated startup requests
    if (
      status === 401 &&
      (
        requestUrl.includes("/auth/me") ||
        requestUrl.includes("/auth/refresh")
      )
    ) {
      setAccessToken(null);
      return Promise.reject(error);
    }

    // Ignore auth endpoints
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/google") ||
      requestUrl.includes("/auth/refresh");

    // Try refresh only for protected APIs
    if (
      status === 401 &&
      !original._retry &&
      !isAuthEndpoint
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers) {
            original.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(original);
        });
      }

      isRefreshing = true;

      try {
        // Cookie-based refresh — refreshToken cookie is sent automatically
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken: string = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);

        if (original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        // Prevent infinite redirect loops if we are already on public auth pages
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register") &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/login?sessionExpired=true";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const api = apiClient; // Exporting as 'api' for backward compatibility with our slices
export default apiClient;