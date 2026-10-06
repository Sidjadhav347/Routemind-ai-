import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('routemind_token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Network communication error';
    let code = 'NETWORK_ERROR';
    let details = null;

    if (error.response) {
      // Server responded with non-2xx status
      const data = error.response.data;
      if (typeof data === 'string') {
        message = data;
      } else if (data?.error) {
        if (typeof data.error === 'string') {
          message = data.error;
        } else if (typeof data.error === 'object') {
          message = data.error.message || message;
          code = data.error.code || code;
          details = data.error.details || null;
        }
      } else if (data?.message) {
        message = data.message;
      } else {
        message = `Server responded with status code ${error.response.status}`;
      }
    } else if (error.request) {
      // Request was sent but no response was received (backend server offline or connection refused)
      message = 'Cannot connect to RouteMind backend server on port 5000. Please ensure the backend is running (`npm run dev` in workspace root).';
      code = 'BACKEND_OFFLINE';
    } else {
      message = error.message || message;
    }

    const err = new Error(message);
    err.code = code;
    err.details = details;
    err.original = error;
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getPreferences: () => api.get('/users/preferences'),
  updatePreferences: (data) => api.put('/users/preferences', data)
};

export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`)
};

export const cargoApi = {
  getAll: () => api.get('/cargo'),
  getById: (id) => api.get(`/cargo/${id}`),
  create: (data) => api.post('/cargo', data),
  update: (id, data) => api.put(`/cargo/${id}`, data),
  delete: (id) => api.delete(`/cargo/${id}`)
};

export const tripApi = {
  create: (data) => api.post('/trips', data),
  optimize: (data) => api.post('/trips/optimize', data),
  getAll: () => api.get('/trips'),
  getById: (id) => api.get(`/trips/${id}`),
  start: (id) => api.post(`/trips/${id}/start`),
  complete: (id) => api.post(`/trips/${id}/complete`),
  evaluateReroute: (id) => api.post(`/trips/${id}/reroute/evaluate`),
  applyReroute: (id, newRouteId) => api.post(`/trips/${id}/reroute/apply`, { new_route_id: newRouteId }),
  simulateIncident: (id, data) => api.post(`/trips/${id}/simulate-incident`, data)
};

export const trafficApi = {
  getEvents: (tripId) => api.get('/traffic/events', { params: { trip_id: tripId } }),
  getScenarios: () => api.get('/traffic/scenarios'),
  triggerScenario: (scenarioId, tripId) => api.post('/traffic/scenarios/trigger', { scenario_id: scenarioId, trip_id: tripId })
};

export const aiApi = {
  getStatus: () => api.get('/ai/status'),
  chat: (query, tripId, apiKey) => api.post('/ai/chat', { query, trip_id: tripId, apiKey }),
  explainRoute: (routeId, tripId, apiKey) => api.post('/ai/explain', { route_id: routeId, trip_id: tripId, apiKey }),
  runSimulation: (data) => api.post('/ai/simulate', data)
};

export const analyticsApi = {
  getAnalytics: () => api.get('/analytics')
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all')
};

export const routeApi = {
  geocode: (query) => api.get('/routes/geocode', { params: { query } })
};

export const coloadingApi = {
  getListings: (params) => api.get('/coloading/listings', { params }),
  getListingById: (id) => api.get(`/coloading/listings/${id}`),
  createListing: (data) => api.post('/coloading/listings', data),
  getMatches: (paramsOrId) => {
    const params = typeof paramsOrId === 'string' ? { listing_id: paramsOrId } : (paramsOrId || {});
    return api.get('/coloading/matches', { params });
  },
  acceptMatch: (matchId, notes) => api.post('/coloading/matches/accept', { match_id: matchId, notes }),
  getStats: () => api.get('/coloading/stats')
};

export const configApi = {
  getKeys: () => api.get('/config/keys'),
  updateKeys: (data) => api.post('/config/keys', data)
};

export default api;
