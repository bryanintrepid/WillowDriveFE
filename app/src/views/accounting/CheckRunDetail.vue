<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex flex-wrap align-items-start justify-content-between">
        <!-- Left Side: Title and Status -->
        <div class="page-title mb-3 me-3">
          <h4>Check Run #{{ checkRun.apCheckRunId }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item"><a href="javascript: void(0);">Accounting</a></li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'accounting-check-runs' }">Check Runs</router-link></li>
            <li class="breadcrumb-item active">Detail</li>
          </ol>
          <div class="mt-2">
            <span v-if="!hasBeenPosted" class="badge bg-success-subtle text-success fs-13">Open</span>
            <router-link v-else :to="postedBatchRoute" class="badge bg-warning-subtle text-warning fs-13">Posted</router-link>
          </div>
        </div>

        <!-- Right Side: Actions -->
        <div class="d-flex flex-wrap gap-2">
          <!-- Print Buttons -->
          <div class="btn-group">
            <button type="button" class="btn btn-soft-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="ri-printer-line align-bottom"></i> Print Reports
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" @click.prevent="printReport('gl-summary')" :class="{ 'disabled': !hasBeenPosted }">G/L Summary</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="printReport('preview-disbursements')" :class="{ 'disabled': hasBeenPosted }">Preview Disbursements</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="printReport('check-register')" :class="{ 'disabled': !hasBeenPosted }">Check Register</a></li>
              <li><a class="dropdown-item" href="#" @click.prevent="printReport('vendor-ach')" :class="{ 'disabled': !hasBeenPosted }">Vendor ACH Report</a></li>
            </ul>
          </div>
          <!-- Main Actions -->
          <div class="btn-group">
            <button class="btn btn-primary" @click="startAdding" v-if="!isAdding" :disabled="hasBeenPosted">
              <i class="ri-add-line align-bottom"></i> Add Check
            </button>
            <button class="btn btn-warning" @click="stopAdding" v-else>
              <i class="ri-close-line align-bottom"></i> Close
            </button>
            <router-link :to="miscCheckRoute" class="btn btn-soft-primary" :class="{ 'disabled': hasBeenPosted }">
              Create Misc Check
            </router-link>
          </div>
          <!-- Run Actions -->
          <div class="btn-group">
            <button class="btn btn-success" @click="postCheckRun" :disabled="hasBeenPosted">Post</button>
            <button class="btn btn-info" @click="printAllChecks" :disabled="!hasBeenPosted">Print Checks</button>
            <button class="btn btn-info" @click="printAchStubs" :disabled="!hasBeenPosted">Print ACH Stubs</button>
          </div>
           <!-- Destructive Actions -->
          <div class="btn-group">
            <button class="btn btn-danger" @click="deleteCheckRun" :disabled="hasBeenPosted">Delete</button>
            <button class="btn btn-danger" @click="reverseCheckRun" :disabled="!hasBeenPosted">Reverse</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Check Form -->
    <div v-show="isAdding" class="card">
      <div class="card-body">
        <h5 class="card-title">Add Check</h5>
        <form @submit.prevent="addCheck">
          <div class="row">
            <div class="col-lg-4">
              <label class="form-label">Check Reference</label>
              <!-- Placeholder for typeahead component -->
              <input type="text" class="form-control" v-model="addingCheckRef" placeholder="Search for check reference...">
            </div>
          </div>
          <div class="mt-3">
            <button type="button" class="btn btn-secondary" @click="stopAdding">Cancel</button>
            <button type="submit" class="btn btn-primary ms-2">Add Check to Run</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Checks Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="!pagination.results.length" class="text-center my-4">
          <p class="text-muted fs-15">No A/P checks found</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-nowrap align-middle">
            <thead>
              <tr>
                <th style="width: 2%;"></th>
                <th style="width: 8%;" @click="sortBy('checkreference')">Reference</th>
                <th style="width: 20%;" @click="sortBy('payee')">Payee</th>
                <th style="width: 10%; text-align: right;" @click="sortBy('checkamount')">Amount</th>
                <th style="width: 10%;" @click="sortBy('paydate')">Pay On</th>
                <th style="width: 12%;">Payment Method</th>
                <th style="width: 10%;" @click="sortBy('checknumber')">Check No.</th>
                <th style="width: 10%;" @click="sortBy('checkingaccount')">Account</th>
                <th style="width: 8%;" @click="sortBy('datemodified')">Modified</th>
                <th style="width: 3%;"></th>
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
                    <router-link :to="{ name: 'accounting-payables-checks-detail', params: { checkId: check.apCheckId } }" :class="{ 'text-decoration-line-through': isReversed(check) }" :title="isReversed(check) ? 'This check has been reversed.' : ''">
                      {{ check.checkReference }}
                    </router-link>
                  </td>
                  <td>
                    <div v-if="check.miscellaneous">
                      <span>{{ check.payee }}</span>
                      <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: check.vendor.vendorId } }" class="text-danger ms-2" title="Miscellaneous check (no linked vendor)">
                        {{ check.vendor.vendorNumber }}
                      </router-link>
                    </div>
                    <div v-else>
                      <span>{{ check.vendor.name }}</span>
                      <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: check.vendor.vendorId } }" class="ms-2" :class="{'text-danger': check.vendor.isDeleted}" :title="check.vendor.isDeleted ? 'This vendor is deleted' : ''">
                        {{ check.vendor.vendorNumber }}
                        <i v-if="check.vendor.isDeleted" class="ri-alert-line"></i>
                      </router-link>
                    </div>
                  </td>
                  <td class="text-end">{{ formatCurrency(check.checkAmount) }}</td>
                  <td>{{ formatDate(check.payDate) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm" v-if="!hasBeenPosted">
                      <button type="button" class="btn" :class="check.paymentMethod === 'Check' ? 'btn-primary' : 'btn-outline-primary'" @click="updatePaymentMethod(check, 'Check')">Check</button>
                      <button type="button" class="btn" :class="check.paymentMethod === 'DirectDeposit' ? 'btn-primary' : 'btn-outline-primary'" @click="updatePaymentMethod(check, 'DirectDeposit')" :disabled="!check.vendor.isDirectDepositEnabled">Dir Dep</button>
                    </div>
                    <span v-else>{{ check.paymentMethod === 'DirectDeposit' ? 'Dir. Dep.' : 'Check' }}</span>
                  </td>
                  <td>
                    <span v-if="hasBeenPosted">
                      <span v-if="check.paymentMethod === 'Check'">{{ check.checkNumber }}</span>
                      <span v-else class="text-muted fst-italic">Dir. Dep.</span>
                    </span>
                  </td>
                  <td>
                     <router-link v-if="check.glBankCheckingAccount && check.glBankCheckingAccount.accountNumber" :to="{ name: 'accounting-detail', params: { fiscalYear: check.glBankCheckingAccount.fiscalYear, accountNumber: check.glBankCheckingAccount.accountNumber } }" :title="check.glBankCheckingAccount.description">
                        {{ check.glBankCheckingAccount.accountNumber }}
                     </router-link>
                  </td>
                  <td>{{ formatDate(check.dateModified) }}</td>
                  <td>
                    <button class="btn btn-sm btn-icon text-danger" @click="removeCheck(check)" v-if="!hasBeenPosted" title="Remove check from run">
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
        <Paginate v-if="pagination.results.length" :pagination="pagination" @page-changed="handlePageChange" class="mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Paginate from '@/components/Paginate.vue';

const route = useRoute();
const router = useRouter();

// --- State ---
const checkRunId = ref(route.params.checkRunId);
const isAdding = ref(false);
const addingCheckRef = ref('');

const queryParams = reactive({
  orderBy: 'paydate',
  orderDesc: true,
});

const checkRun = reactive({
  apCheckRunId: checkRunId.value,
  batchInfo: { posted: checkRunId.value % 2 === 0, batch: 12345 },
  paymentDate: '2024-07-30T00:00:00',
  companyId: 1,
});

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  results: [
    {
      apCheckId: 1,
      checkReference: 'CK-001',
      payee: 'Office Supplies Inc.',
      miscellaneous: false,
      vendor: { vendorId: 10, name: 'Office Supplies Inc.', vendorNumber: 'V1001', isDeleted: false, isDirectDepositEnabled: true },
      checkAmount: 250.75,
      payDate: '2024-07-29T00:00:00',
      paymentMethod: 'Check',
      checkNumber: '15001',
      glBankCheckingAccount: { accountNumber: '10100', description: 'Main Checking', fiscalYear: 2024 },
      dateModified: '2024-07-29T00:00:00',
      isReversedIndependently: false,
      expanded: false,
      checkDetailLines: [
        { invoiceReference: 'INV-123', amount: 150.00, discount: 0, netAmount: 150.00, glAccount: { accountNumber: '60100' }, invoiceDescription: 'Paper and pens' },
      ]
    },
  ],
});

// --- Computed Properties ---
const hasBeenPosted = computed(() => checkRun.batchInfo.posted);

const postedBatchRoute = computed(() => ({
  name: 'accounting-batch-detail',
  params: {
    companyName: 'default',
    fiscalYear: new Date(checkRun.paymentDate).getFullYear(),
    batchNumber: checkRun.batchInfo.batch,
  }
}));

const miscCheckRoute = computed(() => ({
  name: 'accounting-payables-checks-detail',
  params: {
    checkId: 0,
    checkRunId: checkRun.apCheckRunId,
    vendorId: 0,
    misc: true
  }
}));

// --- Methods ---
const fetchData = () => console.log('Fetching check run details...');
const sortBy = (field) => console.log(`Sorting by ${field}`);
const handlePageChange = (page) => console.log(`Fetching page ${page}`);

const startAdding = () => isAdding.value = true;
const stopAdding = () => isAdding.value = false;
const addCheck = () => {
  console.log('Adding check:', addingCheckRef.value);
  stopAdding();
};

const printReport = (reportType) => console.log(`Printing report: ${reportType}`);
const postCheckRun = () => console.log('Posting check run...');
const deleteCheckRun = () => window.confirm('Delete this entire check run?') && console.log('Deleting check run...');
const reverseCheckRun = () => console.log('Reversing check run...');
const printAllChecks = () => console.log('Printing all checks...');
const printAchStubs = () => console.log('Printing ACH stubs...');
const removeCheck = (check) => window.confirm(`Remove check ${check.checkReference}?`) && console.log('Removing check', check.apCheckId);
const updatePaymentMethod = (check, method) => {
  console.log(`Updating payment method for ${check.apCheckId} to ${method}`);
  check.paymentMethod = method;
};

const isReversed = (check) => check.isReversedIndependently;

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

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
.breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider, ">") !important;
  font-weight: bold;
  color: #495057;
}
.table th {
  cursor: pointer;
}
.text-decoration-line-through {
  text-decoration: line-through;
}
</style>
