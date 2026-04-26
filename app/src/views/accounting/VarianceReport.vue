<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Budget Variance Analysis</h4>
      <div class="d-flex gap-2 align-items-center">
        <label class="small text-muted mb-0">FY</label>
        <select v-model="fiscalYear" class="form-select form-select-sm" style="width: 100px;">
          <option v-for="fy in fiscalYears" :key="fy" :value="fy">{{ fy }}</option>
        </select>
        <label class="small text-muted mb-0">Through</label>
        <select v-model="throughPeriod" class="form-select form-select-sm" style="width: 80px;">
          <option v-for="p in 12" :key="p" :value="p">P{{ p }}</option>
        </select>
        <label class="small text-muted mb-0">Threshold</label>
        <select v-model="threshold" class="form-select form-select-sm" style="width: 80px;">
          <option :value="5">5%</option>
          <option :value="10">10%</option>
          <option :value="15">15%</option>
          <option :value="20">20%</option>
        </select>
        <div class="form-check ms-2">
          <input class="form-check-input" type="checkbox" id="materialOnly" v-model="showMaterialOnly">
          <label class="form-check-label small" for="materialOnly">Material only</label>
        </div>
        <button class="btn btn-sm btn-outline-primary" @click="load">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <!-- Summary cards -->
      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Total Budget YTD</div>
              <div class="fs-5 fw-bold">{{ fmt(data.totalBudget) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Total Actual YTD</div>
              <div class="fs-5 fw-bold">{{ fmt(data.totalActual) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Total Variance</div>
              <div class="fs-5 fw-bold" :class="data.totalVariance >= 0 ? 'text-success' : 'text-danger'">
                {{ data.totalVariance >= 0 ? '+' : '' }}{{ fmt(data.totalVariance) }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card" :class="data.materialVarianceCount > 0 ? 'border-warning' : 'border-success'">
            <div class="card-body py-2">
              <div class="small text-muted">Material Variances</div>
              <div class="fs-5 fw-bold" :class="data.materialVarianceCount > 0 ? 'text-warning' : 'text-success'">
                {{ data.materialVarianceCount }} accounts
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Variance table -->
      <div class="card">
        <div class="card-header py-2 d-flex justify-content-between">
          <span class="fw-bold">{{ filteredLines.length }} Accounts</span>
          <span class="small text-muted">Threshold: {{ data.materialityThreshold }}%</span>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Account</th>
                <th>Description</th>
                <th class="text-end">Budget YTD</th>
                <th class="text-end">Actual YTD</th>
                <th class="text-end">$ Variance</th>
                <th class="text-end">% Variance</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(line, idx) in filteredLines" :key="idx">
                <!-- Revenue header -->
                <tr v-if="idx === 0 || (idx > 0 && filteredLines[idx-1].accountType !== line.accountType)"
                    class="table-secondary">
                  <td colspan="7" class="fw-bold">
                    {{ line.accountType === 3 ? 'Revenue' : 'Expenses' }}
                  </td>
                </tr>
                <tr :class="line.isMaterial ? 'table-warning' : ''">
                  <td class="font-monospace small">{{ line.accountNumber }}</td>
                  <td>{{ line.description }}</td>
                  <td class="text-end font-monospace">{{ fmt(line.budgetYtd) }}</td>
                  <td class="text-end font-monospace">{{ fmt(line.actualYtd) }}</td>
                  <td class="text-end font-monospace" :class="varianceClass(line)">
                    {{ line.varianceDollar >= 0 ? '+' : '' }}{{ fmt(line.varianceDollar) }}
                  </td>
                  <td class="text-end font-monospace" :class="varianceClass(line)">
                    {{ line.variancePercent >= 0 ? '+' : '' }}{{ line.variancePercent.toFixed(1) }}%
                  </td>
                  <td class="text-center">
                    <span v-if="line.isMaterial" class="badge"
                          :class="line.isFavorable ? 'bg-success' : 'bg-danger'">
                      {{ line.isFavorable ? 'Favorable' : 'Unfavorable' }}
                    </span>
                    <span v-else-if="line.budgetYtd === 0" class="badge bg-secondary">No Budget</span>
                    <span v-else class="badge bg-light text-dark">OK</span>
                  </td>
                </tr>
              </template>
              <tr v-if="filteredLines.length === 0">
                <td colspan="7" class="text-center text-muted py-3">
                  {{ showMaterialOnly ? 'No material variances found' : 'No data available' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const fiscalYear = ref(new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1);
const throughPeriod = ref(new Date().getMonth() >= 6 ? new Date().getMonth() - 5 : new Date().getMonth() + 7);
const threshold = ref(10);
const showMaterialOnly = ref(false);
const fiscalYears = ref([2025, 2024, 2023, 2022]);

const data = ref(null);
const loading = ref(false);
const error = ref(null);

function fmt(val) { return formatCurrency(val ?? 0); }

const filteredLines = computed(() => {
  if (!data.value?.lines) return [];
  if (showMaterialOnly.value) {
    return data.value.lines.filter(l => l.isMaterial);
  }
  return data.value.lines;
});

function varianceClass(line) {
  if (line.budgetYtd === 0) return '';
  return line.isFavorable ? 'text-success' : 'text-danger';
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data: resp } = await api.get(`budgets/${fiscalYear.value}/variance`, {
      params: { throughPeriod: throughPeriod.value, threshold: threshold.value }
    });
    data.value = resp;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load variance report';
  } finally {
    loading.value = false;
  }
}

watch([fiscalYear, throughPeriod, threshold], () => load());

onMounted(() => load());
</script>
