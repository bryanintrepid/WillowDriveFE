<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4 class="mb-0">Statement Run: {{ run?.name }}</h4>
        <small class="text-muted" v-if="run">{{ fmtDate(run.runDate) }} — {{ run.statementCount }} statements, Total: {{ fmt(run.totalAmount) }}</small>
      </div>
      <router-link to="/accounting/statements" class="btn btn-outline-secondary btn-sm">Back to Runs</router-link>
    </div>

    <div v-if="loading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="run" class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Customer #</th>
                <th>Name</th>
                <th class="text-end">Current</th>
                <th class="text-end">31-60</th>
                <th class="text-end">61-90</th>
                <th class="text-end">90+</th>
                <th class="text-end">Unapplied</th>
                <th class="text-end fw-bold">Balance</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in run.statements" :key="s.statementId">
                <td>{{ s.customerNumber }}</td>
                <td>{{ s.customerName }}</td>
                <td class="text-end">{{ fmt(s.currentDue) }}</td>
                <td class="text-end" :class="s.pastDue30 ? 'text-warning' : ''">{{ fmt(s.pastDue30) }}</td>
                <td class="text-end" :class="s.pastDue60 ? 'text-danger' : ''">{{ fmt(s.pastDue60) }}</td>
                <td class="text-end" :class="s.pastDue90 ? 'text-danger fw-bold' : ''">{{ fmt(s.pastDue90) }}</td>
                <td class="text-end text-success">{{ s.unappliedPayments ? fmt(-s.unappliedPayments) : '' }}</td>
                <td class="text-end fw-bold">{{ fmt(s.balanceTotal) }}</td>
                <td class="small text-muted" style="max-width: 200px;">{{ s.message }}</td>
              </tr>
            </tbody>
            <tfoot class="table-light fw-bold">
              <tr>
                <td colspan="2">Totals</td>
                <td class="text-end">{{ fmt(sumCol('currentDue')) }}</td>
                <td class="text-end">{{ fmt(sumCol('pastDue30')) }}</td>
                <td class="text-end">{{ fmt(sumCol('pastDue60')) }}</td>
                <td class="text-end">{{ fmt(sumCol('pastDue90')) }}</td>
                <td class="text-end">{{ fmt(-sumCol('unappliedPayments')) }}</td>
                <td class="text-end">{{ fmt(sumCol('balanceTotal')) }}</td>
                <td></td>
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
import { useRoute } from 'vue-router';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const route = useRoute();
const run = ref(null);
const loading = ref(false);
const error = ref(null);

function fmt(val) { return formatCurrency(val); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US') : ''; }
function sumCol(col) { return run.value?.statements?.reduce((s, r) => s + (r[col] || 0), 0) || 0; }

async function loadRun() {
  loading.value = true;
  try {
    const { data } = await api.get(`statement-runs/${route.params.id}`);
    run.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

onMounted(loadRun);
</script>

<style scoped>
.table td, .table th { padding: 0.3rem 0.5rem; font-size: 0.85rem; }
</style>
