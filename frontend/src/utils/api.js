const API_URL = '/api';

export const api = {
  // Categories
  getCategories: async () => {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  createCategory: async (category) => {
    const res = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  updateCategory: async (id, category) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  deleteCategory: async (id) => {
    const res = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  // Dates
  getDates: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.author) params.append('author', filters.author);
    if (filters.status) params.append('status', filters.status);

    const res = await fetch(`${API_URL}/dates?${params}`);
    if (!res.ok) throw new Error('Failed to fetch dates');
    return res.json();
  },

  getDate: async (id) => {
    const res = await fetch(`${API_URL}/dates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch date');
    return res.json();
  },

  createDate: async (date) => {
    const res = await fetch(`${API_URL}/dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date),
    });
    if (!res.ok) throw new Error('Failed to create date');
    return res.json();
  },

  updateDate: async (id, updates) => {
    const res = await fetch(`${API_URL}/dates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update date');
    return res.json();
  },

  deleteDate: async (id) => {
    const res = await fetch(`${API_URL}/dates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete date');
    return res.json();
  },

  getRandomDate: async (categories) => {
    const res = await fetch(`${API_URL}/dates/random`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to get random date');
    }
    return res.json();
  },

  getAISuggestion: async (preferences) => {
    const res = await fetch(`${API_URL}/dates/ai-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to get AI suggestions');
    }
    return res.json();
  },
};
