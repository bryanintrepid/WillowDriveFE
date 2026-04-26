<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item active" aria-current="page">Period Close</li>
        </ol>
      </div>
    </div>

    <!-- Error / success banners -->
    <div v-if="banner.message" class="alert" :class="banner.cssClass" role="alert">
      <strong>{{ banner.title }}</strong>
      <span class="ms-2">{{ banner.message }}</span>
      <button type="button" class="btn-close float-end" @click="banner.message = ''" aria-label="Dismiss"></button>
    </div>

    <!-- Period header card -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center gap-3">
          <div class="flex-grow-1">
            <h5 class="mb-1" v-if="period">
              FY {{ period.fiscalYear }} · Period {{ period.period }}
              <span class="text-muted fs-14 ms-2">
                {{ formatPeriodRange(period) }}
              </span>
            </h5>
            <h5 class="mb-1 text-muted" v-else>Loading period...</h5>
            <div v-if="period" class="d-flex align-items-center gap-2">
              <span class="badge" :class="stateBadgeClass">{{ period.state }}</span>
              <span v-if="period.softCloseAt" class="text-muted fs-12">
                Soft-closed {{ formatDate(period.softCloseAt) }}
              </span>
              <span v-if="period.hardCloseAt" class="text-muted fs-12">
                Hard-closed {{ formatDate(period.hardCloseAt) }}
              </span>
            </div>
          </div>

          <!-- State-dependent top-right actions -->
          <div class="d-flex gap-2">
            <button
              v-if="canStartRun"
              class="btn btn-primary btn-sm"
              :disabled="loading"
              @click="showStartModal = true">
              <i class="ri-play-circle-line"></i> Start Close Run
            </button>
            <button
              v-if="canReopen"
              class="btn btn-warning btn-sm"
              :disabled="loading"
              @click="showReopenModal = true">
              <i class="ri-refresh-line"></i> Reopen Period
            </button>
            <button
              v-if="canMarkAudited"
              class="btn btn-dark btn-sm"
              :disabled="loading"
              @click="confirmMarkAudited">
              <i class="ri-lock-fill"></i> Mark Audited
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active run card -->
    <div v-if="currentRun" class="card mb-3">
      <div class="card-header">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <div class="flex-grow-1">
            <h5 class="mb-0">
              {{ currentRun.templateName }}
              <span class="badge ms-2" :class="runBadgeClass(currentRun.state)">{{ currentRun.state }}</span>
            </h5>
            <small class="text-muted">
              Started {{ formatDate(currentRun.startedAt) }} by {{ currentRun.startedBy }}
              · {{ doneCount }} of {{ currentRun.tasks.length }} tasks done
              ({{ blockingRemaining }} blocking task{{ blockingRemaining === 1 ? '' : 's' }} remaining)
            </small>
          </div>
          <div class="d-flex gap-2">
            <button
              v-if="currentRun.state === 'Active' && canCompleteRun"
              class="btn btn-success btn-sm"
              :disabled="loading || blockingRemaining > 0"
              @click="handleCompleteRun"
              :title="blockingRemaining > 0 ? `${blockingRemaining} blocking task(s) still pending` : 'Transition period to Soft Close'">
              <i class="ri-check-double-line"></i> Complete Run
            </button>
            <button
              v-if="currentRun.state === 'Completed' && period?.state === 'SoftClose' && canSignoff"
              class="btn btn-success btn-sm"
              :disabled="loading"
              @click="showSignoffModal = true">
              <i class="ri-quill-pen-line"></i> Sign Off &amp; Hard Close
            </button>
            <button
              v-if="currentRun.state === 'Active' && canAbandon"
              class="btn btn-outline-danger btn-sm"
              :disabled="loading"
              @click="showAbandonModal = true">
              <i class="ri-close-circle-line"></i> Abandon
            </button>
          </div>
        </div>
      </div>

      <div class="card-body">
        <!-- Progress bar -->
        <div class="progress mb-3" style="height: 8px;">
          <div
            class="progress-bar bg-success"
            role="progressbar"
            :style="{ width: progressPercent + '%' }"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100">
          </div>
        </div>

        <!-- Task list -->
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 50px;">#</th>
                <th>Task</th>
                <th style="width: 130px;">Category</th>
                <th style="width: 110px;">Owner</th>
                <th style="width: 110px;">Due</th>
                <th style="width: 120px;">Status</th>
                <th style="width: 180px;" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in currentRun.tasks" :key="t.runTaskId"
                  :class="{ 'table-light': t.status === 'Completed' || t.status === 'Skipped' }">
                <td class="text-muted">{{ t.seq }}</td>
                <td>
                  <div>
                    <strong :class="{ 'text-decoration-line-through text-muted': t.status === 'Skipped' }">{{ t.title }}</strong>
                    <span v-if="!t.blockingClose" class="badge bg-light text-muted ms-1" title="Non-blocking task">optional</span>
                  </div>
                  <small v-if="t.description" class="text-muted">{{ t.description }}</small>
                  <div v-if="t.notes" class="mt-1 small">
                    <i class="ri-sticky-note-line text-muted"></i>
                    <span class="text-muted">{{ t.notes }}</span>
                  </div>
                </td>
                <td><small class="text-muted">{{ t.category }}</small></td>
                <td><small class="text-muted">{{ t.ownerRole }}</small></td>
                <td><small class="text-muted">{{ formatDate(t.dueDate, { date: true }) }}</small></td>
                <td>
                  <span class="badge" :class="taskStatusBadgeClass(t.status)">{{ t.status }}</span>
                </td>
                <td class="text-end">
                  <button
                    v-if="t.status === 'Pending' && canCompleteTask"
                    class="btn btn-success btn-xs me-1"
                    :disabled="loading"
                    @click="openCompleteTaskModal(t)">
                    <i class="ri-check-line"></i> Complete
                  </button>
                  <button
                    v-if="t.status === 'Pending' && canSkipTask"
                    class="btn btn-outline-secondary btn-xs"
                    :disabled="loading"
                    @click="openSkipTaskModal(t)">
                    <i class="ri-skip-forward-line"></i> Skip
                  </button>
                  <small v-if="t.status === 'Completed'" class="text-muted d-block">
                    By {{ t.completedBy }} · {{ formatDate(t.completedAt) }}
                  </small>
                  <small v-if="t.status === 'Skipped'" class="text-muted d-block">
                    Skipped by {{ t.completedBy }}
                  </small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Signoffs on this run -->
        <div v-if="currentRun.signoffs && currentRun.signoffs.length" class="mt-3 pt-3 border-top">
          <h6 class="mb-2">Sign-offs</h6>
          <ul class="list-unstyled mb-0">
            <li v-for="s in currentRun.signoffs" :key="s.signoffId" class="small">
              <i class="ri-quill-pen-line"></i>
              <strong>{{ s.userName }}</strong>
              ({{ s.role }}) — {{ formatDate(s.signedAt) }}
              <span v-if="s.notes" class="text-muted ms-2">"{{ s.notes }}"</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Empty state: period is Open and no run active -->
    <div v-if="!loading && !currentRun && period?.state === 'Open'" class="card mb-3">
      <div class="card-body text-center py-5">
        <i class="ri-calendar-check-line fs-1 text-muted"></i>
        <h5 class="mt-3">No active close run for Period {{ period.period }}</h5>
        <p class="text-muted">
          The period is <span class="badge text-bg-success-subtle text-success-emphasis">Open</span>
          and ready to close. Start a close run to begin the workflow.
        </p>
        <button
          v-if="canStartRun"
          class="btn btn-primary"
          :disabled="loading"
          @click="showStartModal = true">
          <i class="ri-play-circle-line"></i> Start Close Run
        </button>
      </div>
    </div>

    <!-- Already hard-closed with no active run -->
    <div v-if="!loading && !currentRun && period?.state === 'HardClose'" class="card mb-3">
      <div class="card-body text-center py-5">
        <i class="ri-lock-fill fs-1 text-muted"></i>
        <h5 class="mt-3">Period {{ period.period }} is Hard-Closed</h5>
        <p class="text-muted">No new posts allowed. Use Reopen Period to revert to Soft Close if an adjustment is needed.</p>
      </div>
    </div>

    <!-- Audited -->
    <div v-if="!loading && !currentRun && period?.state === 'Audited'" class="card mb-3">
      <div class="card-body text-center py-5">
        <i class="ri-shield-check-fill fs-1 text-muted"></i>
        <h5 class="mt-3">Period {{ period.period }} is Audited</h5>
        <p class="text-muted">This period is locked and cannot be modified.</p>
      </div>
    </div>

    <!-- Phase 1d: Closed-period exceptions panel -->
    <div v-if="exceptions.length > 0 || (period && period.state !== 'Open')" class="card mb-3">
      <div class="card-header">
        <div class="d-flex align-items-center">
          <div class="flex-grow-1">
            <h6 class="mb-0">
              <i class="ri-error-warning-line text-warning"></i>
              Legacy Exceptions
              <span v-if="openExceptions.length > 0" class="badge text-bg-danger-subtle text-danger-emphasis ms-1">
                {{ openExceptions.length }} unacknowledged
              </span>
              <span v-else class="badge text-bg-success-subtle text-success-emphasis ms-1">clear</span>
            </h6>
          </div>
          <button class="btn btn-outline-secondary btn-xs" :disabled="loading" @click="loadExceptions" title="Refresh">
            <i class="ri-refresh-line"></i>
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div v-if="openExceptions.length === 0 && acknowledgedExceptions.length === 0" class="text-center py-3 text-muted small">
          No legacy writes detected in this period since close began.
        </div>
        <div v-else>
          <!-- Open exceptions -->
          <div v-if="openExceptions.length > 0" class="list-group list-group-flush">
            <div v-for="ex in openExceptions" :key="ex.exceptionId" class="list-group-item list-group-item-warning">
              <div class="d-flex align-items-center gap-2">
                <div class="flex-grow-1">
                  <div>
                    <strong>Batch {{ ex.batch || '?' }}</strong>
                    <small class="text-muted ms-2">GlTxn #{{ ex.glTransactionId }}</small>
                    <small class="text-muted ms-2">{{ formatDate(ex.transactionDate, { date: true }) }}</small>
                  </div>
                  <div class="small text-muted">
                    {{ ex.transactionDescription || '(no description)' }}
                    · Creator: {{ ex.creator || 'unknown' }}
                    · DR {{ formatMoney(ex.totalDebit) }} / CR {{ formatMoney(ex.totalCredit) }}
                  </div>
                  <div class="small text-muted">
                    Detected {{ formatDate(ex.detectedAt) }}
                  </div>
                </div>
                <button
                  v-if="isCloseManagement"
                  class="btn btn-outline-warning btn-xs"
                  :disabled="loading"
                  @click="openAckModal(ex)">
                  <i class="ri-check-line"></i> Acknowledge
                </button>
              </div>
            </div>
          </div>
          <!-- Acknowledged (collapsed) -->
          <div v-if="acknowledgedExceptions.length > 0" class="border-top">
            <button class="btn btn-link btn-sm p-2" @click="showAckedExceptions = !showAckedExceptions">
              <i :class="showAckedExceptions ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
              {{ acknowledgedExceptions.length }} acknowledged exception{{ acknowledgedExceptions.length === 1 ? '' : 's' }}
            </button>
            <div v-if="showAckedExceptions" class="list-group list-group-flush">
              <div v-for="ex in acknowledgedExceptions" :key="ex.exceptionId" class="list-group-item small text-muted">
                Batch {{ ex.batch || '?' }} · {{ ex.transactionDescription || '' }} · Acked by {{ ex.acknowledgedBy }} {{ formatDate(ex.acknowledgedAt) }}
                <span v-if="ex.notes"> — {{ ex.notes }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Acknowledge exception modal -->
    <div v-if="showAckModal" class="modal-backdrop-wrap" @click.self="showAckModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Acknowledge Exception</h5>
        </div>
        <div class="card-body">
          <p class="text-muted small">
            This marks the exception as reviewed. The underlying GL transaction is NOT reversed — it stays in the ledger.
            If it needs to be reversed, create a reversing batch manually.
          </p>
          <p>
            <strong>Batch {{ exceptionBeingAcked?.batch }}</strong> — {{ exceptionBeingAcked?.transactionDescription }}
          </p>
          <div class="mb-3">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="3" v-model="ackForm.notes"
                      placeholder="Why is this exception acceptable? Or what action was taken?"></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showAckModal = false">Cancel</button>
          <button class="btn btn-warning" :disabled="loading" @click="handleAcknowledge">
            <i class="ri-check-line"></i> Acknowledge
          </button>
        </div>
      </div>
    </div>

    <!-- Historical runs -->
    <div v-if="historyRuns.length > 1" class="card mb-3">
      <div class="card-header">
        <button class="btn btn-link p-0" @click="showHistory = !showHistory">
          <i :class="showHistory ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
          Prior runs for this period ({{ historyRuns.length - 1 }})
        </button>
      </div>
      <div v-if="showHistory" class="card-body">
        <ul class="list-group list-group-flush">
          <li v-for="r in historyRuns" :key="r.closeRunId" class="list-group-item">
            <div class="d-flex align-items-center">
              <div class="flex-grow-1">
                <strong>Run #{{ r.closeRunId }}</strong>
                <span class="badge ms-2" :class="runBadgeClass(r.state)">{{ r.state }}</span>
                <small class="text-muted ms-2">
                  Started {{ formatDate(r.startedAt) }} by {{ r.startedBy }}
                  <span v-if="r.completedAt"> · Completed {{ formatDate(r.completedAt) }} by {{ r.completedBy }}</span>
                </small>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- ============ Modals ============ -->

    <!-- Start Run modal -->
    <div v-if="showStartModal" class="modal-backdrop-wrap" @click.self="showStartModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Start Close Run</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Template</label>
            <select class="form-select" v-model="startForm.templateId">
              <option v-for="t in templates" :key="t.templateId" :value="t.templateId">
                {{ t.name }} ({{ t.cadence }})
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="2" v-model="startForm.notes"
                      placeholder="Anything to note about this close run..."></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showStartModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="loading || !startForm.templateId" @click="handleStartRun">
            Start Run
          </button>
        </div>
      </div>
    </div>

    <!-- Complete Task modal -->
    <div v-if="showCompleteModal" class="modal-backdrop-wrap" @click.self="showCompleteModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Complete Task</h5>
        </div>
        <div class="card-body">
          <p class="mb-3"><strong>{{ taskBeingEdited?.title }}</strong></p>
          <div class="mb-3">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="2" v-model="completeForm.notes"
                      placeholder="How was this task completed?"></textarea>
          </div>
          <div class="mb-3">
            <label class="form-label">Evidence URL (optional)</label>
            <input type="text" class="form-control" v-model="completeForm.evidenceUrl"
                   placeholder="Link to supporting document or workpaper" />
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showCompleteModal = false">Cancel</button>
          <button class="btn btn-success" :disabled="loading" @click="handleCompleteTask">
            Mark Complete
          </button>
        </div>
      </div>
    </div>

    <!-- Skip Task modal -->
    <div v-if="showSkipModal" class="modal-backdrop-wrap" @click.self="showSkipModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Skip Task</h5>
        </div>
        <div class="card-body">
          <p class="mb-3"><strong>{{ taskBeingEdited?.title }}</strong></p>
          <div class="mb-3">
            <label class="form-label">Reason <span class="text-danger">*</span></label>
            <textarea class="form-control" rows="3" v-model="skipForm.reason" required
                      placeholder="Why is this task being skipped? (required)"></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showSkipModal = false">Cancel</button>
          <button class="btn btn-outline-secondary"
                  :disabled="loading || !skipForm.reason.trim()"
                  @click="handleSkipTask">
            Skip Task
          </button>
        </div>
      </div>
    </div>

    <!-- Signoff modal -->
    <div v-if="showSignoffModal" class="modal-backdrop-wrap" @click.self="showSignoffModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Sign Off &amp; Hard Close</h5>
        </div>
        <div class="card-body">
          <p class="text-muted">
            This will transition FY {{ period?.fiscalYear }} Period {{ period?.period }}
            to <strong>Hard Close</strong> and create a signoff record attributed to you.
            Posts into a hard-closed period are blocked unconditionally.
          </p>
          <div class="mb-3">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" rows="3" v-model="signoffForm.notes"
                      placeholder="Final notes for the close — any caveats, late adjustments, etc."></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showSignoffModal = false">Cancel</button>
          <button class="btn btn-success" :disabled="loading" @click="handleSignoff">
            Sign Off &amp; Hard Close
          </button>
        </div>
      </div>
    </div>

    <!-- Reopen modal -->
    <div v-if="showReopenModal" class="modal-backdrop-wrap" @click.self="showReopenModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Reopen Period</h5>
        </div>
        <div class="card-body">
          <p class="text-muted">
            This will revert FY {{ period?.fiscalYear }} Period {{ period?.period }}
            from <strong>Hard Close</strong> back to <strong>Soft Close</strong>.
            The prior sign-off record is preserved. A reason is required and will be logged.
          </p>
          <div class="mb-3">
            <label class="form-label">Reason <span class="text-danger">*</span></label>
            <textarea class="form-control" rows="3" v-model="reopenForm.reason" required
                      placeholder="Why is this period being reopened? (required)"></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showReopenModal = false">Cancel</button>
          <button class="btn btn-warning"
                  :disabled="loading || !reopenForm.reason.trim()"
                  @click="handleReopen">
            Reopen Period
          </button>
        </div>
      </div>
    </div>

    <!-- Abandon Run modal -->
    <div v-if="showAbandonModal" class="modal-backdrop-wrap" @click.self="showAbandonModal = false">
      <div class="card modal-card">
        <div class="card-header">
          <h5 class="mb-0">Abandon Close Run</h5>
        </div>
        <div class="card-body">
          <p class="text-muted">
            This marks the active run as <strong>Abandoned</strong> and reverts
            FY {{ period?.fiscalYear }} Period {{ period?.period }} back to <strong>Open</strong>.
            Task history is preserved but the period is reset for a fresh close run.
          </p>
          <div class="mb-3">
            <label class="form-label">Reason (optional)</label>
            <textarea class="form-control" rows="3" v-model="abandonForm.reason"
                      placeholder="Why is this run being abandoned?"></textarea>
          </div>
        </div>
        <div class="card-footer text-end">
          <button class="btn btn-light me-2" @click="showAbandonModal = false">Cancel</button>
          <button class="btn btn-outline-danger" :disabled="loading" @click="handleAbandon">
            Abandon Run
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * CloseDashboard — Phase 1c UI for the period-close workflow.
 *
 * Reads:  /api/fiscal-period/current, /api/close/templates,
 *         /api/close/runs?fy&period  (single list with all runs, most-recent first)
 * Writes: /api/close/runs, /api/close/runs/{id}/complete,
 *         /api/close/runs/{id}/signoff, /api/close/runs/{id}/abandon,
 *         /api/close/tasks/{id}/complete, /api/close/tasks/{id}/skip,
 *         /api/close/periods/{fy}/{period}/reopen,
 *         /api/close/periods/{fy}/{period}/mark-audited
 *
 * Role-gated action buttons:
 *   Admin+CFO+Accounting — start run, complete task, skip task, complete run
 *   Admin+CFO            — sign off, abandon run, reopen period
 *   Admin                — mark audited
 * Role detection decodes the JWT's role claim directly (case-insensitive).
 *
 * "Current run" semantics: the most-recent non-Abandoned run for this period.
 * We do NOT use the narrow /runs/active endpoint because it returns 204 as
 * soon as a run transitions to Completed — that would hide the run card
 * exactly when the user needs to see the Sign Off button. Instead we load
 * the full history list and derive currentRun from it, which also gives us
 * run-state visibility while Completed / HardClosed / Audited.
 */
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

// ===================== State =====================
const period = ref(null)        // from GET /api/fiscal-period/current
const historyRuns = ref([])     // from GET /api/close/runs?fy&period (all runs, most-recent first)
const currentRunId = ref(null)  // the run we're displaying — derived from historyRuns
const currentRun = ref(null)    // full DTO for currentRunId (with tasks + signoffs)
const templates = ref([])       // from GET /api/close/templates
const exceptions = ref([])      // from GET /api/close/exceptions (Phase 1d)
const loading = ref(false)
const showHistory = ref(false)
const showAckedExceptions = ref(false)

// Modals
const showStartModal = ref(false)
const showCompleteModal = ref(false)
const showSkipModal = ref(false)
const showSignoffModal = ref(false)
const showReopenModal = ref(false)
const showAbandonModal = ref(false)
const showAckModal = ref(false)
const taskBeingEdited = ref(null)
const exceptionBeingAcked = ref(null)

// Forms
const startForm = ref({ templateId: null, notes: '' })
const completeForm = ref({ notes: '', evidenceUrl: '' })
const skipForm = ref({ reason: '' })
const signoffForm = ref({ notes: '' })
const reopenForm = ref({ reason: '' })
const abandonForm = ref({ reason: '' })
const ackForm = ref({ notes: '' })

// Banner for errors / success messages
const banner = ref({ message: '', title: '', cssClass: 'alert-info' })

// ===================== JWT role decoding =====================
/**
 * Decodes the current JWT's role claim(s). Returns a Set of uppercase
 * role names for case-insensitive matching. The claim can be either a
 * string or an array depending on whether the user has one or many roles.
 */
function decodeUserRoles() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return new Set()
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const roleClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const raw = payload[roleClaimKey] ?? payload.role ?? []
    const asArray = Array.isArray(raw) ? raw : [raw]
    return new Set(asArray.map(r => String(r).toUpperCase()))
  } catch (e) {
    console.warn('decodeUserRoles failed:', e)
    return new Set()
  }
}
const userRoles = ref(decodeUserRoles())
const hasRole = (r) => userRoles.value.has(r.toUpperCase())
const isAccounting = computed(() => hasRole('Admin') || hasRole('CFO') || hasRole('Accounting'))
const isCloseManagement = computed(() => hasRole('Admin') || hasRole('CFO'))
// isAdminOnly is currently unused — Phase 1 treats CFO as admin-equivalent
// inside the accounting domain per user direction 2026-04-11. Keep the
// helper around for future phases that introduce strict admin-only endpoints.
const isAdminOnly = computed(() => hasRole('Admin'))

// ===================== Derived UI state =====================
const doneCount = computed(() => {
  if (!currentRun.value) return 0
  return currentRun.value.tasks.filter(t => t.status === 'Completed' || t.status === 'Skipped').length
})
const blockingRemaining = computed(() => {
  if (!currentRun.value) return 0
  return currentRun.value.tasks.filter(t => t.blockingClose && t.status !== 'Completed' && t.status !== 'Skipped').length
})
const progressPercent = computed(() => {
  if (!currentRun.value || currentRun.value.tasks.length === 0) return 0
  return Math.round((doneCount.value / currentRun.value.tasks.length) * 100)
})

// Exception computeds
const openExceptions = computed(() => exceptions.value.filter(e => !e.acknowledged))
const acknowledgedExceptions = computed(() => exceptions.value.filter(e => e.acknowledged))

// Start is allowed when the period is Open/InClose AND either there's no
// run at all, or the most-recent run is Abandoned (the prior attempt was
// thrown away and the user is starting fresh). If the most-recent run is
// Active or Completed, the user should operate on that run instead.
const canStartRun = computed(() => {
  if (!isAccounting.value || !period.value) return false
  if (period.value.state !== 'Open' && period.value.state !== 'InClose') return false
  if (!currentRun.value) return true
  return currentRun.value.state === 'Abandoned'
})
const canCompleteTask = computed(() => isAccounting.value)
const canSkipTask = computed(() => isAccounting.value)
const canCompleteRun = computed(() => isAccounting.value)
const canSignoff = computed(() => isCloseManagement.value)
const canAbandon = computed(() => isCloseManagement.value)
const canReopen = computed(() =>
  isCloseManagement.value && period.value?.state === 'HardClose')
// CFO+ — CFO is admin-equivalent within accounting per user direction.
const canMarkAudited = computed(() =>
  isCloseManagement.value && period.value?.state === 'HardClose')

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
function runBadgeClass(state) {
  switch (state) {
    case 'Active':    return 'text-bg-primary-subtle text-primary-emphasis'
    case 'Completed': return 'text-bg-success-subtle text-success-emphasis'
    case 'Abandoned': return 'text-bg-danger-subtle text-danger-emphasis'
    default:          return 'text-bg-light text-muted'
  }
}
function taskStatusBadgeClass(status) {
  switch (status) {
    case 'Pending':    return 'text-bg-light text-muted'
    case 'InProgress': return 'text-bg-warning-subtle text-warning-emphasis'
    case 'Completed':  return 'text-bg-success-subtle text-success-emphasis'
    case 'Skipped':    return 'text-bg-secondary-subtle text-secondary-emphasis'
    default:           return 'text-bg-light text-muted'
  }
}

// ===================== Formatting =====================
function formatDate(v, opts = {}) {
  if (!v) return ''
  const d = new Date(v)
  if (opts.date) return d.toLocaleDateString()
  return d.toLocaleString()
}
function formatPeriodRange(p) {
  if (!p) return ''
  return `${new Date(p.startDate).toLocaleDateString()} – ${new Date(p.endDate).toLocaleDateString()}`
}
function formatMoney(n) {
  if (n == null) return '-'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ===================== Banner helper =====================
function setBanner(type, title, message) {
  const cssMap = {
    success: 'alert-success',
    info: 'alert-info',
    warning: 'alert-warning',
    error: 'alert-danger',
  }
  banner.value = { message, title, cssClass: cssMap[type] || 'alert-info' }
}
function clearBanner() { banner.value.message = '' }

// ===================== Data loading =====================
async function loadAll() {
  loading.value = true
  clearBanner()
  try {
    const [pResp, tResp] = await Promise.all([
      api.get('fiscal-period/current'),
      api.get('close/templates'),
    ])
    period.value = pResp.data
    templates.value = tResp.data
    if (templates.value.length && !startForm.value.templateId) {
      startForm.value.templateId = templates.value[0].templateId
    }

    await loadRuns()
    await loadExceptions()
  } catch (e) {
    setBanner('error', 'Load failed', describeError(e))
  } finally {
    loading.value = false
  }
}

async function loadRuns() {
  if (!period.value) return
  const fy = period.value.fiscalYear
  const pd = period.value.period

  // One call: the list-by-period endpoint returns every run (Active,
  // Completed, Abandoned) ordered most-recent first. The "current run"
  // is the most-recent non-Abandoned one; fall back to null.
  try {
    const histResp = await api.get(`close/runs?fy=${fy}&period=${pd}`)
    historyRuns.value = histResp.data || []
  } catch (e) {
    historyRuns.value = []
  }

  const firstLive = historyRuns.value.find(r => r.state !== 'Abandoned')
  if (!firstLive) {
    currentRun.value = null
    currentRunId.value = null
    return
  }

  // The list-by-period endpoint returns metadata only (no tasks/signoffs).
  // Fetch the single run endpoint to get the full DTO with tasks and signoffs
  // that the dashboard needs to render.
  currentRunId.value = firstLive.closeRunId
  try {
    const runResp = await api.get(`close/runs/${firstLive.closeRunId}`)
    currentRun.value = runResp.data
  } catch (e) {
    currentRun.value = null
  }
}

async function loadExceptions() {
  if (!period.value) return
  const fy = period.value.fiscalYear
  const pd = period.value.period
  try {
    const resp = await api.get(`close/exceptions?fy=${fy}&period=${pd}&ackStatus=all`)
    exceptions.value = resp.data || []
  } catch (e) {
    exceptions.value = []
  }
}

function openAckModal(ex) {
  exceptionBeingAcked.value = ex
  ackForm.value = { notes: '' }
  showAckModal.value = true
}

async function handleAcknowledge() {
  loading.value = true
  try {
    await api.post(`close/exceptions/${exceptionBeingAcked.value.exceptionId}/acknowledge`, ackForm.value)
    showAckModal.value = false
    setBanner('success', 'Acknowledged', `Exception for batch ${exceptionBeingAcked.value.batch} acknowledged.`)
    await loadExceptions()
  } catch (e) {
    setBanner('error', 'Acknowledge failed', describeError(e))
  } finally {
    loading.value = false
  }
}

function describeError(e) {
  if (e?.response?.data?.message) return e.response.data.message
  if (typeof e?.response?.data === 'string') return e.response.data
  if (e?.message) return e.message
  return 'Unknown error'
}

// ===================== Actions =====================
async function handleStartRun() {
  loading.value = true
  try {
    await api.post('close/runs', {
      fiscalYear: period.value.fiscalYear,
      period: period.value.period,
      templateId: startForm.value.templateId,
      notes: startForm.value.notes || null,
    })
    showStartModal.value = false
    startForm.value.notes = ''
    setBanner('success', 'Close run started', 'The period is now InClose. Complete tasks to advance.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not start close run', describeError(e))
  } finally {
    loading.value = false
  }
}

function openCompleteTaskModal(task) {
  taskBeingEdited.value = task
  completeForm.value = { notes: '', evidenceUrl: '' }
  showCompleteModal.value = true
}
async function handleCompleteTask() {
  loading.value = true
  try {
    await api.post(`close/tasks/${taskBeingEdited.value.runTaskId}/complete`, completeForm.value)
    showCompleteModal.value = false
    await loadRuns()
  } catch (e) {
    setBanner('error', 'Could not complete task', describeError(e))
  } finally {
    loading.value = false
  }
}

function openSkipTaskModal(task) {
  taskBeingEdited.value = task
  skipForm.value = { reason: '' }
  showSkipModal.value = true
}
async function handleSkipTask() {
  if (!skipForm.value.reason.trim()) return
  loading.value = true
  try {
    await api.post(`close/tasks/${taskBeingEdited.value.runTaskId}/skip`, skipForm.value)
    showSkipModal.value = false
    await loadRuns()
  } catch (e) {
    setBanner('error', 'Could not skip task', describeError(e))
  } finally {
    loading.value = false
  }
}

async function handleCompleteRun() {
  loading.value = true
  try {
    await api.post(`close/runs/${currentRun.value.closeRunId}/complete`, {})
    setBanner('success', 'Close run completed', 'Period transitioned to Soft Close. Waiting for CFO sign-off.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not complete close run', describeError(e))
  } finally {
    loading.value = false
  }
}

async function handleSignoff() {
  loading.value = true
  try {
    await api.post(`close/runs/${currentRun.value.closeRunId}/signoff`, signoffForm.value)
    showSignoffModal.value = false
    signoffForm.value.notes = ''
    setBanner('success', 'Period hard-closed', 'Signoff recorded. Period is now Hard Closed.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not sign off', describeError(e))
  } finally {
    loading.value = false
  }
}

async function handleReopen() {
  if (!reopenForm.value.reason.trim()) return
  loading.value = true
  try {
    await api.post(`close/periods/${period.value.fiscalYear}/${period.value.period}/reopen`, reopenForm.value)
    showReopenModal.value = false
    reopenForm.value.reason = ''
    setBanner('warning', 'Period reopened', 'Reverted to Soft Close. Remember to sign off again when done.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not reopen period', describeError(e))
  } finally {
    loading.value = false
  }
}

async function handleAbandon() {
  loading.value = true
  try {
    await api.post(`close/runs/${currentRun.value.closeRunId}/abandon`, {
      reason: abandonForm.value.reason || null,
    })
    showAbandonModal.value = false
    abandonForm.value.reason = ''
    setBanner('warning', 'Close run abandoned', 'Period reverted to Open.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not abandon run', describeError(e))
  } finally {
    loading.value = false
  }
}

async function confirmMarkAudited() {
  if (!confirm(`Mark FY ${period.value.fiscalYear} Period ${period.value.period} as Audited? This is permanent.`)) return
  loading.value = true
  try {
    await api.post(`close/periods/${period.value.fiscalYear}/${period.value.period}/mark-audited`, {})
    setBanner('success', 'Period marked Audited', 'This period is now locked.')
    await loadAll()
  } catch (e) {
    setBanner('error', 'Could not mark audited', describeError(e))
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
  max-width: 560px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.btn-xs {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
}
.fs-14 { font-size: 0.875rem; }
.fs-12 { font-size: 0.75rem; }
</style>
