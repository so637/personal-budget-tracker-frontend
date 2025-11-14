import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

// Create base Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach access token before each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access") || localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Handle automatic token refresh when access token expires
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token expired (HTTP 401 Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No refresh token found");

        // Request new access token
        const res = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh });

        // Save new access token
        localStorage.setItem("access", res.data.access);

        // Retry original request with new token
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
        originalRequest.headers["Authorization"] = `Bearer ${res.data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login"; // redirect to login if refresh fails
      }
    }

    return Promise.reject(error);
  }
);

//
// ==================== API FUNCTIONS ====================
//

// Auth endpoints
export async function login(username, password) {
  const res = await axios.post(`${API_BASE}/api/token/`, { username, password });
  // Save tokens
  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
  return res.data;
}

export async function refreshToken(refresh) {
  const res = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh });
  localStorage.setItem("access", res.data.access);
  return res.data;
}

// Category APIs
export function getCategories() {
  return axiosInstance.get("/api/categories/");
}

// Transaction APIs
export function getTransactions(params = {}) {
  return axiosInstance.get("/api/transactions/", { params });
}

export function createTransaction(payload) {
  return axiosInstance.post("/api/transactions/", payload);
}

export function updateTransaction(id, payload) {
  return axiosInstance.patch(`/api/transactions/${id}/`, payload);
}

export function deleteTransaction(id) {
  return axiosInstance.delete(`/api/transactions/${id}/`);
}

// Budget APIs
export function getBudgets(params = {}) {
  return axiosInstance.get("/api/budgets/", { params });
}

export function createBudget(payload) {
  return axiosInstance.post("/api/budgets/", payload);
}

export function updateBudget(id, payload) {
  return axiosInstance.put(`/api/budgets/${id}/`, payload);
}

export function deleteBudget(id) {
  return axiosInstance.delete(`/api/budgets/${id}/`);
}

// Summary endpoints
export function getTransactionSummary(params = {}) {
  return axiosInstance.get("/api/transactions/global-summary/", { params });
}

export function getBudgetSummary(params = {}) {
  return axiosInstance.get("/api/budgets/global-summary/", { params });
}


export default axiosInstance;
