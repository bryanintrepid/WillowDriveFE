<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Custom Reports</h4>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-secondary" @click="newReport">
          <i class="ri-add-line"></i> New
        </button>
      </div>
    </div>

    <div class="alert alert-info py-2 small mb-3">
      Minimal saved-query builder — two fixed report types with whitelisted
      filters. Drag-drop column designer deferred (see PHASE12_3 pre-audit).
    </div>

    <div class="row g-3">
      <!-- Saved definitions -->
      <div class="col-lg-3">
        <div class="card">
          <div class="card-header py-2">
            <strong>Saved Reports</strong>
          </div>
          <ul class="list-group list-group-flush">
            <li v-if="definitions.length === 0" class="list-group-item small text-muted">
              No saved reports yet
            </li>
            <li v-for="d in definitions" :key="d.reportDefinitionId"
                class="list-group-item list-group-item-action"
                :class="{ active: selectedId === d.reportDefinitionId }"
                style="cursor:pointer" @click="loadDefinition(d.reportDefinitionId)">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="small fw-bold">{{ d.reportName }}</div>
                  <div class="text-muted" style="font-size: 0.7rem;">
                    {{ typeLabel(d.reportType) }}
                    <span v-if="d.isPublic" class="badge bg-info ms-1" style="font-size: 0.55rem;">public</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Builder / results -->
      <div class="col-lg-9">
        <div class="card mb-3">
          <div class="card-body">
            <div class="row g-2 mb-2">
              <div class="col-md-4">
                <label class="form-label small mb-0">Report name</label>
                <input v-model="form.reportName" class="form-control form-control-sm" />
              </div>
              <div class="col-md-3">
                <label class="form-label small mb-0">Type</label>
                <select v-model="form.reportType" class="form-select form-select-sm" @change="onTypeChange">
                  <option value="GLDetail">GL Detail</option>
                  <option value="AccountSummary">Account Summary</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label small mb-0">Sort by</label>
                <select v-model="form.sortField" class="form-select form-select-sm">
                  <option :value="null">(default)</option>
                  <option v-for="f in availableFields" :key="f.field" :value="f.field">{{ f.field }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label small mb-0">Order</label>
                <select v-model="form.sortDesc" class="form-select form-select-sm">
                  <option :value="false">ASC</option>
                  <option :value="true">DESC</option>
                </select>
              </div>
            </div>

            <div class="row g-2 mb-2">
              <div class="col-md-8">
                <label class="form-label small mb-0">Description</label>
                <input v-model="form.description" class="form-control form-control-sm" />
              </div>
              <div class="col-md-4 d-flex align-items-end">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" id="isPublic" v-model="form.isPublic" />
                  <label class="form-check-label small" for="isPublic">Public (shareable)</label>
                </div>
              </div>
            </div>

            <hr class="my-2" />

            <!-- Filters -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong class="small">Filters</strong>
              <button class="btn btn-sm btn-outline-primary" @click="addFilter">
                <i class="ri-add-line"></i> Add Filter
              </button>
            </div>
            <div v-if="form.filters.length === 0" class="text-muted small">
              No filters — all rows will be returned (up to 5000).
            </div>
            <div v-for="(f, idx) in form.filters" :key="idx" class="row g-2 mb-2 align-items-center">
              <div class="col-md-3">
                <select v-model="f.field" class="form-select form-select-sm">
                  <option v-for="fld in filterFields" :key="fld.field" :value="fld.field">{{ fld.field }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <select v-model="f.op" class="form-select form-select-sm">
                  <option v-for="o in ops" :key="o" :value="o">{{ o }}</option>
                </select>
              </div>
              <div class="col-md-3">
                <input v-model="f.value" class="form-control form-control-sm" placeholder="value" />
              </div>
              <div v-if="f.op === 'between'" class="col-md-3">
                <input v-model="f.valueTo" class="form-control form-control-sm" placeholder="to" />
              </div>
              <div class="col-md-1">
                <button class="btn btn-sm btn-outline-danger" @click="form.filters.splice(idx, 1)">
                  <i class="ri-close-line"></i>
                </button>
              </div>
            </div>

            <hr class="my-2" />

            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-primary" @click="runReport" :disabled="loading">
                <i class="ri-play-line"></i> Run
              </button>
              <button class="btn btn-sm btn-success" @click="saveDefinition" :disabled="loading || !form.reportName">
                <i class="ri-save-line"></i> {{ form.reportDefinitionId ? 'Update' : 'Save' }}
              </button>
              <button class="btn btn-sm btn-outline-secondary" @click="exportCsv" :disabled="loading">
                <i class="ri-download-line"></i> Export CSV
              </button>
              <button v-if="form.reportDefinitionId" class="btn btn-sm btn-outline-danger ms-auto" @click="deleteDefinition">
                <i class="ri-delete-bin-line"></i> Delete
              </button>
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-danger small">{{ error }}</div>

        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary"></div>
        </div>

        <div v-else-if="result" class="card">
          <div class="card-header py-2 d-flex justify-content-between align-items-center">
            <strong>Results — {{ result.rowCount }} rows</strong>
            <span v-if="result.rowCount >= 5000" class="badge bg-warning text-dark">Capped at 5000</span>
          </div>
          <div class="table-responsive" style="max-height: 600px;">
            <table class="table table-sm table-striped mb-0">
              <thead class="sticky-top bg-white">
                <tr>
                  <th v-for="c in result.columns" :key="c.field" class="small">{{ c.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in result.rows" :key="i">
                  <td v-for="c in result.columns" :key="c.field" class="small">
                    {{ fmtCell(row[c.field], c.dataType) }}
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="result.totals">
                <tr class="fw-bold table-secondary">
                  <td v-for="c in result.columns" :key="c.field" class="small">
                    <template v-if="result.totals[c.field] !== undefined">
                      {{ fmtCell(result.totals[c.field], c.dataType) }}
                    </template>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';

const definitions = ref([]);
const metadata = ref(null);
const selectedId = ref(null);
const result = ref(null);
const loading = ref(false);
const error = ref(null);

const emptyForm = () => ({
  reportDefinitionId: null,
  reportName: '',
  description: '',
  reportType: 'GLDetail',
  filters: [],
  sortField: null,
  sortDesc: false,
  isPublic: false
});

const form = ref(emptyForm());

const availableFields = computed(() => {
  if (!metadata.value) return [];
  return metadata.value.fields[form.value.reportType] || [];
});

// For filters on AccountSummary, also include the synthetic 'Period' filter.
const filterFields = computed(() => {
  const fields = [...availableFields.value];
  if (form.value.reportType === 'AccountSummary'
      && !fields.find(f => f.field === 'Period')) {
    fields.push({ field: 'Period', dataType: 'int' });
  }
  return fields;
});

const ops = computed(() => metadata.value?.ops || []);

function typeLabel(t) {
  return t === 'GLDetail' ? 'GL Detail' : t === 'AccountSummary' ? 'Account Summary' : t;
}

function addFilter() {
  const first = filterFields.value[0]?.field || '';
  form.value.filters.push({ field: first, op: 'eq', value: '', valueTo: null });
}

function onTypeChange() {
  form.value.filters = [];
  form.value.sortField = null;
  result.value = null;
}

function newReport() {
  form.value = emptyForm();
  selectedId.value = null;
  result.value = null;
  error.value = null;
}

function fmtCell(v, dataType) {
  if (v === null || v === undefined) return '';
  if (dataType === 'currency') return formatCurrency(v);
  if (dataType === 'date') {
    const d = new Date(v);
    return isNaN(d) ? v : d.toISOString().slice(0, 10);
  }
  return String(v);
}

async function loadMetadata() {
  try {
    const { data } = await api.get('custom-reports/metadata');
    metadata.value = data;
  } catch (e) {
    error.value = 'Failed to load metadata';
  }
}

async function loadList() {
  try {
    const { data } = await api.get('custom-reports');
    definitions.value = data;
  } catch (e) {
    error.value = 'Failed to load saved reports';
  }
}

async function loadDefinition(id) {
  try {
    const { data } = await api.get(`custom-reports/${id}`);
    form.value = {
      reportDefinitionId: data.reportDefinitionId,
      reportName: data.reportName,
      description: data.description || '',
      reportType: data.reportType,
      filters: (data.filters || []).map(f => ({ ...f })),
      sortField: data.sortField,
      sortDesc: data.sortDesc,
      isPublic: data.isPublic
    };
    selectedId.value = id;
    result.value = null;
  } catch (e) {
    error.value = e.response?.data || 'Failed to load definition';
  }
}

async function runReport() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.post('custom-reports/execute', {
      reportDefinitionId: form.value.reportDefinitionId,
      reportType: form.value.reportType,
      filters: form.value.filters,
      sortField: form.value.sortField,
      sortDesc: form.value.sortDesc
    });
    result.value = data;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to run report';
  } finally {
    loading.value = false;
  }
}

async function saveDefinition() {
  error.value = null;
  try {
    const { data } = await api.post('custom-reports', {
      reportDefinitionId: form.value.reportDefinitionId,
      reportName: form.value.reportName,
      description: form.value.description,
      reportType: form.value.reportType,
      filters: form.value.filters,
      sortField: form.value.sortField,
      sortDesc: form.value.sortDesc,
      isPublic: form.value.isPublic
    });
    form.value.reportDefinitionId = data.reportDefinitionId;
    selectedId.value = data.reportDefinitionId;
    await loadList();
  } catch (e) {
    error.value = e.response?.data || 'Failed to save';
  }
}

async function deleteDefinition() {
  if (!form.value.reportDefinitionId) return;
  if (!confirm(`Delete "${form.value.reportName}"?`)) return;
  try {
    await api.delete(`custom-reports/${form.value.reportDefinitionId}`);
    newReport();
    await loadList();
  } catch (e) {
    error.value = e.response?.data || 'Failed to delete';
  }
}

async function exportCsv() {
  error.value = null;
  try {
    const resp = await api.post('custom-reports/export', {
      reportDefinitionId: form.value.reportDefinitionId,
      reportType: form.value.reportType,
      filters: form.value.filters,
      sortField: form.value.sortField,
      sortDesc: form.value.sortDesc
    }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.value.reportType}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e.response?.data || 'Export failed';
  }
}

onMounted(async () => {
  await loadMetadata();
  await loadList();
});
</script>
