<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0">Board Package</h4>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <label class="small text-muted mb-0">Fiscal Year</label>
        <select v-model.number="fiscalYear" class="form-select form-select-sm" style="width: 110px;">
          <option v-for="fy in fiscalYears" :key="fy" :value="fy">FY{{ fy }}</option>
        </select>
        <label class="small text-muted mb-0">Period</label>
        <select v-model.number="period" class="form-select form-select-sm" style="width: 80px;">
          <option v-for="p in 12" :key="p" :value="p">P{{ p }} — {{ monthName(p) }}</option>
        </select>
      </div>
    </div>

    <div class="row g-3">
      <!-- Left: options -->
      <div class="col-lg-5">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0">Layout</h6>
              <div class="d-flex gap-2 align-items-center">
                <select v-model.number="selectedConfigId" class="form-select form-select-sm" style="width: 180px;"
                        @change="applyConfig">
                  <option :value="0">-- Ad-hoc --</option>
                  <option v-for="c in configs" :key="c.id" :value="c.id">
                    {{ c.name }}{{ c.isShared ? ' (shared)' : '' }}
                  </option>
                </select>
                <button v-if="selectedConfigId && ownsSelectedConfig" class="btn btn-sm btn-outline-danger"
                        @click="deleteConfig" :disabled="busy">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>

            <label class="form-label small fw-bold">Sections</label>
            <div class="row g-2 mb-3">
              <div v-for="s in sectionOptions" :key="s.key" class="col-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" :id="'sec-' + s.key"
                         :value="s.key" v-model="sections" />
                  <label class="form-check-label small" :for="'sec-' + s.key">{{ s.label }}</label>
                </div>
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-md-6">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="cmpPrior" v-model="compareToPriorYear" />
                  <label class="form-check-label small" for="cmpPrior">Compare to prior year</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="cmpBudget" v-model="compareToBudget" />
                  <label class="form-check-label small" for="cmpBudget">Compare to budget (IS)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="includeCharts" v-model="includeCharts" />
                  <label class="form-check-label small" for="includeCharts">Include charts</label>
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label small mb-1">Flux threshold (%)</label>
                <input type="number" min="0" step="1" v-model.number="fluxThresholdPct"
                       class="form-control form-control-sm" />
              </div>
            </div>

            <label class="form-label small fw-bold">Commentary</label>
            <textarea v-model="commentary" class="form-control form-control-sm" rows="4"
                      placeholder="Optional narrative for the cover page (overrides layout default)." />

            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-primary btn-sm flex-grow-1" @click="generate" :disabled="busy">
                <i class="ri-file-download-line me-1"></i>
                {{ busy ? 'Generating…' : 'Generate PDF' }}
              </button>
              <button class="btn btn-outline-secondary btn-sm" @click="openSaveModal" :disabled="busy">
                <i class="ri-save-line me-1"></i>{{ selectedConfigId && ownsSelectedConfig ? 'Update…' : 'Save as…' }}
              </button>
            </div>

            <div v-if="error" class="alert alert-danger mt-3 mb-0 small py-2">{{ error }}</div>
          </div>
        </div>
      </div>

      <!-- Right: saved layouts list -->
      <div class="col-lg-7">
        <div class="card">
          <div class="card-body">
            <h6>Saved Layouts</h6>
            <div v-if="configs.length === 0" class="text-muted small py-3">
              No saved layouts yet. Configure sections and click "Save as…" to persist.
            </div>
            <table v-else class="table table-sm align-middle mb-0">
              <thead><tr>
                <th>Name</th>
                <th>Sections</th>
                <th>Shared</th>
                <th class="text-end"></th>
              </tr></thead>
              <tbody>
                <tr v-for="c in configs" :key="c.id">
                  <td>
                    <div class="fw-bold small">{{ c.name }}</div>
                    <div v-if="c.description" class="text-muted small">{{ c.description }}</div>
                  </td>
                  <td class="small text-muted">{{ c.sections.join(', ') }}</td>
                  <td><span v-if="c.isShared" class="badge bg-info">shared</span></td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-link p-0" @click="selectedConfigId = c.id; applyConfig()">
                      Load
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Save modal -->
    <div v-if="showSaveModal" class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ saveForm.id ? 'Update Layout' : 'Save Layout' }}</h5>
            <button type="button" class="btn-close" @click="showSaveModal = false"></button>
          </div>
          <div class="modal-body">
            <label class="form-label small fw-bold">Name</label>
            <input v-model="saveForm.name" class="form-control form-control-sm mb-2" maxlength="200"
                   placeholder="e.g. Monthly CFO package" />
            <label class="form-label small fw-bold">Description</label>
            <input v-model="saveForm.description" class="form-control form-control-sm mb-2" maxlength="500" />
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="saveShared" v-model="saveForm.isShared" />
              <label class="form-check-label small" for="saveShared">
                Shared (visible to all accounting users)
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="showSaveModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="saveConfig" :disabled="!saveForm.name.trim() || busy">
              {{ saveForm.id ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const sectionOptions = [
  { key: 'summary',  label: 'Executive Summary (KPIs + charts)' },
  { key: 'bs',       label: 'Balance Sheet' },
  { key: 'is',       label: 'Income Statement' },
  { key: 'cashflow', label: 'Cash Flow' },
  { key: 'ratios',   label: 'Financial Ratios' },
  { key: 'flux',     label: 'Flux Analysis' },
  { key: 'araging',  label: 'AR Aging' },
  { key: 'apaging',  label: 'AP Aging' },
];

const now = new Date();
const defaultFy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
const defaultPeriod = now.getMonth() >= 6 ? now.getMonth() - 5 : now.getMonth() + 7;

const fiscalYear = ref(defaultFy);
const period = ref(defaultPeriod);
const fiscalYears = ref([defaultFy, defaultFy - 1, defaultFy - 2]);

const sections = ref(sectionOptions.map(s => s.key));
const compareToPriorYear = ref(true);
const compareToBudget = ref(true);
const includeCharts = ref(true);
const fluxThresholdPct = ref(10);
const commentary = ref('');

const configs = ref([]);
const selectedConfigId = ref(0);
const busy = ref(false);
const error = ref('');

const showSaveModal = ref(false);
const saveForm = ref({ id: null, name: '', description: '', isShared: false });

const currentUser = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').userName || ''; }
  catch { return ''; }
});

const ownsSelectedConfig = computed(() => {
  const c = configs.value.find(x => x.id === selectedConfigId.value);
  return c && c.createdBy?.toLowerCase() === currentUser.value?.toLowerCase();
});

function monthName(p) {
  return ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'][p - 1] || '';
}

async function loadFiscalYears() {
  try {
    const { data } = await api.get('/financial-reports/fiscal-years');
    if (Array.isArray(data) && data.length) fiscalYears.value = data;
  } catch { /* keep defaults */ }
}

async function loadConfigs() {
  try {
    const { data } = await api.get('/financial-reports/board-package/configs');
    configs.value = data;
  } catch (e) {
    error.value = 'Failed to load saved layouts.';
  }
}

function applyConfig() {
  error.value = '';
  if (!selectedConfigId.value) return;
  const c = configs.value.find(x => x.id === selectedConfigId.value);
  if (!c) return;
  sections.value = [...c.sections];
  compareToPriorYear.value = c.compareToPriorYear;
  compareToBudget.value = c.compareToBudget;
  includeCharts.value = c.includeCharts;
  fluxThresholdPct.value = c.fluxThresholdPct;
  commentary.value = c.defaultCommentary || '';
}

async function generate() {
  error.value = '';
  if (sections.value.length === 0) {
    error.value = 'Select at least one section.';
    return;
  }
  busy.value = true;
  try {
    const params = new URLSearchParams({
      fiscalYear: fiscalYear.value,
      period: period.value,
      sections: sections.value.join(','),
      compareToPriorYear: compareToPriorYear.value,
      compareToBudget: compareToBudget.value,
      includeCharts: includeCharts.value,
      fluxThresholdPct: fluxThresholdPct.value,
    });
    if (commentary.value) params.append('commentary', commentary.value);

    const response = await api.get(`/financial-reports/board-package?${params.toString()}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BoardPackage_FY${fiscalYear.value}_P${period.value}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to generate board package.';
  } finally {
    busy.value = false;
  }
}

function openSaveModal() {
  if (selectedConfigId.value && ownsSelectedConfig.value) {
    const c = configs.value.find(x => x.id === selectedConfigId.value);
    saveForm.value = {
      id: c.id,
      name: c.name,
      description: c.description || '',
      isShared: c.isShared,
    };
  } else {
    saveForm.value = { id: null, name: '', description: '', isShared: false };
  }
  showSaveModal.value = true;
}

async function saveConfig() {
  error.value = '';
  const body = {
    id: saveForm.value.id,
    name: saveForm.value.name.trim(),
    description: saveForm.value.description || null,
    sections: sections.value,
    compareToPriorYear: compareToPriorYear.value,
    compareToBudget: compareToBudget.value,
    includeCharts: includeCharts.value,
    fluxThresholdPct: fluxThresholdPct.value,
    defaultCommentary: commentary.value || null,
    isShared: saveForm.value.isShared,
  };
  busy.value = true;
  try {
    let res;
    if (saveForm.value.id) {
      res = await api.put(`/financial-reports/board-package/configs/${saveForm.value.id}`, body);
    } else {
      res = await api.post('/financial-reports/board-package/configs', body);
    }
    await loadConfigs();
    selectedConfigId.value = res.data.id;
    showSaveModal.value = false;
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to save layout.';
  } finally {
    busy.value = false;
  }
}

async function deleteConfig() {
  if (!selectedConfigId.value) return;
  if (!confirm('Delete this layout?')) return;
  busy.value = true;
  try {
    await api.delete(`/financial-reports/board-package/configs/${selectedConfigId.value}`);
    selectedConfigId.value = 0;
    await loadConfigs();
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to delete layout.';
  } finally {
    busy.value = false;
  }
}

onMounted(() => {
  loadFiscalYears();
  loadConfigs();
});
</script>
