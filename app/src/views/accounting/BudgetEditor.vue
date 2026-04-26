<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Budget Editor</h4>
      <div class="d-flex gap-2 align-items-center">
        <FiscalPeriodPicker
          :fiscal-year="fiscalYear"
          :fiscal-years="fiscalYears"
          :show-period="false"
          @update:fiscal-year="v => { fiscalYear = v; loadBudget() }"
        />
        <button v-if="!budget?.locked" class="btn btn-success btn-sm" @click="save" :disabled="saving || !dirty">
          <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button v-if="budget && !budget.locked" class="btn btn-outline-warning btn-sm" @click="lockBudget">
          <i class="ri-lock-line me-1"></i>Lock
        </button>
        <button v-if="budget?.locked" class="btn btn-outline-secondary btn-sm" @click="unlockBudget">
          <i class="ri-lock-unlock-line me-1"></i>Unlock
        </button>
      </div>
    </div>

    <!-- Lock banner -->
    <div v-if="budget?.locked" class="alert alert-warning py-2 mb-3">
      <i class="ri-lock-line me-1"></i>
      Budget is locked by {{ budget.lockedBy }} on {{ fmtDate(budget.lockedAt) }}. Unlock to edit.
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Grid -->
    <div v-else-if="budget" class="card">
      <div class="card-body p-0">
        <div class="table-responsive" style="max-height: 75vh;">
          <table class="table table-sm table-bordered mb-0 budget-grid">
            <thead class="table-light sticky-top">
              <tr>
                <th class="sticky-col" style="min-width: 80px;">Account</th>
                <th class="sticky-col-2" style="min-width: 180px;">Description</th>
                <th class="text-end" v-for="p in 12" :key="p" style="min-width: 95px;">{{ periodNames[p-1] }}</th>
                <th class="text-end" style="min-width: 100px;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in budget.lines" :key="line.accountNumber">
                <td class="sticky-col text-nowrap small">{{ line.accountNumber }}</td>
                <td class="sticky-col-2 text-nowrap small text-truncate" style="max-width: 200px;"
                  :title="line.description">{{ line.description }}</td>
                <td v-for="p in 12" :key="p" class="p-0">
                  <input
                    type="number"
                    class="form-control form-control-sm border-0 text-end budget-input"
                    :value="line.budgets[p-1]"
                    :disabled="budget.locked"
                    @change="updateCell(line, p-1, $event)"
                    @focus="$event.target.select()"
                    step="0.01"
                  >
                </td>
                <td class="text-end small fw-bold">{{ fmt(lineTotal(line)) }}</td>
              </tr>
            </tbody>
            <tfoot class="table-light fw-bold sticky-bottom">
              <tr>
                <td class="sticky-col">Totals</td>
                <td class="sticky-col-2"></td>
                <td class="text-end" v-for="p in 12" :key="p">{{ fmt(periodTotal(p-1)) }}</td>
                <td class="text-end">{{ fmt(grandTotal) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- Status -->
    <div v-if="saveMessage" class="mt-2">
      <div class="alert alert-success py-2">{{ saveMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';
import FiscalPeriodPicker from '@/components/FiscalPeriodPicker.vue';

const periodNames = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];

const fiscalYear = ref(0);
const fiscalYears = ref([]);
const budget = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const saveMessage = ref('');
const dirty = ref(false);

function fmt(val) {
  if (val === null || val === undefined) return '0.00';
  return formatCurrency(val);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US');
}

function lineTotal(line) {
  return line.budgets.reduce((s, v) => s + (v || 0), 0);
}

function periodTotal(pIdx) {
  if (!budget.value) return 0;
  return budget.value.lines.reduce((s, l) => s + (l.budgets[pIdx] || 0), 0);
}

const grandTotal = computed(() => {
  if (!budget.value) return 0;
  return budget.value.lines.reduce((s, l) => s + lineTotal(l), 0);
});

function updateCell(line, pIdx, event) {
  const val = parseFloat(event.target.value) || 0;
  line.budgets[pIdx] = Math.round(val * 100) / 100;
  dirty.value = true;
  saveMessage.value = '';
}

async function loadFiscalYears() {
  try {
    const { data } = await api.get('financial-reports/fiscal-years');
    fiscalYears.value = data;
    if (data.length > 0) {
      const now = new Date();
      const currentFY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      fiscalYear.value = data.includes(currentFY) ? currentFY : data[0];
    }
  } catch (e) {
    error.value = 'Failed to load fiscal years';
  }
}

async function loadBudget() {
  if (!fiscalYear.value) return;
  loading.value = true;
  error.value = null;
  dirty.value = false;
  saveMessage.value = '';
  try {
    const { data } = await api.get(`budgets/${fiscalYear.value}`);
    budget.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load budget';
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!budget.value || saving.value) return;
  saving.value = true;
  error.value = null;
  try {
    // Send all lines (including zeroed-out ones) to properly clear old values
    const lines = budget.value.lines
      .map(l => ({ accountNumber: l.accountNumber, budgets: l.budgets }));

    await api.put(`budgets/${fiscalYear.value}`, {
      fiscalYear: fiscalYear.value,
      lines
    });
    dirty.value = false;
    saveMessage.value = `Budget saved — ${lines.length} accounts updated`;
    setTimeout(() => saveMessage.value = '', 5000);
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function lockBudget() {
  try {
    await api.post(`budgets/${fiscalYear.value}/lock`);
    await loadBudget();
  } catch (e) {
    error.value = e.response?.data?.message || 'Lock failed';
  }
}

async function unlockBudget() {
  try {
    await api.post(`budgets/${fiscalYear.value}/unlock`);
    await loadBudget();
  } catch (e) {
    error.value = e.response?.data?.message || 'Unlock failed';
  }
}

onMounted(async () => {
  await loadFiscalYears();
  await loadBudget();
});
</script>

<style scoped>
.budget-grid {
  font-size: 0.82rem;
}
.budget-input {
  font-size: 0.82rem;
  padding: 2px 6px;
  height: 28px;
  border-radius: 0;
}
.budget-input:focus {
  background-color: #fffde7;
  box-shadow: inset 0 0 0 1px var(--bs-primary);
}
.sticky-col {
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 1;
}
.sticky-col-2 {
  position: sticky;
  left: 80px;
  background: inherit;
  z-index: 1;
}
.sticky-top {
  z-index: 2;
}
.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 2;
}
thead .sticky-col, thead .sticky-col-2,
tfoot .sticky-col, tfoot .sticky-col-2 {
  z-index: 3;
}
</style>
