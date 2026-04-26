<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Sales Tax Filing</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select class="form-select form-select-sm" style="width:180px" v-model="jurisdictionFilter" @change="load">
          <option :value="null">All jurisdictions</option>
          <option v-for="j in jurisdictions" :key="j.taxJurisdictionId" :value="j.taxJurisdictionId">
            {{ j.jurisdictionCode }} — {{ j.jurisdictionName }}
          </option>
        </select>
        <select class="form-select form-select-sm" style="width:110px" v-model="statusFilter" @change="load">
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="Filed">Filed</option>
          <option value="Paid">Paid</option>
        </select>
        <button class="btn btn-sm btn-outline-primary" @click="openGenerate"><i class="ri-add-line me-1"></i>Generate Period</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Jurisdiction</th>
              <th>Period</th>
              <th class="text-end">Collected</th>
              <th class="text-end">Remitted</th>
              <th class="text-end">Due</th>
              <th class="text-center">Status</th>
              <th>Filed</th>
              <th>Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in filings" :key="f.taxFilingPeriodId"
                :class="{ 'table-warning': f.status === 'Open' && f.taxCollected > 0 }">
              <td>
                <div class="font-monospace small">{{ f.jurisdictionCode }}</div>
                <div class="small text-muted">{{ f.jurisdictionName }}</div>
              </td>
              <td class="small font-monospace">{{ fmtDate(f.periodStart) }} → {{ fmtDate(f.periodEnd) }}</td>
              <td class="text-end font-monospace">{{ fmt(f.taxCollected) }}</td>
              <td class="text-end font-monospace">{{ fmt(f.taxRemitted) }}</td>
              <td class="text-end font-monospace fw-bold" :class="f.taxDue > 0 ? 'text-danger' : ''">{{ fmt(f.taxDue) }}</td>
              <td class="text-center">
                <span class="badge" :class="statusClass(f.status)">{{ f.status }}</span>
              </td>
              <td class="small">
                <template v-if="f.filedDate">
                  {{ fmtDate(f.filedDate) }}
                  <div class="text-muted">{{ f.filingReference }}</div>
                </template>
              </td>
              <td class="small">
                <template v-if="f.paidDate">
                  {{ fmtDate(f.paidDate) }}
                  <div class="text-muted">{{ f.paymentReference }}</div>
                </template>
              </td>
              <td>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-primary py-0" v-if="f.status === 'Open'" @click="openFile(f)">Mark Filed</button>
                  <button class="btn btn-sm btn-outline-success py-0" v-if="f.status !== 'Paid'" @click="openPay(f)">Mark Paid</button>
                </div>
              </td>
            </tr>
            <tr v-if="filings.length === 0">
              <td colspan="9" class="text-center text-muted py-3">No filing periods yet. Use "Generate Period" to create one.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Generate modal -->
    <div v-if="genModal" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Generate Filing Period</h5>
            <button type="button" class="btn-close" @click="genModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small">Jurisdiction *</label>
                <select class="form-select form-select-sm" v-model.number="genForm.taxJurisdictionId">
                  <option v-for="j in jurisdictions" :key="j.taxJurisdictionId" :value="j.taxJurisdictionId">
                    {{ j.jurisdictionCode }} — {{ j.jurisdictionName }} ({{ j.filingFrequency }})
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label small">Period Start *</label>
                <input type="date" class="form-control form-control-sm" v-model="genForm.periodStart">
              </div>
              <div class="col-md-6">
                <label class="form-label small">Period End *</label>
                <input type="date" class="form-control form-control-sm" v-model="genForm.periodEnd">
              </div>
            </div>
            <div class="form-text small mt-2">Snapshots collected tax from Wdv2_TaxTransaction for the range. Safe to re-run — status is preserved.</div>
            <div v-if="actionError" class="alert alert-danger mt-3 mb-0 py-2 small">{{ actionError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="genModal = false">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="saving" @click="generate">Generate</button>
          </div>
        </div>
      </div>
    </div>

    <!-- File modal -->
    <div v-if="fileModal" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Mark Filed — {{ selected?.jurisdictionCode }} {{ fmtDate(selected?.periodStart) }}</h5>
            <button type="button" class="btn-close" @click="fileModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small">Filed Date</label>
                <input type="date" class="form-control form-control-sm" v-model="fileForm.filedDate">
              </div>
              <div class="col-md-6">
                <label class="form-label small">Filing Reference</label>
                <input class="form-control form-control-sm" v-model="fileForm.filingReference" placeholder="e.g. DOR confirmation #">
              </div>
              <div class="col-12">
                <label class="form-label small">Notes</label>
                <textarea class="form-control form-control-sm" v-model="fileForm.notes" rows="2"></textarea>
              </div>
            </div>
            <div v-if="actionError" class="alert alert-danger mt-3 mb-0 py-2 small">{{ actionError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="fileModal = false">Cancel</button>
            <button class="btn btn-sm btn-primary" :disabled="saving" @click="markFiled">Mark Filed</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pay modal -->
    <div v-if="payModal" class="modal d-block" tabindex="-1" style="background:rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Mark Paid — {{ selected?.jurisdictionCode }} {{ fmtDate(selected?.periodStart) }}</h5>
            <button type="button" class="btn-close" @click="payModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div class="col-md-6">
                <label class="form-label small">Paid Date</label>
                <input type="date" class="form-control form-control-sm" v-model="payForm.paidDate">
              </div>
              <div class="col-md-6">
                <label class="form-label small">Amount Remitted *</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="payForm.taxRemitted">
              </div>
              <div class="col-12">
                <label class="form-label small">Payment Reference</label>
                <input class="form-control form-control-sm" v-model="payForm.paymentReference" placeholder="check #, ACH ref">
              </div>
              <div class="col-12">
                <label class="form-label small">Notes</label>
                <textarea class="form-control form-control-sm" v-model="payForm.notes" rows="2"></textarea>
              </div>
            </div>
            <div v-if="actionError" class="alert alert-danger mt-3 mb-0 py-2 small">{{ actionError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-sm btn-secondary" @click="payModal = false">Cancel</button>
            <button class="btn btn-sm btn-success" :disabled="saving" @click="markPaid">Mark Paid</button>
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

const filings = ref([]);
const jurisdictions = ref([]);
const loading = ref(false);
const error = ref(null);
const jurisdictionFilter = ref(null);
const statusFilter = ref('');

const genModal = ref(false);
const fileModal = ref(false);
const payModal = ref(false);
const saving = ref(false);
const actionError = ref(null);
const selected = ref(null);

const today = new Date().toISOString().substring(0, 10);
const genForm = ref({ taxJurisdictionId: null, periodStart: '', periodEnd: '' });
const fileForm = ref({ filedDate: today, filingReference: '', notes: '' });
const payForm = ref({ paidDate: today, taxRemitted: 0, paymentReference: '', notes: '' });

function fmt(v) { return formatCurrency(v ?? 0); }
function fmtDate(d) { return d ? new Date(d).toISOString().substring(0, 10) : ''; }
function statusClass(s) {
  switch (s) {
    case 'Open': return 'bg-warning text-dark';
    case 'Filed': return 'bg-info';
    case 'Paid': return 'bg-success';
    default: return 'bg-secondary';
  }
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (jurisdictionFilter.value != null) params.jurisdictionId = jurisdictionFilter.value;
    if (statusFilter.value) params.status = statusFilter.value;
    const { data } = await api.get('tax/sales/filings', { params });
    filings.value = data;
  } catch (e) {
    error.value = e.response?.data?.message || e.message;
  } finally {
    loading.value = false;
  }
}

async function loadJurisdictions() {
  const { data } = await api.get('tax/sales/jurisdictions', { params: { activeOnly: true } });
  jurisdictions.value = data;
}

function openGenerate() {
  const first = jurisdictions.value[0];
  const t = new Date();
  const start = new Date(t.getFullYear(), t.getMonth(), 1).toISOString().substring(0, 10);
  const end = new Date(t.getFullYear(), t.getMonth() + 1, 0).toISOString().substring(0, 10);
  genForm.value = { taxJurisdictionId: first?.taxJurisdictionId ?? null, periodStart: start, periodEnd: end };
  actionError.value = null;
  genModal.value = true;
}

async function generate() {
  saving.value = true; actionError.value = null;
  try {
    await api.post('tax/sales/filings/generate', genForm.value);
    genModal.value = false;
    await load();
  } catch (e) {
    actionError.value = e.response?.data?.message || e.message || 'Failed';
  } finally { saving.value = false; }
}

function openFile(f) {
  selected.value = f;
  fileForm.value = { filedDate: today, filingReference: '', notes: '' };
  actionError.value = null;
  fileModal.value = true;
}

async function markFiled() {
  saving.value = true; actionError.value = null;
  try {
    await api.post(`tax/sales/filings/${selected.value.taxFilingPeriodId}/mark-filed`, fileForm.value);
    fileModal.value = false;
    await load();
  } catch (e) {
    actionError.value = e.response?.data?.message || e.message || 'Failed';
  } finally { saving.value = false; }
}

function openPay(f) {
  selected.value = f;
  payForm.value = {
    paidDate: today,
    taxRemitted: Number(f.taxDue) > 0 ? Number(f.taxDue) : Number(f.taxCollected),
    paymentReference: '',
    notes: ''
  };
  actionError.value = null;
  payModal.value = true;
}

async function markPaid() {
  saving.value = true; actionError.value = null;
  try {
    await api.post(`tax/sales/filings/${selected.value.taxFilingPeriodId}/mark-paid`, payForm.value);
    payModal.value = false;
    await load();
  } catch (e) {
    actionError.value = e.response?.data?.message || e.message || 'Failed';
  } finally { saving.value = false; }
}

onMounted(async () => {
  await loadJurisdictions();
  await load();
});
</script>
