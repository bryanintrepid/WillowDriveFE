<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">AP Aging Report</h4>
      <div class="d-flex gap-2 align-items-center">
        <label class="form-label mb-0 small fw-bold">As of</label>
        <input type="date" class="form-control form-control-sm" style="width: 160px;"
          v-model="asOfDate" @change="loadAging">
      </div>
    </div>

    <div v-if="loading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="aging" class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Vendor #</th>
                <th>Name</th>
                <th class="text-end">Current</th>
                <th class="text-end">31-60 Days</th>
                <th class="text-end">61-90 Days</th>
                <th class="text-end">90+ Days</th>
                <th class="text-end fw-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in aging.lines" :key="line.customerOrVendor">
                <td>{{ line.customerOrVendor }}</td>
                <td>{{ line.name }}</td>
                <td class="text-end">{{ fmt(line.current) }}</td>
                <td class="text-end" :class="line.pastDue30 ? 'text-warning' : ''">{{ fmt(line.pastDue30) }}</td>
                <td class="text-end" :class="line.pastDue60 ? 'text-danger' : ''">{{ fmt(line.pastDue60) }}</td>
                <td class="text-end" :class="line.pastDue90 ? 'text-danger fw-bold' : ''">{{ fmt(line.pastDue90) }}</td>
                <td class="text-end fw-bold">{{ fmt(line.total) }}</td>
              </tr>
            </tbody>
            <tfoot class="table-light fw-bold">
              <tr>
                <td colspan="2">Totals ({{ aging.lines?.length }} vendors)</td>
                <td class="text-end">{{ fmt(aging.totalCurrent) }}</td>
                <td class="text-end">{{ fmt(aging.totalPastDue30) }}</td>
                <td class="text-end">{{ fmt(aging.totalPastDue60) }}</td>
                <td class="text-end">{{ fmt(aging.totalPastDue90) }}</td>
                <td class="text-end">{{ fmt(aging.grandTotal) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const asOfDate = ref(new Date().toISOString().split('T')[0]);
const aging = ref(null);
const loading = ref(false);
const error = ref(null);

function fmt(val) { return formatCurrency(val); }

async function loadAging() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('aging/ap', { params: { asOfDate: asOfDate.value } });
    aging.value = data;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to load aging';
  } finally {
    loading.value = false;
  }
}

onMounted(loadAging);
</script>

<style scoped>
.table td, .table th { padding: 0.3rem 0.5rem; font-size: 0.85rem; }
</style>
