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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Paginate from '@/components/Paginate.vue';
import api from '../../services/api';

const route = useRoute();
const router = useRouter();

// --- State ---
const checkRunId = ref(parseInt(route.params.checkRunId) || 0);
const isAdding = ref(false);
const addingCheckRef = ref('');

const queryParams = reactive({
  orderBy: 'paydate',
  orderDesc: true,
});

const checkRun = reactive({
  apCheckRunId: checkRunId.value,
  batchInfo: { posted: false, batch: null },
  paymentDate: '',
  companyId: 1,
});

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  results: [],
});

// --- Computed Properties ---
const hasBeenPosted = computed(() => checkRun.batchInfo.posted);

const postedBatchRoute = computed(() => ({
  name: 'accounting-batch-detail',
  params: {
    companyName: 'default',
    fiscalYear: checkRun.paymentDate ? new Date(checkRun.paymentDate).getFullYear() : new Date().getFullYear(),
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
const fetchData = async () => {
  if (!checkRunId.value || checkRunId.value === 0) return;
  try {
    const response = await api.get(`ap-check-runs/${checkRunId.value}`);
    const data = response.data;
    checkRun.apCheckRunId = data.apCheckRunId;
    checkRun.batchInfo = { posted: data.posted, batch: data.postingBatch };
    checkRun.paymentDate = data.paymentDate;
    checkRun.companyId = data.companyId;
    pagination.results = (data.checks || []).map(c => ({
      ...c,
      expanded: false,
      vendor: { vendorId: c.vendorId, name: c.vendorName, vendorNumber: c.vendorNumber, isDeleted: c.vendorIsDeleted, isDirectDepositEnabled: false },
      glBankCheckingAccount: { accountNumber: c.glBankCheckingAccountNumber, description: '', fiscalYear: new Date().getFullYear() },
      isReversedIndependently: c.isReversed,
      checkDetailLines: [],
    }));
  } catch (err) {
    console.error('Failed to fetch check run:', err);
  }
};

const sortBy = (field) => {
  if (queryParams.orderBy === field) queryParams.orderDesc = !queryParams.orderDesc;
  else { queryParams.orderBy = field; queryParams.orderDesc = false; }
};
const handlePageChange = (page) => { pagination.currentPage = page; };

const startAdding = () => isAdding.value = true;
const stopAdding = () => isAdding.value = false;
const addCheck = async () => {
  // addingCheckRef would be a check ID to add to this run
  const cid = parseInt(addingCheckRef.value);
  if (!cid) { alert('Enter a valid check ID'); return; }
  try {
    await api.post(`ap-check-runs/${checkRunId.value}/add-check/${cid}`);
    stopAdding();
    await fetchData();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to add check');
  }
};

const printReport = (reportType) => {
  if (reportType === 'vendor-ach') {
    window.open(`/api/ap-check-runs/${checkRunId.value}/ach-export`, '_blank');
  } else {
    alert(`Print report: ${reportType} (not yet implemented)`);
  }
};
const postCheckRun = async () => {
  if (!window.confirm('Post this check run? This will create a GL batch.')) return;
  try {
    const result = await api.post('ap-check-runs/post', {
      apCheckRunId: checkRunId.value,
      companyId: checkRun.companyId,
      paymentDate: checkRun.paymentDate,
      reverse: false,
    });
    alert(`Check run posted. Batch: ${result.data.batch}`);
    await fetchData();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to post check run');
  }
};
const deleteCheckRun = async () => {
  if (!window.confirm('Delete this entire check run?')) return;
  try {
    await api.delete(`ap-check-runs/${checkRunId.value}`);
    router.push({ name: 'accounting-check-runs' });
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to delete check run');
  }
};
const reverseCheckRun = async () => {
  if (!window.confirm('Reverse this check run? This will create a reversing GL batch.')) return;
  try {
    const result = await api.post('ap-check-runs/reverse', {
      apCheckRunId: checkRunId.value,
      companyId: checkRun.companyId,
      paymentDate: checkRun.paymentDate,
      reverse: true,
    });
    alert(`Check run reversed. Batch: ${result.data.batch}`);
    await fetchData();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to reverse check run');
  }
};
const printAllChecks = async () => {
  try {
    const response = await api.get(`ap-check-runs/${checkRunId.value}/print-data`);
    const printData = response.data;
    if (!printData.length) { alert('No checks to print.'); return; }
    const printWindow = window.open('', '_blank');
    let html = '<html><head><title>Check Print</title><style>body{font-family:monospace;} .check{page-break-after:always;padding:20px;} table{width:100%;border-collapse:collapse;} td,th{border:1px solid #ccc;padding:4px;text-align:left;}</style></head><body>';
    for (const c of printData) {
      html += `<div class="check"><h2>Check #${c.checkNumber || c.checkReference}</h2><p><strong>Pay to:</strong> ${c.payee || c.vendorName}</p><p>${c.street || ''} ${c.city || ''} ${c.state || ''} ${c.zip || ''}</p><p><strong>Amount:</strong> $${c.checkAmount.toFixed(2)}</p><table><tr><th>Invoice</th><th>Description</th><th>Amount</th><th>Discount</th><th>Net</th></tr>`;
      for (const l of c.lines) { html += `<tr><td>${l.invoiceReference||''}</td><td>${l.invoiceDescription||''}</td><td>${l.amount.toFixed(2)}</td><td>${l.discount.toFixed(2)}</td><td>${l.netAmount.toFixed(2)}</td></tr>`; }
      html += '</table></div>';
    }
    html += '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to load print data');
  }
};
const printAchStubs = () => {
  window.open(`/api/ap-check-runs/${checkRunId.value}/ach-export`, '_blank');
};

const removeCheck = async (check) => {
  if (!window.confirm(`Remove check ${check.checkReference}?`)) return;
  try {
    await api.post(`ap-check-runs/${checkRunId.value}/remove-check/${check.apCheckId}`);
    await fetchData();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to remove check');
  }
};

const updatePaymentMethod = async (check, method) => {
  try {
    await api.put(`ap-checks/${check.apCheckId}/payment-method`, { paymentMethod: method });
    check.paymentMethod = method;
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to update payment method');
  }
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
onMounted(fetchData);

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
