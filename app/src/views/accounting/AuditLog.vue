<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Audit Trail</h4>
      <button class="btn btn-sm btn-outline-secondary" @click="exportCsv" :disabled="!data?.entries?.length">
        <i class="ri-download-line me-1"></i>Export CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <div class="row g-2 align-items-end">
          <div class="col-md-2">
            <label class="form-label small mb-1">Start Date</label>
            <input type="date" class="form-control form-control-sm" v-model="filters.startDate">
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1">End Date</label>
            <input type="date" class="form-control form-control-sm" v-model="filters.endDate">
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1">User</label>
            <input type="text" class="form-control form-control-sm" v-model="filters.userName" placeholder="Name...">
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1">Entity Type</label>
            <select class="form-select form-select-sm" v-model="filters.entityType">
              <option value="">All</option>
              <option v-for="et in filterOptions.entityTypes" :key="et" :value="et">{{ et }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1">Action</label>
            <select class="form-select form-select-sm" v-model="filters.action">
              <option value="">All</option>
              <option v-for="a in filterOptions.actions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-sm btn-primary w-100" @click="search">Search</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="data">
      <!-- Results -->
      <div class="card">
        <div class="card-header py-2 d-flex justify-content-between">
          <span class="fw-bold">{{ data.totalCount }} entries</span>
          <span class="small text-muted">Page {{ data.page }} of {{ data.totalPages }}</span>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 150px;">Timestamp</th>
                <th style="width: 120px;">User</th>
                <th style="width: 140px;">Action</th>
                <th style="width: 100px;">Entity Type</th>
                <th>Entity ID</th>
                <th style="width: 80px;">FY</th>
                <th style="width: 60px;">P</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in data.entries" :key="entry.auditId"
                  @click="selectedEntry = entry" :class="{ 'table-active': selectedEntry?.auditId === entry.auditId }"
                  style="cursor: pointer;">
                <td class="small text-nowrap">{{ fmtDate(entry.actionAt) }}</td>
                <td class="small">{{ entry.actorUserName || '—' }}</td>
                <td><span class="badge bg-secondary">{{ entry.action }}</span></td>
                <td class="small">{{ entry.targetType }}</td>
                <td class="font-monospace small">{{ entry.targetId }}</td>
                <td class="small text-center">{{ entry.fiscalYear || '—' }}</td>
                <td class="small text-center">{{ entry.period || '—' }}</td>
                <td class="small text-muted text-truncate" style="max-width: 200px;">{{ entry.notes || '—' }}</td>
              </tr>
              <tr v-if="!data.entries?.length">
                <td colspan="8" class="text-center text-muted py-3">No audit entries found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="card-footer py-2 d-flex justify-content-between align-items-center" v-if="data.totalPages > 1">
          <button class="btn btn-sm btn-outline-secondary" :disabled="data.page <= 1" @click="goToPage(data.page - 1)">
            Previous
          </button>
          <span class="small text-muted">
            Showing {{ (data.page - 1) * data.pageSize + 1 }} - {{ Math.min(data.page * data.pageSize, data.totalCount) }}
            of {{ data.totalCount }}
          </span>
          <button class="btn btn-sm btn-outline-secondary" :disabled="data.page >= data.totalPages" @click="goToPage(data.page + 1)">
            Next
          </button>
        </div>
      </div>

      <!-- Detail panel -->
      <div class="card mt-3" v-if="selectedEntry">
        <div class="card-header py-2 d-flex justify-content-between">
          <span class="fw-bold">Entry #{{ selectedEntry.auditId }}</span>
          <button class="btn-close" @click="selectedEntry = null"></button>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <dl class="row mb-0">
                <dt class="col-4 text-muted">Timestamp</dt>
                <dd class="col-8">{{ fmtDateFull(selectedEntry.actionAt) }}</dd>
                <dt class="col-4 text-muted">User</dt>
                <dd class="col-8">{{ selectedEntry.actorUserName }} ({{ selectedEntry.actorRole || 'unknown' }})</dd>
                <dt class="col-4 text-muted">Action</dt>
                <dd class="col-8"><span class="badge bg-secondary">{{ selectedEntry.action }}</span></dd>
                <dt class="col-4 text-muted">Entity</dt>
                <dd class="col-8">{{ selectedEntry.targetType }}: {{ selectedEntry.targetId }}</dd>
                <dt class="col-4 text-muted">Period</dt>
                <dd class="col-8">FY {{ selectedEntry.fiscalYear || '—' }} P{{ selectedEntry.period || '—' }}</dd>
                <dt class="col-4 text-muted">IP Address</dt>
                <dd class="col-8 font-monospace small">{{ selectedEntry.ipAddress || '—' }}</dd>
              </dl>
            </div>
            <div class="col-md-6">
              <div v-if="selectedEntry.notes">
                <strong class="small text-muted">Notes:</strong>
                <p class="mb-2">{{ selectedEntry.notes }}</p>
              </div>
              <div v-if="selectedEntry.beforeJson">
                <strong class="small text-muted">Before:</strong>
                <pre class="bg-light p-2 small mb-2" style="max-height: 150px; overflow: auto;">{{ formatJson(selectedEntry.beforeJson) }}</pre>
              </div>
              <div v-if="selectedEntry.afterJson">
                <strong class="small text-muted">After:</strong>
                <pre class="bg-light p-2 small mb-0" style="max-height: 150px; overflow: auto;">{{ formatJson(selectedEntry.afterJson) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const filters = ref({
  startDate: '',
  endDate: '',
  userName: '',
  entityType: '',
  action: ''
});
const filterOptions = ref({ actions: [], entityTypes: [] });

const data = ref(null);
const selectedEntry = ref(null);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);

// Default date range: last 30 days
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
filters.value.startDate = thirtyDaysAgo.toISOString().split('T')[0];
filters.value.endDate = today.toISOString().split('T')[0];

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDateFull(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
}

function formatJson(jsonStr) {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
}

async function loadFilters() {
  try {
    const { data: resp } = await api.get('audit-log/filters');
    filterOptions.value = resp;
  } catch (e) {
    console.error('Failed to load filter options:', e);
  }
}

async function search(page = 1) {
  loading.value = true;
  error.value = null;
  selectedEntry.value = null;
  currentPage.value = page;

  try {
    const params = {
      page,
      pageSize: 50
    };
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;
    if (filters.value.userName) params.userName = filters.value.userName;
    if (filters.value.entityType) params.entityType = filters.value.entityType;
    if (filters.value.action) params.action = filters.value.action;

    const { data: resp } = await api.get('audit-log', { params });
    data.value = resp;
  } catch (e) {
    if (e.response?.status === 401) {
      error.value = 'Audit log access requires CFO or Admin role.';
    } else {
      error.value = e.response?.data?.message || e.message || 'Failed to load audit log';
    }
  } finally {
    loading.value = false;
  }
}

function goToPage(page) {
  search(page);
}

function exportCsv() {
  if (!data.value?.entries?.length) return;

  const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'FY', 'Period', 'Notes'];
  const rows = data.value.entries.map(e => [
    new Date(e.actionAt).toISOString(),
    e.actorUserName || '',
    e.actorRole || '',
    e.action,
    e.targetType,
    e.targetId,
    e.fiscalYear || '',
    e.period || '',
    (e.notes || '').replace(/"/g, '""')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${filters.value.startDate}-to-${filters.value.endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  loadFilters();
  search();
});
</script>
