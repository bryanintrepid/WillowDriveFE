<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ lease?.leaseNumber || 'Lease Detail' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/leases">Leases</router-link></li>
            <li class="breadcrumb-item active">Detail</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/leases" class="btn btn-outline-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="!lease" class="text-center my-5">
      <div class="spinner-border spinner-border-sm"></div> Loading...
    </div>
    <template v-else>
      <!-- Header panel -->
      <div class="card mx-3 mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <table class="table table-sm table-borderless mb-0">
                <tr><td class="text-muted" style="width:180px">Description</td><td>{{ lease.description }}</td></tr>
                <tr><td class="text-muted">Type</td><td>
                  <span :class="lease.leaseType === 'Finance' ? 'badge bg-info text-dark' : 'badge bg-secondary'">
                    {{ lease.leaseType }}
                  </span>
                </td></tr>
                <tr><td class="text-muted">Asset</td><td>{{ lease.assetType }}</td></tr>
                <tr><td class="text-muted">Commencement</td><td>{{ formatDate(lease.commencementDate) }}</td></tr>
                <tr><td class="text-muted">Expiration</td><td>{{ formatDate(lease.expirationDate) }}</td></tr>
                <tr><td class="text-muted">Monthly Payment</td><td class="fw-bold">{{ formatCurrency(lease.monthlyPayment) }}</td></tr>
                <tr><td class="text-muted">Discount Rate (IBR)</td><td>{{ (lease.discountRate * 100).toFixed(3) }}%</td></tr>
                <tr><td class="text-muted">PV of Payments</td><td>{{ formatCurrency(lease.presentValuePayments) }}</td></tr>
                <tr><td class="text-muted">Status</td><td><span :class="statusBadge(lease.status)">{{ lease.status }}</span></td></tr>
              </table>
            </div>
            <div class="col-md-6">
              <table class="table table-sm table-borderless mb-0">
                <tr><td class="text-muted" style="width:220px">ROU Asset Account</td>
                    <td class="small">{{ lease.rouAssetAccount }} {{ lease.rouAssetAccountDescription }}</td></tr>
                <tr><td class="text-muted">Lease Liability Account</td>
                    <td class="small">{{ lease.leaseLiabilityAccount }} {{ lease.leaseLiabilityAccountDescription }}</td></tr>
                <tr><td class="text-muted">Cash Account</td>
                    <td class="small">{{ lease.cashAccount }} {{ lease.cashAccountDescription }}</td></tr>
                <tr v-if="lease.leaseType === 'Operating'"><td class="text-muted">Lease Expense</td>
                    <td class="small">{{ lease.leaseExpenseAccount }} {{ lease.leaseExpenseAccountDescription }}</td></tr>
                <tr v-if="lease.leaseType === 'Finance'"><td class="text-muted">Interest Expense</td>
                    <td class="small">{{ lease.interestExpenseAccount }} {{ lease.interestExpenseAccountDescription }}</td></tr>
                <tr v-if="lease.leaseType === 'Finance'"><td class="text-muted">Amortization Expense</td>
                    <td class="small">{{ lease.amortizationExpenseAccount || '-' }} {{ lease.amortizationExpenseAccountDescription || '' }}</td></tr>
                <tr v-if="lease.leaseType === 'Finance'"><td class="text-muted">Accum. Amortization</td>
                    <td class="small">{{ lease.accumAmortizationAccount || '-' }} {{ lease.accumAmortizationAccountDescription || '' }}</td></tr>
                <tr><td class="text-muted pt-3">ROU Asset Balance</td><td class="fw-bold pt-3">{{ formatCurrency(lease.rouAssetBalance) }}</td></tr>
                <tr><td class="text-muted">Lease Liability Balance</td><td class="fw-bold">{{ formatCurrency(lease.leaseLiabilityBalance) }}</td></tr>
                <tr><td class="text-muted">Accumulated Amortization</td><td>{{ formatCurrency(lease.accumulatedAmortization) }}</td></tr>
              </table>
            </div>
          </div>
          <div class="mt-3">
            <div class="progress" style="height: 22px;">
              <div class="progress-bar" :style="{ width: paymentPct + '%' }">
                Payments {{ lease.postedPayments }}/{{ lease.totalPayments }} ({{ paymentPct }}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Schedule -->
      <div class="card mx-3 mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Payment Schedule</h6>
          <small class="text-muted">{{ lease.paymentSchedule.length }} payments</small>
        </div>
        <div class="card-body">
          <div class="table-responsive" style="max-height: 400px;">
            <table class="table table-sm table-hover align-middle">
              <thead class="sticky-top bg-white">
                <tr>
                  <th>#</th>
                  <th>FY/Period</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance After</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th style="width:60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in lease.paymentSchedule" :key="p.paymentScheduleId"
                    :class="{ 'text-muted text-decoration-line-through': p.isReversed }">
                  <td>{{ p.paymentNumber }}</td>
                  <td class="small">FY{{ p.fiscalYear }} P{{ p.period }}</td>
                  <td class="small">{{ formatDate(p.paymentDate) }}</td>
                  <td>{{ formatCurrency(p.paymentAmount) }}</td>
                  <td>{{ formatCurrency(p.principalPortion) }}</td>
                  <td>{{ formatCurrency(p.interestPortion) }}</td>
                  <td>{{ formatCurrency(p.liabilityBalanceAfter) }}</td>
                  <td><code class="small">{{ p.postedBatch || '-' }}</code></td>
                  <td>
                    <span v-if="p.isReversed" class="badge bg-warning text-dark">Reversed</span>
                    <span v-else-if="p.isPosted" class="badge bg-success">Posted</span>
                    <span v-else class="badge bg-light text-dark">Pending</span>
                  </td>
                  <td>
                    <button v-if="p.isPosted" class="btn btn-sm btn-outline-warning"
                            @click="reverse('Payment', p.paymentScheduleId, `#${p.paymentNumber}`)" title="Reverse">
                      <i class="ri-arrow-go-back-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Amortization Schedule (finance leases) -->
      <div v-if="lease.leaseType === 'Finance'" class="card mx-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">ROU Amortization Schedule</h6>
          <small class="text-muted">{{ lease.amortizationSchedule.length }} periods</small>
        </div>
        <div class="card-body">
          <div class="table-responsive" style="max-height: 400px;">
            <table class="table table-sm table-hover align-middle">
              <thead class="sticky-top bg-white">
                <tr>
                  <th>FY</th>
                  <th>Period</th>
                  <th>Amortization</th>
                  <th>Accumulated</th>
                  <th>Net ROU Asset</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th style="width:60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in lease.amortizationSchedule" :key="a.amortizationId"
                    :class="{ 'text-muted text-decoration-line-through': a.isReversed }">
                  <td>{{ a.fiscalYear }}</td>
                  <td>{{ a.period }}</td>
                  <td>{{ formatCurrency(a.amortizationAmount) }}</td>
                  <td>{{ formatCurrency(a.accumulatedAmortization) }}</td>
                  <td>{{ formatCurrency(a.netRouAsset) }}</td>
                  <td><code class="small">{{ a.postedBatch || '-' }}</code></td>
                  <td>
                    <span v-if="a.isReversed" class="badge bg-warning text-dark">Reversed</span>
                    <span v-else-if="a.isPosted" class="badge bg-success">Posted</span>
                    <span v-else class="badge bg-light text-dark">Pending</span>
                  </td>
                  <td>
                    <button v-if="a.isPosted" class="btn btn-sm btn-outline-warning"
                            @click="reverse('Amortization', a.amortizationId, `FY${a.fiscalYear} P${a.period}`)"
                            title="Reverse">
                      <i class="ri-arrow-go-back-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
const lease = ref(null)

const paymentPct = computed(() => {
  if (!lease.value || !lease.value.totalPayments) return 0
  return Math.round((lease.value.postedPayments / lease.value.totalPayments) * 100)
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
    const resp = await api.get(`leases/${route.params.id}`)
    lease.value = resp.data
  } catch (err) {
    console.error('Load error:', err)
  }
}

async function reverse(postingType, postingId, label) {
  if (!confirm(`Reverse ${postingType.toLowerCase()} ${label}?`)) return
  try {
    await api.post('leases/reverse', { postingType, postingId })
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Reverse failed')
  }
}

onMounted(load)
</script>
