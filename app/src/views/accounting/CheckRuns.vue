<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div class="page-title">
          <h4>A/P Check Runs</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item active" aria-current="page">Check Runs</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 250px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search check runs..." />
          </div>
          <router-link :to="{ name: 'accounting-payables-checkrun-detail', params: { checkRunId: 0 } }" class="btn btn-primary">
            <i class="ri-add-line align-bottom"></i> Create Check Run
          </router-link>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <div v-if="!pagination.results.length" class="text-center my-4">
              <p class="text-muted fs-15">No A/P check runs found</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-nowrap align-middle">
                <thead>
                  <tr>
                    <th>Check Run #</th>
                    <th>Payment Date</th>
                    <th>Checking Account</th>
                    <th>Control Account</th>
                    <th>Posting Date</th>
                    <th>Created By</th>
                    <th>Created On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(run, index) in pagination.results" :key="run.apCheckRunId" :class="{ 'table-light': index % 2 !== 0 }">
                    <td>
                      <router-link :to="{ name: 'accounting-payables-checkrun-detail', params: { checkRunId: run.apCheckRunId } }">
                        Run #{{ run.apCheckRunId }}
                      </router-link>
                    </td>
                    <td>{{ formatDate(run.paymentDate) }}</td>
                    <td>{{ run.bankCheckingAccount.description }}</td>
                    <td>{{ run.controlAccount.description }}</td>
                    <td>{{ run.batchInfo.transactionDate ? formatDate(run.batchInfo.transactionDate) : '' }}</td>
                    <td>{{ run.creator }}</td>
                    <td>{{ formatDate(run.dateCreated) }}</td>
                    <td>
                      <button v-if="!run.batchInfo.posted" class="btn btn-sm btn-icon text-danger" @click="deleteCheckRun(run.apCheckRunId)" title="Delete check run">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Paginate v-if="pagination.itemCount > 0" :paginator="pagination" @update:paginator="onPaginatorUpdate" class="mt-4" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import Paginate from '@/components/Paginate.vue';
import api from '../../services/api';
import { useFilterStore } from '../../stores/filterStore';

const filterStore = useFilterStore();
const PAGE_KEY = 'checkRuns';

const searchText = ref('');
let searchTimeout = null;

const pagination = reactive({
  itemCount: 0,
  queryParams: {
    pageNumber: 1,
    pageSize: 50,
  },
  results: [],
});

// Restore saved filters
const saved = filterStore.getFilters(PAGE_KEY);
if (saved) {
  if (saved.searchText) searchText.value = saved.searchText;
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber;
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize;
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    searchText: searchText.value,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
  });
};

// --- Methods ---
const fetchData = async () => {
  try {
    const params = {
      page: pagination.queryParams.pageNumber,
      pageSize: pagination.queryParams.pageSize,
    };
    if (searchText.value) params.search = searchText.value;
    const response = await api.get('ap-check-runs', { params });
    const data = response.data;
    pagination.results = (data.items || []).map(r => ({
      ...r,
      bankCheckingAccount: { description: r.bankCheckingAccountDescription || r.bankCheckingAccountNumber },
      controlAccount: { description: r.controlAccountDescription || r.controlAccountNumber },
      batchInfo: { transactionDate: r.postingDate, posted: r.posted },
    }));
    pagination.itemCount = data.totalCount || 0;
    saveFilters();
  } catch (err) {
    console.error('Failed to fetch check runs:', err);
  }
};

const onPaginatorUpdate = (updated) => {
  const oldPage = pagination.queryParams.pageNumber;
  const oldSize = pagination.queryParams.pageSize;
  Object.assign(pagination, updated);
  if (pagination.queryParams.pageNumber !== oldPage || pagination.queryParams.pageSize !== oldSize) {
    if (pagination.queryParams.pageSize !== oldSize) pagination.queryParams.pageNumber = 1;
    fetchData();
  }
};

const deleteCheckRun = async (checkRunId) => {
  if (!window.confirm(`Are you sure you want to delete check run #${checkRunId}? This action cannot be undone.`)) return;
  try {
    await api.delete(`ap-check-runs/${checkRunId}`);
    await fetchData();
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to delete check run');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

watch(searchText, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.queryParams.pageNumber = 1;
    fetchData();
  }, 350);
});

onMounted(fetchData);
onBeforeUnmount(saveFilters);
</script>

<style scoped>
.dashhead {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}
.page-title h4 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider, ">") !important;
  font-weight: bold;
  color: #495057;
}
.table th {
  cursor: pointer;
}
</style>
