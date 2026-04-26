<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item">Recurring JEs</li>
          <li class="breadcrumb-item active" aria-current="page">Drafts Workflow</li>
        </ol>
      </div>
    </div>

    <!-- Banner for errors / success -->
    <div v-if="banner.message" class="alert" :class="banner.cssClass" role="alert">
      <strong>{{ banner.title }}</strong>
      <span class="ms-2">{{ banner.message }}</span>
      <button type="button" class="btn-close float-end" @click="banner.message = ''"></button>
    </div>

    <!-- Period selector + actions -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div class="flex-grow-1">
            <h5 class="mb-1" v-if="period">
              FY {{ period.fiscalYear }} · Period {{ period.period }}
              <span class="text-muted fs-14 ms-2">{{ formatPeriodRange(period) }}</span>
              <span class="badge ms-2" :class="stateBadgeClass">{{ period.state }}</span>
            </h5>
            <div v-if="period" class="small text-muted mt-1">
              {{ pendingCount }} pending · {{ approvedCount }} approved · {{ rejectedCount }} rejected
              <span v-if="isSoftClose" class="ms-2 text-warning">
                <i class="ri-alert-line"></i>
                Period is Soft-Closed — approvals require an Override Reason
              </span>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadAll" title="Reload drafts">
              <i class="ri-refresh-line"></i>
            </button>
            <button
              v-if="canMaterialize"
              class="btn btn-primary btn-sm"
              :disabled="loading"
              @click="handleMaterialize"
              title="Materialize all active templates not yet run for this period">
              <i class="ri-magic-line"></i> Materialize Due
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending drafts -->
    <div class="card mb-3">
      <div class="card-header">
        <h6 class="mb-0">
          <i class="ri-hourglass-line"></i>
          Pending Review <span class="badge text-bg-warning-subtle text-warning-emphasis ms-1">{{ pendingCount }}</span>
        </h6>
      </div>
      <div class="card-body p-0">
        <div v-if="pending.length === 0" class="text-center py-4 text-muted">
          <i class="ri-check-line fs-2"></i>
          <p class="mb-0 mt-2">No pending drafts. Click <em>Materialize Due</em> to create drafts for this period.</p>
        </div>
        <div v-else class="list-group list-group-flush">
          <div v-for="d in pending" :key="d.draftId" class="list-group-item">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="flex-grow-1">
                <div>
                  <strong>{{ d.templateName }}</strong>
                  <span class="badge text-bg-light text-muted ms-2">{{ d.lines.length }} lines</span>
                  <span v-if="d.isVariable" class="badge text-bg-warning-subtle text-warning-emphasis ms-1" title="Variable template — amounts editable before approving">variable</span>
                  <span v-if="d.reversesDraftId" class="badge text-bg-info-subtle text-info-emphasis ms-1" :title="'Auto-reversing counterpart of draft ' + d.reversesDraftId">auto-reverse</span>
                </div>
                <small class="text-muted">
                  {{ d.description }}
                  · Materialized {{ formatDate(d.materializedAt) }} by {{ d.materializedBy }}
                </small>
              </div>
              <div class="text-end">
                <div><strong>{{ formatMoney(d.totalDebit) }}</strong> DR</div>
                <div><strong>{{ formatMoney(d.totalCredit) }}</strong> CR</div>
              </div>
              <div class="d-flex gap-1">
                <button class="btn btn-outline-secondary btn-sm" @click="toggleExpand(d.draftId)" title="View / edit lines">
                  <i :class="expanded[d.draftId] ? 'ri-arrow-down-s-fill' : 'ri-arrow-right-s-fill'"></i>
                </button>
                <button class="btn btn-success btn-sm"
                        :disabled="loading"
                        @click="openApproveModal(d)">
                  <i class="ri-check-line"></i> Approve
                </button>
                <button class="btn btn-outline-danger btn-sm"
                        :disabled="loading"
                        @click="openRejectModal(d)">
                  <i class="ri-close-line"></i> Reject
                </button>
              </div>
            </div>

            <!-- Expanded line detail -->
            <div v-if="expanded[d.draftId]" class="mt-3 pt-3 border-top">
              <table class="table table-sm mb-0">
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 120px;">Account</th>
                    <th>Memo</th>
                    <th style="width: 140px;" class="text-end">Debit</th>
                    <th style="width: 140px;" class="text-end">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in d.lines" :key="line.draftLineId">
                    <td class="text-muted">{{ line.seq }}</td>
                    <td><code>{{ line.accountNumber }}</code></td>
                    <td class="small">{{ line.memo || '' }}</td>
                    <td class="text-end" :class="{ 'text-muted': line.debit === 0 }">{{ formatMoney(line.debit) }}</td>
                    <td class="text-end" :class="{ 'text-muted': line.credit === 0 }">{{ formatMoney(line.credit) }}</td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th colspan="3" class="text-end">Totals:</th>
                    <th class="text-end">{{ formatMoney(d.totalDebit) }}</th>
                    <th class="text-end">{{ formatMoney(d.totalCredit) }}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Approved drafts (collapsed by default) -->
    <div v-if="approved.length > 0" class="card mb-3">
      <div class="card-header">
        <button class="btn btn-link p-0" @click="showApproved = !showApproved">
          <i :class="showApproved ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
          <strong>Approved</strong>
          <span class="badge text-bg-success-subtle text-success-emphasis ms-1">{{ approvedCount }}</span>
        </button>
      </div>
      <div v-if="showApproved" class="card-body p-0">
        <div class="list-group list-group-flush">
          <div v-for="d in approved" :key="d.draftId" class="list-group-item">
            <div class="d-flex align-items-center">
              <div class="flex-grow-1">
                <strong>{{ d.templateName }}</strong>
                <small class="text-muted ms-2">
                  Posted as batch <code>{{ d.postedBatch }}</code>
                  (GlTransactionId {{ d.postedTxnId }})
                  by {{ d.approvedBy }} · {{ formatDate(d.approvedAt) }}
                </small>
                <div v-if="d.notes" class="small text-muted mt-1">
                  <i class="ri-sticky-note-line"></i> {{ d.notes }}
                </div>
              </div>
              <div class="text-end small text-muted">
                {{ formatMoney(d.totalDebit) }} DR / {{ formatMoney(d.totalCredit) }} CR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rejected drafts (collapsed by default) -->
    <div v-if="rejected.length > 0" class="card mb-3">
      <div class="card-header">
        <button class="btn btn-link p-0" @click="showRejected = !showRejected">
          <i :class="showRejected ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
          <strong>Rejected</strong>
          <span class="badge text-bg-danger-subtle text-danger-emphasis ms-1">{{ rejectedCount }}</span>
        </button>
      </div>
      <div v-if="showRejected" class="card-body p-0">
        <div class="list-group list-group-flush">
          <div v-for="d in rejected" :key="d.draftId" class="list-group-item">
            <div>
              <strong>{{ d.templateName }}</strong>
              <small class="text-muted ms-2">
                Rejected by {{ d.rejectedBy }} · {{ formatDate(d.rejectedAt) }}
              </small>
            </div>
            <div v-if="d.rejectReason" class="small text-muted mt-1">
              <i class="ri-error-warning-line"></i> <em>{{ d.rejectReason }}</em>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ Approve modal ============ -->
    <div v-if="showApproveModal" class="modal-backdrop-wrap" @click.self="showApproveModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Approve: {{ draftBeingEdited?.templateName }}</h5>
        </div>
        <div class="card-body">
          <p class="text-muted small">
            Approving will post this draft to GL as a new batch via <code>SaveBatch</code>.
            <span v-if="isVariableDraft">
              This is a variable template — edit the amounts below before approving.
            </span>
          </p>

          <!-- Line editor (always visible for variable; read-only for fixed) -->
          <div class="table-responsive mb-3">
            <table class="table table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th style="width: 40px;">#</th>
                  <th style="width: 100px;">Account</th>
                  <th>Memo</th>
                  <th style="width: 130px;" class="text-end">Debit</th>
                  <th style="width: 130px;" class="text-end">Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, idx) in approveForm.editedLines" :key="line.draftLineId">
                  <td class="text-muted">{{ idx + 1 }}</td>
                  <td><code>{{ line.accountNumber }}</code></td>
                  <td class="small">
                    <input v-if="isVariableDraft" type="text" class="form-control form-control-sm" v-model="line.memo" />
                    <span v-else>{{ line.memo || '' }}</span>
                  </td>
                  <td>
                    <input v-if="isVariableDraft" type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="line.debit" />
                    <span v-else class="d-block text-end">{{ formatMoney(line.debit) }}</span>
                  </td>
                  <td>
                    <input v-if="isVariableDraft" type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="line.credit" />
                    <span v-else class="d-block text-end">{{ formatMoney(line.credit) }}</span>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <th colspan="3" class="text-end">Totals:</th>
                  <th class="text-end" :class="editedBalanceClass">{{ formatMoney(editedTotalDebit) }}</th>
                  <th class="text-end" :class="editedBalanceClass">{{ formatMoney(editedTotalCredit) }}</th>
                </tr>
              </tfoot>
            </table>
          </div>

          <div v-if="!editedIsBalanced" class="alert alert-warning small mb-3">
            <i class="ri-alert-line"></i>
            Out of balance: debits and credits must match before approving.
          </div>

          <div v-if="isSoftClose" class="mb-3">
            <label class="form-label">
              Override Reason <span class="text-danger">*</span>
              <small class="text-muted">(required — period is Soft-Closed)</small>
            </label>
            <textarea class="form-control" rows="2" v-model="approveForm.overrideReason"
                      placeholder="Why is this posting happening into a Soft-Closed period?"></textarea>
          </div>

          <div class="mb-3">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="2" v-model="approveForm.notes"
                      placeholder="Anything to note about this approval..."></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showApproveModal = false">Cancel</button>
          <button class="btn btn-success"
                  :disabled="loading || !editedIsBalanced || (isSoftClose && !approveForm.overrideReason?.trim())"
                  @click="handleApprove">
            <i class="ri-check-line"></i> Approve &amp; Post
          </button>
        </div>
      </div>
    </div>

    <!-- ============ Reject modal ============ -->
    <div v-if="showRejectModal" class="modal-backdrop-wrap" @click.self="showRejectModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Reject: {{ draftBeingEdited?.templateName }}</h5>
        </div>
        <div class="card-body">
          <p class="text-muted small">
            Rejecting marks the draft as <strong>Rejected</strong> and logs the reason.
            No GL mutation occurs. You can re-materialize the template after fixing
            whatever issue caused the rejection.
          </p>
          <div class="mb-3">
            <label class="form-label">Reason <span class="text-danger">*</span></label>
            <textarea class="form-control" rows="3" v-model="rejectForm.reason" required
                      placeholder="Why is this draft being rejected? (required)"></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showRejectModal = false">Cancel</button>
          <button class="btn btn-outline-danger"
                  :disabled="loading || !rejectForm.reason.trim()"
                  @click="handleReject">
            <i class="ri-close-line"></i> Reject Draft
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * RecurringJeDrafts — Phase 2b daily workflow view.
 *
 * Flow:
 *   1. Period header shows current FY/Period + state pill + counts
 *   2. "Materialize Due" button creates drafts for any active template
 *      that hasn't already been materialized for this period
 *   3. Pending section: each draft has Approve / Reject / Expand buttons
 *   4. Approve modal: line editor for variable templates, OverrideReason
 *      field when period is SoftClose, Notes
 *   5. Reject modal: required reason, no GL mutation
 *
 * Role-gated: Accounting+ can materialize / approve / reject. The server
 * enforces this — the FE does not hide buttons based on role in Phase 2b
 * (deferred to Phase 2c polish).
 */
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

// State
const period = ref(null)
const drafts = ref([])
const loading = ref(false)
const expanded = ref({})
const showApproved = ref(false)
const showRejected = ref(false)
const banner = ref({ message: '', title: '', cssClass: 'alert-info' })

// Modals + forms
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const draftBeingEdited = ref(null)
const approveForm = ref({ editedLines: [], overrideReason: '', notes: '' })
const rejectForm = ref({ reason: '' })

// Derived
const pending = computed(() => drafts.value.filter(d => d.status === 'Pending'))
const approved = computed(() => drafts.value.filter(d => d.status === 'Approved'))
const rejected = computed(() => drafts.value.filter(d => d.status === 'Rejected'))
const pendingCount = computed(() => pending.value.length)
const approvedCount = computed(() => approved.value.length)
const rejectedCount = computed(() => rejected.value.length)

const isSoftClose = computed(() => period.value?.state === 'SoftClose')
const canMaterialize = computed(() => period.value?.state === 'Open' || period.value?.state === 'InClose')

const stateBadgeClass = computed(() => {
  switch (period.value?.state) {
    case 'Open':      return 'text-bg-success-subtle text-success-emphasis'
    case 'InClose':   return 'text-bg-warning-subtle text-warning-emphasis'
    case 'SoftClose': return 'text-bg-warning-subtle text-warning-emphasis'
    case 'HardClose': return 'text-bg-secondary-subtle text-secondary-emphasis'
    case 'Audited':   return 'text-bg-info-subtle text-info-emphasis'
    default:          return 'text-bg-light text-muted'
  }
})

const isVariableDraft = computed(() => {
  // Phase 2c: use the draft.isVariable field propagated from the template
  // at materialization time. Replaces the Phase 2b heuristic that checked
  // whether totalDebit == totalCredit == 0, which misfired on pre-seeded
  // variable templates like Money Market Interest.
  return !!draftBeingEdited.value?.isVariable
})

const editedTotalDebit = computed(() =>
  approveForm.value.editedLines.reduce((sum, l) => sum + Number(l.debit || 0), 0))
const editedTotalCredit = computed(() =>
  approveForm.value.editedLines.reduce((sum, l) => sum + Number(l.credit || 0), 0))
const editedIsBalanced = computed(() =>
  Math.abs(editedTotalDebit.value - editedTotalCredit.value) < 0.01)
const editedBalanceClass = computed(() => editedIsBalanced.value ? '' : 'text-danger')

// Formatting
function formatMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(v) {
  if (!v) return ''
  return new Date(v).toLocaleString()
}
function formatPeriodRange(p) {
  if (!p) return ''
  return `${new Date(p.startDate).toLocaleDateString()} – ${new Date(p.endDate).toLocaleDateString()}`
}

function toggleExpand(id) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

function setBanner(type, title, message) {
  const cssMap = { success: 'alert-success', info: 'alert-info', warning: 'alert-warning', error: 'alert-danger' }
  banner.value = { message, title, cssClass: cssMap[type] || 'alert-info' }
}
function clearBanner() { banner.value.message = '' }

function describeError(e) {
  const data = e?.response?.data
  if (data?.error === 'PeriodClosed') {
    return `FY ${data.fiscalYear} Period ${data.period} is ${data.state}. ${data.message}`
  }
  if (data?.message) return data.message
  if (typeof data === 'string') return data
  if (e?.message) return e.message
  return 'Unknown error'
}

// Data loading
async function loadAll() {
  loading.value = true
  clearBanner()
  try {
    const pResp = await api.get('fiscal-period/current')
    period.value = pResp.data
    await loadDrafts()
  } catch (e) {
    setBanner('error', 'Load failed', describeError(e))
  } finally {
    loading.value = false
  }
}

async function loadDrafts() {
  if (!period.value) return
  try {
    const resp = await api.get(`recurring-je/drafts?fy=${period.value.fiscalYear}&period=${period.value.period}`)
    drafts.value = resp.data || []
  } catch (e) {
    drafts.value = []
    setBanner('error', 'Load drafts failed', describeError(e))
  }
}

// Actions
async function handleMaterialize() {
  loading.value = true
  try {
    const resp = await api.post('recurring-je/materialize', {
      fiscalYear: period.value.fiscalYear,
      period: period.value.period,
    })
    const count = (resp.data || []).length
    if (count === 0) {
      setBanner('info', 'No new drafts', 'All active templates have already been materialized for this period.')
    } else {
      setBanner('success', 'Materialized', `${count} draft${count === 1 ? '' : 's'} created.`)
    }
    await loadDrafts()
  } catch (e) {
    setBanner('error', 'Materialize failed', describeError(e))
  } finally {
    loading.value = false
  }
}

function openApproveModal(draft) {
  draftBeingEdited.value = draft
  // Clone the lines so edits don't mutate the list view until we send
  approveForm.value = {
    editedLines: draft.lines.map(l => ({
      draftLineId: l.draftLineId,
      accountNumber: l.accountNumber,
      debit: Number(l.debit),
      credit: Number(l.credit),
      memo: l.memo || '',
    })),
    overrideReason: '',
    notes: '',
  }
  showApproveModal.value = true
}

async function handleApprove() {
  if (!editedIsBalanced.value) return
  loading.value = true
  try {
    const body = {
      notes: approveForm.value.notes || null,
      overrideReason: approveForm.value.overrideReason || null,
    }
    // Only send editedLines if this is a variable draft (avoid churn on fixed templates)
    if (isVariableDraft.value) {
      body.editedLines = approveForm.value.editedLines.map(l => ({
        draftLineId: l.draftLineId,
        debit: l.debit,
        credit: l.credit,
        memo: l.memo || null,
      }))
    }
    await api.post(`recurring-je/drafts/${draftBeingEdited.value.draftId}/approve`, body)
    showApproveModal.value = false
    setBanner('success', 'Approved', `${draftBeingEdited.value.templateName} posted to GL.`)
    await loadDrafts()
  } catch (e) {
    setBanner('error', 'Approve failed', describeError(e))
  } finally {
    loading.value = false
  }
}

function openRejectModal(draft) {
  draftBeingEdited.value = draft
  rejectForm.value = { reason: '' }
  showRejectModal.value = true
}

async function handleReject() {
  if (!rejectForm.value.reason.trim()) return
  loading.value = true
  try {
    await api.post(`recurring-je/drafts/${draftBeingEdited.value.draftId}/reject`, rejectForm.value)
    showRejectModal.value = false
    setBanner('warning', 'Rejected', `${draftBeingEdited.value.templateName} marked Rejected.`)
    await loadDrafts()
  } catch (e) {
    setBanner('error', 'Reject failed', describeError(e))
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.modal-backdrop-wrap {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1080;
}
.modal-card {
  max-width: 720px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.fs-14 { font-size: 0.875rem; }
</style>
