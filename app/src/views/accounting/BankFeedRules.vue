<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Bank Feed Rules</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/bank-feed">Bank Feed</router-link></li>
            <li class="breadcrumb-item active">Rules</li>
          </ol>
        </div>
        <div class="d-flex gap-2">
          <router-link to="/accounting/bank-feed" class="btn btn-outline-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back to Feed
          </router-link>
          <button class="btn btn-primary btn-sm" @click="editRule(null)">
            <i class="ri-add-line me-1"></i>Add Rule
          </button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div v-if="!rules.length" class="text-center my-4">
          <p class="text-muted">No categorization rules. Add one to auto-categorize bank transactions.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Rule Name</th>
                <th>Pattern</th>
                <th>Type</th>
                <th>Amount Range</th>
                <th>GL Account</th>
                <th>Vendor</th>
                <th>Active</th>
                <th style="width: 100px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in rules" :key="rule.ruleId" :class="{ 'text-muted': !rule.isActive }">
                <td>{{ rule.priority }}</td>
                <td class="fw-semibold">{{ rule.ruleName }}</td>
                <td>
                  <code>{{ rule.pattern }}</code>
                  <span class="badge bg-secondary-subtle text-secondary ms-1">{{ rule.patternType }}</span>
                </td>
                <td>
                  <span v-if="rule.transactionType === 'D'" class="badge bg-danger-subtle text-danger">Debit</span>
                  <span v-else-if="rule.transactionType === 'C'" class="badge bg-success-subtle text-success">Credit</span>
                  <span v-else class="text-muted">Any</span>
                </td>
                <td class="small">
                  <span v-if="rule.minAmount || rule.maxAmount">
                    {{ rule.minAmount ? formatCurrency(rule.minAmount) : '$0' }}
                    -
                    {{ rule.maxAmount ? formatCurrency(rule.maxAmount) : 'No max' }}
                  </span>
                  <span v-else class="text-muted">Any</span>
                </td>
                <td class="small">{{ rule.glAccountNumber }} {{ rule.glAccountDescription }}</td>
                <td class="small">{{ rule.vendorName || '-' }}</td>
                <td>
                  <span :class="rule.isActive ? 'badge bg-success' : 'badge bg-secondary'">
                    {{ rule.isActive ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-1" @click="editRule(rule)">
                    <i class="ri-pencil-line"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteRule(rule)">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Rule Edit Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="showModal ? 'display: block;' : ''"
         tabindex="-1" @click.self="showModal = false">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.ruleId ? 'Edit' : 'Add' }} Rule</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Rule Name</label>
              <input class="form-control" v-model="form.ruleName" />
            </div>
            <div class="row mb-3">
              <div class="col-8">
                <label class="form-label">Pattern</label>
                <input class="form-control" v-model="form.pattern" placeholder="e.g. ACH PROCESSING FEE" />
              </div>
              <div class="col-4">
                <label class="form-label">Match Type</label>
                <select class="form-select" v-model="form.patternType">
                  <option value="Contains">Contains</option>
                  <option value="StartsWith">Starts With</option>
                  <option value="Regex">Regex</option>
                </select>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-4">
                <label class="form-label">Transaction Type</label>
                <select class="form-select" v-model="form.transactionType">
                  <option :value="null">Any</option>
                  <option value="D">Debit</option>
                  <option value="C">Credit</option>
                </select>
              </div>
              <div class="col-4">
                <label class="form-label">Min Amount</label>
                <input type="number" class="form-control" v-model.number="form.minAmount" step="0.01" />
              </div>
              <div class="col-4">
                <label class="form-label">Max Amount</label>
                <input type="number" class="form-control" v-model.number="form.maxAmount" step="0.01" />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">GL Account</label>
              <select class="form-select" v-model="form.glAccountNumber">
                <option value="">Select...</option>
                <option v-for="a in accounts" :key="a.accountNumber" :value="a.accountNumber">
                  {{ a.accountNumber }} - {{ a.description }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Vendor (optional)</label>
              <select class="form-select" v-model="form.vendorId">
                <option :value="null">None</option>
                <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">
                  {{ v.name }}
                </option>
              </select>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Priority (lower = higher)</label>
                <input type="number" class="form-control" v-model.number="form.priority" />
              </div>
              <div class="col-6 d-flex align-items-end">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="form.isActive" id="activeCheck" />
                  <label class="form-check-label" for="activeCheck">Active</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="saveRule" :disabled="!form.ruleName || !form.pattern || !form.glAccountNumber">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const rules = ref([])
const accounts = ref([])
const vendors = ref([])
const showModal = ref(false)

const emptyForm = {
  ruleId: null, ruleName: '', pattern: '', patternType: 'Contains',
  transactionType: null, minAmount: null, maxAmount: null,
  glAccountNumber: '', vendorId: null, isActive: true, priority: 100
}
const form = ref({ ...emptyForm })

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
}

function editRule(rule) {
  if (rule) {
    form.value = { ...rule }
  } else {
    form.value = { ...emptyForm }
  }
  showModal.value = true
}

async function load() {
  try {
    const resp = await api.get('bank-feed/rules')
    rules.value = resp.data
  } catch (err) {
    console.error('Load rules error:', err)
  }
}

async function loadLookups() {
  try {
    const [acctResp, vendorResp] = await Promise.all([
      api.get('accounts').catch(() => ({ data: [] })),
      api.get('vendors', { params: { pageSize: 500 } }).catch(() => ({ data: [] }))
    ])
    accounts.value = Array.isArray(acctResp.data) ? acctResp.data : acctResp.data?.items || []
    vendors.value = Array.isArray(vendorResp.data) ? vendorResp.data : vendorResp.data?.items || []
  } catch (err) {
    console.error('Lookup error:', err)
  }
}

async function saveRule() {
  try {
    await api.post('bank-feed/rules', form.value)
    showModal.value = false
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Save failed')
  }
}

async function deleteRule(rule) {
  if (!confirm(`Delete rule "${rule.ruleName}"?`)) return
  try {
    await api.delete(`bank-feed/rules/${rule.ruleId}`)
    await load()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

onMounted(() => {
  load()
  loadLookups()
})
</script>
