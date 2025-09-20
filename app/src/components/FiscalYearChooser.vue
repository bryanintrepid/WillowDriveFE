<template>
  <div class="d-flex align-items-center gap-2">
    <label for="fiscalYearSelect" class="form-label fw-bold mb-0">FY</label>
    <select id="fiscalYearSelect" class="form-select" style="width: 100px;" :value="modelValue" @change="$emit('update:modelValue', parseInt($event.target.value))">
      <option v-for="year in fiscalYearChoices" :key="year.value" :value="year.value">
        {{ year.text }}
      </option>
    </select>
  </div>
</template>

<script setup>
// This component is designed to be used with v-model.
// It accepts a list of choices and emits an update event on change.

defineProps({
  modelValue: {
    type: [Number, String],
    required: true,
  },
  fiscalYearChoices: {
    type: Array,
    required: true,
    default: () => [],
  },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
