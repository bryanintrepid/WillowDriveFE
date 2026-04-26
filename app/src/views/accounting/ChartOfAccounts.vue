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
                <button class="btn btn-outline-secondary btn-sm ms-1" @click="expandAll" title="Expand All"><i class="ri-arrow-down-s-fill align-bottom"></i> Expand All</button>
                <button class="btn btn-outline-secondary btn-sm ms-1" @click="collapseAll" title="Collapse All"><i class="ri-arrow-right-s-fill align-bottom"></i> Collapse All</button>
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

    

    <div class="card">
      <div class="card-body">
        <div v-if="!allAccounts.length && !loading" class="text-center my-4">
          <p class="text-muted fs-15">No accounts found for FY {{ selectedFiscalYear }}</p>
        </div>
        <div v-else-if="loading" class="text-center my-4">
          <p class="text-muted fs-15">Loading...</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-nowrap align-middle table-sm">
            <thead>
              <tr>
                <th style="width: 18%;">Account Number</th>
                <th style="width: 10%;">Account Type</th>
                <th style="width: 57%;">Description</th>
                <th style="width: 15%;">Modified</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in flattenedTree" :key="row.accountNumber">
                <tr v-if="row.visible" :class="{ 'fw-semibold': row.isRollup }">
                  <td>
                    <span :style="{ paddingLeft: (row.level * 20) + 'px' }" class="d-inline-flex align-items-center">
                      <button v-if="row.hasChildren" class="btn btn-sm btn-icon me-1 p-0" @click="toggleNode(row)" style="width: 18px; height: 18px;">
                        <i :class="row.expanded ? 'ri-arrow-down-s-fill' : 'ri-arrow-right-s-fill'" class="fs-14"></i>
                      </button>
                      <span v-else style="width: 18px; display: inline-block;" class="me-1"></span>
                      <router-link :to="{ name: 'accounting-detail', params: { fiscalYear: row.fiscalYear, accountNumber: row.accountNumber } }">
                        {{ row.accountNumber }}
                      </router-link>
                    </span>
                  </td>
                  <td>
                    <EditCard
                      :ref="el => { if (el) editCardRefs[row.accountNumber] = el }"
                      :model-value="row"
                      @save="(updated) => handleAccountUpdate(row, updated, '')"
                      :permission-denied="!hasPermission('CanEditChartOfAccounts')"
                      tooltip-text="Edit account type"
                    >
                      <template #summary>
                        {{ getAccountTypeName(row.accountTypeId) }}
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
                  <td>
                    <span :style="{ paddingLeft: (row.level * 20) + 'px' }">
                      <EditCard
                        :ref="el => { if (el) editCardRefs[row.accountNumber + '_desc'] = el }"
                        :model-value="row"
                        @save="(updated) => handleAccountUpdate(row, updated, '_desc')"
                        :permission-denied="!hasPermission('CanEditChartOfAccounts')"
                        tooltip-text="Edit description"
                      >
                        <template #summary>
                          {{ row.description }}
                        </template>
                        <template #form="{ model }">
                          <input type="text" v-model="model.description" class="form-control form-control-sm" />
                        </template>
                      </EditCard>
                    </span>
                  </td>
                  <td><small class="text-muted">{{ formatMoment(row.modified) }}</small></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div class="position-fixed top-0 end-0 p-3" style="z-index: 1080;">
      <div ref="toastEl" class="toast align-items-center border-0" :class="toastClass" role="alert">
        <div class="d-flex">
          <div class="toast-body text-white">{{ toastMessage }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { Toast } from 'bootstrap';
import FiscalYearChooser from '../../components/FiscalYearChooser.vue';
import EditCard from '../../components/EditCard.vue';
import FilterTag from '../../components/FilterTag.vue';
import ClearableSearchInput from '../../components/ClearableSearchInput.vue';
import Paginate from '../../components/Paginate.vue';
import api from '../../services/api';
import { useFilterStore } from '../../stores/filterStore';

const filterStore = useFilterStore();
const PAGE_KEY = 'chartOfAccounts';

const editCardRefs = ref({});
const allAccounts = ref([]);
const loading = ref(false);

// --- Reactive State ---
const adding = ref(false);
const newAccount = ref({
  accountNumber: '',
  accountTypeId: null,
  description: '',
});

const pagination = reactive({
  itemCount: 0,
  queryParams: {
    pageNumber: 1,
    pageSize: 50,
    searchText: '',
    orderBy: 'accountnumber',
    orderDesc: false,
  },
  results: [],
});

const accountTypeChoices = ref([
  { accountTypeId: 0, name: 'Asset' },
  { accountTypeId: 1, name: 'Liability' },
  { accountTypeId: 2, name: 'Equity' },
  { accountTypeId: 3, name: 'Revenue' },
  { accountTypeId: 4, name: 'Expense' },
]);

const currentYear = new Date().getFullYear();
// FY convention: FY 2026 = July 2025 - June 2026. If we're in July+ we're in the next FY.
const defaultFY = new Date().getMonth() >= 6 ? currentYear + 1 : currentYear;
const selectedFiscalYear = ref(defaultFY);
const fiscalYearChoices = ref(
  Array.from({ length: 9 }, (_, i) => {
    const y = currentYear - 5 + i;
    return { value: y, text: y.toString() };
  })
);

// Restore saved filters
const saved = filterStore.getFilters(PAGE_KEY);
if (saved) {
  if (saved.fiscalYear) selectedFiscalYear.value = saved.fiscalYear;
  if (saved.searchText) pagination.queryParams.searchText = saved.searchText;
  if (saved.pageNumber) pagination.queryParams.pageNumber = saved.pageNumber;
  if (saved.pageSize) pagination.queryParams.pageSize = saved.pageSize;
}

const saveFilters = () => {
  filterStore.saveFilters(PAGE_KEY, {
    fiscalYear: selectedFiscalYear.value,
    searchText: pagination.queryParams.searchText,
    pageNumber: pagination.queryParams.pageNumber,
    pageSize: pagination.queryParams.pageSize,
  });
};

// --- Tree ---
const flattenedTree = ref([]);
const expandedNodes = reactive(new Set());

const flattenTree = (nodes, level = 0) => {
  const result = [];
  for (const node of nodes) {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = expandedNodes.has(node.accountNumber);
    result.push({
      ...node,
      level,
      hasChildren,
      expanded,
      visible: true,
    });
    if (hasChildren && expanded) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  return result;
};

const rebuildFlatTree = () => {
  const q = (pagination.queryParams.searchText || '').toLowerCase().trim();
  if (q) {
    // When searching, show flat filtered results (no tree)
    const allFlat = flattenAllAccounts(allAccounts.value);
    flattenedTree.value = allFlat.filter(a =>
      a.accountNumber.toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q)
    ).map(a => ({ ...a, level: 0, hasChildren: false, expanded: false, visible: true }));
  } else {
    flattenedTree.value = flattenTree(allAccounts.value);
  }
};

const flattenAllAccounts = (nodes) => {
  const result = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children && node.children.length > 0) {
      result.push(...flattenAllAccounts(node.children));
    }
  }
  return result;
};

const toggleNode = (row) => {
  if (expandedNodes.has(row.accountNumber)) {
    expandedNodes.delete(row.accountNumber);
  } else {
    expandedNodes.add(row.accountNumber);
  }
  rebuildFlatTree();
};

const expandAll = () => {
  const addAll = (nodes) => {
    for (const n of nodes) {
      if (n.children && n.children.length > 0) {
        expandedNodes.add(n.accountNumber);
        addAll(n.children);
      }
    }
  };
  addAll(allAccounts.value);
  rebuildFlatTree();
};

const collapseAll = () => {
  expandedNodes.clear();
  rebuildFlatTree();
};

// --- Methods ---
const enrichNode = (a) => ({
  ...a,
  id: a.accountNumber,
  accountTypeId: a.type ?? 0,
  modified: a.dateModified,
  fiscalYear: a.fiscalYear || selectedFiscalYear.value,
  children: (a.children || []).map(enrichNode),
});

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await api.get('accounts', { params: { fiscalYear: selectedFiscalYear.value } });
    allAccounts.value = (response.data || []).map(enrichNode);
    expandAll();
    saveFilters();
  } catch (err) {
    console.error('Failed to fetch accounts:', err);
  } finally {
    loading.value = false;
  }
};

// Permission check placeholder
const hasPermission = (role) => {
  const userRoles = ['accounting', 'comptroller'];
  return userRoles.includes(role);
};

// --- Toast ---
const toastEl = ref(null);
const toastMessage = ref('');
const toastClass = ref('bg-success');
let toastInstance = null;
const showToast = (message, type = 'success') => {
  toastMessage.value = message;
  toastClass.value = type === 'success' ? 'bg-success' : 'bg-danger';
  if (toastEl.value) {
    if (!toastInstance) toastInstance = new Toast(toastEl.value, { delay: 3000 });
    toastInstance.show();
  }
};

const openTrialBalanceModal = () => alert('Open Trial Balance Modal');

const getUnpagedQueryParamsString = () => {
  return JSON.stringify({ ...pagination.queryParams, fiscalYear: selectedFiscalYear.value });
};

const startAdding = () => {
  adding.value = true;
};

const stopAdding = () => {
  adding.value = false;
  newAccount.value = { accountNumber: '', accountTypeId: null, description: '' };
};

const createAccount = () => {
  if (!newAccount.value.accountNumber) {
    alert('Account number is required.');
    return;
  }
  console.log('Creating account:', newAccount.value);
  stopAdding();
};


const getAccountTypeName = (typeId) => {
  const type = accountTypeChoices.value.find(t => t.accountTypeId === typeId);
  return type ? type.name : 'Unknown';
};


const formatMoment = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

const handleAccountUpdate = async (originalAccount, updatedAccountData, refSuffix = '') => {
  console.log('Saving account:', updatedAccountData);
  Object.assign(originalAccount, updatedAccountData);
  const refKey = originalAccount.id + refSuffix;
  if (editCardRefs.value[refKey]) {
    editCardRefs.value[refKey].finishEditing();
  } else {
    const fallbackRefKey = originalAccount.id + (refSuffix === '' ? '_desc' : '');
    if (editCardRefs.value[fallbackRefKey]) {
       editCardRefs.value[fallbackRefKey].finishEditing();
    }
  }
};

let searchTimeout = null;

watch(() => pagination.queryParams.searchText, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    rebuildFlatTree();
    saveFilters();
  }, 350);
});

watch(selectedFiscalYear, () => {
  pagination.queryParams.pageNumber = 1;
  fetchData();
});


onMounted(fetchData);

onBeforeUnmount(saveFilters);

</script>

<style scoped>

</style>
