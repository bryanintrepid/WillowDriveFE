<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import KioskLayout from '@/layouts/KioskLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

onMounted(() => {
  // Force the body to have the correct attributes for the vertical layout.
  document.body.setAttribute('data-layout', 'vertical');
  document.body.setAttribute('data-topbar', 'light');
  document.body.setAttribute('data-sidebar', 'dark');
  document.body.setAttribute('data-sidebar-size', 'lg');
  document.body.setAttribute('data-sidebar-image', 'none');
  document.body.setAttribute('data-preloader', 'disable');
});

const route = useRoute()
const layouts = { kiosk: KioskLayout, auth: AuthLayout }
const layout = computed(() => layouts[route.meta?.layout] || DefaultLayout)
</script>

<template>
  <component :is="layout" />
</template>

<style scoped>


</style>
