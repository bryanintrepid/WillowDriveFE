<template>
  <div class="clearable-input-wrapper">
    <div class="position-relative">
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.esc="clearInput"
        :placeholder="placeholder"
        class="form-control search-input"
      />
      <span v-if="modelValue" class="clear-icon" @click="clearInput">
        <i class="ri-close-line"></i>
      </span>
    </div>
  </div>
</template>

<script setup>
// This component is a self-contained, clearable input field.
// It uses v-model for two-way data binding and accepts a placeholder prop.

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
});

const emit = defineEmits(['update:modelValue']);

const clearInput = () => {
  emit('update:modelValue', '');
};
</script>

<style scoped>
.clearable-input-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.clear-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  cursor: pointer;
  color: #878a99; /* Velzon's default icon color */
}

.clear-icon:hover {
  color: #000;
}

/* Adjust input padding to prevent text from overlapping the clear icon */
.form-control {
  padding-right: 30px; 
}
</style>
