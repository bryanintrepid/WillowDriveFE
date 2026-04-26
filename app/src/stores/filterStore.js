import { defineStore } from 'pinia';

export const useFilterStore = defineStore('filters', {
  state: () => ({
    pages: {},
  }),
  actions: {
    saveFilters(pageKey, filters) {
      this.pages[pageKey] = JSON.parse(JSON.stringify(filters));
    },
    getFilters(pageKey) {
      return this.pages[pageKey] || null;
    },
    clearFilters(pageKey) {
      delete this.pages[pageKey];
    },
  },
});
