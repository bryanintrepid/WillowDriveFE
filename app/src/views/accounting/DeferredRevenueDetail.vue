<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ schedule?.name || 'Deferred Revenue Detail' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/deferred-revenue">Deferred Revenue</router-link></li>
            <li class="breadcrumb-item active">Detail</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/deferred-revenue" class="btn btn-outline-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="!schedule" class="text-center my-5">
      <div class="spinner-border spinner-border-sm"></div> Loading...
    </div>
    <template v-else>
      <div class="card mx-3 mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table table-sm table-borderless mb-0">
                <tr><td class="text-muted" style="width:180px">Status</td><td><span :class="statusBadge(schedule.status)">{{ schedule.status }}</span></td></tr>
                <tr><td class="text-muted">Total Amount</td><td class="fw-bold">{{ formatCurrency(schedule.totalAmount) }}</td></tr>
                <tr><td class="text-muted">Method</td><td>{{ schedule.method }}</td></tr>
                <tr><td class="text-muted">Period Range</td><td>FY{{ schedule.startFiscalYear }} P{{ schedule.startPeriod }} – FY{{ schedule.endFiscalYear }} P{{ schedule.endPeriod }} ({{ schedule.totalPeriods }} periods)</td></tr>
                <tr><td class="text-muted">Dr Liability</td><td>{{ schedule.deferredRevenueAccount }} {{ schedule.deferredRevenueAccountDescription }}</td></tr>
                <tr><td class="text-muted">Cr Revenue</td><td>{{ schedule.revenueAccount }} {{ schedule.revenueAccountDescription }}</td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table table-sm table-borderless mb-0">
                <tr><td class="text-muted" style="width:180px">Customer</td><td>{{ schedule.customerName || '-' }}</td></tr>
                <tr><td class="text-muted">Invoice Reference</td><td>{{ schedule.invoiceReference || '-' }}</td></tr>
                <tr><td class="text-muted">Description</td><td>{{ schedule.description || '-' }}</td></tr>
                <tr><td class="text-muted">Recognized</td><td>{{ schedule.postedPeriods }} / {{ schedule.totalPeriods }} periods ({{ formatCurrency(schedule.postedTotal) }})</td></tr>
                <tr><td class="text-muted">Remaining</td><td>{{ formatCurrency(schedule.remainingAmount) }}</td></tr>
              </table>
            </div>
          </div>
          <div class="mt-2">
            <div class="progress" style="height: 22px;">
              <div class="progress-bar" :style="{ width: progressPct + '%' }">
                {{ progressPct }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Posting History -->
      <div class="card mx-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Recognition History</h6>
        </div>
        <div class="card-body">
          <div v-if="!schedule.postings.length" class="text-center my-3 text-muted">
            No recognitions posted yet.
          </div>
          <table v-else class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>FY</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Batch</th>
                <th>Posted</th>
                <th>Status</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in schedule.postings" :key="p.postingId"
                  :class="{ 'text-muted text-decoration-line-through': p.isReversed }">
                <td>{{ p.fiscalYear }}</td>
                <td>{{ p.period }}</td>
                <td>{{ formatCurrency(p.amount) }}</td>
                <td><code>{{ p.batch }}</code></td>
                <td class="small">{{ formatDate(p.postedAt) }}</td>
                <td>
                  <span v-if="p.isReversed" class="badge bg-warning text-dark">Reversed</span>
                  <span v-else class="badge bg-success">Recognized</span>
                </td>
                <td>
                  <button v-if="!p.isReversed" class="btn btn-sm btn-outline-warning"
                          @click="reversePosting(p)" title="Reverse">
                    <i class="ri-arrow-go-back-line"></i>
                  </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const schedule = ref(null)

const progressPct = computed(() => {
  if (!schedule.value || !schedule.value.totalPeriods) return 0
  return Math.round((schedule.value.postedPeriods / schedule.value.totalPeriods) * 100)
})

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString()
}

function statusBadge(status) {
  if (status === 'Active') return 'badge bg-success'
  if (status === 'Completed') return 'badge bg-primary'
  return 'badge bg-secondary'
}

async function load() {
  try {
    const resp = await api.get(`deferred-revenue/${route.params.id}`)
    schedule.value = resp.data
  } catch (err) {
    console.error('Load error:', err)
  }
}

async function reversePosting(p) {
  if (!confirm(`Reverse recognition for P${p.period} FY${p.fiscalYear} (${formatCurrency(p.amount)})?`)) return
  try {
    await api.post('deferred-revenue/reverse', { postingId: p.postingId })
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Reverse failed')
  }
}

onMounted(load)
</script>
