<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Invoice Approvals</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Invoice Approvals</li>
          </ol>
        </div>
        <div>
          <button class="btn btn-outline-secondary btn-sm" @click="showRulesModal = true">
            <i class="ri-settings-3-line me-1"></i>Approval Rules
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row" v-if="summary">
      <div class="col-md-3">
        <div class="card border-warning">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-warning">{{ summary.pendingCount }}</div>
            <div class="text-muted small">Pending Approval</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold">{{ formatCurrency(summary.pendingTotal) }}</div>
            <div class="text-muted small">Pending Amount</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-success">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-success">{{ summary.approvedTodayCount }}</div>
            <div class="text-muted small">Approved Today</div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-danger">
          <div class="card-body text-center">
            <div class="fs-4 fw-bold text-danger">{{ summary.overdueCount }}</div>
            <div class="text-muted small">Overdue</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'my' }" href="#" @click.prevent="activeTab = 'my'">
          My Queue <span class="badge bg-warning ms-1" v-if="myPending.length">{{ myPending.length }}</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'all' }" href="#" @click.prevent="activeTab = 'all'">
          All Pending
        </a>
      </li>
    </ul>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Approval Queue -->
    <div class="card" v-else>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Invoice</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Due</th>
                <th class="text-end">Amount</th>
                <th>Rule</th>
                <th>Assigned To</th>
                <th>Queued</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in displayedItems" :key="item.queueId" :class="isOverdue(item) ? 'table-danger' : ''">
                <td>
                  <router-link :to="`/accounting/vendors/${item.vendorId}/invoices/${item.invoiceNumber}`" class="fw-medium">
                    {{ item.invoiceNumber }}
                  </router-link>
                  <div v-if="item.description" class="small text-muted">{{ item.description }}</div>
                </td>
                <td>{{ item.vendorName }}</td>
                <td>{{ formatDate(item.invoiceDate) }}</td>
                <td>
                  <span :class="isOverdue(item) ? 'text-danger fw-bold' : ''">
                    {{ formatDate(item.dueDate) }}
                    <i v-if="isOverdue(item)" class="ri-error-warning-line"></i>
                  </span>
                </td>
                <td class="text-end fw-medium">{{ formatCurrency(item.totalAmount) }}</td>
                <td><span class="badge bg-light text-dark">{{ item.ruleName }}</span></td>
                <td>{{ item.assignedToRole }}</td>
                <td>{{ formatDateTime(item.queuedAt) }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-success" @click="approve(item)" title="Approve">
                      <i class="ri-check-line"></i>
                    </button>
                    <button class="btn btn-danger" @click="openRejectModal(item)" title="Reject">
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="displayedItems.length === 0" class="text-center text-muted py-5">
          No pending invoices to approve
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div class="modal fade" :class="{ show: showRejectModal }" :style="{ display: showRejectModal ? 'block' : 'none' }"
         tabindex="-1" v-if="showRejectModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Reject Invoice</h5>
            <button type="button" class="btn-close" @click="showRejectModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Invoice: <strong>{{ rejectingItem?.invoiceNumber }}</strong> - {{ formatCurrency(rejectingItem?.totalAmount) }}</p>
            <div class="mb-3">
              <label class="form-label">Reason for Rejection <span class="text-danger">*</span></label>
              <textarea class="form-control" v-model="rejectReason" rows="3" placeholder="Enter reason..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showRejectModal = false">Cancel</button>
            <button class="btn btn-danger" @click="submitReject" :disabled="!rejectReason.trim()">
              <i class="ri-close-line me-1"></i>Reject
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showRejectModal"></div>

    <!-- Rules Modal -->
    <div class="modal fade" :class="{ show: showRulesModal }" :style="{ display: showRulesModal ? 'block' : 'none' }"
         tabindex="-1" v-if="showRulesModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Approval Rules</h5>
            <button type="button" class="btn-close" @click="showRulesModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <button class="btn btn-primary btn-sm" @click="addRule">
                <i class="ri-add-line me-1"></i>Add Rule
              </button>
            </div>
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>Rule Name</th>
                  <th>Amount Range</th>
                  <th>Vendor</th>
                  <th>Approver</th>
                  <th>Priority</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rule in rules" :key="rule.ruleId">
                  <td>{{ rule.ruleName }}</td>
                  <td>
                    <span v-if="rule.minAmount != null && rule.maxAmount != null">
                      {{ formatCurrency(rule.minAmount) }} - {{ formatCurrency(rule.maxAmount) }}
                    </span>
                    <span v-else-if="rule.minAmount != null">
                      >= {{ formatCurrency(rule.minAmount) }}
                    </span>
                    <span v-else-if="rule.maxAmount != null">
                      <= {{ formatCurrency(rule.maxAmount) }}
                    </span>
                    <span v-else class="text-muted">Any</span>
                  </td>
                  <td>{{ rule.vendorName || 'Any' }}</td>
                  <td>{{ rule.approverRole }}</td>
                  <td>{{ rule.priority }}</td>
                  <td>
                    <span class="badge" :class="rule.isActive ? 'bg-success' : 'bg-secondary'">
                      {{ rule.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-link btn-sm p-0" @click="editRule(rule)">
                      <i class="ri-edit-line"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showRulesModal = false">Close</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showRulesModal"></div>

    <!-- Edit Rule Modal -->
    <div class="modal fade" :class="{ show: showEditRuleModal }" :style="{ display: showEditRuleModal ? 'block' : 'none' }"
         tabindex="-1" v-if="showEditRuleModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingRule.ruleId ? 'Edit' : 'Add' }} Approval Rule</h5>
            <button type="button" class="btn-close" @click="showEditRuleModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Rule Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" v-model="editingRule.ruleName" />
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Min Amount</label>
                <input type="number" class="form-control" v-model.number="editingRule.minAmount" step="0.01" />
              </div>
              <div class="col-6">
                <label class="form-label">Max Amount</label>
                <input type="number" class="form-control" v-model.number="editingRule.maxAmount" step="0.01" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Approver Role <span class="text-danger">*</span></label>
              <select class="form-select" v-model="editingRule.approverRole">
                <option value="Admin">Admin</option>
                <option value="CFO">CFO</option>
                <option value="Manager">Manager</option>
                <option value="Accounting">Accounting</option>
              </select>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Priority</label>
                <input type="number" class="form-control" v-model.number="editingRule.priority" />
                <small class="text-muted">Lower = higher priority</small>
              </div>
              <div class="col-6">
                <label class="form-label">Active</label>
                <div class="form-check form-switch mt-2">
                  <input class="form-check-input" type="checkbox" v-model="editingRule.isActive" />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showEditRuleModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveRule" :disabled="!editingRule.ruleName || !editingRule.approverRole">
              Save Rule
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showEditRuleModal"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const myPending = ref([])
const allPending = ref([])
const rules = ref([])
const summary = ref(null)
const activeTab = ref('my')

const showRejectModal = ref(false)
const showRulesModal = ref(false)
const showEditRuleModal = ref(false)
const rejectingItem = ref(null)
const rejectReason = ref('')

const editingRule = reactive({
  ruleId: null,
  ruleName: '',
  minAmount: null,
  maxAmount: null,
  vendorId: null,
  approverRole: 'Admin',
  priority: 100,
  isActive: true
})

const displayedItems = computed(() => activeTab.value === 'my' ? myPending.value : allPending.value)

const formatCurrency = (value) => {
  if (value == null) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const isOverdue = (item) => {
  if (!item.dueDate) return false
  return new Date(item.dueDate) < new Date()
}

const loadPending = async () => {
  loading.value = true
  try {
    const [myRes, allRes] = await Promise.all([
      api.get('invoice-approvals/pending'),
      api.get('invoice-approvals/pending/all')
    ])
    myPending.value = myRes.data
    allPending.value = allRes.data
  } catch (err) {
    console.error('Failed to load pending:', err)
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  try {
    const response = await api.get('invoice-approvals/summary')
    summary.value = response.data
  } catch (err) {
    console.error('Failed to load summary:', err)
  }
}

const loadRules = async () => {
  try {
    const response = await api.get('invoice-approvals/rules')
    rules.value = response.data
  } catch (err) {
    console.error('Failed to load rules:', err)
  }
}

const approve = async (item) => {
  if (!confirm(`Approve invoice ${item.invoiceNumber} for ${formatCurrency(item.totalAmount)}?`)) return

  try {
    await api.post(`invoice-approvals/approve/${item.vendorInvoiceId}`)
    await loadPending()
    await loadSummary()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to approve')
  }
}

const openRejectModal = (item) => {
  rejectingItem.value = item
  rejectReason.value = ''
  showRejectModal.value = true
}

const submitReject = async () => {
  if (!rejectReason.value.trim()) return

  try {
    await api.post(`invoice-approvals/reject/${rejectingItem.value.vendorInvoiceId}`, {
      reason: rejectReason.value
    })
    showRejectModal.value = false
    await loadPending()
    await loadSummary()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reject')
  }
}

const addRule = () => {
  Object.assign(editingRule, {
    ruleId: null,
    ruleName: '',
    minAmount: null,
    maxAmount: null,
    vendorId: null,
    approverRole: 'Admin',
    priority: 100,
    isActive: true
  })
  showEditRuleModal.value = true
}

const editRule = (rule) => {
  Object.assign(editingRule, {
    ruleId: rule.ruleId,
    ruleName: rule.ruleName,
    minAmount: rule.minAmount,
    maxAmount: rule.maxAmount,
    vendorId: rule.vendorId,
    approverRole: rule.approverRole,
    priority: rule.priority,
    isActive: rule.isActive
  })
  showEditRuleModal.value = true
}

const saveRule = async () => {
  try {
    await api.post('invoice-approvals/rules', editingRule)
    showEditRuleModal.value = false
    await loadRules()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save rule')
  }
}

onMounted(() => {
  loadPending()
  loadSummary()
  loadRules()
})
</script>

<style scoped>
.modal.show { display: block; }
</style>
