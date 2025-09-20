<script setup>
import { onMounted } from 'vue';
import useApi from '@/composables/useApi';
import { useCounterStore } from '@/stores/counter';

const { data, error, loading, fetchData } = useApi();

onMounted(() => {
  
});


</script>

<template>
<div></div>
</template>
