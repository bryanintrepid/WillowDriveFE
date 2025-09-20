import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApiStore } from './apiStore';

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const apiStore = useApiStore();

  const fetchCounter = async () => {
    try {
      await apiStore.get('/counter');
      if (apiStore.data) {
        count.value = apiStore.data;
      }
    } catch (error) {
      console.error('Failed to fetch counter:', error);
      throw error;
    }
  };

  const increment = async () => {
    try {
      await apiStore.post('/counter/increment');
      await fetchCounter();
    } catch (error) {
      console.error('Failed to increment counter:', error);
      throw error;
    }
  };

  const reset = async () => {
    try {
      await apiStore.post('/counter/reset');
      await fetchCounter();
    } catch (error) {
      console.error('Failed to reset counter:', error);
      throw error;
    }
  };

  return {
    count,
    fetchCounter,
    increment,
    reset,
    isLoading: apiStore.loading,
    error: apiStore.error
  };
});