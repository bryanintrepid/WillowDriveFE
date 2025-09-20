import { ref } from 'vue';
import api from '@/services/api';

export default function useApi() {
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

  return {
    data,
    error,
    loading,
    fetchData,
    // Add other HTTP methods as needed
    get: (url, config = {}) => fetchData(url, { ...config, method: 'GET' }),
    post: (url, payload, config = {}) => 
      fetchData(url, { ...config, method: 'POST', data: payload }),
    put: (url, payload, config = {}) => 
      fetchData(url, { ...config, method: 'PUT', data: payload }),
    delete: (url, config = {}) => 
      fetchData(url, { ...config, method: 'DELETE' }),
  };
}