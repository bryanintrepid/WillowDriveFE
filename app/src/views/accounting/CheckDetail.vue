<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex justify-content-between align-items-center">
        <div class="dashhead-titles">
          <h6 class="dashhead-subtitle">
            <router-link :to="{ name: 'accounting-checks', query: { fiscalYear: check.fiscalYear } }">
              FY{{ check.fiscalYear }} A/P Checks
            </router-link>
          </h6>
          <h1 class="dashhead-title">
            {{ check.apCheckId ? 'A/P Check ' + check.checkReference : 'New A/P Check' }}
            <small v-if="!check.batchInfo.posted">&nbsp;(Unposted)</small>
            <small v-else-if="!check.batchInfo.transactionDate">&nbsp;(Posted)</small>
            <small v-else>&nbsp;(Posted on {{ formatDate(check.batchInfo.transactionDate) }})</small>
          </h1>
        </div>
        <div class="dashhead-toolbar d-flex gap-2">
          <span v-if="bankStatus.bankCleared && !bankStatus.amountMismatch" class="badge bg-success-subtle text-success fs-13 d-flex align-items-center gap-1">
            <i class="ri-checkbox-circle-fill"></i> Cleared by bank on {{ formatDate(bankStatus.bankClearedDate) }}
          </span>
          <span v-else-if="bankStatus.amountMismatch" class="badge bg-warning-subtle text-warning fs-13 d-flex align-items-center gap-1">
            <i class="ri-error-warning-fill"></i> Amount mismatch — Bank: {{ formatCurrency(bankStatus.bankTransactionAmount) }}
          </span>
          <span v-else-if="check.apCheckId > 0" class="badge bg-light text-muted fs-13 d-flex align-items-center gap-1">
            <i class="ri-time-line"></i> Not yet cleared by bank
          </span>
          <button v-if="bankStatus.bankCleared && bankStatus.keyBankTransactionId" class="btn btn-sm btn-outline-warning" @click="unmatchTransaction">
            <i class="ri-link-unlink"></i> Unmatch
          </button>
          <button v-else-if="check.apCheckId > 0 && !bankStatus.bankCleared" class="btn btn-sm btn-outline-primary" @click="showMatchModal = true">
            <i class="ri-link"></i> Match to Bank Transaction
          </button>
          <button class="btn btn-light">
            <i :class="isDirty ? 'ri-error-warning-line text-warning' : 'ri-check-line text-success'"></i>
            {{ isDirty ? 'Unsaved changes' : 'Saved' }}
          </button>
        </div>
      </div>
    </div>

    <form @submit.prevent="saveApCheck(check)">
      <div class="row">
        <!-- Left Column -->
        <div class="col-lg-3">
          <div class="card">
            <div class="card-body">
              <!-- Check Reference -->
              <div class="mb-3">
                <label class="form-label">Reference</label>
                <input type="text" class="form-control" v-model="check.checkReference" :disabled="!!check.apCheckId" />
              </div>

              <!-- Pay Date -->
              <div class="mb-3">
                <label class="form-label">Intended Pay Date</label>
                <input type="date" class="form-control" v-model="check.payDate" />
              </div>

              <!-- Check Number -->
              <div class="mb-3">
                <label class="form-label">Check Number</label>
                <input type="text" class="form-control" v-model="check.checkNumber" />
              </div>

              <!-- Print Check -->
              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" v-model="check.printCheck" id="printCheck" :disabled="check.batchInfo.posted" />
                <label class="form-check-label" for="printCheck">Print Check</label>
              </div>

              <!-- Check Amount -->
              <div class="mb-3">
                <label class="form-label">Check Amount</label>
                <p class="form-control-plaintext">{{ formatCurrency(check.checkAmount) }}</p>
              </div>

              <!-- G/L Checking Account -->
              <div class="mb-3">
                <label class="form-label">G/L Checking Account</label>
                <!-- Placeholder for account-selector-edit-card -->
                <select class="form-select" v-model="check.glBankCheckingAccount.accountNumber" :disabled="check.batchInfo.posted">
                  <option value="10100">10100 - Main Checking</option>
                  <option value="10200">10200 - Payroll Checking</option>
                </select>
              </div>

              <!-- Vendor -->
              <div class="mb-3" v-if="!check.miscellaneous">
                <label class="form-label">Vendor</label>
                 <!-- Placeholder for vendor typeahead -->
                <input type="text" class="form-control" :value="check.vendor.name" placeholder="Search vendors..."/>
              </div>

              <!-- Payee Information -->
              <div class="mb-3">
                <label class="form-label">Payee Information</label>
                <input type="text" class="form-control mb-1" v-model="check.payee" placeholder="Payee Name"/>
                <input type="text" class="form-control mb-1" v-model="check.attention" placeholder="ATTN"/>
                <input type="text" class="form-control mb-1" v-model="check.street" placeholder="Street"/>
                <input type="text" class="form-control mb-1" v-model="check.city" placeholder="City"/>
                <input type="text" class="form-control mb-1" v-model="check.state" placeholder="State"/>
                <input type="text" class="form-control" v-model="check.zip" placeholder="Zip Code"/>
              </div>

            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-lg-9">
          <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">Line Items</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th style="width: 5%;"></th>
                      <th style="width: 15%;">Reference</th>
                      <th style="width: 25%;">Description</th>
                      <th class="text-end" style="width: 10%;">Amount</th>
                      <th class="text-end" style="width: 10%;">Discount</th>
                      <th class="text-end" style="width: 10%;">Net</th>
                      <th style="width: 20%;">G/L Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, index) in check.checkDetailLines" :key="index">
                      <td>
                        <button class="btn btn-sm btn-soft-danger" @click="removeLine(index)" :disabled="check.batchInfo.posted">
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      </td>
                      <td><input type="text" class="form-control form-control-sm" v-model="line.invoiceReference" :disabled="check.batchInfo.posted"/></td>
                      <td><input type="text" class="form-control form-control-sm" v-model="line.invoiceDescription" :disabled="check.batchInfo.posted"/></td>
                      <td><input type="number" class="form-control form-control-sm text-end" v-model.number="line.amount" :disabled="check.batchInfo.posted"/></td>
                      <td><input type="number" class="form-control form-control-sm text-end" v-model.number="line.discount" :disabled="check.batchInfo.posted"/></td>
                      <td class="text-end">{{ formatCurrency(line.amount - line.discount) }}</td>
                      <td>
                        <!-- Placeholder for account-selector-edit-card -->
                        <select class="form-select form-select-sm" v-model="line.glAccount.accountNumber" :disabled="check.batchInfo.posted">
                            <option value="60100">60100 - Office Supplies</option>
                            <option value="60500">60500 - Utilities</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button class="btn btn-primary" @click.prevent="addLine" :disabled="check.batchInfo.posted">
                <i class="ri-add-line align-bottom"></i> Add Line Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Attachments -->
      <div class="row mt-3" v-if="check.apCheckId">
        <div class="col-lg-12">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Documents</h5></div>
            <div class="card-body">
              <AttachmentPanel
                entityType="ApCheck"
                :entityId="check.apCheckId"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body d-flex gap-2">
                    <button type="submit" class="btn btn-primary" :disabled="!isDirty">
                        <i class="ri-check-line align-bottom"></i> Save Check
                    </button>
                    <button v-if="check.apCheckId && !check.batchInfo.posted" class="btn btn-info" @click.prevent="postApCheck(check)" :disabled="isDirty">
                        <i class="ri-send-plane-2-line align-bottom"></i> Post Check
                    </button>
                    <button v-if="check.apCheckId && check.batchInfo.posted" class="btn btn-warning" @click.prevent="reverseApCheck(check)" :disabled="isDirty">
                        <i class="ri-arrow-go-back-line align-bottom"></i> Reverse Check
                    </button>
                    <router-link :to="{ name: 'accounting-checks' }" class="btn btn-light">
                        <i class="ri-close-line align-bottom"></i> Cancel
                    </router-link>
                </div>
            </div>
        </div>
      </div>
    </form>

    <!-- Match to Bank Transaction Modal -->
    <div v-if="showMatchModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Match to Bank Transaction</h5>
            <button type="button" class="btn-close" @click="showMatchModal = false"></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">Select an unmatched bank debit transaction to link to check {{ check.checkReference }} ({{ formatCurrency(check.checkAmount) }})</p>
            <div v-if="!unmatchedTransactions.length" class="text-center py-3">
              <p class="text-muted">No unmatched debit transactions found near this amount</p>
            </div>
            <table v-else class="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="text-end">Amount</th>
                  <th>Description</th>
                  <th>Check #</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="txn in unmatchedTransactions" :key="txn.keyBankTransactionId">
                  <td>{{ formatDate(txn.transactionEffectiveDate) }}</td>
                  <td class="text-end" :class="{ 'text-warning': txn.transactionAmount !== check.checkAmount }">
                    {{ formatCurrency(txn.transactionAmount) }}
                  </td>
                  <td>{{ txn.transactionDescription }}</td>
                  <td>{{ txn.checkSerialNumber || '—' }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" @click="matchTransaction(txn.keyBankTransactionId)">
                      <i class="ri-link"></i> Match
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api';
import AttachmentPanel from '../../components/AttachmentPanel.vue';

const route = useRoute();
const router = useRouter();

// --- State ---
const check = reactive({
  apCheckId: parseInt(route.params.checkId) || 0,
  fiscalYear: new Date().getFullYear(),
  checkReference: '',
  payDate: new Date().toISOString().split('T')[0],
  checkNumber: '',
  printCheck: true,
  checkAmount: 0,
  miscellaneous: route.params.misc === 'true',
  glBankCheckingAccount: { accountNumber: '' },
  vendor: { vendorId: parseInt(route.params.vendorId) || 0, name: '' },
  payee: '',
  attention: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  batchInfo: {
    posted: false,
    transactionDate: null,
  },
  checkDetailLines: [],
});

const bankStatus = reactive({
  bankCleared: false,
  bankClearedDate: null,
  bankTransactionAmount: null,
  amountMismatch: false,
  keyBankTransactionId: null,
});

const showMatchModal = ref(false);
const unmatchedTransactions = ref([]);

const originalCheckState = ref(JSON.stringify(check));

// --- Computed ---
const isDirty = computed(() => {
  return JSON.stringify(check) !== originalCheckState.value;
});

const checkAmount = computed(() => {
    return check.checkDetailLines.reduce((total, line) => total + (line.amount || 0) - (line.discount || 0), 0);
});

watch(checkAmount, (newVal) => {
    check.checkAmount = newVal;
});

watch(showMatchModal, (val) => {
    if (val) loadUnmatchedTransactions();
});

// --- Methods ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const addLine = () => {
  check.checkDetailLines.push({
    invoiceReference: '',
    invoiceDescription: '',
    amount: 0,
    discount: 0,
    glAccount: { accountNumber: '' },
  });
};

const removeLine = (index) => {
  check.checkDetailLines.splice(index, 1);
};

const saveApCheck = async () => {
  try {
    const payload = {
      apCheckId: check.apCheckId,
      companyId: 1,
      vendorId: check.vendor.vendorId,
      checkReference: check.checkReference,
      checkNumber: check.checkNumber,
      payDate: check.payDate,
      glBankCheckingAccountNumber: check.glBankCheckingAccount.accountNumber,
      miscellaneous: check.miscellaneous,
      payee: check.payee,
      attention: check.attention,
      street: check.street,
      city: check.city,
      state: check.state,
      zip: check.zip,
      printCheck: check.printCheck,
      paymentMethod: check.paymentMethod || 'Check',
      checkRunId: check.checkRunId,
      checkDetailLines: check.checkDetailLines.map(l => ({
        invoiceReference: l.invoiceReference,
        invoiceDescription: l.invoiceDescription,
        amount: l.amount || 0,
        discount: l.discount || 0,
        netAmount: (l.amount || 0) - (l.discount || 0),
        glAccountNumber: l.glAccount?.accountNumber || l.glAccountNumber,
        invoiceId: l.invoiceId,
      })),
    };
    const response = await api.post('ap-checks/save', payload);
    applyCheckData(response.data);
    originalCheckState.value = JSON.stringify(check);
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to save check');
  }
};

const postApCheck = async () => {
  if (!check.apCheckId || check.apCheckId <= 0) { alert('Save the check first.'); return; }
  if (!window.confirm('Post this check? This will create a GL batch.')) return;
  try {
    const result = await api.post('ap-checks/post', {
      apCheckIds: [check.apCheckId],
      companyId: 1,
      fiscalYear: check.fiscalYear || new Date().getFullYear(),
      reverse: false,
    });
    alert(`Check posted. Batch: ${result.data.batch}`);
    const response = await api.get(`ap-checks/${check.apCheckId}`);
    applyCheckData(response.data);
    originalCheckState.value = JSON.stringify(check);
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to post check');
  }
};

const reverseApCheck = async () => {
  if (!check.apCheckId || check.apCheckId <= 0) return;
  if (!window.confirm('Reverse this check? This will create a reversing GL batch.')) return;
  try {
    const result = await api.post('ap-checks/reverse', {
      apCheckIds: [check.apCheckId],
      companyId: 1,
      fiscalYear: check.fiscalYear || new Date().getFullYear(),
      reverse: true,
    });
    alert(`Check reversed. Batch: ${result.data.batch}`);
    const response = await api.get(`ap-checks/${check.apCheckId}`);
    applyCheckData(response.data);
    originalCheckState.value = JSON.stringify(check);
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to reverse check');
  }
};

const applyCheckData = (data) => {
  check.apCheckId = data.apCheckId;
  check.checkReference = data.checkReference;
  check.fiscalYear = data.fiscalYear || check.fiscalYear;
  check.payDate = data.payDate ? new Date(data.payDate).toISOString().split('T')[0] : '';
  check.checkNumber = data.checkNumber;
  check.printCheck = data.printCheck;
  check.checkAmount = data.checkAmount;
  check.miscellaneous = data.miscellaneous;
  check.glBankCheckingAccount = { accountNumber: data.glBankCheckingAccountNumber || '' };
  check.vendor = { vendorId: data.vendorId || 0, name: data.vendorName || '' };
  check.payee = data.payee;
  check.attention = data.attention;
  check.street = data.street;
  check.city = data.city;
  check.state = data.state;
  check.zip = data.zip;
  check.batchInfo = { posted: data.posted, transactionDate: data.postingDate };
  check.checkRunId = data.checkRunId;
  check.checkDetailLines = (data.checkDetailLines || []).map(d => ({
    invoiceReference: d.invoiceReference,
    invoiceDescription: d.invoiceDescription,
    amount: d.amount,
    discount: d.discount,
    glAccount: { accountNumber: d.glAccountNumber },
    invoiceId: d.invoiceId,
  }));
};

const fetchBankStatus = async () => {
  if (!check.apCheckId || check.apCheckId <= 0) return;
  try {
    const response = await api.get(`bank-reconciliation/check-status/${check.apCheckId}`);
    const data = response.data;
    bankStatus.bankCleared = data.bankCleared;
    bankStatus.bankClearedDate = data.bankClearedDate;
    bankStatus.bankTransactionAmount = data.bankTransactionAmount;
    bankStatus.amountMismatch = data.amountMismatch;
    bankStatus.keyBankTransactionId = data.keyBankTransactionId;
  } catch (err) {
    // Ignore — bank status is supplementary
  }
};

const loadUnmatchedTransactions = async () => {
  try {
    const response = await api.get('bank-reconciliation/unmatched-transactions', {
      params: { nearAmount: check.checkAmount }
    });
    unmatchedTransactions.value = response.data || [];
  } catch (err) {
    console.error('Failed to load unmatched transactions:', err);
  }
};

const matchTransaction = async (keyBankTransactionId) => {
  try {
    await api.post('bank-reconciliation/match', {
      keyBankTransactionId,
      apCheckId: check.apCheckId
    });
    showMatchModal.value = false;
    await fetchBankStatus();
  } catch (err) {
    alert(err.response?.data || err.message || 'Match failed');
  }
};

const unmatchTransaction = async () => {
  if (!bankStatus.keyBankTransactionId) return;
  if (!window.confirm('Remove bank transaction match?')) return;
  try {
    await api.post(`bank-reconciliation/unmatch/${bankStatus.keyBankTransactionId}`);
    await fetchBankStatus();
  } catch (err) {
    alert(err.response?.data || err.message || 'Unmatch failed');
  }
};

// --- Initial Load ---
onMounted(async () => {
  if (check.apCheckId && check.apCheckId > 0) {
    try {
      const response = await api.get(`ap-checks/${check.apCheckId}`);
      applyCheckData(response.data);
      originalCheckState.value = JSON.stringify(check);
      await fetchBankStatus();
    } catch (err) {
      console.error('Failed to load check:', err);
    }
  }
});

</script>

<style scoped>
.dashhead-subtitle a {
    text-decoration: none;
    color: inherit;
}
.dashhead-subtitle a:hover {
    text-decoration: underline;
}
</style>
