import api from './api';

export const categoryService = {
  async getAllCategories() {
    const res = await api.get('/categories');
    return res.data;
  },

  async createCategory(categoryData) {
    const res = await api.post('/categories', categoryData);
    return res.data;
  },

  async updateCategory(id, categoryData) {
    const res = await api.put(`/categories/${id}`, categoryData);
    return res.data;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};
