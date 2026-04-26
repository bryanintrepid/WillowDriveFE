<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item active" aria-current="page">Account Reconciliation</li>
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
              <div class="flex-shrink-0 d-flex align-items-center gap-2 flex-wrap">
                <div style="width: 140px;">
                  <select class="form-select form-select-sm" v-model="selectedMonth">
                    <option v-for="m in monthChoices" :key="m.value" :value="m.value">{{ m.text }}</option>
                  </select>
                </div>
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
          <th style="width: 17%" class="text-end">Beginning Balance</th>
          <th style="width: 17%" class="text-end">Debits</th>
          <th style="width: 17%" class="text-end">Credits</th>
          <th style="width: 17%" class="text-end">Ending Balance</th>
          <th style="width: 17%">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in filteredResults" :key="account.accountNumber">
          <td>{{ account.accountNumber }}</td>
          <td class="text-end">{{ formatCurrency(account.beginningBalance) }}</td>
          <td class="text-end">{{ formatCurrency(account.debits) }}</td>
          <td class="text-end">{{ formatCurrency(account.credits) }}</td>
          <td class="text-end">{{ formatCurrency(account.endingBalance ?? (account.beginningBalance + account.debits - account.credits)) }}</td>
          <td>
            <span :class="['badge', statusBadgeClass(account.status)]">{{ account.status }}</span>
          </td>
        </tr>
      </tbody>
    </table>
        </div>
        <div v-if="!filteredResults.length" class="text-center my-4">
          <p class="text-muted fs-15">No accounts found</p>
        </div>
        <Paginate :paginator="pagination" @update:paginator="Object.assign(pagination, $event)" v-if="pagination.results.length > 0" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute } from 'vue-router';
import FiscalYearChooser from '../../components/FiscalYearChooser.vue';
import EditCard from '../../components/EditCard.vue';
import FilterTag from '../../components/FilterTag.vue';
import ClearableSearchInput from '../../components/ClearableSearchInput.vue';
import Paginate from '../../components/Paginate.vue';
import api from '../../services/api';
import { useFilterStore } from '../../stores/filterStore';

const filterStore = useFilterStore();
const PAGE_KEY = 'accountReconciliation';

const editCardRefs = ref({});

// --- Reactive State ---

const pagination = reactive({
  results: [],
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
const fiscalYearChoices = ref(
  Array.from({ length: 9 }, (_, i) => {
    const y = currentYear - 5 + i;
    return { value: y, text: y.toString() };
  })
);

// Month selector (Jan-Dec)
const monthChoices = ref([
  { value: 1, text: 'Jan' },
  { value: 2, text: 'Feb' },
  { value: 3, text: 'Mar' },
  { value: 4, text: 'Apr' },
  { value: 5, text: 'May' },
  { value: 6, text: 'Jun' },
  { value: 7, text: 'Jul' },
  { value: 8, text: 'Aug' },
  { value: 9, text: 'Sep' },
  { value: 10, text: 'Oct' },
  { value: 11, text: 'Nov' },
  { value: 12, text: 'Dec' },
]);
const selectedMonth = ref(new Date().getMonth() + 1);

// Restore saved filters
const savedFilters = filterStore.getFilters(PAGE_KEY);
if (savedFilters) {
  if (savedFilters.fiscalYear) selectedFiscalYear.value = savedFilters.fiscalYear;
  if (savedFilters.month) selectedMonth.value = savedFilters.month;
  if (savedFilters.searchText) pagination.queryParams.searchText = savedFilters.searchText;
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    fiscalYear: selectedFiscalYear.value,
    month: selectedMonth.value,
    searchText: pagination.queryParams.searchText,
  });
};

// Routing
const route = useRoute();

const reloadData = async () => {
  try {
    const params = {
      fiscalYear: selectedFiscalYear.value,
      period: selectedMonth.value,
    };
    if (pagination.queryParams.searchText) params.searchText = pagination.queryParams.searchText;
    const response = await api.get('account-reconciliation', { params });
    pagination.results = (response.data || []).map(r => ({
      ...r,
      id: r.accountNumber,
      enabled: true,
      isCashAccount: false,
      link: '',
      cfoRestricted: false,
      fiscalYear: selectedFiscalYear.value,
    }));
    saveFilters();
  } catch (err) {
    console.error('Failed to fetch reconciliation data:', err);
  }
};

onMounted(() => {
  // Initialize FY from route if provided
  if (route.params.fiscalYear) {
    const fy = parseInt(route.params.fiscalYear, 10);
    if (!isNaN(fy)) selectedFiscalYear.value = fy;
  }
  reloadData();
});

// Watchers to trigger reloads
watch(() => selectedFiscalYear.value, () => reloadData());
watch(() => selectedMonth.value, () => reloadData());

onBeforeUnmount(saveFilters);

// (Removed currentAccount; header no longer shows per-account badges)

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

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatCurrency = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val || 0);
  return currencyFormatter.format(isNaN(num) ? 0 : num);
};

// Map status to badge classes
const statusBadgeClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'not started':
      return 'bg-danger';
    case 'in progress':
      return 'bg-warning text-dark';
    case 'completed':
      return 'bg-info text-dark';
    case 'approved':
      return 'bg-success';
    default:
      return 'bg-light text-muted';
  }
};

// Filter results by search text (account number or description)
const filteredResults = computed(() => {
  const q = (pagination.queryParams.searchText || '').toLowerCase().trim();
  if (!q) return pagination.results;
  return pagination.results.filter(a => {
    const num = String(a.accountNumber || '').toLowerCase();
    const desc = String(a.description || '').toLowerCase();
    return num.includes(q) || desc.includes(q);
  });
});

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
