<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Cash Flow Forecast</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <label class="small text-muted mb-0">As Of</label>
        <input type="date" v-model="asOfDate" class="form-control form-control-sm" style="width: 160px;" />
        <label class="small text-muted mb-0">Horizon</label>
        <select v-model.number="horizonDays" class="form-select form-select-sm" style="width: 110px;">
          <option :value="30">30 days</option>
          <option :value="60">60 days</option>
          <option :value="90">90 days</option>
        </select>
        <button class="btn btn-sm btn-outline-primary" @click="load" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <!-- Summary cards -->
      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Beginning Cash</div>
              <div class="h5 mb-0">{{ fmt(data.beginningCash) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Projected Ending Cash</div>
              <div class="h5 mb-0" :class="niClass(data.endingCash)">{{ fmt(data.endingCash) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Total Receipts (AR)</div>
              <div class="h5 mb-0 text-success">{{ fmt(data.totalReceipts) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="small text-muted">Total Outflows (AP + Recurring)</div>
              <div class="h5 mb-0 text-danger">{{ fmt(data.totalDisbursements + data.totalRecurring) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Minimum cash banner -->
      <div v-if="data.minimumCashProjected < 0" class="alert alert-danger py-2 mb-3">
        <i class="ri-alert-line me-1"></i>
        <strong>Cash deficit projected:</strong> minimum cash reaches
        <strong>{{ fmt(data.minimumCashProjected) }}</strong> on {{ formatDate(data.minimumCashDate) }}.
      </div>
      <div v-else class="alert alert-info py-2 mb-3">
        <i class="ri-information-line me-1"></i>
        Minimum projected cash: <strong>{{ fmt(data.minimumCashProjected) }}</strong> on {{ formatDate(data.minimumCashDate) }}.
      </div>

      <!-- Weekly ending-cash line chart -->
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="mb-3">Weekly Ending Cash</h6>
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-height: 320px;">
            <line v-if="zeroLineVisible" :x1="padLeft" :y1="yOfZero" :x2="chartWidth - padRight" :y2="yOfZero" stroke="#b00" stroke-width="1" stroke-dasharray="4 3" />
            <line v-for="(yg, i) in yGridValues" :key="'g'+i" :x1="padLeft" :y1="yOf(yg)" :x2="chartWidth - padRight" :y2="yOf(yg)" stroke="#eee" stroke-width="1" />
            <text v-for="(yg, i) in yGridValues" :key="'t'+i" :x="padLeft - 6" :y="yOf(yg) + 4" text-anchor="end" font-size="10" fill="#888">{{ fmtShort(yg) }}</text>
            <polyline
              :points="linePoints"
              fill="none"
              stroke="#4e79a7"
              stroke-width="2" />
            <g v-for="(p, i) in pointList" :key="'p'+i">
              <circle :cx="p.x" :cy="p.y" r="3" :fill="p.val < 0 ? '#e15759' : '#4e79a7'" />
            </g>
            <text v-for="(w, i) in data.endingCashByWeek" :key="'x'+i" :x="xOf(i)" :y="chartHeight - 6" text-anchor="middle" font-size="9" fill="#888">
              {{ xLabel(w.weekEnding, i) }}
            </text>
          </svg>
        </div>
      </div>

      <!-- Weekly breakdown -->
      <div class="card mb-3">
        <div class="card-body">
          <h6 class="mb-3">Weekly Breakdown</h6>
          <div class="table-responsive">
            <table class="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Week Ending</th>
                  <th class="text-end">Receipts</th>
                  <th class="text-end">AP Disbursements</th>
                  <th class="text-end">Recurring</th>
                  <th class="text-end">Net Change</th>
                  <th class="text-end">Ending Cash</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="w in data.endingCashByWeek" :key="w.weekEnding">
                  <td>{{ formatDate(w.weekEnding) }}</td>
                  <td class="text-end text-success">{{ w.receipts ? fmt(w.receipts) : '—' }}</td>
                  <td class="text-end text-danger">{{ w.disbursements ? fmt(w.disbursements) : '—' }}</td>
                  <td class="text-end text-danger">{{ w.recurring ? fmt(w.recurring) : '—' }}</td>
                  <td class="text-end" :class="niClass(w.netChange)">{{ fmt(w.netChange) }}</td>
                  <td class="text-end fw-semibold" :class="niClass(w.endingCash)">{{ fmt(w.endingCash) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tabbed item tables -->
      <ul class="nav nav-tabs mb-0" role="tablist">
        <li class="nav-item"><button class="nav-link" :class="{active: tab==='ap'}" @click="tab='ap'">AP Disbursements ({{ data.projectedDisbursements.length }})</button></li>
        <li class="nav-item"><button class="nav-link" :class="{active: tab==='ar'}" @click="tab='ar'">AR Receipts ({{ data.projectedReceipts.length }})</button></li>
        <li class="nav-item"><button class="nav-link" :class="{active: tab==='rec'}" @click="tab='rec'">Recurring ({{ data.recurringExpenses.length }})</button></li>
      </ul>
      <div class="card border-top-0 rounded-top-0">
        <div class="card-body p-0">
          <div class="table-responsive" style="max-height: 480px; overflow-y: auto;">
            <table class="table table-sm table-hover mb-0">
              <thead class="table-light sticky-top">
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Confidence</th>
                  <th class="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in currentItems" :key="i">
                  <td>{{ formatDate(it.date) }}</td>
                  <td>{{ it.description }}</td>
                  <td>
                    <span class="badge" :class="confClass(it.confidence)">{{ it.confidence }}</span>
                  </td>
                  <td class="text-end" :class="tab==='ar' ? 'text-success' : 'text-danger'">
                    {{ tab === 'ar' ? fmt(it.amount) : fmt(-it.amount) }}
                  </td>
                </tr>
                <tr v-if="!currentItems.length"><td colspan="4" class="text-center text-muted py-3">No items in horizon.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const asOfDate = ref(new Date().toISOString().slice(0, 10));
const horizonDays = ref(90);
const data = ref(null);
const loading = ref(false);
const error = ref(null);
const tab = ref('ap');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = { horizonDays: horizonDays.value, asOfDate: asOfDate.value };
    const resp = await api.get('financial-reports/cash-forecast', { params });
    data.value = resp.data;
  } catch (e) {
    error.value = e.response?.data?.error || e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([asOfDate, horizonDays], load);

const currentItems = computed(() => {
  if (!data.value) return [];
  if (tab.value === 'ap') return data.value.projectedDisbursements;
  if (tab.value === 'ar') return data.value.projectedReceipts;
  return data.value.recurringExpenses;
});

// Chart geometry
const chartWidth = 900;
const chartHeight = 280;
const padLeft = 70;
const padRight = 20;
const padTop = 10;
const padBottom = 24;

const weeks = computed(() => data.value?.endingCashByWeek || []);

const yMin = computed(() => {
  if (!weeks.value.length) return 0;
  return Math.min(0, data.value.beginningCash, ...weeks.value.map(w => w.endingCash));
});
const yMax = computed(() => {
  if (!weeks.value.length) return 1;
  return Math.max(0, data.value.beginningCash, ...weeks.value.map(w => w.endingCash));
});
const ySpan = computed(() => Math.max(1, yMax.value - yMin.value));

function xOf(i) {
  const n = weeks.value.length;
  if (n <= 1) return padLeft;
  const span = chartWidth - padLeft - padRight;
  return padLeft + (i / (n - 1)) * span;
}
function yOf(v) {
  const span = chartHeight - padTop - padBottom;
  return padTop + (1 - (v - yMin.value) / ySpan.value) * span;
}
const yOfZero = computed(() => yOf(0));
const zeroLineVisible = computed(() => yMin.value < 0 && yMax.value > 0);

const pointList = computed(() =>
  weeks.value.map((w, i) => ({ x: xOf(i), y: yOf(w.endingCash), val: w.endingCash }))
);

const linePoints = computed(() => pointList.value.map(p => `${p.x},${p.y}`).join(' '));

const yGridValues = computed(() => {
  const steps = 4;
  const out = [];
  for (let k = 0; k <= steps; k++) {
    out.push(yMin.value + (ySpan.value * k) / steps);
  }
  return out;
});

function xLabel(iso, i) {
  if (i % 2 !== 0 && weeks.value.length > 8) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmt(v) { return formatCurrency(v); }
function fmtShort(v) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return v.toFixed(0);
}
function niClass(v) {
  return v > 0 ? 'text-success' : v < 0 ? 'text-danger' : '';
}
function confClass(c) {
  if (c === 'High') return 'bg-success-subtle text-success';
  if (c === 'Medium') return 'bg-warning-subtle text-warning';
  return 'bg-danger-subtle text-danger';
}
</script>
