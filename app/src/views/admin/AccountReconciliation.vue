<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 fs-15">
          <li class="breadcrumb-item"><a href="/"><i class="ri-home-fill"></i></a></li>
          <li class="breadcrumb-item"><a href="javascript: void(0);">Admin</a></li>
          <li class="breadcrumb-item active fw-bold">Account Reconciliation</li>
        </ol>
      </div>
    </div>

    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="flex-grow-1">
              </div>
              <div class="flex-shrink-0 d-flex align-items-center gap-2">
                 <FiscalYearChooser v-model="selectedFiscalYear" :fiscal-year-choices="fiscalYearChoices" />
                <div style="width: 200px;">
                  <ClearableSearchInput v-model="pagination.queryParams.searchText" placeholder="Search accounts..." />
                </div>
              </div>
            </div>
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
          <th style="width: 10%; text-align:center">On/Off</th>
          <th style="width: 10%; text-align:center">Cash Account?</th>
          <th style="width: 10%">Link</th>
          <th style="width: 15%; text-align:center">CFO Restriction</th>
          <th style="width: 35%" @click="sortBy('description')">Description</th>
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
            <span class="badge" :class="account.enabled ? 'bg-success-subtle text-success' : 'bg-secondary'" style="cursor: pointer;"
                  @click="toggleAccountEnabled(account)"
                  :title="account.enabled ? 'Click to turn off' : 'Click to turn on'">
              <i :class="account.enabled ? 'ri-toggle-line' : 'ri-toggle-fill'" class="align-middle"></i>
              {{ account.enabled ? 'On' : 'Off' }}
            </span>
          </td>
          <td style="text-align:center;">
            <span class="badge" :class="account.isCashAccount ? 'bg-info-subtle text-info' : 'bg-light text-muted'" style="cursor: pointer;"
                  @click="toggleCashAccount(account)"
                  :title="account.isCashAccount ? 'Click to unset cash account' : 'Click to set as cash account'">
              {{ account.isCashAccount ? 'Yes' : 'No' }}
            </span>
          </td>
          <td>
            <EditCard
              :ref="el => { if (el) editCardRefs[account.id + '_link'] = el }"
              :model-value="account"
              @save="(updatedAccount) => handleAccountUpdate(account, updatedAccount, '_link')"
              :permission-denied="!hasPermission('CanEditChartOfAccounts')"
              tooltip-text="Edit account link"
            >
              <template #summary>
                {{ account.link || '-' }}
              </template>
              <template #form="{ model }">
                <input type="text" v-model="model.link" class="form-control form-control-sm" placeholder="Enter link (e.g., related account)" />
              </template>
            </EditCard>
          </td>
          <td style="text-align:center;">
            <span class="badge" :class="account.cfoRestricted ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'" style="cursor: pointer;"
                  @click="toggleCfoRestriction(account)"
                  :title="account.cfoRestricted ? 'Click to remove restriction' : 'Click to restrict'">
              {{ account.cfoRestricted ? 'Restricted' : 'Open' }}
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

const pagination = reactive({
  results: [
    // Sample data - replace with API call
    { id: '10100', accountNumber: '10100', accountTypeId: 1, description: 'Cash in Bank', enabled: true, isCashAccount: true, link: '', cfoRestricted: false, fiscalYear: 2024 },
    { id: '40100', accountNumber: '40100', accountTypeId: 4, description: 'Sales Revenue', enabled: true, isCashAccount: false, link: '', cfoRestricted: false, fiscalYear: 2024 },
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

// Removed button-related methods (trial balance, lock/unlock period, move balances, print, add account)

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

const toggleAccountEnabled = (account) => {
  const next = !account.enabled;
  console.log(next ? 'Enabling account:' : 'Disabling account:', account.accountNumber);
  // Add API call logic here
  account.enabled = next; // Optimistic update
};

const toggleCashAccount = (account) => {
  const next = !account.isCashAccount;
  console.log(next ? 'Setting cash account:' : 'Unsetting cash account:', account.accountNumber);
  // Add API call logic here
  account.isCashAccount = next; // Optimistic update
};

const toggleCfoRestriction = (account) => {
  const next = !account.cfoRestricted;
  console.log(next ? 'Applying CFO restriction to:' : 'Removing CFO restriction from:', account.accountNumber);
  // Add API call logic here
  account.cfoRestricted = next; // Optimistic update
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
.breadcrumb-item + .breadcrumb-item::before {
  content: var(--bs-breadcrumb-divider, ">") !important;
  font-weight: bold;
  color: #495057;
}
</style>
