<template>
  <div class="custom-fields-panel">
    <div v-if="loading" class="text-center py-3">
      <span class="spinner-border spinner-border-sm"></span> Loading custom fields...
    </div>

    <div v-else-if="error" class="alert alert-danger alert-sm py-2 mb-2">{{ error }}</div>

    <div v-else-if="fields.length === 0" class="text-muted small">
      <i class="ri-information-line me-1"></i>
      No custom fields defined for this entity type.
      <router-link v-if="canManage" :to="{ name: 'admin-custom-fields' }" class="ms-1">Add one</router-link>
    </div>

    <div v-else>
      <div class="row g-3">
        <div
          v-for="f in fields"
          :key="f.customFieldId"
          class="col-md-6"
        >
          <label class="form-label">
            {{ f.displayName }}
            <span v-if="f.isRequired" class="text-danger">*</span>
          </label>

          <!-- Text -->
          <input
            v-if="f.dataType === 'Text'"
            type="text"
            v-model="inputs[f.fieldName].textValue"
            class="form-control form-control-sm"
            :disabled="saving"
          />

          <!-- Number -->
          <input
            v-else-if="f.dataType === 'Number'"
            type="number"
            step="any"
            v-model.number="inputs[f.fieldName].numberValue"
            class="form-control form-control-sm"
            :disabled="saving"
          />

          <!-- Date -->
          <input
            v-else-if="f.dataType === 'Date'"
            type="date"
            v-model="inputs[f.fieldName].dateValue"
            class="form-control form-control-sm"
            :disabled="saving"
          />

          <!-- Boolean -->
          <div v-else-if="f.dataType === 'Boolean'" class="form-check mt-1">
            <input
              type="checkbox"
              class="form-check-input"
              :id="'cf-bool-' + f.customFieldId"
              v-model="inputs[f.fieldName].boolValue"
              :disabled="saving"
            />
            <label class="form-check-label small" :for="'cf-bool-' + f.customFieldId">
              Yes
            </label>
          </div>

          <!-- Dropdown -->
          <select
            v-else-if="f.dataType === 'Dropdown'"
            v-model="inputs[f.fieldName].textValue"
            class="form-select form-select-sm"
            :disabled="saving"
          >
            <option value="">— Select —</option>
            <option v-for="opt in parseOptions(f.optionsJson)" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-3 gap-2">
        <span v-if="savedMessage" class="text-success small align-self-center">
          <i class="ri-check-line"></i> {{ savedMessage }}
        </span>
        <button
          class="btn btn-primary btn-sm"
          @click="save"
          :disabled="saving"
        >
          <span v-if="saving">
            <span class="spinner-border spinner-border-sm me-1"></span>Saving...
          </span>
          <span v-else><i class="ri-save-line me-1"></i>Save Custom Fields</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import api from '../services/api'
import { useMainStore } from '@/stores/mainStore'

const props = defineProps({
  entityType: { type: String, required: true },
  entityId:   { type: [Number, String], required: true }
})

const fields = ref([])
const inputs = reactive({})
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const savedMessage = ref('')

const mainStore = useMainStore()
const canManage = computed(() => {
  const roles = mainStore.user?.roles || []
  return roles.some(r => ['admin', 'cfo'].includes(r.toLowerCase()))
})

const parseOptions = (json) => {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

const load = async () => {
  if (!props.entityId) return
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`custom-fields/values/${props.entityType}/${props.entityId}`)
    fields.value = res.data.fields || []

    Object.keys(inputs).forEach(k => delete inputs[k])
    for (const f of fields.value) {
      inputs[f.fieldName] = {
        textValue:   f.textValue ?? '',
        numberValue: f.numberValue ?? null,
        dateValue:   f.dateValue ? f.dateValue.slice(0, 10) : '',
        boolValue:   f.boolValue ?? false
      }
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load custom fields'
    fields.value = []
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  error.value = null
  savedMessage.value = ''
  try {
    const values = fields.value.map(f => {
      const inp = inputs[f.fieldName]
      return {
        fieldName: f.fieldName,
        textValue:   f.dataType === 'Text' || f.dataType === 'Dropdown' ? (inp.textValue || null) : null,
        numberValue: f.dataType === 'Number' ? (inp.numberValue ?? null) : null,
        dateValue:   f.dataType === 'Date'   ? (inp.dateValue || null) : null,
        boolValue:   f.dataType === 'Boolean' ? !!inp.boolValue : null
      }
    })
    await api.post(`custom-fields/values/${props.entityType}/${props.entityId}`, { values })
    savedMessage.value = 'Saved'
    setTimeout(() => { savedMessage.value = '' }, 2500)
  } catch (err) {
    error.value = err.response?.data?.message || 'Save failed'
  } finally {
    saving.value = false
  }
}

watch(() => [props.entityType, props.entityId], load, { immediate: false })

onMounted(load)
</script>

<style scoped>
.custom-fields-panel {
  padding: 0.5rem 0;
}
</style>
