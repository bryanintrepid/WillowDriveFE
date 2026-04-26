<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">1099 Report</h4>
      <div class="d-flex gap-2 align-items-center">
        <label class="small text-muted mb-0">Tax Year</label>
        <select v-model="taxYear" class="form-select form-select-sm" style="width: 100px;">
          <option v-for="y in taxYears" :key="y" :value="y">{{ y }}</option>
        </select>
        <button class="btn btn-sm btn-primary" @click="load">Generate</button>
        <button class="btn btn-sm btn-outline-success" @click="exportCsv" :disabled="!data || data.total1099Required === 0">
          <i class="ri-download-line me-1"></i>Export CSV
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <!-- Warning banner if issues -->
      <div class="alert alert-warning d-flex align-items-center mb-3" v-if="data.totalWithMissingTaxId > 0 || data.totalWithMissingAddress > 0">
        <i class="ri-alert-line fs-4 me-2"></i>
        <div>
          <strong>Action Required:</strong>
          <span v-if="data.totalWithMissingTaxId > 0"> {{ data.totalWithMissingTaxId }} vendor(s) missing Tax ID.</span>
          <span v-if="data.totalWithMissingAddress > 0"> {{ data.totalWithMissingAddress }} vendor(s) missing address.</span>
          <br><small>Update vendor records before filing 1099 forms.</small>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="row g-3 mb-3">
        <div class="col-md-2">
          <div class="card">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Total 1099 Vendors</div>
              <div class="fs-4 fw-bold">{{ data.totalVendors }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card border-primary">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Requiring 1099</div>
              <div class="fs-4 fw-bold text-primary">{{ data.total1099Required }}</div>
              <div class="small text-muted">${{ data.threshold }}+ threshold</div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card" :class="data.totalReady === data.total1099Required ? 'border-success' : ''">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Ready to File</div>
              <div class="fs-4 fw-bold" :class="data.totalReady === data.total1099Required ? 'text-success' : ''">
                {{ data.totalReady }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card" :class="data.totalWithMissingTaxId > 0 ? 'border-danger' : ''">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Missing Tax ID</div>
              <div class="fs-4 fw-bold" :class="data.totalWithMissingTaxId > 0 ? 'text-danger' : ''">
                {{ data.totalWithMissingTaxId }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card" :class="data.totalWithMissingAddress > 0 ? 'border-warning' : ''">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Missing Address</div>
              <div class="fs-4 fw-bold" :class="data.totalWithMissingAddress > 0 ? 'text-warning' : ''">
                {{ data.totalWithMissingAddress }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card">
            <div class="card-body py-2 text-center">
              <div class="small text-muted">Total Payments</div>
              <div class="fs-5 fw-bold">{{ fmt(data.grandTotalPayments) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter toggles -->
      <div class="mb-2">
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="showAll" v-model="showAll">
          <label class="form-check-label small" for="showAll">Show all vendors (including below threshold)</label>
        </div>
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="showIssuesOnly" v-model="showIssuesOnly">
          <label class="form-check-label small" for="showIssuesOnly">Show issues only</label>
        </div>
      </div>

      <!-- Vendor table -->
      <div class="card">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Vendor</th>
                <th>Tax ID</th>
                <th>Address</th>
                <th class="text-end">Total Payments</th>
                <th class="text-center">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in filteredVendors" :key="v.vendorId"
                  :class="{ 'table-warning': v.status === 'MissingTaxId' || v.status === 'MissingAddress',
                            'table-light': v.status === 'BelowThreshold' }">
                <td>
                  <div class="fw-semibold">{{ v.vendorName }}</div>
                  <div class="small text-muted">ID: {{ v.vendorId }}</div>
                </td>
                <td>
                  <span :class="v.hasValidTaxId ? '' : 'text-danger fw-bold'">
                    {{ v.taxIdMasked }}
                  </span>
                </td>
                <td>
                  <template v-if="v.hasValidAddress">
                    <div class="small">{{ v.address1 }}</div>
                    <div class="small" v-if="v.address2">{{ v.address2 }}</div>
                    <div class="small">{{ v.city }}, {{ v.state }} {{ v.zip }}</div>
                  </template>
                  <span v-else class="text-warning fw-bold">MISSING</span>
                </td>
                <td class="text-end font-monospace">{{ fmt(v.totalPayments) }}</td>
                <td class="text-center">
                  <span class="badge" :class="statusClass(v.status)">{{ statusLabel(v.status) }}</span>
                </td>
                <td>
                  <router-link :to="`/accounting/vendors/${v.vendorId}`" class="btn btn-sm btn-outline-secondary py-0" v-if="v.status !== 'Ready' && v.status !== 'BelowThreshold'">
                    Edit
                  </router-link>
                </td>
              </tr>
              <tr v-if="filteredVendors.length === 0">
                <td colspan="6" class="text-center text-muted py-3">No vendors match the current filter</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const currentYear = new Date().getFullYear();
const taxYear = ref(currentYear - 1); // Default to last year
const taxYears = ref([currentYear, currentYear - 1, currentYear - 2, currentYear - 3]);

const data = ref(null);
const loading = ref(false);
const error = ref(null);
const showAll = ref(false);
const showIssuesOnly = ref(false);

function fmt(val) { return formatCurrency(val ?? 0); }

function statusClass(status) {
  switch (status) {
    case 'Ready': return 'bg-success';
    case 'MissingTaxId': return 'bg-danger';
    case 'MissingAddress': return 'bg-warning text-dark';
    case 'BelowThreshold': return 'bg-secondary';
    default: return 'bg-light text-dark';
  }
}

function statusLabel(status) {
  switch (status) {
    case 'Ready': return 'Ready';
    case 'MissingTaxId': return 'Missing Tax ID';
    case 'MissingAddress': return 'Missing Address';
    case 'BelowThreshold': return 'Below $600';
    default: return status;
  }
}

const filteredVendors = computed(() => {
  if (!data.value?.vendors) return [];
  let list = data.value.vendors;

  if (!showAll.value) {
    list = list.filter(v => v.is1099Required);
  }

  if (showIssuesOnly.value) {
    list = list.filter(v => v.status === 'MissingTaxId' || v.status === 'MissingAddress');
  }

  return list;
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data: resp } = await api.get('tax/1099', { params: { taxYear: taxYear.value } });
    data.value = resp;
  } catch (e) {
    if (e.response?.status === 401) {
      error.value = '1099 report access requires CFO or Admin role.';
    } else {
      error.value = e.response?.data?.message || e.message || 'Failed to generate 1099 report';
    }
  } finally {
    loading.value = false;
  }
}

function exportCsv() {
  window.open(`${api.defaults.baseURL}tax/1099/export?taxYear=${taxYear.value}&format=csv`, '_blank');
}

onMounted(() => load());
</script>
