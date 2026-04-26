<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Flux Analysis</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <label class="small text-muted mb-0">Report</label>
        <select v-model="reportType" class="form-select form-select-sm" style="width: 160px;">
          <option value="balance-sheet">Balance Sheet</option>
          <option value="income-statement">Income Statement</option>
        </select>

        <span class="text-muted small ms-2">Current:</span>
        <select v-model.number="currentFy" class="form-select form-select-sm" style="width: 110px;">
          <option v-for="fy in fiscalYears" :key="'cfy' + fy" :value="fy">FY{{ fy }}</option>
        </select>
        <select v-model.number="currentPeriod" class="form-select form-select-sm" style="width: 70px;">
          <option v-for="p in 12" :key="'cp' + p" :value="p">P{{ p }}</option>
        </select>

        <span class="text-muted small ms-2">vs Prior:</span>
        <select v-model.number="priorFy" class="form-select form-select-sm" style="width: 110px;">
          <option v-for="fy in fiscalYears" :key="'pfy' + fy" :value="fy">FY{{ fy }}</option>
        </select>
        <select v-model.number="priorPeriod" class="form-select form-select-sm" style="width: 70px;">
          <option v-for="p in 12" :key="'pp' + p" :value="p">P{{ p }}</option>
        </select>

        <label class="small text-muted mb-0 ms-2">Threshold $</label>
        <input v-model.number="threshold" type="number" min="0" step="100"
               class="form-control form-control-sm" style="width: 110px;" />

        <div class="form-check ms-2">
          <input class="form-check-input" type="checkbox" id="signifOnly" v-model="showSignificantOnly">
          <label class="form-check-label small" for="signifOnly">Significant only</label>
        </div>

        <button class="btn btn-sm btn-outline-primary" @click="load" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <!-- Summary cards -->
      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Accounts</div>
              <div class="fs-5 fw-bold">{{ data.totalAccounts }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card" :class="data.significantCount > 0 ? 'border-warning' : 'border-success'">
            <div class="card-body py-2">
              <div class="small text-muted">Significant (>= {{ fmt(data.significanceThreshold) }})</div>
              <div class="fs-5 fw-bold" :class="data.significantCount > 0 ? 'text-warning' : 'text-success'">
                {{ data.significantCount }} accounts
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Total Current</div>
              <div class="fs-5 fw-bold">{{ fmt(totalCurrent) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body py-2">
              <div class="small text-muted">Total Change</div>
              <div class="fs-5 fw-bold" :class="totalChange >= 0 ? 'text-success' : 'text-danger'">
                {{ totalChange >= 0 ? '+' : '' }}{{ fmt(totalChange) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Flux table -->
      <div class="card">
        <div class="card-header py-2 d-flex justify-content-between">
          <span class="fw-bold">{{ filteredLines.length }} rows (sorted by magnitude of change)</span>
          <span v-if="crossFy && reportType === 'balance-sheet'" class="small text-muted">
            Cross-FY balance-sheet drilldown shows current period only.
          </span>
        </div>
        <div class="table-responsive" style="max-height: 70vh;">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 30px;"></th>
                <th>Account</th>
                <th>Description</th>
                <th class="text-end">Prior</th>
                <th class="text-end">Current</th>
                <th class="text-end">$ Change</th>
                <th class="text-end">% Change</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="line in filteredLines" :key="line.accountNumber">
                <tr :class="line.isSignificant ? 'table-warning' : ''">
                  <td>
                    <button class="btn btn-sm btn-link p-0" @click="toggle(line)"
                            :title="expanded[line.accountNumber] ? 'Collapse' : 'Show transactions'">
                      <i :class="expanded[line.accountNumber] ? 'ri-subtract-line' : 'ri-add-line'"></i>
                    </button>
                  </td>
                  <td class="font-monospace small">{{ line.accountNumber }}</td>
                  <td>
                    {{ line.description }}
                    <span class="text-muted small ms-1">{{ typeLabel(line.type) }}</span>
                  </td>
                  <td class="text-end font-monospace">{{ fmt(line.priorAmount) }}</td>
                  <td class="text-end font-monospace">{{ fmt(line.currentAmount) }}</td>
                  <td class="text-end font-monospace"
                      :class="line.changeDollar >= 0 ? 'text-success' : 'text-danger'">
                    {{ line.changeDollar >= 0 ? '+' : '' }}{{ fmt(line.changeDollar) }}
                  </td>
                  <td class="text-end font-monospace"
                      :class="line.changeDollar >= 0 ? 'text-success' : 'text-danger'">
                    {{ line.priorAmount === 0 ? '—'
                       : (line.changePercent >= 0 ? '+' : '') + line.changePercent.toFixed(1) + '%' }}
                  </td>
                  <td class="text-center">
                    <span v-if="line.isSignificant" class="badge bg-warning text-dark">Significant</span>
                    <span v-else class="badge bg-light text-dark">OK</span>
                  </td>
                </tr>
                <tr v-if="expanded[line.accountNumber]">
                  <td></td>
                  <td colspan="7" class="bg-light">
                    <div v-if="drilldownLoading[line.accountNumber]" class="small text-muted py-2">
                      Loading transactions…
                    </div>
                    <div v-else-if="drilldownError[line.accountNumber]" class="small text-danger py-2">
                      {{ drilldownError[line.accountNumber] }}
                    </div>
                    <div v-else-if="drilldown[line.accountNumber]">
                      <div class="small text-muted mb-1">
                        Current period ({{ fyLabel(data.currentFiscalYear, data.currentPeriod) }}):
                        {{ drilldown[line.accountNumber].transactions.length }} transactions,
                        DR {{ fmt(drilldown[line.accountNumber].totalDebits) }} /
                        CR {{ fmt(drilldown[line.accountNumber].totalCredits) }}
                      </div>
                      <table v-if="drilldown[line.accountNumber].transactions.length" class="table table-sm mb-0">
                        <thead>
                          <tr class="small">
                            <th>Date</th>
                            <th>Journal</th>
                            <th>Batch</th>
                            <th>Description</th>
                            <th class="text-end">Debit</th>
                            <th class="text-end">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="tx in drilldown[line.accountNumber].transactions" :key="tx.glTransactionId"
                              class="small">
                            <td>{{ formatDate(tx.transactionDate) }}</td>
                            <td>{{ tx.journalName }}</td>
                            <td class="font-monospace">{{ tx.batch }}</td>
                            <td>{{ tx.description || tx.transactionDescription }}</td>
                            <td class="text-end font-monospace">{{ tx.debit ? fmt(tx.debit) : '' }}</td>
                            <td class="text-end font-monospace">{{ tx.credit ? fmt(tx.credit) : '' }}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-else class="small text-muted">No transactions in current period.</div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="filteredLines.length === 0">
                <td colspan="8" class="text-center text-muted py-3">
                  {{ showSignificantOnly ? 'No significant changes at this threshold.' : 'No rows to display.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const now = new Date();
const defaultFy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
const defaultPeriod = now.getMonth() >= 6 ? now.getMonth() - 5 : now.getMonth() + 7;

const reportType = ref('income-statement');
const currentFy = ref(defaultFy);
const currentPeriod = ref(defaultPeriod);
const priorFy = ref(defaultFy);
const priorPeriod = ref(defaultPeriod > 1 ? defaultPeriod - 1 : 12);
const threshold = ref(1000);
const showSignificantOnly = ref(false);

const fiscalYears = ref([]);
const data = ref(null);
const loading = ref(false);
const error = ref(null);

const expanded = reactive({});
const drilldown = reactive({});
const drilldownLoading = reactive({});
const drilldownError = reactive({});

function fmt(v) { return formatCurrency(v ?? 0); }

function typeLabel(t) {
  return ({ 0: 'Asset', 1: 'Liability', 2: 'Equity', 3: 'Revenue', 4: 'Expense' })[t] || '';
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

function fyLabel(fy, p) { return `FY${fy} P${p}`; }

const crossFy = computed(() => currentFy.value !== priorFy.value);

const filteredLines = computed(() => {
  if (!data.value?.lines) return [];
  return showSignificantOnly.value
    ? data.value.lines.filter(l => l.isSignificant)
    : data.value.lines;
});

const totalCurrent = computed(() =>
  (data.value?.lines || []).reduce((s, l) => s + (l.currentAmount || 0), 0));
const totalChange = computed(() =>
  (data.value?.lines || []).reduce((s, l) => s + (l.changeDollar || 0), 0));

async function loadFiscalYears() {
  try {
    const { data: years } = await api.get('financial-reports/fiscal-years');
    fiscalYears.value = years;
    if (!years.includes(currentFy.value)) currentFy.value = years[0];
    if (!years.includes(priorFy.value)) priorFy.value = years[0];
  } catch (e) {
    fiscalYears.value = [defaultFy, defaultFy - 1, defaultFy - 2];
  }
}

async function load() {
  loading.value = true;
  error.value = null;
  // reset expansions on fresh load
  Object.keys(expanded).forEach(k => delete expanded[k]);
  Object.keys(drilldown).forEach(k => delete drilldown[k]);
  try {
    const { data: resp } = await api.get('financial-reports/flux', {
      params: {
        reportType: reportType.value,
        currentFiscalYear: currentFy.value,
        currentPeriod: currentPeriod.value,
        priorFiscalYear: priorFy.value,
        priorPeriod: priorPeriod.value,
        threshold: threshold.value
      }
    });
    data.value = resp;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to load flux analysis';
  } finally {
    loading.value = false;
  }
}

async function toggle(line) {
  const acct = line.accountNumber;
  if (expanded[acct]) {
    expanded[acct] = false;
    return;
  }
  expanded[acct] = true;
  if (drilldown[acct]) return;
  drilldownLoading[acct] = true;
  drilldownError[acct] = null;
  try {
    const { data: resp } = await api.get('financial-reports/drilldown', {
      params: {
        accountNumber: acct,
        fiscalYear: currentFy.value,
        period: currentPeriod.value
      }
    });
    drilldown[acct] = resp;
  } catch (e) {
    drilldownError[acct] = e.response?.data || e.message || 'Failed to load drilldown';
  } finally {
    drilldownLoading[acct] = false;
  }
}

watch([reportType, currentFy, currentPeriod, priorFy, priorPeriod, threshold], () => load());

onMounted(async () => {
  await loadFiscalYears();
  await load();
});
</script>
