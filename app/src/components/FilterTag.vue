<template>
  <div v-if="modelValue || modelValue === false" class="badge bg-light text-dark fs-13 fw-normal me-2">
    <span class="fw-semibold">{{ label }}:</span> {{ displayValue || modelValue }}
    <a href="#" class="text-muted ms-1" @click.prevent="clearFilter" title="Clear Filter" v-if="!noClearButton">
      <i class="ri-close-line"></i>
    </a>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  displayValue: {
    type: [String, Number],
    default: '',
  },
  noClearButton: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const clearFilter = () => {
  // Handle the specific case from the original directive where a boolean true becomes false
  const newValue = typeof props.modelValue === 'boolean' ? false : null;
  emit('update:modelValue', newValue);
};
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.4em 0.7em;
  font-size: 90%;
}

.filter-label {
  margin-right: 5px;
  opacity: 0.8;
}

.filter-remove {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-left: 8px;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23fff'%3e%3cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 10px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.filter-remove:hover {
  opacity: 1;
}
</style>
