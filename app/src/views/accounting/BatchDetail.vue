<template>
  <div class="page-content">
    <h1>Batch Detail</h1>
    <p>Company: {{ companyName }}</p>
    <p>Fiscal Year: {{ fiscalYear }}</p>
    <p>Batch Number: {{ batchNumber }}</p>
  </div>
</template>

<script setup>
import { toRefs } from 'vue';

const props = defineProps({
  companyName: String,
  fiscalYear: String,
  batchNumber: String,
});

const { companyName, fiscalYear, batchNumber } = toRefs(props);

</script>

<style scoped>
.page-content {
  padding: 1.5rem;
}
</style>
