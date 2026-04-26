<template>
  <div class="d-flex align-items-center gap-2 flex-wrap">
    <label class="form-label fw-bold mb-0">{{ label }}</label>
    <select class="form-select" style="width: 120px;"
      :value="fiscalYear" @change="$emit('update:fiscalYear', parseInt($event.target.value))">
      <option v-for="fy in fiscalYears" :key="fy" :value="fy">FY {{ fy }}</option>
    </select>
    <select v-if="showPeriod" class="form-select" style="width: 140px;"
      :value="period" @change="$emit('update:period', parseInt($event.target.value))">
      <option :value="0">Full Year</option>
      <option v-for="p in 12" :key="p" :value="p">P{{ p }} — {{ periodName(p) }}</option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  fiscalYear: { type: Number, required: true },
  period: { type: Number, default: 0 },
  fiscalYears: { type: Array, required: true },
  showPeriod: { type: Boolean, default: true },
  label: { type: String, default: '' }
});

defineEmits(['update:fiscalYear', 'update:period']);

const periodNames = [
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'
];

function periodName(p) {
  return periodNames[p - 1] || '';
}
</script>
