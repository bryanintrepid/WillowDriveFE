<template>
  <div class="container-fluid">
    <h4 class="mb-3">Year-End Close — FY {{ fiscalYear }}</h4>

    <!-- Step indicator -->
    <div class="d-flex mb-4 gap-2">
      <span v-for="s in 3" :key="s" class="badge"
        :class="step === s ? 'bg-primary' : (step > s ? 'bg-success' : 'bg-secondary')">
        {{ s }}. {{ ['Precheck', 'Preview', 'Confirm'][s-1] }}
      </span>
    </div>

    <div v-if="loading" class="text-center py-4"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Step 1: Precheck -->
    <div v-if="step === 1" class="card">
      <div class="card-header fw-bold">Precheck — FY {{ fiscalYear }}</div>
      <div class="card-body">
        <div class="mb-3">
          <FiscalPeriodPicker label="Fiscal Year" :fiscal-year="fiscalYear" :fiscal-years="fiscalYears"
            :show-period="false" @update:fiscal-year="v => { fiscalYear = v; loadPrecheck() }" />
        </div>

        <table class="table table-sm">
          <tbody>
            <tr>
              <td>Retained Earnings Close</td>
              <td>
                <span v-if="precheck?.retainedEarningsCloseDone" class="badge bg-success">Done</span>
                <span v-else class="badge bg-danger">Not Run</span>
              </td>
              <td>
                <button v-if="!precheck?.retainedEarningsCloseDone"
                  class="btn btn-warning btn-sm" @click="runReClose" :disabled="running">
                  Run RE Close Now
                </button>
              </td>
            </tr>
            <tr>
              <td>Balance Sheet Proof</td>
              <td>
                <span :class="precheck?.bsProof?.proves ? 'badge bg-success' : 'badge bg-warning'">
                  {{ precheck?.bsProof?.proves ? 'Proves' : 'Gap: $' + fmt(precheck?.bsProof?.total) }}
                </span>
              </td>
              <td class="small text-muted">
                Assets: {{ fmt(precheck?.bsProof?.assets) }} |
                Liab+Eq: {{ fmt(precheck?.bsProof?.liabilities + precheck?.bsProof?.equity) }}
              </td>
            </tr>
            <tr>
              <td>Target FY {{ fiscalYear + 1 }} Accounts</td>
              <td>
                <span class="badge" :class="precheck?.existingTargetAccounts > 0 ? 'bg-info' : 'bg-secondary'">
                  {{ precheck?.existingTargetAccounts || 0 }} existing
                </span>
              </td>
              <td class="small text-muted">{{ precheck?.accountCount }} accounts to roll forward</td>
            </tr>
          </tbody>
        </table>

        <button class="btn btn-primary" @click="step = 2"
          :disabled="!precheck?.retainedEarningsCloseDone">
          Next: Preview
        </button>
      </div>
    </div>

    <!-- Step 2: Preview -->
    <div v-if="step === 2" class="card">
      <div class="card-header fw-bold">Preview — FY {{ fiscalYear }} → FY {{ fiscalYear + 1 }}</div>
      <div class="card-body">
        <div class="table-responsive" style="max-height: 50vh;">
          <table class="table table-sm table-hover">
            <thead class="table-light sticky-top">
              <tr>
                <th>Account</th><th>Description</th><th>Type</th>
                <th class="text-end">Source Ending</th><th class="text-end">Target Beginning</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in precheck?.preview" :key="row.accountNumber">
                <td>{{ row.accountNumber }}</td>
                <td>{{ row.description }}</td>
                <td><span class="badge bg-secondary">{{ typeLabel(row.type) }}</span></td>
                <td class="text-end">{{ fmt(row.sourceEnding) }}</td>
                <td class="text-end fw-bold">{{ fmt(row.targetBeginning) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="step = 1">Back</button>
          <button class="btn btn-primary" @click="step = 3">Next: Confirm</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Confirm & Run -->
    <div v-if="step === 3" class="card">
      <div class="card-header fw-bold">Confirm Roll-Forward</div>
      <div class="card-body">
        <p>This will roll forward <strong>{{ precheck?.accountCount }}</strong> accounts from
          FY {{ fiscalYear }} to FY {{ fiscalYear + 1 }}.</p>
        <p>BS accounts carry their ending balance. IS accounts start at $0.</p>

        <div class="mb-3">
          <label class="form-label">Type the target fiscal year to confirm:</label>
          <input type="number" class="form-control" style="width: 120px;"
            v-model.number="confirmYear" placeholder="e.g. 2026">
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" @click="step = 2">Back</button>
          <button class="btn btn-success" @click="runRollForward"
            :disabled="confirmYear !== fiscalYear + 1 || running">
            {{ running ? 'Running...' : 'Run Roll-Forward' }}
          </button>
        </div>

        <!-- Result -->
        <div v-if="result" class="alert alert-success mt-3">
          <strong>{{ result.message }}</strong><br>
          Accounts created: {{ result.accountsCreated }} | Balances set: {{ result.balancesSet }}<br>
          BS Proof: Assets {{ fmt(result.bsProof?.assets) }} |
          Liab+Eq {{ fmt(result.bsProof?.liabilitiesAndEquity) }} |
          Gap {{ fmt(result.bsProof?.gap) }}
          <span v-if="result.bsProof?.proves" class="badge bg-success ms-2">Proves</span>
          <span v-else class="badge bg-danger ms-2">Does Not Prove</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';
import FiscalPeriodPicker from '@/components/FiscalPeriodPicker.vue';

const fiscalYear = ref(0);
const fiscalYears = ref([]);
const step = ref(1);
const precheck = ref(null);
const result = ref(null);
const confirmYear = ref(0);
const loading = ref(false);
const running = ref(false);
const error = ref(null);

function fmt(val) { return formatCurrency(val ?? 0); }
function typeLabel(t) { return ['Asset','Liability','Equity','Revenue','Expense'][t] || t; }

async function loadFiscalYears() {
  const { data } = await api.get('financial-reports/fiscal-years');
  fiscalYears.value = data;
  const now = new Date();
  const currentFY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  fiscalYear.value = data.includes(currentFY) ? currentFY : data[0];
}

async function loadPrecheck() {
  loading.value = true;
  error.value = null;
  result.value = null;
  step.value = 1;
  try {
    const { data } = await api.get(`close/year-end/${fiscalYear.value}/roll-forward/preview`);
    precheck.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

async function runReClose() {
  running.value = true;
  error.value = null;
  try {
    await api.post(`close/year-end/${fiscalYear.value}/retained-earnings`);
    await loadPrecheck();
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    running.value = false;
  }
}

async function runRollForward() {
  running.value = true;
  error.value = null;
  try {
    const { data } = await api.post(`close/year-end/${fiscalYear.value}/roll-forward?mode=Initial`);
    result.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    running.value = false;
  }
}

onMounted(async () => {
  await loadFiscalYears();
  await loadPrecheck();
});
</script>
