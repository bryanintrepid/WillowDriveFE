import { defineStore } from 'pinia';

export const useMainStore = defineStore('main', {
  state: () => ({
    error: "",
    user: {}
  }),
  getters: {
    // Add any getters here if needed
  },
  actions: {
    setError(error) {
      this.error = error;
    },
    setUser(user) {
      this.user = user;
    }
  },
});