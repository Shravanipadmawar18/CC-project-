/**
 * ===========================================
 * API SERVICE
 * ===========================================
 * 
 * Centralized API configuration using Axios.
 * Handles authentication headers and error handling.
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout for slow connections
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Public routes that don't need auth redirect
const publicRoutes = ['/', '/products', '/categories', '/search'];

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response) {
      const { status, data } = error.response;
      
      // Unauthorized - only redirect for protected routes
      if (status === 401) {
        const currentPath = window.location.pathname;
        const isPublicRoute = publicRoutes.some(route => 
          currentPath === route || currentPath.startsWith('/products/') || currentPath.startsWith('/category/')
        );
        
        // Only clear token and redirect for protected routes
        if (!isPublicRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (currentPath !== '/login') {
            window.location.href = '/login';
          }
        }
      }
      
      // Return error message from server
      return Promise.reject({
        status,
        message: data.message || 'Something went wrong',
        errors: data.errors
      });
    }
    
    // Network error - don't throw, just return error object
    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
        isNetworkError: true
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ===========================================
// API SERVICE FUNCTIONS
// ===========================================

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  logout: () => api.post('/auth/logout')
};

// Product Services
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getFeatured: (limit) => api.get('/products/featured', { params: { limit } }),
  getNewArrivals: (limit) => api.get('/products/new-arrivals', { params: { limit } }),
  getTrending: (limit) => api.get('/products/trending', { params: { limit } }),
  getSimilar: (id, limit) => api.get(`/products/${id}/similar`, { params: { limit } }),
  getReviews: (id) => api.get(`/products/${id}/reviews`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  deleteReview: (id, reviewId) => api.delete(`/products/${id}/reviews/${reviewId}`),
  // Admin
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`)
};

// Category Services
export const categoryService = {
  getCategories: (tree) => api.get('/categories', { params: { tree } }),
  getCategory: (id) => api.get(`/categories/${id}`),
  getCategoryProducts: (id, params) => api.get(`/categories/${id}/products`, { params }),
  // Admin
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// Cart Services
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity = 1) => api.post('/cart', { productId, quantity }),
  updateCartItem: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }),
  removeFromCart: (productId) => api.delete(`/cart/${productId}`),
  clearCart: () => api.delete('/cart'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon')
};

// Order Services
export const orderService = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  trackOrder: (id) => api.get(`/orders/${id}/track`)
};

// Payment Services
export const paymentService = {
  getConfig: () => api.get('/payments/config'),
  createPaymentIntent: (orderId) => api.post('/payments/create-payment-intent', { orderId }),
  confirmPayment: (paymentIntentId, orderId) => api.post('/payments/confirm', { paymentIntentId, orderId })
};

// User Services
export const userService = {
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
  getViewHistory: (limit) => api.get('/users/history', { params: { limit } }),
  clearHistory: () => api.delete('/users/history'),
  getAddresses: () => api.get('/users/addresses'),
  updateAddress: (data) => api.put('/users/addresses', data)
};

// Wishlist Services (alternative namespace)
export const wishlistService = {
  getWishlist: () => api.get('/users/wishlist'),
  addToWishlist: (productId) => api.post(`/users/wishlist/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
  clearWishlist: () => api.delete('/users/wishlist')
};

// Recommendation Services
export const recommendationService = {
  getRecommendations: (limit) => api.get('/recommendations', { params: { limit } }),
  getHomepageRecommendations: () => api.get('/recommendations/homepage'),
  getSimilar: (productId, limit) => api.get(`/recommendations/similar/${productId}`, { params: { limit } }),
  getBoughtTogether: (productId, limit) => api.get(`/recommendations/bought-together/${productId}`, { params: { limit } }),
  getTrending: (limit, period) => api.get('/recommendations/trending', { params: { limit, period } }),
  trackActivity: (data) => api.post('/recommendations/track', data)
};

// Admin Services
export const adminService = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  
  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  getLowStock: () => api.get('/admin/products/low-stock'),
  updateStock: (updates) => api.put('/admin/products/stock', { updates }),
  
  // Categories
  createCategory: (data) => api.post('/admin/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`)
};
