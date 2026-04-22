// frontend/lib/api-client.ts
import axios, { AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

let apiClient: AxiosInstance | null = null;

/**
 * Initialize API client with token
 */
export function initializeApiClient(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Add authorization header if token exists
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('agri-market-token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  apiClient = instance;
  return instance;
}

/**
 * Get API client instance
 */
export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    const token = localStorage.getItem('agri-market-token');
    return initializeApiClient(token || undefined);
  }
  return apiClient;
}

/**
 * Set authorization token
 */
export function setAuthToken(token: string): void {
  if (apiClient) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// ============= AUTH ENDPOINTS =============
export const authAPI = {
  login: (email: string, password: string) =>
    getApiClient().post('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; password_confirmation: string; role: string; phone?: string }) =>
    getApiClient().post('/auth/register', data),

  getCurrentUser: () =>
    getApiClient().get('/auth/me'),

  logout: () =>
    getApiClient().post('/auth/logout'),
};

// ============= PRODUCT ENDPOINTS =============
export const productAPI = {
  getMarketplace: (params?: any) =>
    getApiClient().get('/marketplace', { params }),

  searchProducts: (query: string) =>
    getApiClient().get('/marketplace', { params: { search: query } }),

  getProductById: (id: number) =>
    getApiClient().get(`/products/${id}`),

  getProducerProducts: (params?: any) =>
    getApiClient().get('/producer/products', { params }),

  createProduct: (data: any) =>
    getApiClient().post('/producer/products', data),

  updateProduct: (id: number, data: any) =>
    getApiClient().patch(`/producer/products/${id}`, data),

  deleteProduct: (id: number) =>
    getApiClient().delete(`/producer/products/${id}`),
};

// ============= ORDER ENDPOINTS =============
export const orderAPI = {
  getBuyerOrders: (params?: any) =>
    getApiClient().get('/buyer/orders', { params }),

  getProducerOrders: (params?: any) =>
    getApiClient().get('/producer/orders', { params }),

  getOrderById: (id: number) =>
    getApiClient().get(`/orders/${id}`),

  createOrder: (data: any) =>
    getApiClient().post('/buyer/orders', data),

  confirmOrder: (id: number) =>
    getApiClient().patch(`/producer/orders/${id}/confirm`),

  rejectOrder: (id: number) =>
    getApiClient().patch(`/producer/orders/${id}/reject`),

  markOrderReady: (id: number) =>
    getApiClient().patch(`/producer/orders/${id}/ready`),

  rateOrder: (id: number, rating: number, comment?: string) =>
    getApiClient().post(`/buyer/orders/${id}/rate`, { rating, comment }),

  cancelOrder: (id: number) =>
    getApiClient().post(`/buyer/orders/${id}/cancel`),
};

// ============= DELIVERY ENDPOINTS =============
export const deliveryAPI = {
  getRiderDeliveries: (params?: any) =>
    getApiClient().get('/rider/deliveries', { params }),

  getDeliveryById: (id: number) =>
    getApiClient().get(`/rider/deliveries/${id}`),

  confirmPickup: (id: number) =>
    getApiClient().patch(`/rider/deliveries/${id}/pickup`),

  startDelivery: (id: number) =>
    getApiClient().patch(`/rider/deliveries/${id}/start`),

  completeDelivery: (id: number) =>
    getApiClient().patch(`/rider/deliveries/${id}/complete`),

  updateLocation: (id: number, latitude: number, longitude: number, etaMinutes?: number) =>
    getApiClient().patch(`/rider/deliveries/${id}/location`, {
      latitude,
      longitude,
      eta_minutes: etaMinutes,
    }),
};

// ============= ADMIN ENDPOINTS =============
export const adminAPI = {
  getDashboard: () =>
    getApiClient().get('/admin/dashboard'),

  getRecentActivity: (params?: any) =>
    getApiClient().get('/admin/activity', { params }),

  getUsers: (params?: any) =>
    getApiClient().get('/admin/users', { params }),

  verifyUser: (userId: number) =>
    getApiClient().patch(`/admin/users/${userId}/verify`),

  getSalesAnalytics: (params?: any) =>
    getApiClient().get('/admin/sales-analytics', { params }),

  getTopProducers: (params?: any) =>
    getApiClient().get('/admin/top-producers', { params }),

  getPopularProducts: (params?: any) =>
    getApiClient().get('/admin/popular-products', { params }),
};
