<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Alert Rules</h4>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-primary" :disabled="evaluating" @click="evaluateNow">
          <span v-if="evaluating" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="ri-play-line me-1"></i>Evaluate Now
        </button>
        <button class="btn btn-sm btn-primary" @click="openNew"><i class="ri-add-line me-1"></i>New Rule</button>
      </div>
    </div>

    <div v-if="evalResult" class="alert alert-success small py-2">
      Evaluated {{ evalResult.rulesEvaluated }} rule(s) — created {{ evalResult.notificationsCreated }},
      skipped {{ evalResult.notificationsSkippedDuplicate }} duplicate(s)<span v-if="evalResult.errors?.length">,
      {{ evalResult.errors.length }} error(s)</span>.
      <div v-if="evalResult.errors?.length" class="mt-2">
        <div v-for="(e, i) in evalResult.errors" :key="i" class="text-danger small">{{ e }}</div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Alert Type</th>
              <th>Rule Name</th>
              <th class="text-end">Days</th>
              <th class="text-end">Amount</th>
              <th>Severity</th>
              <th>Recipients</th>
              <th class="text-center">Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rules" :key="r.alertRuleId">
              <td class="small">{{ r.alertType }}</td>
              <td>{{ r.ruleName }}</td>
              <td class="text-end">{{ r.thresholdDays ?? '—' }}</td>
              <td class="text-end font-monospace">{{ r.thresholdAmount != null ? fmtMoney(r.thresholdAmount) : '—' }}</td>
              <td>
                <span class="badge" :class="sevClass(r.severity)">{{ r.severity }}</span>
              </td>
              <td class="small text-muted">{{ r.recipientUserNames || '—' }}</td>
              <td class="text-center">
                <span class="badge" :class="r.isActive ? 'bg-success' : 'bg-secondary'">
                  {{ r.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary py-0 me-1" @click="openEdit(r)">Edit</button>
                <button class="btn btn-sm btn-outline-danger py-0" @click="remove(r)">Delete</button>
              </td>
            </tr>
            <tr v-if="rules.length === 0">
              <td colspan="8" class="text-center text-muted py-3">No rules configured</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="editing" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.alertRuleId ? 'Edit' : 'New' }} Alert Rule</h5>
            <button type="button" class="btn-close" @click="editing = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small">Alert Type *</label>
                <select class="form-select form-select-sm" v-model="form.alertType" :disabled="form.alertRuleId > 0">
                  <option v-for="t in alertTypes" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small">Rule Name *</label>
                <input class="form-control form-control-sm" v-model="form.ruleName" maxlength="100">
              </div>
              <div class="col-md-4">
                <label class="form-label small">Threshold Days</label>
                <input class="form-control form-control-sm" type="number" v-model.number="form.thresholdDays">
                <div class="form-text small">Used by due/overdue/approval rules</div>
              </div>
              <div class="col-md-4">
                <label class="form-label small">Threshold Amount</label>
                <input class="form-control form-control-sm" type="number" step="0.01" v-model.number="form.thresholdAmount">
                <div class="form-text small">Used by LowCash only</div>
              </div>
              <div class="col-md-4">
                <label class="form-label small">Severity *</label>
                <select class="form-select form-select-sm" v-model="form.severity">
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label small">Recipients (comma-separated usernames) *</label>
                <input class="form-control form-control-sm" v-model="form.recipientUserNames" placeholder="admin, cfo, accountant1">
                <div class="form-text small">No recipients = rule silently skipped at evaluation time.</div>
              </div>
              <div class="col-md-4">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" id="ruleActive" v-model="form.isActive">
                  <label class="form-check-label small" for="ruleActive">Active</label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label small">Notes</label>
                <textarea class="form-control form-control-sm" v-model="form.notes" rows="2"></textarea>
              </div>
            </div>
            <div v-if="saveError" class="alert alert-danger mt-3 mb-0 py-2 small">{{ saveError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="editing = false">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const fmtMoney = (v) => '$' + formatCurrency(v);

const rules = ref([]);
const alertTypes = ref([]);
const loading = ref(false);
const error = ref(null);
const editing = ref(false);
const saving = ref(false);
const saveError = ref(null);
const evaluating = ref(false);
const evalResult = ref(null);
const form = ref(blank());

function blank() {
  return {
    alertRuleId: 0,
    companyId: 1,
    alertType: 'ArOverdue',
    ruleName: '',
    thresholdDays: null,
    thresholdAmount: null,
    recipientUserNames: '',
    severity: 'Warning',
    isActive: true,
    notes: ''
  };
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [r, t] = await Promise.all([
      api.get('alerts/rules'),
      api.get('alerts/types')
    ]);
    rules.value = r.data;
    alertTypes.value = t.data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

function openNew() {
  form.value = blank();
  saveError.value = null;
  editing.value = true;
}

function openEdit(r) {
  form.value = { ...r, notes: r.notes ?? '', recipientUserNames: r.recipientUserNames ?? '' };
  saveError.value = null;
  editing.value = true;
}

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    await api.post('alerts/rules', form.value);
    editing.value = false;
    await load();
  } catch (e) {
    saveError.value = e.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function remove(r) {
  if (!confirm(`Delete rule "${r.ruleName}" (${r.alertType})?`)) return;
  await api.delete(`alerts/rules/${r.alertRuleId}`);
  await load();
}

async function evaluateNow() {
  evaluating.value = true;
  evalResult.value = null;
  try {
    const { data } = await api.post('alerts/evaluate');
    evalResult.value = data;
  } catch (e) {
    evalResult.value = { rulesEvaluated: 0, notificationsCreated: 0, notificationsSkippedDuplicate: 0, errors: [e.message] };
  } finally {
    evaluating.value = false;
  }
}

function sevClass(sev) {
  return sev === 'Critical' ? 'bg-danger'
       : sev === 'Warning' ? 'bg-warning text-dark'
       : 'bg-info text-dark';
}

onMounted(load);
</script>
