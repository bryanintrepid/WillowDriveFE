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
        <div class="dashhead-toolbar">
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// --- State ---
const check = reactive({
  apCheckId: route.params.checkId || 0,
  fiscalYear: new Date().getFullYear(),
  checkReference: '',
  payDate: new Date().toISOString().split('T')[0],
  checkNumber: '',
  printCheck: true,
  checkAmount: 0,
  miscellaneous: route.params.misc === 'true',
  glBankCheckingAccount: { accountNumber: '10100' },
  vendor: { vendorId: route.params.vendorId || 0, name: 'Sample Vendor' },
  payee: 'Sample Payee',
  attention: '',
  street: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  batchInfo: {
    posted: false,
    transactionDate: null,
  },
  checkDetailLines: [
    {
      invoiceReference: 'INV-001',
      invoiceDescription: 'Initial Item',
      amount: 100.00,
      discount: 0,
      glAccount: { accountNumber: '60100' },
    },
  ],
});

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

const saveApCheck = (checkToSave) => {
  console.log('Saving check:', checkToSave);
  // Pretend save is successful
  originalCheckState.value = JSON.stringify(checkToSave);
  alert('Check saved!');
};

const postApCheck = (checkToPost) => {
  console.log('Posting check:', checkToPost);
  alert('Check posted!');
};

const reverseApCheck = (checkToReverse) => {
  console.log('Reversing check:', checkToReverse);
  alert('Check reversed!');
};

// --- Initial Load ---
if (check.apCheckId && check.apCheckId !== '0') {
  console.log(`Fetching data for check ID: ${check.apCheckId}`);
  // API call to fetch check data would go here
  // For now, we use the default reactive object
}

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
