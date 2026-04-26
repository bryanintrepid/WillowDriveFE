<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div class="page-title">
          <h4>Bank Transactions</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item active" aria-current="page">Bank Transactions</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <input type="date" class="form-control form-control-sm" v-model="filters.fromDate" style="width: 150px;" />
          <span class="text-muted">to</span>
          <input type="date" class="form-control form-control-sm" v-model="filters.toDate" style="width: 150px;" />
          <select class="form-select form-select-sm" v-model="filters.creditOrDebit" style="width: 130px;">
            <option value="">All Types</option>
            <option value="D">Debits</option>
            <option value="C">Credits</option>
          </select>
          <select class="form-select form-select-sm" v-model="filters.matchedOnly" style="width: 140px;">
            <option :value="null">All Status</option>
            <option :value="true">Matched</option>
            <option :value="false">Unmatched</option>
          </select>
          <div style="width: 200px;">
            <ClearableSearchInput v-model="filters.searchText" placeholder="Search..." />
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <div v-if="!pagination.results.length" class="text-center my-4">
              <p class="text-muted fs-15">No bank transactions found</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-nowrap align-middle table-sm">
                <thead>
                  <tr>
                    <th style="width: 10%;" class="sortable" @click="sortBy('transactionEffectiveDate')">
                      Date <i :class="sortIcon('transactionEffectiveDate')"></i>
                    </th>
                    <th style="width: 6%;" class="sortable" @click="sortBy('creditOrDebitCode')">
                      Type <i :class="sortIcon('creditOrDebitCode')"></i>
                    </th>
                    <th style="width: 10%; text-align: right;" class="sortable" @click="sortBy('transactionAmount')">
                      Amount <i :class="sortIcon('transactionAmount')"></i>
                    </th>
                    <th style="width: 22%;">Description</th>
                    <th style="width: 8%;">Check #</th>
                    <th style="width: 12%;">BAI Code</th>
                    <th style="width: 20%;">Matched Check</th>
                    <th style="width: 7%;">Status</th>
                    <th style="width: 10%;">Synced</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="txn in sortedResults" :key="txn.keyBankTransactionId"
                      :class="rowClass(txn)">
                    <td>{{ formatDate(txn.transactionEffectiveDate) }}</td>
                    <td>
                      <span class="badge" :class="txn.creditOrDebitCode === 'C' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                        {{ txn.creditOrDebitCode === 'C' ? 'Credit' : 'Debit' }}
                      </span>
                    </td>
                    <td class="text-end fw-semibold">{{ formatCurrency(txn.transactionAmount) }}</td>
                    <td class="text-truncate" style="max-width: 250px;" :title="txn.transactionDescription">{{ txn.transactionDescription }}</td>
                    <td>{{ txn.checkSerialNumber || '—' }}</td>
                    <td><small>{{ txn.baiCodeDesc || txn.baiCode || '—' }}</small></td>
                    <td>
                      <template v-if="txn.matchedApCheckId">
                        <router-link :to="{ name: 'accounting-payables-checks-detail', params: { checkId: txn.matchedApCheckId } }">
                          {{ txn.matchedCheckReference }}
                        </router-link>
                        <small class="text-muted d-block">{{ txn.matchedPayee }}</small>
                      </template>
                      <span v-else class="text-muted">—</span>
                    </td>
                    <td>
                      <span v-if="txn.matchedApCheckId" class="badge bg-success-subtle text-success">Matched</span>
                      <span v-else-if="txn.creditOrDebitCode === 'D'" class="badge bg-warning-subtle text-warning">Unmatched</span>
                      <span v-else class="badge bg-light text-muted">N/A</span>
                    </td>
                    <td><small class="text-muted">{{ formatDate(txn.dateSynced) }}</small></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import ClearableSearchInput from '@/components/ClearableSearchInput.vue';
import Paginate from '@/components/Paginate.vue';
import api from '../../services/api';

// --- State ---
const filters = reactive({
  fromDate: '',
  toDate: '',
  creditOrDebit: '',
  matchedOnly: null,
  searchText: '',
});

const sortField = ref('transactionEffectiveDate');
const sortDesc = ref(true);

const pagination = reactive({
  itemCount: 0,
  queryParams: { pageNumber: 1, pageSize: 50 },
  results: [],
});

// --- Sorting ---
const sortBy = (field) => {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = false;
  }
};

const sortIcon = (field) => {
  if (sortField.value !== field) return 'ri-arrow-up-down-line text-muted opacity-25';
  return sortDesc.value ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line';
};

const sortedResults = computed(() => {
  const data = [...pagination.results];
  const field = sortField.value;
  const desc = sortDesc.value;
  data.sort((a, b) => {
    let valA = a[field], valB = b[field];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;
    if (typeof valA === 'number') return desc ? valB - valA : valA - valB;
    if (field.includes('Date') || field.includes('date')) return desc ? new Date(valB) - new Date(valA) : new Date(valA) - new Date(valB);
    return desc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
  });
  return data;
});

// --- Methods ---
const fetchData = async () => {
  try {
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
    };
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.creditOrDebit) params.creditOrDebit = filters.creditOrDebit;
    if (filters.matchedOnly !== null) params.matchedOnly = filters.matchedOnly;
    if (filters.searchText) params.searchText = filters.searchText;

    const response = await api.get('bank-transactions', { params });
    const data = response.data;
    pagination.results = data.items || [];
    pagination.itemCount = data.totalCount || 0;
  } catch (err) {
    console.error('Failed to fetch bank transactions:', err);
  }
};

const rowClass = (txn) => {
  if (txn.matchedApCheckId) return 'table-success bg-opacity-10';
  if (txn.creditOrDebitCode === 'D') return 'table-warning bg-opacity-10';
  return '';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US');
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// --- Watchers ---
let searchTimeout = null;
watch(() => filters.searchText, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { pagination.queryParams.pageNumber = 1; fetchData(); }, 350);
});
watch(() => filters.fromDate, () => { pagination.queryParams.pageNumber = 1; fetchData(); });
watch(() => filters.toDate, () => { pagination.queryParams.pageNumber = 1; fetchData(); });
watch(() => filters.creditOrDebit, () => { pagination.queryParams.pageNumber = 1; fetchData(); });
watch(() => filters.matchedOnly, () => { pagination.queryParams.pageNumber = 1; fetchData(); });
watch(() => pagination.queryParams.pageNumber, fetchData);
watch(() => pagination.queryParams.pageSize, () => { pagination.queryParams.pageNumber = 1; fetchData(); });

// --- Initial Load ---
fetchData();
</script>

<style scoped>
.dashhead {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
.page-title h4 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.sortable {
  cursor: pointer;
  user-select: none;
}
.sortable:hover {
  background-color: rgba(0,0,0,.03);
}
.sortable i {
  font-size: 0.75rem;
  vertical-align: middle;
}
</style>
