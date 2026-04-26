<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Sales Tax Jurisdictions</h4>
      <div class="d-flex gap-2 align-items-center">
        <div class="form-check form-check-inline mb-0">
          <input class="form-check-input" type="checkbox" id="activeOnly" v-model="activeOnly" @change="load">
          <label class="form-check-label small" for="activeOnly">Active only</label>
        </div>
        <button class="btn btn-sm btn-primary" @click="openNew"><i class="ri-add-line me-1"></i>New Jurisdiction</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th class="text-end">Rate</th>
              <th>Effective</th>
              <th>End</th>
              <th>GL Account</th>
              <th>Frequency</th>
              <th class="text-center">Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="j in jurisdictions" :key="j.taxJurisdictionId">
              <td class="font-monospace">{{ j.jurisdictionCode }}</td>
              <td>{{ j.jurisdictionName }}</td>
              <td>{{ j.taxType }}</td>
              <td class="text-end font-monospace">{{ (j.taxRate * 100).toFixed(3) }}%</td>
              <td class="small">{{ fmtDate(j.effectiveDate) }}</td>
              <td class="small">{{ j.endDate ? fmtDate(j.endDate) : '—' }}</td>
              <td class="font-monospace small">{{ j.taxAccountNumber }}</td>
              <td class="small">{{ j.filingFrequency }}</td>
              <td class="text-center">
                <span class="badge" :class="j.isActive ? 'bg-success' : 'bg-secondary'">
                  {{ j.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary py-0" @click="openEdit(j)">Edit</button>
              </td>
            </tr>
            <tr v-if="jurisdictions.length === 0">
              <td colspan="10" class="text-center text-muted py-3">No jurisdictions configured</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.taxJurisdictionId ? 'Edit' : 'New' }} Jurisdiction</h5>
            <button type="button" class="btn-close" @click="editing = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-md-3">
                <label class="form-label small">Code *</label>
                <input class="form-control form-control-sm" v-model="form.jurisdictionCode" maxlength="20" placeholder="WA, WA-KING, OR">
              </div>
              <div class="col-md-9">
                <label class="form-label small">Name *</label>
                <input class="form-control form-control-sm" v-model="form.jurisdictionName" maxlength="100">
              </div>
              <div class="col-md-3">
                <label class="form-label small">Type</label>
                <select class="form-select form-select-sm" v-model="form.taxType">
                  <option value="State">State</option>
                  <option value="County">County</option>
                  <option value="City">City</option>
                  <option value="District">District</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small">Rate (decimal, e.g. 0.065) *</label>
                <input class="form-control form-control-sm" type="number" step="0.00001" v-model.number="form.taxRate">
                <div class="form-text small">{{ (form.taxRate * 100).toFixed(3) }}%</div>
              </div>
              <div class="col-md-3">
                <label class="form-label small">GL Account *</label>
                <input class="form-control form-control-sm" v-model="form.taxAccountNumber" maxlength="20">
              </div>
              <div class="col-md-3">
                <label class="form-label small">Filing Frequency</label>
                <select class="form-select form-select-sm" v-model="form.filingFrequency">
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small">Effective Date *</label>
                <input class="form-control form-control-sm" type="date" v-model="form.effectiveDate">
              </div>
              <div class="col-md-4">
                <label class="form-label small">End Date</label>
                <input class="form-control form-control-sm" type="date" v-model="form.endDate">
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="jActive" v-model="form.isActive">
                  <label class="form-check-label small" for="jActive">Active</label>
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

const jurisdictions = ref([]);
const loading = ref(false);
const error = ref(null);
const activeOnly = ref(false);
const editing = ref(false);
const saving = ref(false);
const saveError = ref(null);
const form = ref(blankForm());

function blankForm() {
  return {
    taxJurisdictionId: 0,
    companyId: 1,
    jurisdictionCode: '',
    jurisdictionName: '',
    taxType: 'State',
    taxRate: 0,
    effectiveDate: new Date().toISOString().substring(0, 10),
    endDate: null,
    taxAccountNumber: '21530',
    filingFrequency: 'Monthly',
    isActive: true,
    notes: ''
  };
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().substring(0, 10);
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('tax/sales/jurisdictions', { params: { activeOnly: activeOnly.value } });
    jurisdictions.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

function openNew() {
  form.value = blankForm();
  saveError.value = null;
  editing.value = true;
}

function openEdit(j) {
  form.value = {
    ...j,
    effectiveDate: fmtDate(j.effectiveDate),
    endDate: j.endDate ? fmtDate(j.endDate) : null,
    notes: j.notes ?? ''
  };
  saveError.value = null;
  editing.value = true;
}

async function save() {
  saving.value = true;
  saveError.value = null;
  try {
    const payload = { ...form.value };
    if (!payload.endDate) payload.endDate = null;
    await api.post('tax/sales/jurisdictions', payload);
    editing.value = false;
    await load();
  } catch (e) {
    saveError.value = e.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
