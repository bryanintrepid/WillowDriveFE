// src/stores/userStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApiStore } from './apiStore';

export const useUserStore = defineStore('user', () => {
  const users = ref([]);
  const currentUser = ref(null);
  const apiStore = useApiStore();

  const fetchUsers = async () => {
    await apiStore.get('/users');
    if (apiStore.data) {
      users.value = apiStore.data;
    }
  };

  const fetchUser = async (id) => {
    await apiStore.get(`/users/${id}`);
    if (apiStore.data) {
      currentUser.value = apiStore.data;
    }
  };

  return {
    users,
    currentUser,
    fetchUsers,
    fetchUser,
    isLoading: apiStore.loading,
    error: apiStore.error
  };
});