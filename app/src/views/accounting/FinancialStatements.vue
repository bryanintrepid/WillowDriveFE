<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Financial Statements</h4>
      <ExportMenu :disabled="loading || !report" @export="handleExport" />
    </div>

    <!-- Controls -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-end">
          <!-- Report Type -->
          <div class="col-auto">
            <label class="form-label fw-bold mb-1 small">Report</label>
            <select class="form-select" v-model="reportType" @change="loadReport">
              <option value="balance-sheet">Balance Sheet</option>
              <option value="income-statement">Income Statement</option>
              <option value="trial-balance">Trial Balance</option>
              <option value="cash-flow">Cash Flow Statement</option>
            </select>
          </div>

          <!-- Primary Period -->
          <div class="col-auto">
            <FiscalPeriodPicker
              label="Period"
              :fiscal-year="fiscalYear"
              :period="period"
              :fiscal-years="fiscalYears"
              @update:fiscal-year="v => { fiscalYear = v; loadReport() }"
              @update:period="v => { period = v; loadReport() }"
            />
          </div>

          <!-- Compare Toggle -->
          <div class="col-auto d-flex align-items-center gap-2">
            <div class="form-check mb-0">
              <input class="form-check-input" type="checkbox" id="compareToggle"
                v-model="compareEnabled" @change="loadReport">
              <label class="form-check-label small" for="compareToggle">Compare</label>
            </div>
          </div>

          <!-- Compare Period (shown when compare enabled) -->
          <div class="col-auto" v-if="compareEnabled">
            <FiscalPeriodPicker
              label="vs"
              :fiscal-year="compareFY"
              :period="comparePeriod"
              :fiscal-years="fiscalYears"
              @update:fiscal-year="v => { compareFY = v; loadReport() }"
              @update:period="v => { comparePeriod = v; loadReport() }"
            />
          </div>

          <!-- Budget Toggle (not applicable to cash flow) -->
          <div class="col-auto d-flex align-items-center" v-if="!isCashFlow">
            <div class="form-check mb-0">
              <input class="form-check-input" type="checkbox" id="budgetToggle"
                v-model="includeBudget" @change="loadReport">
              <label class="form-check-label small" for="budgetToggle">Budget</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Cash Flow Statement -->
    <div v-else-if="report && isCashFlow" class="card">
      <div class="card-body">
        <div class="mb-2 small text-muted">
          FY {{ report.fiscalYear }}{{ report.throughPeriod ? ' through P' + report.throughPeriod : '' }}
          <span v-if="report.reconciles" class="badge bg-success ms-2">Reconciles</span>
          <span v-else class="badge bg-danger ms-2">Does Not Reconcile</span>
        </div>

        <div v-for="section in report.sections" :key="section.name" class="mb-4">
          <h6 class="fw-bold border-bottom pb-1">{{ section.name }}</h6>
          <table class="table table-sm mb-1">
            <tbody>
              <tr v-for="(line, i) in section.lines" :key="i"
                :class="{ 'fw-bold text-muted': line.isSubtotal }">
                <td style="width: 70%;">{{ line.label }}</td>
                <td class="text-end" v-if="!line.isSubtotal">{{ fmt(line.amount) }}</td>
                <td v-else></td>
                <td class="text-end" v-if="compareEnabled && report.compareData">
                  {{ !line.isSubtotal ? fmt(getCompareLine(section, i)) : '' }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="fw-bold table-light">
                <td>Net cash from {{ section.name.replace('Cash Flows from ', '') }}</td>
                <td class="text-end">{{ fmt(section.subtotal) }}</td>
                <td class="text-end" v-if="compareEnabled && report.compareData">
                  {{ fmt(getCompareSection(section.name)?.subtotal) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <table class="table table-sm">
          <tbody>
            <tr class="fw-bold fs-6">
              <td style="width: 70%;">Net change in cash</td>
              <td class="text-end">{{ fmt(report.netChangeInCash) }}</td>
              <td class="text-end" v-if="compareEnabled && report.compareData">{{ fmt(report.compareData.netChangeInCash) }}</td>
            </tr>
            <tr>
              <td>Beginning cash</td>
              <td class="text-end">{{ fmt(report.beginningCash) }}</td>
              <td class="text-end" v-if="compareEnabled && report.compareData">{{ fmt(report.compareData.beginningCash) }}</td>
            </tr>
            <tr class="fw-bold border-top border-2">
              <td>Ending cash</td>
              <td class="text-end">{{ fmt(report.endingCash) }}</td>
              <td class="text-end" v-if="compareEnabled && report.compareData">{{ fmt(report.compareData.endingCash) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Report Table (BS/IS/TB) -->
    <div v-else-if="report && !isCashFlow" class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th style="min-width: 80px;">Account</th>
                <th style="min-width: 200px;">Description</th>
                <th class="text-end" v-if="showPeriodColumn">{{ periodLabel(period || 12) }}</th>
                <th class="text-end">YTD</th>
                <th class="text-end" v-if="compareEnabled && report.compareRows">
                  {{ compareEnabled ? `FY${compareFY} ${periodLabel(comparePeriod || 12)}` : '' }}
                </th>
                <th class="text-end" v-if="compareEnabled && report.compareRows">Variance</th>
                <th class="text-end" v-if="compareEnabled && report.compareRows">Var %</th>
                <th class="text-end" v-if="includeBudget">Budget</th>
                <th class="text-end" v-if="includeBudget">Bud Var</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in displayRows" :key="idx"
                :class="{ 'fw-bold': row.isRollup, 'table-light': row.isRollup }">
                <td>
                  <span :style="{ paddingLeft: (row.level * 16) + 'px' }">
                    {{ row.accountNumber }}
                  </span>
                </td>
                <td>
                  <span :style="{ paddingLeft: (row.level * 16) + 'px' }">
                    {{ row.description }}
                  </span>
                </td>
                <td class="text-end" v-if="showPeriodColumn"
                  :class="{ 'cell-clickable': !row.isRollup }"
                  @click="!row.isRollup && openDrilldown(row, period)">
                  {{ fmt(getEndingBalance(row)) }}
                </td>
                <td class="text-end"
                  :class="{ 'cell-clickable': !row.isRollup }"
                  @click="!row.isRollup && openDrilldown(row, period || 12)">
                  {{ fmt(row.ytdBalance) }}
                </td>
                <td class="text-end" v-if="compareEnabled && report.compareRows">
                  {{ fmt(getCompareYtd(row)) }}
                </td>
                <td class="text-end" v-if="compareEnabled && report.compareRows"
                  :class="varianceClass(getVariance(row))">
                  {{ fmt(getVariance(row)) }}
                </td>
                <td class="text-end" v-if="compareEnabled && report.compareRows"
                  :class="varianceClass(getVariance(row))">
                  {{ fmtPct(getVariancePct(row)) }}
                </td>
                <td class="text-end" v-if="includeBudget">{{ fmt(getBudgetTotal(row)) }}</td>
                <td class="text-end" v-if="includeBudget"
                  :class="varianceClass(getBudgetVariance(row))">
                  {{ fmt(getBudgetVariance(row)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- Drill-down Modal -->
    <DrilldownModal
      :account-number="drillAccount"
      :fiscal-year="drillFY"
      :period="drillPeriod"
      @close="drillAccount = ''"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';
import FiscalPeriodPicker from '@/components/FiscalPeriodPicker.vue';
import DrilldownModal from '@/components/DrilldownModal.vue';
import ExportMenu from '@/components/ExportMenu.vue';

const reportType = ref('balance-sheet');
const fiscalYear = ref(0);
const period = ref(0); // 0 = full year
const compareEnabled = ref(false);
const compareFY = ref(0);
const comparePeriod = ref(0);
const includeBudget = ref(false);
const fiscalYears = ref([]);
const report = ref(null);
const loading = ref(false);
const error = ref(null);

// Drill-down state
const drillAccount = ref('');
const drillFY = ref(0);
const drillPeriod = ref(0);

// Computed
const showPeriodColumn = computed(() => period.value > 0 && period.value < 12);
const isCashFlow = computed(() => reportType.value === 'cash-flow');

// Cash flow helpers
function getCompareLine(section, lineIdx) {
  const cmpSection = report.value?.compareData?.sections?.find(s => s.name === section.name);
  return cmpSection?.lines?.[lineIdx]?.amount ?? 0;
}
function getCompareSection(sectionName) {
  return report.value?.compareData?.sections?.find(s => s.name === sectionName);
}

const displayRows = computed(() => {
  if (!report.value || isCashFlow.value) return [];
  return report.value.rows || [];
});

// Period label
const periodNames = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
function periodLabel(p) {
  if (!p || p === 0) return 'Full Year';
  return `P${p} (${periodNames[p - 1]})`;
}

// Data access helpers
function getEndingBalance(row) {
  const p = (period.value || 12) - 1;
  return row.endingBalances?.[p] ?? 0;
}

function getCompareYtd(row) {
  if (!report.value?.compareRows) return 0;
  const compareRow = report.value.compareRows.find(r => r.accountNumber === row.accountNumber);
  return compareRow?.ytdBalance ?? 0;
}

function getVariance(row) {
  return row.ytdBalance - getCompareYtd(row);
}

function getVariancePct(row) {
  const prior = getCompareYtd(row);
  if (prior === 0) return null;
  return (getVariance(row) / Math.abs(prior)) * 100;
}

function getBudgetTotal(row) {
  if (!row.budgets) return 0;
  const maxP = period.value || 12;
  let total = 0;
  for (let i = 0; i < maxP; i++) total += (row.budgets[i] ?? 0);
  return total;
}

function getBudgetVariance(row) {
  return row.ytdBalance - getBudgetTotal(row);
}

// Formatting
function fmt(val) {
  if (val === null || val === undefined) return '—';
  return formatCurrency(val);
}

function fmtPct(val) {
  if (val === null || val === undefined) return '—';
  return val.toFixed(1) + '%';
}

function varianceClass(val) {
  if (val === null || val === undefined || val === 0) return '';
  return val < 0 ? 'text-danger' : 'text-success';
}

// Export
async function handleExport(format) {
  const params = {
    format,
    fiscalYear: fiscalYear.value,
    includeBudget: includeBudget.value
  };
  if (period.value > 0) params.throughPeriod = period.value;
  if (compareEnabled.value && compareFY.value) {
    params.compareFiscalYear = compareFY.value;
    if (comparePeriod.value > 0) params.compareThroughPeriod = comparePeriod.value;
  }
  try {
    const { data, headers } = await api.get(
      `financial-reports/${reportType.value}/export`,
      { params, responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    const disposition = headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    a.download = match ? match[1] : `report.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    error.value = 'Export failed: ' + (e.message || 'Unknown error');
  }
}

// Drill-down
function openDrilldown(row, p) {
  if (!p || p === 0) p = 12; // Full year → drill into last period
  drillAccount.value = row.accountNumber;
  drillFY.value = fiscalYear.value;
  drillPeriod.value = p;
}

// API
async function loadFiscalYears() {
  try {
    const { data } = await api.get('financial-reports/fiscal-years');
    fiscalYears.value = data;
    if (data.length > 0) {
      // Default to most recent FY
      const now = new Date();
      const currentFY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      fiscalYear.value = data.includes(currentFY) ? currentFY : data[0];
      compareFY.value = fiscalYear.value - 1;
    }
  } catch (e) {
    error.value = 'Failed to load fiscal years';
  }
}

async function loadReport() {
  if (!fiscalYear.value) return;
  loading.value = true;
  error.value = null;
  report.value = null; // Clear stale data before loading new report type
  try {
    const params = {
      fiscalYear: fiscalYear.value,
      includeBudget: includeBudget.value
    };
    if (period.value > 0) params.throughPeriod = period.value;
    if (compareEnabled.value && compareFY.value) {
      params.compareFiscalYear = compareFY.value;
      if (comparePeriod.value > 0) params.compareThroughPeriod = comparePeriod.value;
    }
    const { data } = await api.get(`financial-reports/${reportType.value}`, { params });
    report.value = data;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to load report';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadFiscalYears();
  await loadReport();
});
</script>

<style scoped>
.table td, .table th {
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
}
.cell-clickable {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}
.cell-clickable:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.08);
}
</style>
