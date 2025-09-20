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
                                                <button class="btn btn-sm btn-icon me-1" @click="transaction.expanded = !transaction.expanded">
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
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';

import FiscalYearChooser from '../../components/FiscalYearChooser.vue';
import ClearableSearchInput from '../../components/ClearableSearchInput.vue';
import Paginate from '../../components/Paginate.vue';

const router = useRouter();

// --- Page Header --- 


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
  results: [
    // Sample Data - Replace with API call
    {
      batch: '2024-001',
      journal: 1,
      transactionDate: '2024-07-28T00:00:00',
      totalDebit: 1500.00,
      totalCredit: 1500.00,
      description: 'Sample journal entry for office supplies',
      creator: 'user1',
      expanded: false,
      reversedBy: null,
      glDetails: [
        { id: 1, account: { accountNumber: '60100', description: 'Office Supplies' }, debit: 1500.00, credit: 0, description: 'Pens and paper' },
        { id: 2, account: { accountNumber: '10100', description: 'Cash in Bank' }, debit: 0, credit: 1500.00, description: 'Payment for supplies' },
      ]
    },
    {
      batch: '2024-002',
      journal: 2,
      transactionDate: '2024-07-27T00:00:00',
      totalDebit: 5000.00,
      totalCredit: 5000.00,
      description: 'Sales invoice #INV-123',
      creator: 'user2',
      expanded: false,
      reversedBy: { batch: '2024-003' },
      glDetails: [
        { id: 3, account: { accountNumber: '12000', description: 'Accounts Receivable' }, debit: 5000.00, credit: 0, description: 'Sale to Customer A' },
        { id: 4, account: { accountNumber: '40100', description: 'Sales Revenue' }, debit: 0, credit: 5000.00, description: 'Product sales' },
      ]
    }
  ],
  // ... other pagination properties like total, perPage, etc.
});

const journalNames = {
  1: 'General',
  2: 'Sales',
  3: 'Cash Disbursements',
  4: 'Purchases',
  5: 'Cash Receipts',
  6: 'Payroll'
};

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);
const fiscalYearChoices = ref([
  { value: currentYear + 1, text: (currentYear + 1).toString() },
  { value: currentYear, text: currentYear.toString() },
  { value: currentYear - 1, text: (currentYear - 1).toString() },
]);

// --- Methods ---
const fetchData = () => {
  console.log('Fetching data with params:', { ...queryParams, year: selectedFiscalYear.value });
  // API call to fetch transactions would go here
};

const sortBy = (field) => {
  console.log(`Sorting by ${field}`);
  // Add sorting logic and re-fetch data
};

const getFiscalYear = (dateString) => {
  return new Date(dateString).getFullYear();
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
    // Logic to open a new tab with the printable report
}

const print = () => {
    console.log('Printing transaction register');
    // Logic to open a new tab with the printable report
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
watch([queryParams, selectedFiscalYear], () => {
  fetchData();
}, { deep: true });

// Initial data fetch
fetchData();

</script>

<style scoped>
.btn-icon {
    padding: 0.1rem 0.4rem;
}
</style>
