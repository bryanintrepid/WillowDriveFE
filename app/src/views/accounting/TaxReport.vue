<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Sales Tax Report</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <label class="small text-muted mb-0">From</label>
        <input type="date" class="form-control form-control-sm" style="width:140px" v-model="startDate">
        <label class="small text-muted mb-0">To</label>
        <input type="date" class="form-control form-control-sm" style="width:140px" v-model="endDate">
        <select class="form-select form-select-sm" style="width:110px" v-model="groupBy">
          <option value="Month">Monthly</option>
          <option value="Quarter">Quarterly</option>
        </select>
        <select class="form-select form-select-sm" style="width:180px" v-model="jurisdictionId">
          <option :value="null">All jurisdictions</option>
          <option v-for="j in jurisdictions" :key="j.taxJurisdictionId" :value="j.taxJurisdictionId">
            {{ j.jurisdictionCode }} — {{ j.jurisdictionName }}
          </option>
        </select>
        <button class="btn btn-sm btn-primary" @click="load">Run</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Rows</div>
              <div class="fs-4 fw-bold">{{ data.rows.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-primary">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Total Taxable</div>
              <div class="fs-4 fw-bold">{{ fmt(data.grandTotalTaxable) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-success">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Total Tax Collected</div>
              <div class="fs-4 fw-bold text-success">{{ fmt(data.grandTotalTax) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Jurisdiction</th>
                <th>Period</th>
                <th class="text-end">Txns</th>
                <th class="text-end">Taxable</th>
                <th class="text-end">Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in data.rows" :key="i">
                <td>
                  <div class="font-monospace small">{{ r.jurisdictionCode }}</div>
                  <div class="small text-muted">{{ r.jurisdictionName }}</div>
                </td>
                <td class="font-monospace">{{ r.reportingPeriod }}</td>
                <td class="text-end font-monospace">{{ r.transactionCount }}</td>
                <td class="text-end font-monospace">{{ fmt(r.taxableTotal) }}</td>
                <td class="text-end font-monospace fw-bold">{{ fmt(r.taxTotal) }}</td>
              </tr>
              <tr v-if="data.rows.length === 0">
                <td colspan="5" class="text-center text-muted py-3">
                  No tax transactions recorded in this range.
                  <div class="small">Tax transactions are captured automatically when invoices with a TaxAmount are saved.</div>
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
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

const startDate = ref(firstOfMonth.toISOString().substring(0, 10));
const endDate = ref(today.toISOString().substring(0, 10));
const groupBy = ref('Month');
const jurisdictionId = ref(null);
const data = ref(null);
const jurisdictions = ref([]);
const loading = ref(false);
const error = ref(null);

function fmt(v) { return formatCurrency(v ?? 0); }

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value,
      groupBy: groupBy.value
    };
    if (jurisdictionId.value != null) params.jurisdictionId = jurisdictionId.value;
    const { data: resp } = await api.get('tax/sales/report', { params });
    data.value = resp;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

async function loadJurisdictions() {
  try {
    const { data } = await api.get('tax/sales/jurisdictions', { params: { activeOnly: true } });
    jurisdictions.value = data;
  } catch { /* non-fatal */ }
}

onMounted(async () => {
  await loadJurisdictions();
  await load();
});
</script>
