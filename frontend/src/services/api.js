import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          return api(original);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  getUsers: (params) => api.get('/auth/users', { params }),
};

// Projects API
export const projectsAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, userData) => api.post(`/projects/${id}/members`, userData),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// Observations API
export const observationsAPI = {
  getObservations: (params) => api.get('/observations', { params }),
  getObservation: (id) => api.get(`/observations/${id}`),
  createObservation: (observationData) => api.post('/observations', observationData),
  updateObservation: (id, observationData) => api.put(`/observations/${id}`, observationData),
  deleteObservation: (id) => api.delete(`/observations/${id}`),
  exportObservations: (params) => api.get('/observations/export', { params }),
};

// Species API
export const speciesAPI = {
  getSpecies: (params) => api.get('/species', { params }),
  getSpeciesById: (id) => api.get(`/species/${id}`),
  createSpecies: (speciesData) => api.post('/species', speciesData),
  updateSpecies: (id, speciesData) => api.put(`/species/${id}`, speciesData),
  getFamilies: () => api.get('/species/families'),
  getConservationStatuses: () => api.get('/species/conservation-statuses'),
};

// Indicators API
export const indicatorsAPI = {
  getIndicators: (params) => api.get('/indicators', { params }),
  getIndicator: (id) => api.get(`/indicators/${id}`),
  createIndicator: (indicatorData) => api.post('/indicators', indicatorData),
  updateIndicator: (id, indicatorData) => api.put(`/indicators/${id}`, indicatorData),
  deleteIndicator: (id) => api.delete(`/indicators/${id}`),
};

// Resources API
export const resourcesAPI = {
  getResources: (params) => api.get('/resources', { params }),
  getResource: (id) => api.get(`/resources/${id}`),
  createResource: (resourceData) => api.post('/resources', resourceData),
  updateResource: (id, resourceData) => api.put(`/resources/${id}`, resourceData),
  deleteResource: (id) => api.delete(`/resources/${id}`),
};

// Uploads API
export const uploadsAPI = {
  uploadImage: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  uploadAudio: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/uploads/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
  deleteFile: (fileId) => api.delete(`/uploads/files/${fileId}`),
};

// Reports API
export const reportsAPI = {
  generateReport: (projectId, reportType) => api.post('/reports/generate', {
    project_id: projectId,
    report_type: reportType
  }),
  getReportStatus: (taskId) => api.get(`/reports/status/${taskId}`),
  downloadReport: (filename) => api.get(`/reports/download/${filename}`, {
    responseType: 'blob'
  }),
};

export default api;