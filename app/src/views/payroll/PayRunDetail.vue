<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">
            Pay Run #{{ payrollRunId }}
            <span v-if="audit" class="badge ms-2"
              :class="audit.findingsTotal === 0 ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'">
              {{ audit.findingsTotal === 0 ? 'No issues' : audit.findingsTotal + ' findings' }}
            </span>
          </h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'payroll-view' }">Payroll</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">#{{ payrollRunId }}</li>
          </ol>
        </div>
        <button class="btn btn-secondary btn-sm" @click="loadAll" :disabled="loading">
          <i class="ri-refresh-line me-1"></i>Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <div v-else>
      <!-- Audit findings -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Timecard Audit</h5>
          <small class="text-muted">{{ audit?.payStubsTotal || 0 }} paystubs · {{ audit?.findingsTotal || 0 }} findings</small>
        </div>
        <div v-if="audit?.findings?.length" class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-sm table-nowrap mb-0">
              <thead class="table-light">
                <tr>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Employee</th>
                  <th>Message</th>
                  <th style="width: 80px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in audit.findings" :key="f.payStubId + ':' + f.findingType">
                  <td>
                    <span class="badge" :class="f.severity === 'Error' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'">
                      {{ f.severity }}
                    </span>
                  </td>
                  <td>{{ f.findingType }}</td>
                  <td>{{ f.employeeNumber }} — {{ f.employeeName }}</td>
                  <td class="text-muted small">{{ f.message }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" @click="selectStub(f.payStubId)">
                      Open
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="card-body text-center text-muted">
          ✓ No findings — every paystub has timecards in a consistent shape.
        </div>
      </div>

      <!-- Paystub list (left) + Earning Lines preview (right) -->
      <div class="row g-3 mt-1">
        <div class="col-lg-5">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Paystubs in this run</h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive" style="max-height: 600px; overflow: auto;">
                <table class="table table-sm table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Employee</th>
                      <th class="text-end">Stub ID</th>
                      <th class="text-end">Lines</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in paystubs" :key="s.payStubId"
                      :class="{ 'table-active': s.payStubId === selectedStubId }"
                      @click="selectStub(s.payStubId)" style="cursor: pointer;">
                      <td>{{ s.employeeNumber }} — {{ s.employeeName }}</td>
                      <td class="text-end text-muted">{{ s.payStubId }}</td>
                      <td class="text-end">{{ stubLineCounts[s.payStubId] ?? '—' }}</td>
                    </tr>
                    <tr v-if="!paystubs.length">
                      <td colspan="3" class="text-center text-muted py-3">No paystubs.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">
                Earning Lines
                <span v-if="selectedStubId" class="text-muted small">— PayStub #{{ selectedStubId }}</span>
              </h5>
              <small v-if="overtimeSummary" class="text-muted">
                Reg: {{ overtimeSummary.reg }} hrs / ${{ overtimeSummary.regGross.toFixed(2) }}
                · OT: {{ overtimeSummary.ot }} hrs / ${{ overtimeSummary.otGross.toFixed(2) }}
              </small>
            </div>
            <div class="card-body p-0">
              <div v-if="!selectedStubId" class="p-3 text-muted text-center">
                Select a paystub on the left to preview its earning lines.
              </div>
              <div v-else-if="linesLoading" class="p-3 text-center">
                <span class="spinner-border spinner-border-sm"></span>
              </div>
              <div v-else-if="!earningLines.length" class="p-3 text-muted text-center">
                ⚠️ No earning lines — this paystub has zero TimecardEntries.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-sm table-nowrap mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>PayType</th>
                      <th>Dept</th>
                      <th>L&amp;I</th>
                      <th class="text-end">Hours</th>
                      <th class="text-end">Rate</th>
                      <th class="text-end">Gross</th>
                      <th>Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in earningLines" :key="l.timeCardEntryId">
                      <td>{{ l.payTypeCode }} — {{ l.payTypeDescription }}</td>
                      <td>{{ l.department || '—' }}</td>
                      <td>{{ l.employeeLniCode || l.legacyLniCode || '—' }}</td>
                      <td class="text-end">{{ l.hours }}</td>
                      <td class="text-end">${{ Number(l.rate || 0).toFixed(2) }}</td>
                      <td class="text-end">${{ (Number(l.hours || 0) * Number(l.rate || 0)).toFixed(2) }}</td>
                      <td>
                        <span v-if="l.payTypeIsOvertime" class="badge bg-warning-subtle text-warning me-1">OT</span>
                        <span v-if="l.raiseBoundary" class="badge bg-info-subtle text-info">Raise Boundary</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const payrollRunId = computed(() => Number(route.params.payrollRunId))

const loading = ref(true)
const error = ref('')
const audit = ref(null)
const paystubs = ref([])
const stubLineCounts = ref({})
const selectedStubId = ref(null)
const earningLines = ref([])
const linesLoading = ref(false)

const overtimeSummary = computed(() => {
  if (!earningLines.value.length) return null
  let reg = 0, regGross = 0, ot = 0, otGross = 0
  for (const l of earningLines.value) {
    if (l.payTypeCountedInHoursWorked !== true) continue
    const h = Number(l.hours || 0)
    const r = Number(l.rate || 0)
    if (l.payTypeIsOvertime === true) { ot += h; otGross += h * r }
    else { reg += h; regGross += h * r }
  }
  return { reg, regGross, ot, otGross }
})

const loadAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get(`payroll/pay-runs/${payrollRunId.value}/timecard-audit`)
    audit.value = r.data
    // Build paystub list from audit.findings + (separately) any stubs with no finding.
    // Audit doesn't return all paystubs directly — use the findings list as the visible
    // employee set, and skip any stubs that audit considers clean (showing only
    // problematic rows is fine for Phase 3; Phase 8 will mature this view).
    paystubs.value = r.data.findings.map(f => ({
      payStubId: f.payStubId,
      employeeId: f.employeeId,
      employeeNumber: f.employeeNumber,
      employeeName: f.employeeName
    }))
    // If everything is clean, show a message instead of an empty table.
    if (paystubs.value.length === 0 && r.data.payStubsTotal > 0) {
      // No findings means all stubs are clean — we don't have their identities
      // in the audit response. Keep it lightweight: tell the clerk to click
      // through from the calendar list. (Phase 8 wires a full stub list view.)
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load pay run'
  } finally {
    loading.value = false
  }
}

const selectStub = async (payStubId) => {
  selectedStubId.value = payStubId
  linesLoading.value = true
  earningLines.value = []
  try {
    const r = await api.get(`payroll/pay-stubs/${payStubId}/earning-lines`)
    earningLines.value = r.data
    stubLineCounts.value[payStubId] = r.data.length
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to load earning lines'
  } finally {
    linesLoading.value = false
  }
}

onMounted(loadAll)
</script>
