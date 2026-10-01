import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('routemind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data?.error || {
      message: error.message || 'Network communication error'
    };
    return Promise.reject(errorData);
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
  chat: (query, tripId) => api.post('/ai/chat', { query, trip_id: tripId }),
  explainRoute: (routeId, tripId) => api.post('/ai/explain', { route_id: routeId, trip_id: tripId }),
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
  getMatches: (listingId) => api.get('/coloading/matches', { params: { listing_id: listingId } }),
  acceptMatch: (matchId, notes) => api.post('/coloading/matches/accept', { match_id: matchId, notes }),
  getStats: () => api.get('/coloading/stats')
};

export const configApi = {
  getKeys: () => api.get('/config/keys'),
  updateKeys: (data) => api.post('/config/keys', data)
};

export default api;
