<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item active" aria-current="page">Chart of Accounts</li>
        </ol>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="flex-grow-1">
                <button class="btn btn-primary btn-sm" @click="openTrialBalanceModal"><i class="ri-download-2-line align-bottom"></i> Trial Balance</button>
                <button class="btn btn-secondary btn-sm ms-1" @click="openLockPeriodModal"><i class="ri-calendar-check-line align-bottom"></i> Lock Period</button>
                <button class="btn btn-secondary btn-sm ms-1" v-if="hasPermission('comptroller')" @click="openUnlockPeriodModal"><i class="ri-calendar-todo-line align-bottom"></i> Unlock Period</button>
                <button class="btn btn-info btn-sm ms-1" v-if="hasPermission('comptroller')" @click="moveIncomeBalancesToRetainedEarnings"><i class="ri-arrow-right-circle-line align-bottom"></i> Move Balances</button>
              </div>
              <div class="flex-shrink-0 d-flex align-items-center gap-2">
                 <FiscalYearChooser v-model="selectedFiscalYear" :fiscal-year-choices="fiscalYearChoices" />
                <div style="width: 200px;">
                  <ClearableSearchInput v-model="pagination.queryParams.searchText" placeholder="Search accounts..." />
                </div>
                <router-link class="btn btn-info btn-sm" :to="{ name: 'chart-of-accounts-print', query: { listParams: getUnpagedQueryParamsString() } }" target="_blank">
                  <i class="ri-printer-line align-bottom"></i> Print
                </router-link>
                <button class="btn btn-primary btn-sm" v-if="hasPermission('comptroller') && !adding" @click="startAdding">
                  <i class="ri-add-line align-bottom"></i> Add Account
                </button>
                <button class="btn btn-danger btn-sm" v-if="adding" @click="stopAdding">
                  <i class="ri-close-line align-bottom"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row" v-if="adding">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Create New Account</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="createAccount">
              <div class="row">
                <div class="col-md-3">
                  <div class="mb-3">
                    <label for="accountNumber" class="form-label">Account Number</label>
                    <input type="text" class="form-control" id="accountNumber" v-model="newAccount.accountNumber" required maxlength="8" />
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="mb-3">
                    <label for="typeChoice" class="form-label">Account Type</label>
                    <select class="form-select" id="typeChoice" v-model="newAccount.accountTypeId">
                      <option v-for="type in accountTypeChoices" :key="type.accountTypeId" :value="type.accountTypeId">
                        {{ type.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <input type="text" class="form-control" id="description" v-model="newAccount.description" />
                  </div>
                </div>
              </div>
              <div class="text-end">
                <button type="button" class="btn btn-light me-2" @click="stopAdding">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <FilterTag label="Search text" v-model="pagination.queryParams.searchText" />

    

    <div class="card" v-if="pagination.results.length">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle">
      <thead>
        <tr>
          <th style="width: 15%" @click="sortBy('accountnumber')">Account Number</th>
          <th style="width: 10%" @click="sortBy('accountTypeId')">Account Type</th>
          <th style="width: 15%; text-align:center">Account Locks</th>
          <th style="width: 60%" @click="sortBy('description')">Description</th>
          <th style="width: 10%" @click="sortBy('modified')">Modified</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in pagination.results" :key="account.accountNumber">
          <td>
            <router-link :to="{ name: 'accounting-detail', params: { fiscalYear: account.fiscalYear, accountNumber: account.accountNumber } }">
              {{ account.accountNumber }}
            </router-link>
          </td>
          <td>
            <EditCard
              :ref="el => { if (el) editCardRefs[account.id] = el }"
              :model-value="account"
              @save="(updatedAccount) => handleAccountUpdate(account, updatedAccount, '')"
              :permission-denied="!hasPermission('CanEditChartOfAccounts')"
              tooltip-text="Edit account details"
            >
              <template #summary>
                {{ getAccountTypeName(account.accountTypeId) }}
              </template>
              <template #form="{ model }">
                <select v-model="model.accountTypeId" class="form-select form-select-sm">
                  <option v-for="type in accountTypeChoices" :key="type.accountTypeId" :value="type.accountTypeId">
                    {{ type.name }}
                  </option>
                </select>
              </template>
            </EditCard>
          </td>
          <td style="text-align:center;">
            <span class="badge" :class="account.locked ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'" style="cursor: pointer;"
                  @click="account.locked ? unlockAccount(account) : lockAccount(account)"
                  :title="account.locked ? 'Click to unlock' : 'Click to lock'">
              <i :class="account.locked ? 'ri-lock-fill' : 'ri-lock-unlock-fill'" class="align-middle"></i>
              {{ account.locked ? 'Locked' : 'Unlocked' }}
            </span>
          </td>
          <td>
            <EditCard
              :ref="el => { if (el) editCardRefs[account.id + '_desc'] = el }"
              :model-value="account"
              @save="(updatedAccount) => handleAccountUpdate(account, updatedAccount, '_desc')"
              :permission-denied="!hasPermission('CanEditChartOfAccounts')"
              tooltip-text="Edit account details"
            >
              <template #summary>
                {{ account.description }}
              </template>
              <template #form="{ model }">
                <input type="text" v-model="model.description" class="form-control form-control-sm" />
              </template>
            </EditCard>
          </td>
          <td>{{ formatMoment(account.modified) }}</td>
        </tr>
      </tbody>
    </table>
        </div>
        <div v-if="!pagination.results.length" class="text-center my-4">
          <p class="text-muted fs-15">No accounts found</p>
        </div>
        <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import FiscalYearChooser from '../../components/FiscalYearChooser.vue';
import EditCard from '../../components/EditCard.vue';
import FilterTag from '../../components/FilterTag.vue';
import ClearableSearchInput from '../../components/ClearableSearchInput.vue';
import Paginate from '../../components/Paginate.vue';

const editCardRefs = ref({});

// --- Reactive State ---
const adding = ref(false);
const newAccount = ref({
  accountNumber: '',
  accountTypeId: null,
  description: '',
});

const pagination = reactive({
  results: [
    // Sample data - replace with API call
    { accountNumber: '10100', accountTypeId: 1, description: 'Cash in Bank', modified: new Date(), locked: false, fiscalYear: 2024 },
    { accountNumber: '40100', accountTypeId: 4, description: 'Sales Revenue', modified: new Date(), locked: true, fiscalYear: 2024 },
  ],
  queryParams: {
    searchText: '',
    orderBy: 'accountnumber',
    orderDesc: false,
  },
});

const accountTypeChoices = ref([
  // Sample data - replace with API call
  { accountTypeId: 1, name: 'Asset' },
  { accountTypeId: 2, name: 'Liability' },
  { accountTypeId: 3, name: 'Equity' },
  { accountTypeId: 4, name: 'Revenue' },
  { accountTypeId: 5, name: 'Expense' },
]);

const currentYear = new Date().getFullYear();
const selectedFiscalYear = ref(currentYear);
const fiscalYearChoices = ref([
  { value: currentYear + 1, text: (currentYear + 1).toString() },
  { value: currentYear, text: currentYear.toString() },
  { value: currentYear - 1, text: (currentYear - 1).toString() },
]);

// --- Methods ---

// Permission check placeholder
const hasPermission = (role) => {
  // Replace with actual permission logic (e.g., from a user store)
  const userRoles = ['accounting', 'comptroller']; // Mock roles
  return userRoles.includes(role);
};

const openTrialBalanceModal = () => alert('Open Trial Balance Modal');
const openLockPeriodModal = () => alert('Open Lock Period Modal');
const openUnlockPeriodModal = () => alert('Open Unlock Period Modal');
const moveIncomeBalancesToRetainedEarnings = () => alert('Move Balances to Retained Earnings');

const getUnpagedQueryParamsString = () => {
  // Logic to serialize query params for the print link
  return JSON.stringify(pagination.queryParams);
};

const startAdding = () => {
  adding.value = true;
};

const stopAdding = () => {
  adding.value = false;
  // Reset form
  newAccount.value = { accountNumber: '', accountTypeId: null, description: '' };
};

const createAccount = () => {
  if (!newAccount.value.accountNumber) {
    alert('Account number is required.');
    return;
  }
  console.log('Creating account:', newAccount.value);
  // Add API call logic here
  stopAdding(); // Close form on successful creation
};

const sortBy = (field) => {
  if (pagination.queryParams.orderBy === field) {
    pagination.queryParams.orderDesc = !pagination.queryParams.orderDesc;
  } else {
    pagination.queryParams.orderBy = field;
    pagination.queryParams.orderDesc = false;
  }
  // Add logic to re-fetch data from API with new sort order
  console.log(`Sorting by ${field}, descending: ${pagination.queryParams.orderDesc}`);
};

const getAccountTypeName = (typeId) => {
  const type = accountTypeChoices.value.find(t => t.accountTypeId === typeId);
  return type ? type.name : 'Unknown';
};

const lockAccount = (account) => {
  console.log('Locking account:', account.accountNumber);
  // Add API call logic here
  account.locked = true; // Optimistic update
};

const unlockAccount = (account) => {
  console.log('Unlocking account:', account.accountNumber);
  // Add API call logic here
  account.locked = false; // Optimistic update
};

const formatMoment = (date) => {
  // Replace with a proper date formatting library like date-fns or dayjs
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

const handleAccountUpdate = async (originalAccount, updatedAccountData, refSuffix = '') => {
  console.log('Saving account:', updatedAccountData);
  // --- API Call Placeholder ---
  // In a real app, you would make an API call here:
  // try {
  //   const response = await api.updateAccount(originalAccount.id, updatedAccountData);
  //   Object.assign(originalAccount, response.data);
  //   editCardRefs.value[originalAccount.id + refSuffix]?.finishEditing();
  // } catch (error) {
  //   console.error('Failed to update account:', error);
  // }

  // --- Mock Success for Demonstration ---
  // Merge the updated data into the original account object.
  Object.assign(originalAccount, updatedAccountData);

  // Find the correct EditCard instance using its ref and call finishEditing to close the form.
  const refKey = originalAccount.id + refSuffix;
  if (editCardRefs.value[refKey]) {
    editCardRefs.value[refKey].finishEditing();
  } else {
    // Fallback for the other ref if one isn't explicitly provided
    const fallbackRefKey = originalAccount.id + (refSuffix === '' ? '_desc' : '');
    if (editCardRefs.value[fallbackRefKey]) {
       editCardRefs.value[fallbackRefKey].finishEditing();
    }
  }
};

</script>

<style scoped>

</style>
