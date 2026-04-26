<template>
  <div class="dropdown">
    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button"
      data-bs-toggle="dropdown" :disabled="disabled">
      <i class="ri-download-line me-1"></i>Export
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <li><a class="dropdown-item" href="#" @click.prevent="$emit('export', 'csv')">
        <i class="ri-file-text-line me-2"></i>CSV
      </a></li>
      <li><a class="dropdown-item" href="#" @click.prevent="$emit('export', 'xlsx')">
        <i class="ri-file-excel-line me-2"></i>Excel (XLSX)
      </a></li>
      <li><a class="dropdown-item" href="#" @click.prevent="$emit('export', 'pdf')">
        <i class="ri-file-pdf-line me-2"></i>PDF
      </a></li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  disabled: { type: Boolean, default: false }
});
defineEmits(['export']);
</script>
