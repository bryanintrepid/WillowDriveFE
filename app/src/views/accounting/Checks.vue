<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div class="page-title">
          <h4>Checks</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item active" aria-current="page">Checks</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <FiscalYearChooser v-model="selectedFiscalYear" :fiscal-year-choices="fiscalYearChoices" show-all-years-option />
          <div style="width: 250px;">
            <ClearableSearchInput v-model="queryParams.searchText" placeholder="Search checks..." />
          </div>
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle no-caret" data-bs-toggle="dropdown" :disabled="syncing">
              <i :class="syncing ? 'ri-loader-4-line spin' : 'ri-bank-line'" class="align-bottom"></i>
              {{ syncing ? 'Syncing...' : 'Sync Bank Data' }}
            </button>
            <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 280px;" @click.stop>
              <button class="btn btn-outline-primary btn-sm w-100 mb-3" @click="syncBankData()" :disabled="syncing">
                <i class="ri-refresh-line"></i> Sync Yesterday
              </button>
              <label class="form-label fw-semibold mb-2">Custom Date Range</label>
              <div class="d-flex gap-2 mb-2">
                <input type="date" class="form-control form-control-sm" v-model="syncFromDate" />
                <input type="date" class="form-control form-control-sm" v-model="syncToDate" />
              </div>
              <button class="btn btn-primary btn-sm w-100" @click="syncBankData(syncFromDate, syncToDate)" :disabled="syncing || !syncFromDate || !syncToDate">
                <i class="ri-calendar-line"></i> Sync Range
              </button>
            </div>
          </div>
          <router-link :to="{ name: 'accounting-payables-checks-detail', params: { checkId: 0, vendorId: 0, misc: true } }" class="btn btn-primary">
            <i class="ri-add-line align-bottom"></i> Add Misc Check
          </router-link>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header p-0 border-bottom-0">
            <ul class="nav nav-tabs nav-tabs-custom" role="tablist">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'all' }" href="#" @click.prevent="activeTab = 'all'">
                  All Checks <span class="badge bg-secondary-subtle text-secondary ms-1">{{ allCount }}</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'unreconciled' }" href="#" @click.prevent="activeTab = 'unreconciled'">
                  Unreconciled <span class="badge bg-warning-subtle text-warning ms-1">{{ unreconciledCount }}</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: activeTab === 'stale' }" href="#" @click.prevent="activeTab = 'stale'">
                  Stale (90+ days) <span class="badge bg-danger-subtle text-danger ms-1">{{ staleCount }}</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="card-body">
            <div v-if="!displayedResults.length" class="text-center my-4">
              <p class="text-muted fs-15">{{ activeTab === 'unreconciled' ? 'All checks are reconciled' : activeTab === 'stale' ? 'No stale checks' : 'No checks found' }}</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-nowrap align-middle">
                <thead>
                  <tr>
                    <th style="width: 2%;"></th>
                    <th style="width: 8%;" class="sortable" @click="sortBy('checkReference')">
                      Reference <i :class="sortIcon('checkReference')"></i>
                    </th>
                    <th style="width: 25%;" class="sortable" @click="sortBy('vendorName')">
                      Vendor / Payee <i :class="sortIcon('vendorName')"></i>
                    </th>
                    <th style="width: 8%;" class="sortable" @click="sortBy('checkNumber')">
                      Check # <i :class="sortIcon('checkNumber')"></i>
                    </th>
                    <th style="width: 10%;" class="sortable" @click="sortBy('payDate')">
                      Pay Date <i :class="sortIcon('payDate')"></i>
                    </th>
                    <th style="width: 10%; text-align: right;" class="sortable" @click="sortBy('checkAmount')">
                      Amount <i :class="sortIcon('checkAmount')"></i>
                    </th>
                    <th style="width: 5%; text-align: center;" class="sortable" @click="sortBy('bankCleared')">
                      Bank <i :class="sortIcon('bankCleared')"></i>
                    </th>
                    <th style="width: 10%;" class="sortable" @click="sortBy('glBankCheckingAccountNumber')">
                      Account <i :class="sortIcon('glBankCheckingAccountNumber')"></i>
                    </th>
                    <th style="width: 10%;" class="sortable" @click="sortBy('dateModified')">
                      Last Modified <i :class="sortIcon('dateModified')"></i>
                    </th>
                    <th style="width: 5%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(check, index) in displayedResults" :key="check.apCheckId">
                    <tr :class="{ 'table-light': index % 2 !== 0 }">
                      <td>
                        <button class="btn btn-sm btn-icon" @click="toggleExpand(check)">
                          <i :class="check.expanded ? 'ri-subtract-line' : 'ri-add-line'"></i>
                        </button>
                      </td>
                      <td>
                        <router-link :to="{ name: 'accounting-payables-checks-detail', params: { checkId: check.apCheckId } }">
                          <span :class="{ 'text-decoration-line-through': check.isReversed }" :title="check.isReversed ? 'This check has been reversed.' : ''">
                            {{ check.checkReference }}
                          </span>
                        </router-link>
                      </td>
                      <td>
                         <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: check.vendor.vendorId } }" :class="{'text-danger': check.vendor.isDeleted}" :title="check.vendor.isDeleted ? 'This vendor is deleted' : ''">
                            {{ check.vendor.name }}
                            <i v-if="check.vendor.isDeleted" class="ri-alert-line"></i>
                        </router-link>
                      </td>
                      <td>{{ check.checkNumber }}</td>
                      <td>{{ formatDate(check.payDate) }}</td>
                      <td class="text-end">{{ formatCurrency(check.checkAmount) }}</td>
                      <td class="text-center">
                        <i v-if="check.bankCleared && !check.amountMismatch" class="ri-checkbox-circle-fill text-success" :title="'Cleared ' + formatDate(check.bankClearedDate)"></i>
                        <i v-else-if="check.amountMismatch" class="ri-error-warning-fill text-warning" :title="'Amount mismatch — Check: ' + formatCurrency(check.checkAmount) + ', Bank: ' + formatCurrency(check.bankTransactionAmount)"></i>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td>
                        <router-link v-if="check.glBankCheckingAccount && check.glBankCheckingAccount.accountNumber" :to="{ name: 'accounting-detail', params: { fiscalYear: check.glBankCheckingAccount.fiscalYear, accountNumber: check.glBankCheckingAccount.accountNumber } }" :title="check.glBankCheckingAccount.description">
                          {{ check.glBankCheckingAccount.accountNumber }}
                        </router-link>
                        <span v-else><em>None</em></span>
                      </td>
                      <td>{{ formatDate(check.dateModified) }}</td>
                      <td>
                        <button v-if="!check.isReversed" class="btn btn-sm btn-soft-danger" @click="deleteCheck(check.apCheckId)">
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="check.expanded" :class="{ 'table-light': index % 2 !== 0 }">
                      <td colspan="10" class="p-0">
                        <div class="p-3">
                          <table class="table table-sm table-bordered">
                            <thead class="table-light">
                              <tr>
                                <th>Invoice</th>
                                <th class="text-end">Amount</th>
                                <th class="text-end">Discount</th>
                                <th class="text-end">Net</th>
                                <th>GL Account</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="detail in check.checkDetailLines" :key="detail.invoiceReference">
                                <td>
                                  <router-link :to="{ name: 'accounting-payables-invoices-detail', params: { vendorId: check.vendor.vendorId, invoiceNumber: detail.invoiceReference } }">
                                    {{ detail.invoiceReference }}
                                  </router-link>
                                </td>
                                <td class="text-end">{{ formatCurrency(detail.amount) }}</td>
                                <td class="text-end">{{ formatCurrency(detail.discount) }}</td>
                                <td class="text-end">{{ formatCurrency(detail.netAmount) }}</td>
                                <td>{{ detail.glAccount ? detail.glAccount.accountNumber : 'N/A' }}</td>
                                <td>{{ detail.invoiceDescription }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <div v-if="lastSyncDate" class="text-muted small mt-2">
              <i class="ri-time-line"></i> Last bank sync: {{ formatDate(lastSyncDate) }}
            </div>
            <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
          </div>
        </div>
      </div>
    </div>
    <!-- Toast notification -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1080;">
      <div ref="toastEl" class="toast align-items-center border-0" :class="toastClass" role="alert">
        <div class="d-flex">
          <div class="toast-body text-white">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue';
import { Toast } from 'bootstrap';
import FiscalYearChooser from '@/components/FiscalYearChooser.vue';
import ClearableSearchInput from '@/components/ClearableSearchInput.vue';
import Paginate from '@/components/Paginate.vue';
import api from '../../services/api';
import { useFilterStore } from '../../stores/filterStore';

const filterStore = useFilterStore();
const PAGE_KEY = 'checks';

// --- State ---
const activeTab = ref('all');

const queryParams = reactive({
  searchText: '',
});

const sortField = ref('payDate');
const sortDesc = ref(true);

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);
const fiscalYearChoices = ref([
  { value: 0, text: 'All Years' },
  ...Array.from({ length: 9 }, (_, i) => {
    const y = currentYear - 5 + i;
    return { value: y, text: y.toString() };
  }),
]);

const pagination = reactive({
  itemCount: 0,
  queryParams: {
    pageNumber: 1,
    pageSize: 50,
  },
  results: [],
});

const syncing = ref(false);
const lastSyncDate = ref(null);
const allCount = ref(0);
const unreconciledCount = ref(0);
const staleCount = ref(0);
const syncFromDate = ref('');
const syncToDate = ref('');
const toastEl = ref(null);
const toastMessage = ref('');
const toastClass = ref('bg-success');

let toastInstance = null;
const showToast = (message, type = 'success') => {
  toastMessage.value = message;
  toastClass.value = type === 'success' ? 'bg-success' : 'bg-danger';
  if (toastEl.value) {
    if (!toastInstance) toastInstance = new Toast(toastEl.value, { delay: 2000 });
    toastInstance.show();
  }
};

// Restore saved filters
const saved = filterStore.getFilters(PAGE_KEY);
if (saved) {
  if (saved.fiscalYear != null) selectedFiscalYear.value = saved.fiscalYear;
  if (saved.searchText) queryParams.searchText = saved.searchText;
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber;
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize;
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    fiscalYear: selectedFiscalYear.value,
    searchText: queryParams.searchText,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
  });
};

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
    let valA = getNestedValue(a, field);
    let valB = getNestedValue(b, field);

    // Handle nulls
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    // Numeric
    if (typeof valA === 'number' && typeof valB === 'number') {
      return desc ? valB - valA : valA - valB;
    }

    // Boolean
    if (typeof valA === 'boolean') {
      return desc ? (valB === valA ? 0 : valB ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
    }

    // Date strings
    if (field === 'payDate' || field === 'dateModified' || field === 'bankClearedDate') {
      const dA = new Date(valA);
      const dB = new Date(valB);
      return desc ? dB - dA : dA - dB;
    }

    // String
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return desc ? strB.localeCompare(strA) : strA.localeCompare(strB);
  });

  return data;
});

const getNestedValue = (obj, field) => {
  if (field === 'vendorName') return obj.vendor?.name;
  return obj[field];
};

// --- Tabs ---
const displayedResults = computed(() => sortedResults.value);

// --- Methods ---
const fetchData = async () => {
  try {
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
    };
    if (selectedFiscalYear.value > 0) params.fiscalYear = selectedFiscalYear.value;
    if (queryParams.searchText) params.searchText = queryParams.searchText;
    if (activeTab.value === 'unreconciled') params.unreconciledOnly = true;
    if (activeTab.value === 'stale') params.staleOnly = true;
    const response = await api.get('ap-checks', { params });
    const data = response.data;
    pagination.results = (data.items || []).map(c => ({
      ...c,
      expanded: false,
      bankCleared: false,
      bankClearedDate: null,
      bankTransactionAmount: null,
      amountMismatch: false,
      vendor: { vendorId: c.vendorId, name: c.vendorName, isDeleted: c.vendorIsDeleted },
      glBankCheckingAccount: { accountNumber: c.glBankCheckingAccountNumber, description: c.glBankCheckingAccountDescription, fiscalYear: selectedFiscalYear.value },
      checkDetailLines: [],
    }));
    pagination.itemCount = data.totalCount || 0;
    saveFilters();
    await fetchBankStatuses();
    await fetchTabCounts();
  } catch (err) {
    console.error('Failed to fetch checks:', err);
  }
};

const fetchTabCounts = async () => {
  try {
    const baseParams = {};
    if (selectedFiscalYear.value > 0) baseParams.fiscalYear = selectedFiscalYear.value;
    if (queryParams.searchText) baseParams.searchText = queryParams.searchText;

    const [allRes, unreconRes, staleRes] = await Promise.all([
      api.get('ap-checks', { params: { ...baseParams, page: 1, pageSize: 1 } }),
      api.get('ap-checks', { params: { ...baseParams, page: 1, pageSize: 1, unreconciledOnly: true } }),
      api.get('ap-checks', { params: { ...baseParams, page: 1, pageSize: 1, staleOnly: true } }),
    ]);
    allCount.value = allRes.data.totalCount || 0;
    unreconciledCount.value = unreconRes.data.totalCount || 0;
    staleCount.value = staleRes.data.totalCount || 0;
  } catch (err) {
    // Non-critical — counts just won't update
  }
};

const fetchBankStatuses = async () => {
  const checkIds = pagination.results.map(c => c.apCheckId).filter(Boolean);
  if (!checkIds.length) return;
  try {
    const response = await api.get('bank-reconciliation/check-statuses', { params: { checkIds: checkIds.join(',') } });
    const statuses = response.data || [];
    const statusMap = {};
    statuses.forEach(s => { statusMap[s.apCheckId] = s; });
    pagination.results.forEach(check => {
      const status = statusMap[check.apCheckId];
      if (status) {
        check.bankCleared = status.bankCleared;
        check.bankClearedDate = status.bankClearedDate;
        check.bankTransactionAmount = status.bankTransactionAmount;
        check.amountMismatch = status.amountMismatch;
      }
    });
  } catch (err) {
    console.error('Failed to fetch bank statuses:', err);
  }
};

const syncBankData = async (fromDate, toDate) => {
  syncing.value = true;
  try {
    const body = {};
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;
    const response = await api.post('bank-reconciliation/sync', body);
    const result = response.data;
    showToast(result.message || 'Sync complete', 'success');
    await fetchData();
    await fetchLastSync();
  } catch (err) {
    showToast(err.response?.data || err.message || 'Sync failed', 'error');
  } finally {
    syncing.value = false;
  }
};

const fetchLastSync = async () => {
  try {
    const response = await api.get('bank-reconciliation/last-sync');
    lastSyncDate.value = response.data?.lastSyncDate;
  } catch (err) {
    // Ignore — just means no sync has happened yet
  }
};

const deleteCheck = async (id) => {
  if (!window.confirm('Are you sure you want to delete this check?')) return;
  try {
    await api.delete(`ap-checks/${id}`);
    await fetchData();
  } catch (err) {
    showToast(err.response?.data || err.message || 'Failed to delete check', 'error');
  }
};

const loadCheckDetails = async (check) => {
  if (check.checkDetailLines?.length) return;
  try {
    const response = await api.get(`ap-checks/${check.apCheckId}`);
    check.checkDetailLines = (response.data.checkDetailLines || []).map(d => ({
      ...d,
      glAccount: { accountNumber: d.glAccountNumber },
    }));
  } catch (err) {
    console.error('Failed to load check details:', err);
  }
};

const toggleExpand = async (check) => {
  check.expanded = !check.expanded;
  if (check.expanded) await loadCheckDetails(check);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// --- Watchers ---
let searchTimeout = null;

watch(() => queryParams.searchText, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1;
    fetchData();
  }, 350);
});

watch(selectedFiscalYear, () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});

watch(activeTab, () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});

watch(() => pagination.queryParams.pageNumber, fetchData);
watch(() => pagination.queryParams.pageSize, () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});

// --- Initial Load ---
fetchData();
fetchLastSync();

onBeforeUnmount(() => {
  clearTimeout(searchTimeout);
  saveFilters();
});

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
.btn-icon {
    padding: 0.1rem 0.4rem;
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
.no-caret::after {
  display: none !important;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spin {
  animation: spin 1s linear infinite;
}
.nav-tabs-custom .nav-link {
  padding: 0.75rem 1.25rem;
  color: #495057;
  background-color: #f8f9fa;
  border-color: #dee2e6 #dee2e6 transparent;
}
.nav-tabs-custom .nav-link.active {
  color: #0d6efd;
  background-color: #fff;
  border-bottom-color: #fff;
  font-weight: 600;
}
</style>
