<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Segment P&amp;L</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <label class="small text-muted mb-0">Slice by</label>
        <select v-model="segmentType" class="form-select form-select-sm" style="width: 150px;">
          <option value="Product">Product</option>
          <option value="ProductYear">Product Year</option>
        </select>
        <label class="small text-muted mb-0">FY</label>
        <select v-model.number="fiscalYear" class="form-select form-select-sm" style="width: 100px;">
          <option v-for="fy in fiscalYears" :key="fy" :value="fy">FY{{ fy }}</option>
        </select>
        <label class="small text-muted mb-0">Through</label>
        <select v-model.number="period" class="form-select form-select-sm" style="width: 90px;">
          <option :value="null">Full Year</option>
          <option v-for="p in 12" :key="p" :value="p">P{{ p }}</option>
        </select>
        <button class="btn btn-sm btn-outline-primary" @click="load" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <div class="card mb-3">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>{{ segmentType === 'Product' ? 'Product' : 'Crop Year' }}</th>
                  <th class="text-end">Revenue</th>
                  <th class="text-end">COGS</th>
                  <th class="text-end">Gross Profit</th>
                  <th class="text-end">Operating Exp.</th>
                  <th class="text-end">Net Income</th>
                  <th class="text-end">% Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in data.segments" :key="s.segmentId">
                  <td class="small text-muted">{{ s.segmentId }}</td>
                  <td class="fw-semibold">{{ s.segmentName }}</td>
                  <td class="text-end">{{ fmt(s.revenue) }}</td>
                  <td class="text-end">{{ fmt(s.cogs) }}</td>
                  <td class="text-end">{{ fmt(s.grossProfit) }}</td>
                  <td class="text-end">{{ fmt(s.operatingExpenses) }}</td>
                  <td class="text-end fw-semibold" :class="niClass(s.netIncome)">{{ fmt(s.netIncome) }}</td>
                  <td class="text-end small text-muted">{{ pct(s.percentOfTotalRevenue) }}</td>
                </tr>
                <tr class="table-warning">
                  <td class="small text-muted">—</td>
                  <td class="fw-semibold fst-italic">Unallocated</td>
                  <td class="text-end">{{ fmt(data.unallocated.revenue) }}</td>
                  <td class="text-end">{{ fmt(data.unallocated.cogs) }}</td>
                  <td class="text-end">{{ fmt(data.unallocated.grossProfit) }}</td>
                  <td class="text-end">{{ fmt(data.unallocated.operatingExpenses) }}</td>
                  <td class="text-end fw-semibold" :class="niClass(data.unallocated.netIncome)">{{ fmt(data.unallocated.netIncome) }}</td>
                  <td class="text-end small text-muted">{{ pct(data.unallocated.percentOfTotalRevenue) }}</td>
                </tr>
                <tr class="table-secondary fw-bold">
                  <td></td>
                  <td>Consolidated Total</td>
                  <td class="text-end">{{ fmt(data.consolidatedTotal.revenue) }}</td>
                  <td class="text-end">{{ fmt(data.consolidatedTotal.cogs) }}</td>
                  <td class="text-end">{{ fmt(data.consolidatedTotal.grossProfit) }}</td>
                  <td class="text-end">{{ fmt(data.consolidatedTotal.operatingExpenses) }}</td>
                  <td class="text-end" :class="niClass(data.consolidatedTotal.netIncome)">{{ fmt(data.consolidatedTotal.netIncome) }}</td>
                  <td class="text-end">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Revenue vs Net Income bar chart -->
      <div v-if="chartSegments.length" class="card">
        <div class="card-body">
          <h6 class="mb-3">Revenue vs Net Income by {{ segmentType === 'Product' ? 'Product' : 'Crop Year' }}</h6>
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-height: 360px;">
            <g v-for="(seg, i) in chartSegments" :key="seg.segmentId">
              <text :x="labelX" :y="barY(i) + barHeight / 2 + 4" text-anchor="end" font-size="11" fill="#555">
                {{ seg.segmentName.length > 22 ? seg.segmentName.slice(0, 22) + '…' : seg.segmentName }}
              </text>
              <!-- Revenue bar -->
              <rect
                :x="zeroX"
                :y="barY(i)"
                :width="barWidth(seg.revenue)"
                :height="barHeight / 2 - 1"
                :fill="seg.revenue >= 0 ? '#4e79a7' : '#b07aa1'"
              />
              <!-- Net Income bar -->
              <rect
                :x="seg.netIncome >= 0 ? zeroX : zeroX - barWidth(Math.abs(seg.netIncome))"
                :y="barY(i) + barHeight / 2 + 1"
                :width="barWidth(Math.abs(seg.netIncome))"
                :height="barHeight / 2 - 1"
                :fill="seg.netIncome >= 0 ? '#59a14f' : '#e15759'"
              />
            </g>
            <!-- Zero axis -->
            <line :x1="zeroX" :y1="10" :x2="zeroX" :y2="chartHeight - 20" stroke="#333" stroke-width="1" />
            <!-- Legend -->
            <rect :x="chartWidth - 180" y="10" width="10" height="10" fill="#4e79a7" />
            <text :x="chartWidth - 165" y="19" font-size="11" fill="#555">Revenue</text>
            <rect :x="chartWidth - 95" y="10" width="10" height="10" fill="#59a14f" />
            <text :x="chartWidth - 80" y="19" font-size="11" fill="#555">Net Income</text>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const currentFy = (() => {
  const d = new Date();
  return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
})();

const fiscalYear = ref(currentFy);
const period = ref(null);
const segmentType = ref('Product');
const data = ref(null);
const fiscalYears = ref([]);
const loading = ref(false);
const error = ref(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = { fiscalYear: fiscalYear.value, segmentType: segmentType.value };
    if (period.value != null) params.throughPeriod = period.value;
    const resp = await api.get('financial-reports/segment-pnl', { params });
    data.value = resp.data;
    if (resp.data.availableFiscalYears?.length) fiscalYears.value = resp.data.availableFiscalYears;
  } catch (e) {
    error.value = e.response?.data?.error || e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([fiscalYear, period, segmentType], load);

// Chart geometry
const chartSegments = computed(() =>
  (data.value?.segments || []).filter(s => s.revenue !== 0 || s.netIncome !== 0)
);
const chartWidth = 760;
const barHeight = 32;
const labelX = 160;
const zeroX = 180;
const chartHeight = computed(() => Math.max(80, chartSegments.value.length * barHeight + 30));

const maxAbs = computed(() => {
  let m = 1;
  for (const s of chartSegments.value) {
    m = Math.max(m, Math.abs(s.revenue), Math.abs(s.netIncome));
  }
  return m;
});

function barWidth(value) {
  const scale = (chartWidth - zeroX - 190) / maxAbs.value;
  return Math.max(0, Math.abs(value) * scale);
}
function barY(i) { return 10 + i * barHeight; }

function fmt(v) {
  return formatCurrency(v);
}
function pct(v) {
  return (v == null ? 0 : Number(v)).toFixed(2) + '%';
}
function niClass(v) {
  return v > 0 ? 'text-success' : v < 0 ? 'text-danger' : '';
}
</script>
