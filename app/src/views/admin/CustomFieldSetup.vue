<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Custom Fields</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Admin</li>
            <li class="breadcrumb-item active" aria-current="page">Custom Fields</li>
          </ol>
        </div>
        <div>
          <button class="btn btn-primary btn-sm" @click="openCreate">
            <i class="ri-add-line me-1"></i>New Field
          </button>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="card">
      <div class="card-body">
        <div class="row g-2 align-items-center">
          <div class="col-md-4">
            <label class="form-label mb-1">Entity Type</label>
            <select v-model="entityTypeFilter" class="form-select form-select-sm">
              <option value="">All</option>
              <option v-for="t in entityTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="col-md-8 text-muted small align-self-end">
            Custom fields are user-defined attributes attached to an entity type
            (e.g., Vendor). Values are entered on each entity's detail page.
          </div>
        </div>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="text-center my-4">
      <span class="spinner-border text-primary"></span>
    </div>
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <!-- Definitions table -->
    <div v-else class="card">
      <div class="card-body p-0">
        <div class="table-responsive" v-if="filteredDefs.length">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Entity Type</th>
                <th>Field Name</th>
                <th>Display Name</th>
                <th>Data Type</th>
                <th class="text-center">Required</th>
                <th class="text-center">Active</th>
                <th class="text-center">Order</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in filteredDefs" :key="d.customFieldId">
                <td><span class="badge bg-info-subtle text-info">{{ d.entityType }}</span></td>
                <td><code>{{ d.fieldName }}</code></td>
                <td>{{ d.displayName }}</td>
                <td>{{ d.dataType }}</td>
                <td class="text-center">
                  <span v-if="d.isRequired" class="badge bg-warning-subtle text-warning">Required</span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td class="text-center">
                  <span class="badge" :class="d.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'">
                    {{ d.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-center">{{ d.displayOrder }}</td>
                <td class="text-end">
                  <button class="btn btn-soft-primary btn-sm me-1" @click="openEdit(d)">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="btn btn-soft-danger btn-sm" @click="confirmDelete(d)">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-4 text-center text-muted">
          No custom fields defined. Click <strong>New Field</strong> to create one.
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showModal" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ form.customFieldId ? 'Edit Custom Field' : 'New Custom Field' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>

            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Entity Type <span class="text-danger">*</span></label>
                <select
                  v-model="form.entityType"
                  class="form-select"
                  :disabled="!!form.customFieldId"
                >
                  <option value="">— Select —</option>
                  <option v-for="t in entityTypes" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Field Name <span class="text-danger">*</span></label>
                <input
                  type="text"
                  v-model="form.fieldName"
                  class="form-control"
                  placeholder="e.g., PreferredVendor"
                  :disabled="!!form.customFieldId"
                />
                <small class="text-muted">Letters, digits, underscore. Starts with a letter. Cannot be changed.</small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Display Name <span class="text-danger">*</span></label>
                <input type="text" v-model="form.displayName" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Data Type <span class="text-danger">*</span></label>
                <select v-model="form.dataType" class="form-select">
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Dropdown">Dropdown</option>
                  <option value="Boolean">Boolean (Yes/No)</option>
                </select>
              </div>

              <div v-if="form.dataType === 'Dropdown'" class="col-12">
                <label class="form-label">Dropdown Options <span class="text-danger">*</span></label>
                <textarea
                  v-model="dropdownOptionsText"
                  class="form-control"
                  rows="3"
                  placeholder="One option per line"
                ></textarea>
                <small class="text-muted">One per line — saved as JSON array.</small>
              </div>

              <div class="col-md-4">
                <label class="form-label">Default Value</label>
                <input type="text" v-model="form.defaultValue" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Display Order</label>
                <input type="number" v-model.number="form.displayOrder" class="form-control" />
              </div>
              <div class="col-md-4 d-flex align-items-end gap-3">
                <div class="form-check">
                  <input type="checkbox" v-model="form.isRequired" class="form-check-input" id="cf-req" />
                  <label for="cf-req" class="form-check-label">Required</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" v-model="form.isActive" class="form-check-input" id="cf-active" />
                  <label for="cf-active" class="form-check-label">Active</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeModal" :disabled="saving">Cancel</button>
            <button class="btn btn-primary" @click="save" :disabled="saving">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>Saving...</span>
              <span v-else>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteTarget" class="modal fade show d-block" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">Delete Custom Field</h6>
            <button type="button" class="btn-close" @click="deleteTarget = null"></button>
          </div>
          <div class="modal-body">
            <p>Delete <strong>{{ deleteTarget.displayName }}</strong>?</p>
            <p class="small text-danger mb-0">
              All stored values for this field will also be removed.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api'

const entityTypes = ['Vendor']

const definitions = ref([])
const loading = ref(false)
const error = ref(null)
const entityTypeFilter = ref('')

const showModal = ref(false)
const form = ref(emptyForm())
const dropdownOptionsText = ref('')
const saving = ref(false)
const modalError = ref(null)

const deleteTarget = ref(null)

function emptyForm() {
  return {
    customFieldId: null,
    entityType: '',
    fieldName: '',
    displayName: '',
    dataType: 'Text',
    optionsJson: null,
    isRequired: false,
    defaultValue: '',
    displayOrder: 100,
    isActive: true
  }
}

const filteredDefs = computed(() => {
  if (!entityTypeFilter.value) return definitions.value
  return definitions.value.filter(d => d.entityType === entityTypeFilter.value)
})

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('custom-fields/definitions')
    definitions.value = res.data || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load custom fields'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.value = emptyForm()
  if (entityTypeFilter.value) form.value.entityType = entityTypeFilter.value
  dropdownOptionsText.value = ''
  modalError.value = null
  showModal.value = true
}

const openEdit = (d) => {
  form.value = { ...d }
  try {
    const opts = d.optionsJson ? JSON.parse(d.optionsJson) : []
    dropdownOptionsText.value = Array.isArray(opts) ? opts.join('\n') : ''
  } catch {
    dropdownOptionsText.value = ''
  }
  modalError.value = null
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = emptyForm()
  modalError.value = null
}

const save = async () => {
  modalError.value = null

  if (form.value.dataType === 'Dropdown') {
    const opts = dropdownOptionsText.value
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    if (opts.length === 0) {
      modalError.value = 'Dropdown requires at least one option'
      return
    }
    form.value.optionsJson = JSON.stringify(opts)
  } else {
    form.value.optionsJson = null
  }

  saving.value = true
  try {
    await api.post('custom-fields/definitions', form.value)
    showModal.value = false
    await load()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (d) => { deleteTarget.value = d }

const doDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`custom-fields/definitions/${deleteTarget.value.customFieldId}`)
    deleteTarget.value = null
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
    deleteTarget.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.modal {
  overflow-y: auto;
}
</style>
