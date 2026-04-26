<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Financial Ratios</h4>
      <div class="d-flex gap-2 align-items-center">
        <label class="small text-muted mb-0">FY</label>
        <select v-model.number="fiscalYear" class="form-select form-select-sm" style="width: 100px;">
          <option v-for="fy in fiscalYears" :key="fy" :value="fy">FY{{ fy }}</option>
        </select>
        <label class="small text-muted mb-0">Through</label>
        <select v-model.number="period" class="form-select form-select-sm" style="width: 80px;">
          <option v-for="p in 12" :key="p" :value="p">P{{ p }}</option>
        </select>
        <button class="btn btn-sm btn-outline-primary" @click="loadAll" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="snapshot">
      <!-- Source totals -->
      <div class="card mb-3">
        <div class="card-body py-2">
          <div class="small text-muted mb-1">Source totals (FY{{ snapshot.fiscalYear }} P{{ snapshot.period }})</div>
          <div class="row g-2 small">
            <div class="col-md col-6"><span class="text-muted">Current Assets</span><br><span class="fw-bold">{{ fmt(snapshot.currentAssets) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">Current Liab.</span><br><span class="fw-bold">{{ fmt(snapshot.currentLiabilities) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">Cash</span><br><span class="fw-bold">{{ fmt(snapshot.cash) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">Inventory</span><br><span class="fw-bold">{{ fmt(snapshot.inventory) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">AR</span><br><span class="fw-bold">{{ fmt(snapshot.accountsReceivable) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">AP</span><br><span class="fw-bold">{{ fmt(snapshot.accountsPayable) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">Total Assets</span><br><span class="fw-bold">{{ fmt(snapshot.totalAssets) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">Total Equity</span><br><span class="fw-bold">{{ fmt(snapshot.totalEquity) }}</span></div>
          </div>
          <div class="row g-2 small mt-1">
            <div class="col-md col-6"><span class="text-muted">Revenue YTD</span><br><span class="fw-bold">{{ fmt(snapshot.revenueYtd) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">COGS YTD</span><br><span class="fw-bold">{{ fmt(snapshot.cogsYtd) }}</span></div>
            <div class="col-md col-6"><span class="text-muted">OpEx YTD</span><br><span class="fw-bold">{{ fmt(snapshot.operatingExpensesYtd) }}</span></div>
            <div class="col-md col-6">
              <span class="text-muted">Net Income YTD</span><br>
              <span class="fw-bold" :class="snapshot.netIncomeYtd >= 0 ? 'text-success' : 'text-danger'">
                {{ fmt(snapshot.netIncomeYtd) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ratios grouped by category -->
      <div v-for="cat in categories" :key="cat" class="mb-3">
        <h6 class="text-muted mb-2">{{ cat }}</h6>
        <div class="row g-3">
          <div v-for="r in ratiosByCategory[cat]" :key="r.key" class="col-md-3 col-sm-6">
            <div class="card h-100" :class="statusBorder(r.status)">
              <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="small text-muted">{{ r.label }}</div>
                  <span v-if="r.status" class="badge" :class="statusBadge(r.status)">{{ r.status }}</span>
                </div>
                <div class="fs-4 fw-bold" :class="statusText(r.status)">
                  {{ displayValue(r) }}
                </div>
                <Sparkline :points="trendPoints(r.key)" :color="sparklineColor(r.status)" />
                <div class="small text-muted mt-1">
                  <span v-if="r.higherIsBetter">Target ≥ {{ formatThreshold(r.warnThreshold, r.unit) }}</span>
                  <span v-else>Target ≤ {{ formatThreshold(r.warnThreshold, r.unit) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h, defineComponent } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const Sparkline = defineComponent({
  name: 'Sparkline',
  props: {
    points: { type: Array, default: () => [] },
    color: { type: String, default: '#0d6efd' },
    width: { type: Number, default: 120 },
    height: { type: Number, default: 30 }
  },
  setup(props) {
    return () => {
      const pts = props.points.filter(v => v !== null && v !== undefined);
      if (pts.length < 2) {
        return h('div', { style: 'height: 30px;' }, '');
      }
      const min = Math.min(...pts);
      const max = Math.max(...pts);
      const range = max - min || 1;
      const xStep = props.width / Math.max(pts.length - 1, 1);
      const d = pts.map((v, i) => {
        const x = (i * xStep).toFixed(1);
        const y = (props.height - ((v - min) / range) * (props.height - 4) - 2).toFixed(1);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
      return h('svg', { width: props.width, height: props.height, viewBox: `0 0 ${props.width} ${props.height}` }, [
        h('path', { d, stroke: props.color, fill: 'none', 'stroke-width': 1.5 })
      ]);
    };
  }
});

const now = new Date();
const defaultFy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
const defaultPeriod = now.getMonth() >= 6 ? now.getMonth() - 5 : now.getMonth() + 7;

const fiscalYear = ref(defaultFy);
const period = ref(defaultPeriod);
const fiscalYears = ref([]);

const snapshot = ref(null);
const trends = ref({});
const loading = ref(false);
const error = ref(null);

function fmt(v) { return formatCurrency(v ?? 0); }

const categories = ['Liquidity', 'Profitability', 'Efficiency', 'Leverage'];

const ratiosByCategory = computed(() => {
  const out = {};
  for (const c of categories) out[c] = [];
  for (const r of (snapshot.value?.ratios || [])) {
    if (!out[r.category]) out[r.category] = [];
    out[r.category].push(r);
  }
  return out;
});

function trendPoints(key) {
  const t = trends.value[key];
  if (!t) return [];
  return t.points.map(p => p.value);
}

function displayValue(r) {
  if (r.value === null || r.value === undefined) return '—';
  if (r.unit === '$') return formatCurrency(r.value);
  if (r.unit === '%') return `${r.value.toFixed(1)}%`;
  if (r.unit === 'days') return `${r.value.toFixed(0)} days`;
  return r.value.toFixed(2);
}

function formatThreshold(v, unit) {
  if (v === null || v === undefined) return '';
  if (unit === '$') return formatCurrency(v);
  if (unit === '%') return `${v}%`;
  if (unit === 'days') return `${v} days`;
  return v.toFixed(2);
}

function statusBorder(s) {
  return s === 'critical' ? 'border-danger'
    : s === 'warn' ? 'border-warning'
    : s === 'good' ? 'border-success' : '';
}
function statusBadge(s) {
  return s === 'critical' ? 'bg-danger'
    : s === 'warn' ? 'bg-warning text-dark'
    : s === 'good' ? 'bg-success' : 'bg-secondary';
}
function statusText(s) {
  return s === 'critical' ? 'text-danger'
    : s === 'warn' ? 'text-warning' : '';
}
function sparklineColor(s) {
  return s === 'critical' ? '#dc3545'
    : s === 'warn' ? '#ffc107'
    : s === 'good' ? '#198754' : '#6c757d';
}

async function loadFiscalYears() {
  try {
    const { data } = await api.get('financial-reports/fiscal-years');
    fiscalYears.value = data;
    if (!data.includes(fiscalYear.value)) fiscalYear.value = data[0];
  } catch {
    fiscalYears.value = [defaultFy, defaultFy - 1];
  }
}

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const [snapResp, trendResp] = await Promise.all([
      api.get('financial-reports/ratios', { params: { fiscalYear: fiscalYear.value, period: period.value } }),
      api.get('financial-reports/ratios/trends', { params: { fiscalYear: fiscalYear.value, throughPeriod: period.value } })
    ]);
    snapshot.value = snapResp.data;
    const byKey = {};
    for (const t of trendResp.data.trends) byKey[t.key] = t;
    trends.value = byKey;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to load ratios';
  } finally {
    loading.value = false;
  }
}

watch([fiscalYear, period], () => loadAll());
onMounted(async () => { await loadFiscalYears(); await loadAll(); });
</script>
