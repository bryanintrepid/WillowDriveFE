<template>
  <div class="d-flex justify-content-between align-items-center pt-3" v-if="paginator.itemCount > 0">
    <div class="d-flex align-items-center gap-2">
      <span class="text-muted">Showing {{ startItem }} - {{ endItem }} of {{ paginator.itemCount }}</span>
      <select class="form-select form-select-sm w-auto" v-model="paginator.queryParams.pageSize">
        <option v-for="size in pageSizeChoices" :key="size" :value="size">{{ size }}</option>
      </select>
    </div>
    <div class="d-flex align-items-center gap-2">
      <button class="btn btn-light btn-sm" @click="turnPage(-1)" :disabled="paginator.queryParams.pageNumber <= 1">
        Previous
      </button>
      <div class="d-flex align-items-center">
        <form @submit.prevent="goToPage">
          <input type="tel" class="form-control form-control-sm text-center" style="width: 50px;" v-model.number="pageNumberInput" @blur="goToPage" />
        </form>
        <span class="mx-2 text-muted">of {{ maxPageNumber }}</span>
      </div>
      <button class="btn btn-light btn-sm" @click="turnPage(1)" :disabled="paginator.queryParams.pageNumber >= maxPageNumber">
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  paginator: {
    type: Object,
    required: true,
    default: () => ({
      itemCount: 0,
      queryParams: {
        pageNumber: 1,
        pageSize: 15,
      },
    }),
  },
  pageSizes: {
    type: Array,
    default: () => [15, 30, 50, 100, 250],
  },
});

const emit = defineEmits(['update:paginator']);

// Use a writable computed property to sync the input with the paginator state
const pageNumberInput = computed({
  get: () => props.paginator.queryParams.pageNumber,
  set: (val) => {
    // This setter is mostly for typing; the actual change happens on blur/submit
    // We can add validation here if needed
  }
});

const maxPageNumber = computed(() => {
  return Math.ceil(props.paginator.itemCount / props.paginator.queryParams.pageSize) || 1;
});

const startItem = computed(() => {
  if (props.paginator.itemCount === 0) return 0;
  return (props.paginator.queryParams.pageNumber - 1) * props.paginator.queryParams.pageSize + 1;
});

const endItem = computed(() => {
  const end = props.paginator.queryParams.pageNumber * props.paginator.queryParams.pageSize;
  return end > props.paginator.itemCount ? props.paginator.itemCount : end;
});

const pageSizeChoices = computed(() => {
  const choices = new Set(props.pageSizes);
  choices.add(Number(props.paginator.queryParams.pageSize));
  return Array.from(choices).sort((a, b) => a - b);
});

const updatePaginator = (newParams) => {
  emit('update:paginator', {
    ...props.paginator,
    queryParams: { ...props.paginator.queryParams, ...newParams },
  });
};

const turnPage = (direction) => {
  let newPage = props.paginator.queryParams.pageNumber + direction;
  if (newPage > 0 && newPage <= maxPageNumber.value) {
    updatePaginator({ pageNumber: newPage });
  }
};

const goToPage = (event) => {
  let newPage = Number(event.target.value);
  if (isNaN(newPage) || newPage < 1) {
    newPage = 1;
  } else if (newPage > maxPageNumber.value) {
    newPage = maxPageNumber.value;
  }
  event.target.value = newPage; // Correct the input visually
  updatePaginator({ pageNumber: newPage });
};

</script>


