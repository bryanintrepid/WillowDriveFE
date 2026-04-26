<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
        <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <div class="page-title">
                    <h4>General Ledger</h4>
                    <ol class="breadcrumb m-0 align-items-center">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="ri-home-fill"></i></router-link>
                        </li>
                        <li class="breadcrumb-item">Accounting</li>
                        <li class="breadcrumb-item active" aria-current="page">General Ledger</li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="card-title mb-0">Filters</h5>
              <div class="d-flex align-items-center gap-2">
                <router-link :to="{ name: 'accounting-batch-detail', params: { companyName: 'Willow Drive Nursery', fiscalYear: selectedFiscalYear, batchNumber: 'new' } }" class="btn btn-primary">Create Batch</router-link>
                <button class="btn btn-info btn-sm" @click="print"><i class="ri-printer-line align-bottom"></i> Print Register</button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="row gy-3">
              <div class="col-lg-8">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                  <span class="me-2">Show Journals:</span>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="generalJournal" v-model="queryParams.generalJournal">
                      <label class="form-check-label" for="generalJournal">General</label>
                  </div>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="salesJournal" v-model="queryParams.salesJournal">
                      <label class="form-check-label" for="salesJournal">Sales</label>
                  </div>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="cashDisbursements" v-model="queryParams.cashDisbursementsJournal">
                      <label class="form-check-label" for="cashDisbursements">Cash Disb.</label>
                  </div>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="purchases" v-model="queryParams.purchaseJournal">
                      <label class="form-check-label" for="purchases">Purchases</label>
                  </div>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="cashReceipts" v-model="queryParams.cashReceiptsJournal">
                      <label class="form-check-label" for="cashReceipts">Cash Receipts</label>
                  </div>
                  <div class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" id="payroll" v-model="queryParams.payrollJournal">
                      <label class="form-check-label" for="payroll">Payroll</label>
                  </div>
                </div>
              </div>
              <div class="col-lg-4">
                <div class="d-flex align-items-center gap-2">
                  <FiscalYearChooser v-model="selectedFiscalYear" :fiscal-year-choices="fiscalYearChoices" />
                  <div class="flex-grow-1">
                    <ClearableSearchInput v-model="queryParams.searchText" placeholder="Search batches..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card" id="transaction-list">
                <div class="card-body">
                    <div v-if="pagination.results.length">
                        <div class="table-responsive">
                            <table class="table table-nowrap align-middle">
                                <thead>
                                    <tr>
                                        <th style="width: 15%;" @click="sortBy('batch')">Batch</th>
                                        <th style="width: 15%;" @click="sortBy('journal')">Journal</th>
                                        <th style="width: 10%;" @click="sortBy('transactiondate')">Date</th>
                                        <th style="width: 10%; text-align: right;" @click="sortBy('totaldebit')">Total</th>
                                        <th style="width: 40%;" @click="sortBy('description')">Description</th>
                                        <th style="width: 10%;" @click="sortBy('createdby')">Created By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="(transaction, index) in pagination.results" :key="transaction.batch">
                                        <tr :class="{ 'table-light': index % 2 !== 0 }">
                                            <td>
                                                <button class="btn btn-sm btn-icon me-1" @click="toggleExpand(transaction)">
                                                <i :class="transaction.expanded ? 'ri-subtract-line' : 'ri-add-line'"></i>
                                                </button>
                                                <router-link :to="{ name: 'accounting-batch-detail', params: { companyName: 'Willow Drive Nursery', fiscalYear: getFiscalYear(transaction.transactionDate), batchNumber: transaction.batch } }">
                                                <span :class="{ 'text-decoration-line-through': transaction.reversedBy }" :title="transaction.reversedBy ? 'Reversed by batch ' + transaction.reversedBy.batch : ''">
                                                    {{ transaction.batch }}
                                                </span>
                                                </router-link>
                                                <button class="btn btn-sm btn-icon" :title="'Copy this batch'" @click="copyBatch(transaction)">
                                                <i class="ri-file-copy-line"></i>
                                                </button>
                                                <button class="btn btn-sm btn-icon" :title="'Print a summary of this batch'" @click="printBatch(transaction)">
                                                <i class="ri-printer-line"></i>
                                                </button>
                                            </td>
                                            <td>{{ journalNames[transaction.journal] }}</td>
                                            <td>{{ formatDate(transaction.transactionDate) }}</td>
                                            <td class="text-end">{{ formatCurrency(transaction.totalDebit) }}</td>
                                            <td>{{ transaction.description }}</td>
                                            <td>{{ transaction.creator }}</td>
                                        </tr>
                                        <tr v-if="transaction.expanded" :class="{ 'table-light': index % 2 !== 0 }">
                                            <td colspan="6" class="p-0">
                                                <div class="p-3">
                                                <table class="table table-sm table-bordered">
                                                    <thead class="table-light">
                                                    <tr>
                                                        <th>Account</th>
                                                        <th class="text-end">Debits</th>
                                                        <th class="text-end">Credits</th>
                                                        <th>Detail</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    <tr v-for="detail in transaction.glDetails" :key="detail.id">
                                                        <td>{{ detail.account.accountNumber }} - {{ detail.account.description }}</td>
                                                        <td class="text-end">{{ formatCurrency(detail.debit) }}</td>
                                                        <td class="text-end">{{ formatCurrency(detail.credit) }}</td>
                                                        <td>{{ detail.description }}</td>
                                                    </tr>
                                                    </tbody>
                                                    <tfoot>
                                                    <tr>
                                                        <th class="text-end">Totals:</th>
                                                        <th class="text-end">{{ formatCurrency(transaction.totalDebit) }}</th>
                                                        <th class="text-end">{{ formatCurrency(transaction.totalCredit) }}</th>
                                                        <th></th>
                                                    </tr>
                                                    </tfoot>
                                                </table>
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                        <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
                    </div>
                    <div v-if="!pagination.results.length" class="text-center my-4">
                        <p class="text-muted fs-15">No transactions found for the selected criteria.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

import FiscalYearChooser from '../../components/FiscalYearChooser.vue';
import ClearableSearchInput from '../../components/ClearableSearchInput.vue';
import Paginate from '../../components/Paginate.vue';
import api from '../../services/api';
import { useFilterStore } from '../../stores/filterStore';

const filterStore = useFilterStore();
const PAGE_KEY = 'generalLedger';
const router = useRouter();

// --- Reactive State ---
const queryParams = reactive({
  generalJournal: true,
  salesJournal: true,
  cashDisbursementsJournal: true,
  purchaseJournal: true,
  cashReceiptsJournal: true,
  payrollJournal: true,
  searchText: '',
});

const pagination = reactive({
  itemCount: 0,
  queryParams: {
    pageNumber: 1,
    pageSize: 50,
  },
  results: [],
});

const journalNames = {
  1: 'General',
  2: 'Sales',
  3: 'Cash Disbursements',
  4: 'Purchases',
  5: 'Cash Receipts',
  6: 'Payroll'
};

const journalMap = {
  generalJournal: 1,
  salesJournal: 2,
  cashDisbursementsJournal: 3,
  purchaseJournal: 4,
  cashReceiptsJournal: 5,
  payrollJournal: 6,
};

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);
const fiscalYearChoices = ref(
  Array.from({ length: 9 }, (_, i) => {
    const y = currentYear - 5 + i;
    return { value: y, text: y.toString() };
  })
);

let searchTimeout = null;

// Restore saved filters
const saved = filterStore.getFilters(PAGE_KEY);
if (saved) {
  if (saved.fiscalYear) selectedFiscalYear.value = saved.fiscalYear;
  if (saved.searchText) queryParams.searchText = saved.searchText;
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber;
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize;
  if (saved.journals) {
    for (const [key, val] of Object.entries(saved.journals)) {
      if (key in queryParams) queryParams[key] = val;
    }
  }
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    fiscalYear: selectedFiscalYear.value,
    searchText: queryParams.searchText,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
    journals: {
      generalJournal: queryParams.generalJournal,
      salesJournal: queryParams.salesJournal,
      cashDisbursementsJournal: queryParams.cashDisbursementsJournal,
      purchaseJournal: queryParams.purchaseJournal,
      cashReceiptsJournal: queryParams.cashReceiptsJournal,
      payrollJournal: queryParams.payrollJournal,
    },
  });
};

// --- Methods ---
const getSelectedJournals = () => {
  const selected = [];
  for (const [key, val] of Object.entries(journalMap)) {
    if (queryParams[key]) selected.push(val);
  }
  return selected;
};

const fetchData = async () => {
  try {
    const journals = getSelectedJournals();
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
    };
    if (journals.length > 0 && journals.length < 6) {
      params.journals = journals.join(',');
    }
    if (queryParams.searchText) params.search = queryParams.searchText;
    const response = await api.get(`transactions/${selectedFiscalYear.value}`, { params });
    const data = response.data;
    pagination.results = (data.items || []).map(t => ({
      ...t,
      expanded: false,
      glDetails: [],
      reversedBy: null,
    }));
    pagination.itemCount = data.totalCount || 0;
    saveFilters();
  } catch (err) {
    console.error('Failed to fetch transactions:', err);
  }
};

const loadDetails = async (transaction) => {
  if (transaction.glDetails?.length) return;
  try {
    const response = await api.get(`transactions/${selectedFiscalYear.value}`, {
      params: { search: transaction.batch, page: 1, pageSize: 1 }
    });
    // Use the batch detail endpoint if available, otherwise parse from the list
    // For now, we'll load details via the batch detail endpoint
    const batchResponse = await api.get(`batch/${selectedFiscalYear.value}/${transaction.batch}`);
    const batchData = batchResponse.data;
    transaction.glDetails = (batchData.lines || []).map(d => ({
      id: d.glDetailId,
      account: { accountNumber: d.accountNumber, description: d.accountDescription || '' },
      debit: d.debit || 0,
      credit: d.credit || 0,
      description: d.description || '',
    }));
  } catch (err) {
    console.error('Failed to load batch details:', err);
  }
};

const toggleExpand = async (transaction) => {
  transaction.expanded = !transaction.expanded;
  if (transaction.expanded) await loadDetails(transaction);
};

const sortBy = (field) => {
  // Server-side sorting not yet implemented; re-fetch resets
  fetchData();
};

const getFiscalYear = (dateString) => {
  if (!dateString) return selectedFiscalYear.value;
  const d = new Date(dateString);
  return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
};

const copyBatch = (transaction) => {
  router.push({ 
    name: 'accounting-batch-detail', 
    params: { 
      companyName: 'Willow Drive Nursery', 
      fiscalYear: getFiscalYear(transaction.transactionDate), 
      batchNumber: transaction.batch, 
      copyBatch: true 
    }
  });
};

const printBatch = (transaction) => {
    console.log(`Printing batch ${transaction.batch}`);
}

const print = () => {
    console.log('Printing transaction register');
}

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// --- Watchers ---
// Journal checkboxes and fiscal year: reset page and fetch immediately
watch([
  () => queryParams.generalJournal,
  () => queryParams.salesJournal,
  () => queryParams.cashDisbursementsJournal,
  () => queryParams.purchaseJournal,
  () => queryParams.cashReceiptsJournal,
  () => queryParams.payrollJournal,
  selectedFiscalYear,
], () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});

// Search text: debounce
watch(() => queryParams.searchText, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1;
    fetchData();
  }, 350);
});

// Paginator page/size changes
watch(() => pagination.queryParams.pageNumber, fetchData);
watch(() => pagination.queryParams.pageSize, () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});

// --- Initial Load ---
onMounted(fetchData);
onBeforeUnmount(saveFilters);

</script>

<style scoped>
.btn-icon {
    padding: 0.1rem 0.4rem;
}
</style>
