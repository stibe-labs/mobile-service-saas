// ─── API Client ────────────────────────────────────────
// Centralized fetch wrapper for all backend API calls.
// Handles JWT tokens, error responses, and base URL.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  // Get JWT token from localStorage
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Set JWT token
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Remove JWT token
  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Save user data
  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Get saved user data
  getUser() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  // Core fetch method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const config = {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Don't stringify body if it's already a string or FormData
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle auth errors
        if (response.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        throw { status: response.status, ...data };
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw { status: 500, error: 'Network error. Please check your connection.' };
    }
  }

  // HTTP method shortcuts
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // ─── AUTH (Flow 1) ──────────────────────────────────
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  logout() {
    this.removeToken();
  }

  getProfile() {
    return this.get('/auth/me');
  }

  // ─── SUPER ADMIN (Flow 2/2A) ───────────────────────
  getAdminDashboard() {
    return this.get('/admin/dashboard');
  }

  getTenants() {
    return this.get('/admin/tenants');
  }

  createTenant(data) {
    return this.post('/admin/tenants', data);
  }

  updateTenant(id, data) {
    return this.patch(`/admin/tenants/${id}`, data);
  }

  setTenantMaxBranches(tenantId, maxBranches) {
    return this.patch(`/admin/tenants/${tenantId}/max-branches`, { maxBranches });
  }

  setTenantMaxTechnicians(tenantId, maxTechnicians) {
    return this.patch(`/admin/tenants/${tenantId}/max-technicians`, { maxTechnicians });
  }

  getUsers() {
    return this.get('/admin/users');
  }

  resetTenantPassword(tenantId, newPassword, userId) {
    return this.post(`/admin/tenants/${tenantId}/reset-password`, { newPassword, userId });
  }

  getTenantToggles(tenantId) {
    return this.get(`/admin/tenants/${tenantId}/toggles`);
  }

  updateTenantToggles(tenantId, toggles) {
    return this.patch(`/admin/tenants/${tenantId}/toggles`, toggles);
  }

  getTenantTechnicians(tenantId, branchId) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.get(`/admin/tenants/${tenantId}/technicians${query}`);
  }

  getTenantServices(tenantId, branchId) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.get(`/admin/tenants/${tenantId}/services${query}`);
  }

  getTenantBranches(tenantId) {
    return this.get(`/admin/tenants/${tenantId}/branches`);
  }

  // ─── Tenant Admin (Branches) ───
  getBranches() {
    return this.get('/tenant/branches');
  }

  createBranch(data) {
    return this.post('/tenant/branches', data);
  }

  updateBranch(id, data) {
    return this.patch(`/tenant/branches/${id}`, data);
  }

  deleteBranch(id) {
    return this.delete(`/tenant/branches/${id}`);
  }

  // ─── DASHBOARD (Flow 3) ────────────────────────────
  getDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/dashboard${query ? '?' + query : ''}`);
  }

  // ─── SERVICES (Flow 3/4/5) ─────────────────────────
  getServices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/services${query ? '?' + query : ''}`);
  }

  getService(id) {
    return this.get(`/services/${id}`);
  }

  createService(data) {
    return this.post('/services', data);
  }

  updateService(id, data) {
    return this.patch(`/services/${id}`, data);
  }

  updateServiceStatus(id, status, cancellationReason) {
    return this.patch(`/services/${id}/status`, { status, cancellationReason });
  }

  addServicePart(serviceId, data) {
    return this.post(`/services/${serviceId}/parts`, data);
  }

  removeServicePart(serviceId, partId) {
    return this.delete(`/services/${serviceId}/parts/${partId}`);
  }

  addServiceNote(serviceId, noteType, content) {
    return this.post(`/services/${serviceId}/notes`, { noteType, content });
  }

  getServiceHistory(serviceId) {
    return this.get(`/services/${serviceId}/history`);
  }

  getJobCardPrint(serviceId) {
    return this.get(`/services/${serviceId}/print/jobcard`);
  }

  getReceiptPrint(serviceId) {
    return this.get(`/services/${serviceId}/print/receipt`);
  }

  // ─── SEARCH (Flow 6) ──────────────────────────────
  search(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/search${query ? '?' + query : ''}`);
  }

  // ─── PARTS (Flow 7) ──────────────────────────────
  getParts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/parts${query ? '?' + query : ''}`);
  }

  createPart(data) {
    return this.post('/parts', data);
  }

  updatePart(id, data) {
    return this.patch(`/parts/${id}`, data);
  }

  deletePart(id) {
    return this.delete(`/parts/${id}`);
  }

  // ─── MODELS (Flow 8) ─────────────────────────────
  getBrands(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/models/brands${query ? '?' + query : ''}`);
  }

  createBrand(name, branchId) {
    return this.post('/models/brands', { name, branchId });
  }

  getBrandModels(brandId) {
    return this.get(`/models/brands/${brandId}/models`);
  }

  createModel(brandId, name, branchId) {
    return this.post(`/models/brands/${brandId}/models`, { name, branchId });
  }

  updateModel(modelId, name) {
    return this.patch(`/models/models/${modelId}`, { name });
  }

  deleteModel(modelId) {
    return this.delete(`/models/models/${modelId}`);
  }

  getAllBrandsWithModels() {
    return this.get('/models/all');
  }

  // ─── TECHNICIANS ─────────────────────────────
  getTechnicians(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/technicians${query ? '?' + query : ''}`);
  }

  createTechnician(data) {
    return this.post('/technicians', data);
  }

  deleteTechnician(id) {
    return this.delete(`/technicians/${id}`);
  }

  // ─── SALES STAFF ─────────────────────────────
  getSalesStaff(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/sales-staff${query ? '?' + query : ''}`);
  }

  createSalesStaff(data) {
    return this.post('/sales-staff', data);
  }

  deleteSalesStaff(id) {
    return this.delete(`/sales-staff/${id}`);
  }

  // ─── PHASE 1: INVENTORY & SALES ───────────────────────
  getInventory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/inventory${query ? '?' + query : ''}`);
  }

  addInventory(data) {
    return this.post('/inventory', data);
  }

  getSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/sales${query ? '?' + query : ''}`);
  }

  recordSale(data) {
    return this.post('/sales', data);
  }

  lookupIMEI(imei) {
    return this.get(`/imei/${imei}`);
  }

  // ─── PHASE 2: PRICING ───────────────────────────────
  getPricing(branchId) {
    const query = branchId ? `?branchId=${branchId}` : '';
    return this.get(`/pricing${query}`);
  }

  updatePricing(branchId, margins) {
    return this.post('/pricing', { branchId, margins });
  }

  // ─── PHASE 3: ANALYTICS ──────────────────────────────
  getSalesAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/analytics/sales${query ? '?' + query : ''}`);
  }

  getCommissionsAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/analytics/commissions${query ? '?' + query : ''}`);
  }
}

const api = new ApiClient();
export default api;
