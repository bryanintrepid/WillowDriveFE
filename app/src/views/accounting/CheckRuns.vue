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
        <div class="dashhead-toolbar">
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
                    <th @click="sortBy('checkrunid')">Check Run #</th>
                    <th @click="sortBy('paymentdate')">Payment Date</th>
                    <th @click="sortBy('checkingaccountname')">Checking Account</th>
                    <th @click="sortBy('controlaccountname')">Control Account</th>
                    <th @click="sortBy('postingdate')">Posting Date</th>
                    <th @click="sortBy('creator')">Created By</th>
                    <th @click="sortBy('created')">Created On</th>
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
            <Paginate v-if="pagination.results.length" :pagination="pagination" @page-changed="handlePageChange" class="mt-4" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import Paginate from '@/components/Paginate.vue';

const queryParams = reactive({
  orderBy: 'created',
  orderDesc: true,
});

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  results: [
    {
      apCheckRunId: 101,
      paymentDate: '2023-10-26T00:00:00Z',
      bankCheckingAccount: { description: 'Main Checking' },
      controlAccount: { description: 'Accounts Payable' },
      batchInfo: { transactionDate: '2023-10-27T00:00:00Z', posted: false },
      creator: 'John Doe',
      dateCreated: '2023-10-26T14:30:00Z',
    },
    {
      apCheckRunId: 102,
      paymentDate: '2023-11-01T00:00:00Z',
      bankCheckingAccount: { description: 'Operating Account' },
      controlAccount: { description: 'Accounts Payable' },
      batchInfo: { transactionDate: '2023-11-02T00:00:00Z', posted: true },
      creator: 'Jane Smith',
      dateCreated: '2023-11-01T10:00:00Z',
    },
  ],
});

// --- Methods ---
const sortBy = (field) => {
  if (queryParams.orderBy === field) {
    queryParams.orderDesc = !queryParams.orderDesc;
  } else {
    queryParams.orderBy = field;
    queryParams.orderDesc = false;
  }
  // In a real app, you would fetch data here based on the new sort order.
  console.log(`Sorting by ${field}, descending: ${queryParams.orderDesc}`);
};

const deleteCheckRun = (checkRunId) => {
  if (window.confirm(`Are you sure you want to delete check run #${checkRunId}? This action cannot be undone.`)) {
    // In a real app, you would make an API call to delete the check run.
    console.log('Deleting check run:', checkRunId);
    pagination.results = pagination.results.filter(r => r.apCheckRunId !== checkRunId);
  }
};

const handlePageChange = (page) => {
  pagination.currentPage = page;
  // In a real app, you would fetch data for the new page.
  console.log('Fetching data for page:', page);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
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
