const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const DEFAULT_ADMIN_TOKEN = 'hirebuddy_admin_secret_2026';

export const getStoredToken = () => {
  return localStorage.getItem('hirebuddy_admin_token') || DEFAULT_ADMIN_TOKEN;
};

export const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem('hirebuddy_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (token, adminUser) => {
  localStorage.setItem('hirebuddy_admin_token', token);
  localStorage.setItem('hirebuddy_admin_user', JSON.stringify(adminUser));
};

export const clearAuthSession = () => {
  localStorage.removeItem('hirebuddy_admin_token');
  localStorage.removeItem('hirebuddy_admin_user');
};

async function apiRequest(endpoint, { method = 'GET', body, token, params } = {}) {
  const currentToken = token || getStoredToken();
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || `API request failed with status ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error ${method} ${endpoint}]:`, error.message);
    throw error;
  }
}

// ---------------- API SERVICES ----------------

export const adminApi = {
  // Auth
  loginWithPhone: async (phone, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { phone, password },
    });
  },

  // ID Verification
  getPendingIdSubmissions: async (customToken) => {
    const token = customToken || getStoredToken();
    return apiRequest('/user/pending-ids', {
      params: { adminToken: token },
    });
  },

  verifyUserId: async (userId, { status, notes, adminToken }) => {
    const token = adminToken || getStoredToken();
    return apiRequest(`/user/id/${userId}/verify`, {
      method: 'PATCH',
      body: {
        status,
        notes,
        adminToken: token,
      },
    });
  },

  // Helpers
  getHelpers: async () => {
    return apiRequest('/user/helpers');
  },

  getHelperById: async (id) => {
    return apiRequest(`/user/helper/${id}`);
  },

  createHelper: async (helperData) => {
    return apiRequest('/user/helper/create', {
      method: 'POST',
      body: helperData,
    });
  },

  // Users
  getUsers: async (filters = {}) => {
    return apiRequest('/user/all', {
      params: filters,
    });
  },

  // Tasks
  getAllTasks: async (filters = {}) => {
    return apiRequest('/tasks/search', {
      params: {
        limit: 100,
        ...filters,
      },
    });
  },

  getTaskById: async (id) => {
    return apiRequest(`/tasks/${id}`);
  },

  updateTaskStatus: async (taskId, status) => {
    return apiRequest(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: { status },
    });
  },

  deleteTask: async (taskId) => {
    return apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  // Users Management
  updateUserRole: async (userId, role) => {
    return apiRequest(`/user/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    });
  },

  deleteUser: async (userId) => {
    return apiRequest(`/user/${userId}`, {
      method: 'DELETE',
    });
  },

  // Categories
  getCategories: async () => {
    return apiRequest('/categories');
  },

  createCategory: async (categoryData) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: categoryData,
    });
  },

  updateCategory: async (id, categoryData) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
    });
  },

  deleteCategory: async (id) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Health
  checkHealth: async () => {
    try {
      const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
      const res = await fetch(`${baseUrl}/health`).catch(() => null);
      if (res && res.ok) return true;
      const rootRes = await fetch(`${baseUrl}/`).catch(() => null);
      return !!(rootRes && rootRes.ok);
    } catch {
      return false;
    }
  },
};
