import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useApiStore = defineStore('api', () => {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  const fetchData = async (url, config = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api(url, config);
      data.value = response.data;
      return response;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Helper methods for common HTTP methods
  const get = (url, config = {}) => fetchData(url, { ...config, method: 'GET' });
  const post = (url, payload, config = {}) => 
    fetchData(url, { ...config, method: 'POST', data: payload });
  const put = (url, payload, config = {}) => 
    fetchData(url, { ...config, method: 'PUT', data: payload });
  const del = (url, config = {}) => 
    fetchData(url, { ...config, method: 'DELETE' });

  return {
    data,
    error,
    loading,
    fetchData,
    get,
    post,
    put,
    delete: del
  };
});