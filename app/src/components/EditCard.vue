<template>
  <div class="edit-card-wrapper" :class="{ 'is-editing': isEditing }">
    <!-- Summary View -->
    <div v-if="!isEditing" class="summary-view d-flex justify-content-between align-items-center">
      <div class="flex-grow-1">
        <slot name="summary"></slot>
      </div>
      <div class="edit-icon-wrapper ms-2" v-show="!isAnyCardActive && !permissionDenied">
        <button class="btn btn-soft-secondary btn-sm btn-icon" @click="startEditing" title="Edit">
          <i class="ri-pencil-fill"></i>
        </button>
      </div>
    </div>

    <!-- Editing View -->
    <div v-else class="edit-form-view">
      <form @submit.prevent="submitForm" novalidate autocomplete="off">
        <slot name="form" :model="internalModel"></slot>
        <div class="mt-2">
          <button type="submit" class="btn btn-success btn-sm">{{ saveText }}</button>
          <button v-if="showClearButton" type="button" class="btn btn-light btn-sm ms-1" @click="clearForm">{{ clearText }}</button>
          <button type="button" class="btn btn-ghost-danger btn-sm ms-1" @click="cancelEditing">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useEditCardState } from '../composables/useEditCardState';
import { cloneDeep } from 'lodash';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  saveText: {
    type: String,
    default: 'Save',
  },
  clearText: {
    type: String,
    default: 'Clear',
  },
  showClearButton: {
    type: Boolean,
    default: false,
  },
  permissionDenied: {
    type: Boolean,
    default: false,
  },
  tooltipText: {
    type: String,
    default: 'Click to edit',
  },
});

const emit = defineEmits(['save', 'clear']);

const { isAnyCardActive, setAnyCardIsActive } = useEditCardState();
const isEditing = ref(false);
const internalModel = ref(cloneDeep(props.modelValue));

watch(() => props.modelValue, (newValue) => {
  if (!isEditing.value) {
    internalModel.value = cloneDeep(newValue);
  }
}, { deep: true });

const startEditing = () => {
  if (isAnyCardActive.value || props.permissionDenied) return;
  isEditing.value = true;
  setAnyCardIsActive(true);
  // Focus the first input in the form on the next DOM update cycle
  nextTick(() => {
    const formElement = document.querySelector('form');
    if (formElement) {
      const firstInput = formElement.querySelector('input, select, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }
  });
};

const cancelEditing = () => {
  isEditing.value = false;
  setAnyCardIsActive(false);
  internalModel.value = cloneDeep(props.modelValue); // Reset changes
};

const submitForm = () => {
  // The parent component is responsible for the actual save operation.
  // It should call finishEditing() on success.
  emit('save', internalModel.value);
};

const clearForm = () => {
  emit('clear');
};

// This method should be called by the parent component after a successful save/clear operation.
const finishEditing = () => {
  isEditing.value = false;
  setAnyCardIsActive(false);
};

defineExpose({ finishEditing });

</script>

<style scoped>
.edit-card-wrapper {
  transition: background-color 0.2s ease-in-out;
  border-radius: 4px;
}
.summary-view {
  min-height: 38px; /* Match default input height */
  padding: 2px 4px;
}
.edit-icon-wrapper {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.edit-card-wrapper:hover .edit-icon-wrapper {
  opacity: 1;
}
.edit-card-wrapper.is-editing {
  background-color: #f8f9fa;
  padding: 10px;
  padding: 15px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 300px; /* Or adjust as needed */
}
</style>
