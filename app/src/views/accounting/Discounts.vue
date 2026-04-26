<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Discounts</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active" aria-current="page">Discounts</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <div style="width: 220px;">
            <input type="text" class="form-control form-control-sm" v-model="searchText" placeholder="Search discounts..." @input="debouncedLoad" />
          </div>
          <button class="btn btn-primary btn-sm" @click="showAdd = !showAdd">
            <i class="ri-add-line me-1"></i>{{ showAdd ? 'Cancel' : 'Add Discount' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Form -->
    <div v-if="showAdd" class="card">
      <div class="card-header"><h5 class="card-title mb-0">New Discount</h5></div>
      <div class="card-body">
        <form @submit.prevent="createDiscount" class="row g-3 align-items-end">
          <div class="col-md-2">
            <label class="form-label">Code</label>
            <input type="text" class="form-control form-control-sm" v-model="newDiscount.discountCode" required maxlength="20" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Description</label>
            <input type="text" class="form-control form-control-sm" v-model="newDiscount.description" maxlength="80" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Percentage</label>
            <input type="number" step="0.01" class="form-control form-control-sm" v-model.number="newDiscount.percentage" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Within Days</label>
            <input type="number" class="form-control form-control-sm" v-model.number="newDiscount.withinDays" />
          </div>
          <div class="col-md-1">
            <label class="form-label">Following Mo.</label>
            <div class="form-check mt-1">
              <input class="form-check-input" type="checkbox" v-model="newDiscount.followingMonth" />
            </div>
          </div>
          <div class="col-md-2">
            <button type="submit" class="btn btn-success btn-sm" :disabled="saving">
              <i class="ri-check-line me-1"></i>Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Discount List -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-nowrap align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th class="text-end">Percentage</th>
                <th class="text-center">Within Days</th>
                <th class="text-center">Following Month</th>
                <th style="width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in discounts" :key="d.discountCode">
                <template v-if="editing === d.discountCode">
                  <td><strong>{{ d.discountCode }}</strong></td>
                  <td><input type="text" class="form-control form-control-sm" v-model="editForm.description" /></td>
                  <td><input type="number" step="0.01" class="form-control form-control-sm text-end" v-model.number="editForm.percentage" /></td>
                  <td><input type="number" class="form-control form-control-sm text-center" v-model.number="editForm.withinDays" /></td>
                  <td class="text-center"><input class="form-check-input" type="checkbox" v-model="editForm.followingMonth" /></td>
                  <td>
                    <button class="btn btn-success btn-sm me-1" @click="saveEdit(d)" :disabled="saving"><i class="ri-check-line"></i></button>
                    <button class="btn btn-secondary btn-sm" @click="editing = null"><i class="ri-close-line"></i></button>
                  </td>
                </template>
                <template v-else>
                  <td><strong>{{ d.discountCode }}</strong></td>
                  <td>{{ d.description }}</td>
                  <td class="text-end">{{ d.percentage }}%</td>
                  <td class="text-center">{{ d.withinDays }}</td>
                  <td class="text-center">{{ d.followingMonth ? 'Yes' : 'No' }}</td>
                  <td>
                    <button class="btn btn-outline-primary btn-sm" @click="startEdit(d)"><i class="ri-pencil-line"></i></button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!discounts.length" class="text-center my-4">
          <p class="text-muted fs-15">No discounts found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const discounts = ref([])
const searchText = ref('')
const showAdd = ref(false)
const editing = ref(null)

const newDiscount = reactive({ discountCode: '', description: '', percentage: 0, withinDays: 0, followingMonth: false })
const editForm = reactive({ description: '', percentage: 0, withinDays: 0, followingMonth: false })

let debounceTimer = null
const debouncedLoad = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadDiscounts, 300)
}

const loadDiscounts = async () => {
  loading.value = true
  error.value = null
  try {
    const params = searchText.value ? `?searchText=${encodeURIComponent(searchText.value)}` : ''
    const response = await api.get(`discounts${params}`)
    discounts.value = response.data || []
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load discounts'
  } finally {
    loading.value = false
  }
}

const createDiscount = async () => {
  saving.value = true
  try {
    await api.post('discounts', { ...newDiscount })
    Object.assign(newDiscount, { discountCode: '', description: '', percentage: 0, withinDays: 0, followingMonth: false })
    showAdd.value = false
    await loadDiscounts()
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to create discount')
  } finally {
    saving.value = false
  }
}

const startEdit = (d) => {
  editing.value = d.discountCode
  Object.assign(editForm, { description: d.description, percentage: d.percentage, withinDays: d.withinDays, followingMonth: d.followingMonth })
}

const saveEdit = async (d) => {
  saving.value = true
  try {
    await api.put(`discounts/${d.discountCode}`, { ...editForm })
    editing.value = null
    await loadDiscounts()
  } catch (err) {
    alert(err.response?.data || err.message || 'Failed to update discount')
  } finally {
    saving.value = false
  }
}

onMounted(loadDiscounts)
</script>

<style scoped>
</style>
