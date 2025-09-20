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
          <router-link :to="{ name: 'accounting-payables-checks-detail', params: { checkId: 0, vendorId: 0, misc: true } }" class="btn btn-primary">
            <i class="ri-add-line align-bottom"></i> Add Misc Check
          </router-link>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <div v-if="!pagination.results.length" class="text-center my-4">
              <p class="text-muted fs-15">No checks found</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-nowrap align-middle">
                <thead>
                  <tr>
                    <th style="width: 2%;"></th>
                    <th style="width: 8%;" @click="sortBy('checkreference')">Reference</th>
                    <th style="width: 30%;" @click="sortBy('vendorno')">Vendor / Payee</th>
                    <th style="width: 10%;" @click="sortBy('checknumber')">Check #</th>
                    <th style="width: 10%;" @click="sortBy('paydate')">Pay Date</th>
                    <th style="width: 10%; text-align: right;" @click="sortBy('checkamount')">Amount</th>
                    <th style="width: 10%;" @click="sortBy('checkingaccount')">Account</th>
                    <th style="width: 10%;" @click="sortBy('datemodified')">Last Modified</th>
                    <th style="width: 10%;"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(check, index) in pagination.results" :key="check.apCheckId">
                    <tr :class="{ 'table-light': index % 2 !== 0 }">
                      <td>
                        <button class="btn btn-sm btn-icon" @click="check.expanded = !check.expanded">
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
                      <td colspan="9" class="p-0">
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
            <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import FiscalYearChooser from '@/components/FiscalYearChooser.vue';
import ClearableSearchInput from '@/components/ClearableSearchInput.vue';
import Paginate from '@/components/Paginate.vue';

// --- State ---
const queryParams = reactive({
  searchText: '',
  orderBy: 'paydate',
  orderDesc: true,
});

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);
const fiscalYearChoices = ref([
  { value: 0, text: 'All Years' },
  { value: currentYear + 1, text: (currentYear + 1).toString() },
  { value: currentYear, text: currentYear.toString() },
  { value: currentYear - 1, text: (currentYear - 1).toString() },
]);

const pagination = reactive({
  results: [
    // Sample Data
    {
      apCheckId: 1,
      checkReference: 'CK-001',
      vendor: { vendorId: 10, name: 'Office Supplies Inc.', isDeleted: false },
      checkNumber: '15001',
      payDate: '2024-07-29T00:00:00',
      checkAmount: 250.75,
      glBankCheckingAccount: { accountNumber: '10100', description: 'Main Checking', fiscalYear: 2024 },
      dateModified: '2024-07-29T00:00:00',
      isReversed: false,
      expanded: false,
      checkDetailLines: [
        { invoiceReference: 'INV-123', amount: 150.00, discount: 0, netAmount: 150.00, glAccount: { accountNumber: '60100' }, invoiceDescription: 'Paper and pens' },
        { invoiceReference: 'INV-124', amount: 100.75, discount: 0, netAmount: 100.75, glAccount: { accountNumber: '60200' }, invoiceDescription: 'Toner' },
      ]
    },
    {
      apCheckId: 2,
      checkReference: 'CK-002',
      vendor: { vendorId: 20, name: 'Utility Company', isDeleted: true },
      checkNumber: '15002',
      payDate: '2024-07-28T00:00:00',
      checkAmount: 1200.00,
      glBankCheckingAccount: { accountNumber: '10100', description: 'Main Checking', fiscalYear: 2024 },
      dateModified: '2024-07-28T00:00:00',
      isReversed: true,
      expanded: false,
      checkDetailLines: [
        { invoiceReference: 'UTIL-555', amount: 1200.00, discount: 0, netAmount: 1200.00, glAccount: { accountNumber: '60500' }, invoiceDescription: 'Electricity Bill' },
      ]
    },
  ],
  // ... other pagination properties
});

// --- Methods ---
const fetchData = () => {
  console.log('Fetching checks with params:', { ...queryParams, year: selectedFiscalYear.value });
  // API call would go here
};

const sortBy = (field) => {
  if (queryParams.orderBy === field) {
    queryParams.orderDesc = !queryParams.orderDesc;
  } else {
    queryParams.orderBy = field;
    queryParams.orderDesc = false;
  }
  fetchData();
};

const deleteCheck = (id) => {
  console.log(`Deleting check ${id}`);
  // API call to delete and then re-fetch data
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
watch([queryParams, selectedFiscalYear], fetchData, { deep: true });

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
.btn-icon {
    padding: 0.1rem 0.4rem;
}
.table th {
  cursor: pointer;
}
</style>
