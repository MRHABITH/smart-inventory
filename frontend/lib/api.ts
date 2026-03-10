import axios, { AxiosInstance, AxiosError } from "axios";
import { useStore } from "@/store/useStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});


// ─── REQUEST INTERCEPTOR (Attach Token) ─────────────────────────

api.interceptors.request.use((config) => {
  const token = useStore.getState().access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ─── RESPONSE INTERCEPTOR (Auto Refresh Token) ───────────────────

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refresh_token, setAuth, clearAuth } = useStore.getState();

      if (!refresh_token) {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {

        const res = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          { refresh_token }
        );

        const { access_token, refresh_token: new_refresh, user } = res.data;

        setAuth(user, access_token, new_refresh);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);

      } catch (refreshError) {

        clearAuth();
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


// ───────────────── AUTH ─────────────────

export const authAPI = {

  register: (data: {
    company_name: string
    full_name: string
    email: string
    password: string
  }) =>
    api.post("/auth/register", data),

  login: (data: {
    email: string
    password: string
  }) =>
    api.post("/auth/login", data),

  me: () => api.get("/auth/me"),

};


// ───────────────── DASHBOARD ─────────────────

export const dashboardAPI = {
  get: () => api.get("/dashboard"),
};


// ───────────────── PRODUCTS ─────────────────

export const productsAPI = {

  list: (params?: any) =>
    api.get("/products", { params }),

  get: (id: string) =>
    api.get(`/products/${id}`),

  create: (data: any) =>
    api.post("/products", data),

  update: (id: string, data: any) =>
    api.put(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),

};


// ───────────────── WAREHOUSES ─────────────────

export const warehousesAPI = {

  list: () =>
    api.get("/warehouses"),

  create: (data: any) =>
    api.post("/warehouses", data),

  update: (id: string, data: any) =>
    api.put(`/warehouses/${id}`, data),

  delete: (id: string) =>
    api.delete(`/warehouses/${id}`),

};


// ───────────────── INVENTORY ─────────────────

export const inventoryAPI = {

  list: (params?: any) =>
    api.get("/inventory", { params }),

  movements: (params?: any) =>
    api.get("/inventory/movements", { params }),

  stockIn: (data: any) =>
    api.post("/inventory/stock-in", data),

  stockOut: (data: any) =>
    api.post("/inventory/stock-out", data),

  transfer: (data: any) =>
    api.post("/inventory/transfer", data),

  deleteItem: (id: string) =>
    api.delete(`/inventory/${id}`),

  deleteMovement: (id: string) =>
    api.delete(`/inventory/movements/${id}`),

};


// ───────────────── ALERTS ─────────────────

export const alertsAPI = {

  list: (params?: any) =>
    api.get("/alerts", { params }),

  markRead: (ids: string[]) =>
    api.post("/alerts/mark-read", { alert_ids: ids }),

  markAllRead: () =>
    api.post("/alerts/mark-all-read"),

};


// ───────────────── REPORTS ─────────────────

export const reportsAPI = {

  inventoryValuation: (format?: string) =>
    api.get("/reports/inventory-valuation", {
      params: { format },
      responseType: format !== "json" ? "blob" : "json",
    }),

  stockMovement: (days?: number, format?: string) =>
    api.get("/reports/stock-movement", {
      params: { days, format },
      responseType: format !== "json" ? "blob" : "json",
    }),

  warehouseStock: (format?: string) =>
    api.get("/reports/warehouse-stock", {
      params: { format },
      responseType: format !== "json" ? "blob" : "json",
    }),

};


// ───────────────── AI ─────────────────

export const aiAPI = {

  generateDescription: (data: any) =>
    api.post("/ai/product-description", data),

  getInsights: () =>
    api.get("/ai/inventory-insights"),

  chat: (data: { message: string; history: any[] }) =>
    api.post("/ai/chat", data),

  demandForecast: (data: {
    product_id: string
    days_ahead?: number
  }) =>
    api.post("/ai/demand-forecast", data),

};