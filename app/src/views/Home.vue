<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Executive Dashboard</h4>
      <span class="badge bg-primary fs-6">FY {{ d?.fiscalYear }} P{{ d?.currentPeriod }} — {{ d?.periodState }}</span>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="d">
      <!-- Row 1: Key Financial KPIs -->
      <div class="row g-3 mb-3">
        <div class="col-md-3">
          <div class="card border-success">
            <div class="card-body py-2">
              <div class="small text-muted">Cash Balance</div>
              <div class="fs-4 fw-bold text-success">{{ fmt(d.cashBalance) }}</div>
              <div class="small text-muted" v-if="d.cashRunwayMonths > 0">
                {{ d.cashRunwayMonths }} mo runway
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-primary">
            <div class="card-body py-2">
              <div class="small text-muted">Total Assets</div>
              <div class="fs-4 fw-bold text-primary">{{ fmt(d.totalAssets) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-info">
            <div class="card-body py-2">
              <div class="small text-muted">Total Liabilities</div>
              <div class="fs-4 fw-bold text-info">{{ fmt(d.totalLiabilities) }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-secondary">
            <div class="card-body py-2">
              <div class="small text-muted">Total Equity</div>
              <div class="fs-4 fw-bold">{{ fmt(d.totalEquity) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 1b: Financial Ratios -->
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small text-muted">Revenue MTD</div>
                  <div class="fs-5 fw-bold">{{ fmt(d.revenueMtd) }}</div>
                </div>
                <div class="text-end">
                  <div class="small text-muted">vs Budget</div>
                  <div :class="d.revenueVarianceMtd >= 0 ? 'text-success' : 'text-danger'">
                    {{ d.revenueVarianceMtd >= 0 ? '+' : '' }}{{ fmt(d.revenueVarianceMtd) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small text-muted">Expense MTD</div>
                  <div class="fs-5 fw-bold">{{ fmt(d.expenseMtd) }}</div>
                </div>
                <div class="text-end">
                  <div class="small text-muted">vs Budget</div>
                  <div :class="d.expenseVarianceMtd <= 0 ? 'text-success' : 'text-danger'">
                    {{ d.expenseVarianceMtd >= 0 ? '+' : '' }}{{ fmt(d.expenseVarianceMtd) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="small text-muted">Current Ratio</div>
                  <div class="fs-5 fw-bold" :class="d.currentRatio >= 1.5 ? 'text-success' : d.currentRatio >= 1 ? 'text-warning' : 'text-danger'">
                    {{ d.currentRatio?.toFixed(2) || '0.00' }}
                  </div>
                </div>
                <div class="text-end">
                  <div class="small text-muted">DSO</div>
                  <div class="fs-5 fw-bold" :class="d.dso <= 45 ? 'text-success' : d.dso <= 60 ? 'text-warning' : 'text-danger'">
                    {{ d.dso?.toFixed(0) || '0' }} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: AR/AP Aging -->
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center py-2">
              <span class="fw-bold">Accounts Receivable</span>
              <router-link to="/accounting/aging-ar" class="btn btn-sm btn-outline-primary py-0">Detail</router-link>
            </div>
            <div class="card-body py-2">
              <div class="d-flex justify-content-between mb-1">
                <span>Total ({{ d.arCustomerCount }} customers)</span>
                <span class="fw-bold">{{ fmt(d.arAgingTotal) }}</span>
              </div>
              <div class="d-flex justify-content-between small">
                <span>Current</span><span class="text-success">{{ fmt(d.arCurrent) }}</span>
              </div>
              <div class="d-flex justify-content-between small">
                <span>Past Due</span>
                <span :class="d.arPastDue > 0 ? 'text-danger fw-bold' : ''">{{ fmt(d.arPastDue) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center py-2">
              <span class="fw-bold">Accounts Payable</span>
              <router-link to="/accounting/aging-ap" class="btn btn-sm btn-outline-primary py-0">Detail</router-link>
            </div>
            <div class="card-body py-2">
              <div class="d-flex justify-content-between mb-1">
                <span>Total ({{ d.apVendorCount }} vendors)</span>
                <span class="fw-bold">{{ fmt(d.apAgingTotal) }}</span>
              </div>
              <div class="d-flex justify-content-between small">
                <span>Current</span><span class="text-success">{{ fmt(d.apCurrent) }}</span>
              </div>
              <div class="d-flex justify-content-between small">
                <span>Past Due</span>
                <span :class="d.apPastDue > 0 ? 'text-danger fw-bold' : ''">{{ fmt(d.apPastDue) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Workflow Status -->
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header py-2 fw-bold">Close Workflow</div>
            <div class="card-body py-2">
              <div v-if="d.activeCloseRun">
                <div class="small text-muted">FY{{ d.activeCloseRun.fiscalYear }} P{{ d.activeCloseRun.period }}</div>
                <div class="progress mt-1" style="height: 20px;">
                  <div class="progress-bar" :style="{ width: closeProgress + '%' }">
                    {{ d.activeCloseRun.completedTasks }}/{{ d.activeCloseRun.totalTasks }}
                  </div>
                </div>
                <router-link to="/accounting/close-dashboard" class="btn btn-sm btn-outline-primary mt-2 py-0">Go to Close</router-link>
              </div>
              <div v-else class="text-muted small">No active close run</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header py-2 fw-bold">Action Items</div>
            <div class="card-body py-2">
              <div class="d-flex justify-content-between small" v-if="d.pendingRecurringDrafts > 0">
                <span>Pending JE Drafts</span>
                <span class="badge bg-warning">{{ d.pendingRecurringDrafts }}</span>
              </div>
              <div class="d-flex justify-content-between small" v-if="d.unacknowledgedExceptions > 0">
                <span>Period Exceptions</span>
                <span class="badge bg-danger">{{ d.unacknowledgedExceptions }}</span>
              </div>
              <div v-if="d.pendingRecurringDrafts === 0 && d.unacknowledgedExceptions === 0"
                class="text-success small">All clear</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header py-2 fw-bold">Budget</div>
            <div class="card-body py-2">
              <div class="d-flex justify-content-between small">
                <span>FY {{ d.fiscalYear }}</span>
                <span class="badge" :class="d.budgetLocked ? 'bg-success' : 'bg-secondary'">
                  {{ d.budgetLocked ? 'Locked' : 'Unlocked' }}
                </span>
              </div>
              <router-link to="/accounting/budget-editor" class="btn btn-sm btn-outline-primary mt-2 py-0">Editor</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 4: Recent Activity -->
      <div class="card">
        <div class="card-header py-2 fw-bold">Recent Activity</div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            <tbody>
              <tr v-for="(a, i) in d.recentAudit" :key="i">
                <td class="text-nowrap small">{{ fmtDate(a.actionAt) }}</td>
                <td><span class="badge bg-secondary">{{ a.action }}</span></td>
                <td class="small">{{ a.targetType }} {{ a.targetId }}</td>
                <td class="small text-muted">{{ a.actorUserName }}</td>
              </tr>
              <tr v-if="!d.recentAudit?.length">
                <td class="text-muted small py-2">No recent activity</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const router = useRouter();

const d = ref(null);
const loading = ref(false);
const error = ref(null);

function fmt(val) { return formatCurrency(val ?? 0); }
function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const closeProgress = computed(() => {
  if (!d.value?.activeCloseRun?.totalTasks) return 0;
  return Math.round((d.value.activeCloseRun.completedTasks / d.value.activeCloseRun.totalTasks) * 100);
});

onMounted(async () => {
  loading.value = true;
  try {
    const { data: resp } = await api.get('dashboard');
    d.value = resp;
  } catch (e) {
    if (e.response?.status === 401) {
      // Non-CFO/Admin — show a simple message instead of redirecting
      // (avoids redirect loop if user also lacks accounting access)
      error.value = 'The executive dashboard is available to CFO and Admin users. Please use the sidebar to navigate.';
      return;
    } else {
      error.value = e.response?.data?.message || e.message || 'Failed to load dashboard';
    }
  } finally {
    loading.value = false;
  }
});
</script>
