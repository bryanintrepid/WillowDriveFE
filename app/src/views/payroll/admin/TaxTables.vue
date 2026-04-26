<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 fs-15">
          <li class="breadcrumb-item"><a href="/"><i class="ri-home-fill"></i></a></li>
          <li class="breadcrumb-item"><a href="javascript: void(0);">Payroll</a></li>
          <li class="breadcrumb-item"><a href="javascript: void(0);">Admin</a></li>
          <li class="breadcrumb-item active fw-bold">Tax Tables</li>
        </ol>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="flex-grow-1">
                <h4 class="m-0">Payroll Tax Tables</h4>
                <small class="text-muted">
                  Enter rates from the annual notices (WA ESD, WA L&amp;I, IRS Pub 15-T, SSA COLA).
                  Attach the source PDF to each section as audit evidence.
                </small>
              </div>
              <div class="flex-shrink-0 d-flex align-items-center gap-2">
                <label class="m-0">Year:</label>
                <select class="form-select form-select-sm" v-model.number="selectedYear" style="width: 120px">
                  <option v-for="y in years" :key="y.calendarYear" :value="y.calendarYear">
                    {{ y.calendarYear }}
                  </option>
                </select>
                <button class="btn btn-sm btn-outline-primary" @click="showCreate = !showCreate">
                  + Add year
                </button>
              </div>
            </div>

            <div v-if="showCreate" class="mt-3 p-3 border rounded bg-light">
              <div class="row g-2 align-items-end">
                <div class="col-sm-3">
                  <label class="form-label m-0">New calendar year</label>
                  <input type="number" v-model.number="newYear.calendarYear" class="form-control form-control-sm" />
                </div>
                <div class="col-sm-3">
                  <label class="form-label m-0">Copy rates from (optional)</label>
                  <select class="form-select form-select-sm" v-model.number="newYear.copyFromYear">
                    <option :value="null">(empty — enter from scratch)</option>
                    <option v-for="y in years" :key="y.calendarYear" :value="y.calendarYear">
                      {{ y.calendarYear }}
                    </option>
                  </select>
                </div>
                <div class="col-sm-auto">
                  <button class="btn btn-sm btn-primary" @click="createYear">Create</button>
                  <button class="btn btn-sm btn-link" @click="showCreate = false">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border"></div>
    </div>

    <div v-else-if="detail" class="mt-3">
      <!-- Section: Federal & FICA scalars -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="m-0 flex-grow-1">Federal &amp; FICA scalars</h5>
          <small class="text-muted me-3">Source: IRS Pub 15-T, SSA COLA fact sheet</small>
          <button class="btn btn-sm btn-outline-secondary" @click="saveScalars" :disabled="!scalarsDirty">
            Save scalars
          </button>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3" v-for="f in scalarFields" :key="f.key">
              <label class="form-label m-0">{{ f.label }}</label>
              <input
                type="number"
                :step="f.step || 'any'"
                class="form-control form-control-sm"
                v-model.number="detail.scalars[f.key]"
                @input="scalarsDirty = true"
              />
              <small v-if="f.hint" class="text-muted">{{ f.hint }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Federal brackets -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="m-0 flex-grow-1">Federal withholding brackets</h5>
          <small class="text-muted me-3">Source: IRS Pub 15-T Worksheet 1A/1B</small>
        </div>
        <div class="card-body">
          <div class="d-flex gap-2 mb-2 align-items-center">
            <label class="m-0">W-4 version:</label>
            <select class="form-select form-select-sm" v-model.number="bracketFilter.w4Version" style="width: 160px">
              <option :value="0">Pre-2020</option>
              <option :value="1">2020+</option>
            </select>
            <label class="m-0 ms-3">Filing status:</label>
            <select class="form-select form-select-sm" v-model.number="bracketFilter.filingStatus" style="width: 200px">
              <option :value="0">Single</option>
              <option :value="1">Married Filing Jointly</option>
              <option :value="2" :disabled="bracketFilter.w4Version !== 1">Head of Household (2020+ only)</option>
            </select>
            <button class="btn btn-sm btn-outline-secondary ms-auto" @click="addBracketRow">+ Row</button>
            <button class="btn btn-sm btn-outline-primary" @click="saveBrackets">Save brackets</button>
          </div>
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Base amount</th>
                <th>Range low</th>
                <th>Range high</th>
                <th>Tax rate</th>
                <th style="width: 1%"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in visibleBrackets" :key="row.rateBreakId ?? `new-${idx}`">
                <td><input type="number" step="any" class="form-control form-control-sm" v-model.number="row.incomeBaseAmount" /></td>
                <td><input type="number" step="any" class="form-control form-control-sm" v-model.number="row.incomeRangeLow" /></td>
                <td><input type="number" step="any" class="form-control form-control-sm" v-model.number="row.incomeRangeHigh" /></td>
                <td><input type="number" step="0.0001" class="form-control form-control-sm" v-model.number="row.taxRate" /></td>
                <td>
                  <button class="btn btn-sm btn-link text-danger" @click="removeBracketRow(idx)">×</button>
                </td>
              </tr>
              <tr v-if="!visibleBrackets.length">
                <td colspan="5" class="text-muted text-center">No brackets for this combination. Click + Row to add.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: L&I per-class rates -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="m-0 flex-grow-1">WA L&amp;I per-class rates</h5>
          <small class="text-muted me-3">Source: WA L&amp;I Premium Rate Notice (experience-modified)</small>
          <button class="btn btn-sm btn-outline-secondary" @click="addLniRow">+ Class code</button>
        </div>
        <div class="card-body">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Class code</th>
                <th>Employee rate</th>
                <th>Employer rate</th>
                <th style="width: 1%"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in detail.lniRates" :key="row.lniCode || `new-${idx}`">
                <td><input type="number" class="form-control form-control-sm" v-model.number="row.lniCode" :disabled="row.saved" /></td>
                <td><input type="number" step="0.00001" class="form-control form-control-sm" v-model.number="row.employeeRate" /></td>
                <td><input type="number" step="0.00001" class="form-control form-control-sm" v-model.number="row.employerRate" /></td>
                <td><button class="btn btn-sm btn-outline-primary" @click="saveLniRow(row)">Save</button></td>
              </tr>
              <tr v-if="!detail.lniRates.length">
                <td colspan="4" class="text-muted text-center">No L&amp;I rates for this year. Click + Class code to add.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: FMLA / LTCA splits -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="m-0 flex-grow-1">FMLA &amp; LTCA employer-share splits</h5>
          <small class="text-muted me-3">Source: WA PFML + WA Cares Fund rate notices</small>
          <button class="btn btn-sm btn-outline-primary" @click="saveSplits" :disabled="!splitsDirty">Save splits</button>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label m-0">Employer FMLA share (0–1)</label>
              <input type="number" step="0.00001" class="form-control form-control-sm"
                     v-model.number="detail.configSplits.employerFmlaShare"
                     @input="splitsDirty = true" />
              <small class="text-muted">E.g. 0.27273 = 27.273%</small>
            </div>
            <div class="col-md-4">
              <label class="form-label m-0">Employee LTCA share (0–1)</label>
              <input type="number" step="0.00001" class="form-control form-control-sm"
                     v-model.number="detail.configSplits.employeeLtcaShare"
                     @input="splitsDirty = true" />
              <small class="text-muted">WA Cares Fund employee %</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Evidence -->
      <div class="card mb-3">
        <div class="card-header d-flex align-items-center">
          <h5 class="m-0 flex-grow-1">Rate-notice evidence</h5>
          <button class="btn btn-sm btn-outline-primary" @click="showEvidenceForm = !showEvidenceForm">
            + Attach evidence
          </button>
        </div>
        <div v-if="showEvidenceForm" class="card-body border-bottom">
          <div class="row g-2 align-items-end">
            <div class="col-md-2">
              <label class="form-label m-0">Rate table</label>
              <select class="form-select form-select-sm" v-model="newEvidence.rateTable">
                <option value="TaxTables">TaxTables</option>
                <option value="TaxRateBreaks">TaxRateBreaks</option>
                <option value="LniCalendarPeriods">LniCalendarPeriods</option>
                <option value="PayrollConfigs">PayrollConfigs</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label m-0">Row key</label>
              <input type="text" class="form-control form-control-sm" v-model="newEvidence.rateRowKey"
                     placeholder="e.g. 2026, 2026/1/2, 2026/4805" />
            </div>
            <div class="col-md-3">
              <label class="form-label m-0">Source description</label>
              <input type="text" class="form-control form-control-sm" v-model="newEvidence.sourceDescription"
                     placeholder="e.g. WA ESD 2026 UI Rate Notice" />
            </div>
            <div class="col-md-3">
              <label class="form-label m-0">Notes (optional)</label>
              <input type="text" class="form-control form-control-sm" v-model="newEvidence.notes" />
            </div>
            <div class="col-md-1">
              <button class="btn btn-sm btn-primary w-100" @click="createEvidence">Save</button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <table class="table table-sm align-middle" v-if="detail.evidence.length">
            <thead>
              <tr>
                <th>Rate table</th>
                <th>Row key</th>
                <th>Source</th>
                <th>Uploaded by</th>
                <th>When</th>
                <th>Files</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="ev in detail.evidence" :key="ev.evidenceId">
                <tr>
                  <td>{{ ev.rateTable }}</td>
                  <td><code>{{ ev.rateRowKey }}</code></td>
                  <td>{{ ev.sourceDescription }}</td>
                  <td>{{ ev.uploadedByUserId }}</td>
                  <td>{{ formatDate(ev.uploadedAt) }}</td>
                  <td>
                    <button class="btn btn-sm btn-link" @click="toggleAttachments(ev.evidenceId)">
                      {{ ev.attachmentCount }} file(s)
                      <i class="ri-arrow-down-s-line" v-if="expandedEvidence !== ev.evidenceId"></i>
                      <i class="ri-arrow-up-s-line" v-else></i>
                    </button>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-link text-danger" @click="deleteEvidence(ev.evidenceId)">Delete</button>
                  </td>
                </tr>
                <tr v-if="expandedEvidence === ev.evidenceId">
                  <td colspan="7">
                    <AttachmentPanel :entity-type="'TaxRateEvidence'" :entity-id="ev.evidenceId"
                                     @updated="loadYear(selectedYear)" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <p v-else class="text-muted m-0">No evidence attached for {{ selectedYear }} yet.</p>
        </div>
      </div>
    </div>

    <div v-else-if="!loading && !years.length" class="alert alert-info mt-3">
      No tax years in the system yet. Click <strong>+ Add year</strong> to create one.
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import api from '../../../services/api';
import AttachmentPanel from '../../../components/AttachmentPanel.vue';

const scalarFields = [
  { key: 'fmlaRate', label: 'WA PFML rate (%)', step: '0.0001', hint: 'Employee+employer total, e.g. 0.0113' },
  { key: 'sutaRate', label: 'WA SUTA rate', step: '0.0001', hint: 'Experience-modified' },
  { key: 'sutaMaximum', label: 'WA SUTA wage base', step: '1' },
  { key: 'ficaMaximum', label: 'FICA (SS) max', step: '1' },
  { key: 'employeeFicaRate', label: 'Employee FICA rate', step: '0.0001' },
  { key: 'employerFicaRate', label: 'Employer FICA rate', step: '0.0001' },
  { key: 'employeeMedicareRate', label: 'Employee Medicare rate', step: '0.0001' },
  { key: 'employerMedicareRate', label: 'Employer Medicare rate', step: '0.0001' },
  { key: 'employeeMedicareThreshold', label: 'Addl. Medicare threshold', step: '1' },
  { key: 'employeeMedicareThresholdRate', label: 'Addl. Medicare rate', step: '0.0001' },
  { key: 'futaRate', label: 'FUTA rate (gross)', step: '0.0001', hint: 'Pre-credit; 0.06' },
  { key: 'futaMaximum', label: 'FUTA wage base', step: '1' },
  { key: 'minimumWage', label: 'WA minimum wage', step: '0.01' },
  { key: 'maximum401KDeduction', label: '401(k) limit', step: '1' },
  { key: 'maximum401KDeduction50Plus', label: '401(k) limit 50+', step: '1' },
  { key: 'annualWitholdingAllowance', label: 'Annual W/H allowance', step: '1' },
  { key: 'singleIncomeStart', label: 'Single income start', step: '1' },
  { key: 'marriedIncomeStart', label: 'Married income start', step: '1' }
];

const years = ref([]);
const selectedYear = ref(null);
const detail = ref(null);
const loading = ref(false);

const showCreate = ref(false);
const newYear = reactive({ calendarYear: new Date().getFullYear() + 1, copyFromYear: null });

const scalarsDirty = ref(false);
const splitsDirty = ref(false);

const bracketFilter = reactive({ w4Version: 1, filingStatus: 0 });
const visibleBrackets = computed(() => {
  if (!detail.value) return [];
  return detail.value.brackets.filter(
    b => b.w4Version === bracketFilter.w4Version && b.filingStatus === bracketFilter.filingStatus
  );
});

const showEvidenceForm = ref(false);
const newEvidence = reactive({ rateTable: 'TaxTables', rateRowKey: '', sourceDescription: '', notes: '' });
const expandedEvidence = ref(null);

async function loadYears() {
  const r = await api.get('payroll/tax-tables/years');
  years.value = r.data;
  if (!selectedYear.value && years.value.length) {
    selectedYear.value = years.value[0].calendarYear;
  }
}

async function loadYear(year) {
  if (!year) { detail.value = null; return; }
  loading.value = true;
  try {
    const r = await api.get(`payroll/tax-tables/${year}`);
    detail.value = r.data;
    detail.value.lniRates.forEach(l => l.saved = true);
    scalarsDirty.value = false;
    splitsDirty.value = false;
    newEvidence.rateRowKey = String(year);
  } finally {
    loading.value = false;
  }
}

async function createYear() {
  try {
    await api.post('payroll/tax-tables', newYear);
    showCreate.value = false;
    await loadYears();
    selectedYear.value = newYear.calendarYear;
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to create year');
  }
}

async function saveScalars() {
  try {
    await api.put(`payroll/tax-tables/${selectedYear.value}`, detail.value.scalars);
    scalarsDirty.value = false;
  } catch (e) {
    alert(e.response?.data?.message || 'Save failed');
  }
}

function addBracketRow() {
  detail.value.brackets.push({
    rateBreakId: null,
    calendarYear: selectedYear.value,
    w4Version: bracketFilter.w4Version,
    filingStatus: bracketFilter.filingStatus,
    incomeBaseAmount: 0,
    incomeRangeLow: 0,
    incomeRangeHigh: 0,
    taxRate: 0
  });
}

function removeBracketRow(idx) {
  const row = visibleBrackets.value[idx];
  const outerIdx = detail.value.brackets.indexOf(row);
  if (outerIdx >= 0) detail.value.brackets.splice(outerIdx, 1);
}

async function saveBrackets() {
  try {
    const payload = {
      calendarYear: selectedYear.value,
      w4Version: bracketFilter.w4Version,
      filingStatus: bracketFilter.filingStatus,
      brackets: visibleBrackets.value.map(b => ({
        incomeBaseAmount: b.incomeBaseAmount,
        incomeRangeLow: b.incomeRangeLow,
        incomeRangeHigh: b.incomeRangeHigh,
        taxRate: b.taxRate
      }))
    };
    await api.put(
      `payroll/tax-tables/${selectedYear.value}/brackets/${bracketFilter.w4Version}/${bracketFilter.filingStatus}`,
      payload
    );
    await loadYear(selectedYear.value);
  } catch (e) {
    alert(e.response?.data?.message || 'Save failed');
  }
}

function addLniRow() {
  detail.value.lniRates.push({
    lniCode: null, calendarYear: selectedYear.value,
    employeeRate: 0, employerRate: 0, saved: false
  });
}

async function saveLniRow(row) {
  if (!row.lniCode) { alert('Class code required'); return; }
  try {
    await api.put(`payroll/tax-tables/${selectedYear.value}/lni/${row.lniCode}`, {
      calendarYear: selectedYear.value,
      lniCode: row.lniCode,
      employeeRate: row.employeeRate,
      employerRate: row.employerRate
    });
    row.saved = true;
  } catch (e) {
    alert(e.response?.data?.message || 'Save failed');
  }
}

async function saveSplits() {
  try {
    await api.put(`payroll/tax-tables/${selectedYear.value}/config-splits`, {
      fiscalYear: selectedYear.value,
      employerFmlaShare: detail.value.configSplits.employerFmlaShare,
      employeeLtcaShare: detail.value.configSplits.employeeLtcaShare
    });
    splitsDirty.value = false;
  } catch (e) {
    alert(e.response?.data?.message || 'Save failed');
  }
}

async function createEvidence() {
  try {
    const r = await api.post('payroll/tax-tables/evidence', {
      rateTable: newEvidence.rateTable,
      rateRowKey: newEvidence.rateRowKey,
      effectiveYear: selectedYear.value,
      sourceDescription: newEvidence.sourceDescription,
      notes: newEvidence.notes || null
    });
    showEvidenceForm.value = false;
    newEvidence.sourceDescription = '';
    newEvidence.notes = '';
    await loadYear(selectedYear.value);
    expandedEvidence.value = r.data.evidenceId;
  } catch (e) {
    alert(e.response?.data?.message || 'Create failed');
  }
}

async function deleteEvidence(id) {
  if (!confirm('Delete this evidence record? Attached files will remain in storage.')) return;
  try {
    await api.delete(`payroll/tax-tables/evidence/${id}`);
    await loadYear(selectedYear.value);
  } catch (e) {
    alert(e.response?.data?.message || 'Delete failed');
  }
}

function toggleAttachments(id) {
  expandedEvidence.value = expandedEvidence.value === id ? null : id;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString();
}

watch(selectedYear, (y) => { if (y) loadYear(y); });

onMounted(async () => {
  await loadYears();
  if (selectedYear.value) await loadYear(selectedYear.value);
});
</script>

<style scoped>
.card-header h5 { font-size: 1rem; }
</style>
