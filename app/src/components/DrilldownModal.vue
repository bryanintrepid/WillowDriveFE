<template>
  <div class="modal fade" ref="modalRef" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ data?.accountNumber }} — {{ data?.description }}
            <span class="text-muted ms-2 small">FY{{ fiscalYear }} P{{ period }} ({{ periodName }})</span>
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

          <!-- Content -->
          <div v-else-if="data">
            <!-- Summary -->
            <div class="row mb-3">
              <div class="col-sm-3">
                <div class="small text-muted">Beginning Balance</div>
                <div class="fw-bold">{{ fmt(data.beginningBalance) }}</div>
              </div>
              <div class="col-sm-3">
                <div class="small text-muted">Total Debits</div>
                <div class="fw-bold text-primary">{{ fmt(data.totalDebits) }}</div>
              </div>
              <div class="col-sm-3">
                <div class="small text-muted">Total Credits</div>
                <div class="fw-bold text-info">{{ fmt(data.totalCredits) }}</div>
              </div>
              <div class="col-sm-3">
                <div class="small text-muted">Ending Balance</div>
                <div class="fw-bold">{{ fmt(data.endingBalance) }}</div>
              </div>
            </div>

            <!-- Transactions -->
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Batch</th>
                    <th>Journal</th>
                    <th>Description</th>
                    <th class="text-end">Debit</th>
                    <th class="text-end">Credit</th>
                    <th class="text-end">Balance</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="data.transactions.length === 0">
                    <td colspan="8" class="text-center text-muted py-3">No transactions in this period</td>
                  </tr>
                  <tr v-for="(txn, idx) in data.transactions" :key="idx">
                    <td class="text-nowrap">{{ fmtDate(txn.transactionDate) }}</td>
                    <td>{{ txn.batch }}</td>
                    <td>
                      <span class="badge bg-secondary">{{ txn.journalName }}</span>
                    </td>
                    <td>{{ txn.description || txn.transactionDescription }}</td>
                    <td class="text-end">{{ txn.debit ? fmt(txn.debit) : '' }}</td>
                    <td class="text-end">{{ txn.credit ? fmt(txn.credit) : '' }}</td>
                    <td class="text-end">{{ fmt(runningBalance(idx)) }}</td>
                    <td>
                      <router-link v-if="txn.sourceType === 'ApCheck'"
                        :to="`/accounting/checks/${txn.sourceId}`"
                        class="btn btn-sm btn-outline-primary py-0 px-1"
                        @click="closeModal">
                        Check {{ txn.sourceRef }}
                      </router-link>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light fw-bold" v-if="data.transactions.length > 0">
                  <tr>
                    <td colspan="4">Totals</td>
                    <td class="text-end">{{ fmt(data.totalDebits) }}</td>
                    <td class="text-end">{{ fmt(data.totalCredits) }}</td>
                    <td class="text-end">{{ fmt(data.endingBalance) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="text-muted small">{{ data.transactions.length }} transaction(s)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import api from '@/services/api';
import { formatCurrency } from '@/utils/format';
import { Modal } from 'bootstrap';

const props = defineProps({
  accountNumber: { type: String, default: '' },
  fiscalYear: { type: Number, default: 0 },
  period: { type: Number, default: 0 }
});

const emit = defineEmits(['close']);

const modalRef = ref(null);
const data = ref(null);
const loading = ref(false);
const error = ref(null);
let bsModal = null;

const periodNames = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','P13'];
const periodName = computed(() => periodNames[(props.period || 1) - 1] || '');

function fmt(val) {
  if (val === null || val === undefined) return '—';
  return formatCurrency(val);
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

// Pre-computed running balances (O(n) instead of O(n²) per-row)
const runningBalances = computed(() => {
  if (!data.value?.transactions) return [];
  const balances = [];
  let bal = data.value.beginningBalance ?? 0;
  for (const txn of data.value.transactions) {
    bal += (txn.debit ?? 0) - (txn.credit ?? 0);
    balances.push(bal);
  }
  return balances;
});

function runningBalance(idx) {
  return runningBalances.value[idx] ?? 0;
}

async function loadData() {
  if (!props.accountNumber || !props.fiscalYear || !props.period) return;
  loading.value = true;
  error.value = null;
  try {
    const { data: resp } = await api.get('financial-reports/drilldown', {
      params: { accountNumber: props.accountNumber, fiscalYear: props.fiscalYear, period: props.period }
    });
    data.value = resp;
  } catch (e) {
    error.value = e.response?.data || e.message || 'Failed to load drill-down';
  } finally {
    loading.value = false;
  }
}

async function show() {
  if (bsModal) {
    bsModal.show();
    await loadData();
  }
}

function closeModal() {
  if (bsModal) bsModal.hide();
}

watch(() => [props.accountNumber, props.fiscalYear, props.period], () => {
  if (props.accountNumber && props.fiscalYear && props.period) {
    show();
  }
});

onMounted(() => {
  bsModal = new Modal(modalRef.value);
  modalRef.value.addEventListener('hidden.bs.modal', () => emit('close'));
});

onBeforeUnmount(() => {
  bsModal?.dispose();
});

defineExpose({ show });
</script>

<style scoped>
.table td, .table th {
  padding: 0.25rem 0.4rem;
  font-size: 0.82rem;
}
</style>
