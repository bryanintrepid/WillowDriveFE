<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="dashhead-titles">
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item">Recurring JEs</li>
          <li class="breadcrumb-item active" aria-current="page">Templates</li>
        </ol>
      </div>
    </div>

    <div v-if="banner.message" class="alert" :class="banner.cssClass">
      <strong>{{ banner.title }}</strong>
      <span class="ms-2">{{ banner.message }}</span>
      <button type="button" class="btn-close float-end" @click="banner.message = ''"></button>
    </div>

    <div class="card mb-3">
      <div class="card-header">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <div class="flex-grow-1">
            <h5 class="mb-0">Recurring Journal Entry Templates</h5>
            <small class="text-muted">
              {{ templates.length }} template{{ templates.length === 1 ? '' : 's' }}
              <span v-if="activeOnlyFilter"> (active only)</span>
            </small>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="activeOnlyToggle"
                     v-model="activeOnlyFilter" @change="loadTemplates" />
              <label class="form-check-label" for="activeOnlyToggle">Active only</label>
            </div>
            <router-link class="btn btn-primary btn-sm" to="/accounting/recurring-je/drafts">
              <i class="ri-list-check"></i> Drafts Workflow
            </router-link>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <div v-if="loading" class="text-center my-4">
          <p class="text-muted">Loading templates...</p>
        </div>
        <div v-else-if="templates.length === 0" class="text-center my-4">
          <p class="text-muted">No recurring JE templates yet.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 40px;"></th>
                <th>Name</th>
                <th style="width: 100px;">Frequency</th>
                <th style="width: 80px;" class="text-end">Lines</th>
                <th style="width: 140px;" class="text-end">Total DR</th>
                <th style="width: 140px;" class="text-end">Total CR</th>
                <th style="width: 110px;" class="text-center">Flags</th>
                <th style="width: 140px;">Last Materialized</th>
                <th style="width: 70px;" class="text-center">Active</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="t in templates" :key="t.templateId">
                <tr :class="{ 'cursor-pointer': true }" @click="toggleExpand(t.templateId)">
                  <td class="text-muted text-center">
                    <i :class="expanded[t.templateId] ? 'ri-arrow-down-s-fill' : 'ri-arrow-right-s-fill'"></i>
                  </td>
                  <td>
                    <strong>{{ t.name }}</strong>
                    <div v-if="t.description" class="small text-muted">{{ t.description }}</div>
                  </td>
                  <td><small class="text-muted">{{ t.frequency }}</small></td>
                  <td class="text-end">{{ t.lines.length }}</td>
                  <td class="text-end">{{ formatMoney(totalFor(t, 'debit')) }}</td>
                  <td class="text-end">{{ formatMoney(totalFor(t, 'credit')) }}</td>
                  <td class="text-center">
                    <span v-if="t.isVariable" class="badge text-bg-warning-subtle text-warning-emphasis me-1" title="Amounts are placeholders — user edits before approval">var</span>
                    <span v-if="t.reversingFlag" class="badge text-bg-info-subtle text-info-emphasis" title="Auto-reverses in next period after posting">rev</span>
                  </td>
                  <td>
                    <small v-if="t.lastMaterializedFiscalYear && t.lastMaterializedPeriod" class="text-muted">
                      FY{{ t.lastMaterializedFiscalYear }} P{{ t.lastMaterializedPeriod }}
                    </small>
                    <small v-else class="text-muted">—</small>
                  </td>
                  <td class="text-center">
                    <span v-if="t.isActive" class="badge text-bg-success-subtle text-success-emphasis">Yes</span>
                    <span v-else class="badge text-bg-secondary-subtle text-secondary-emphasis">No</span>
                  </td>
                </tr>
                <tr v-if="expanded[t.templateId]">
                  <td colspan="9" class="bg-light">
                    <div class="p-2">
                      <h6 class="mb-2">Template lines</h6>
                      <table class="table table-sm mb-0" style="background: white;">
                        <thead>
                          <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 120px;">Account</th>
                            <th>Memo</th>
                            <th style="width: 140px;" class="text-end">Debit</th>
                            <th style="width: 140px;" class="text-end">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="line in t.lines" :key="line.lineId">
                            <td class="text-muted">{{ line.seq }}</td>
                            <td><code>{{ line.accountNumber }}</code></td>
                            <td class="small">{{ line.memo || '' }}</td>
                            <td class="text-end" :class="{ 'text-muted': line.debit === 0 }">{{ formatMoney(line.debit) }}</td>
                            <td class="text-end" :class="{ 'text-muted': line.credit === 0 }">{{ formatMoney(line.credit) }}</td>
                          </tr>
                        </tbody>
                        <tfoot class="table-light">
                          <tr>
                            <th colspan="3" class="text-end">Totals:</th>
                            <th class="text-end">{{ formatMoney(totalFor(t, 'debit')) }}</th>
                            <th class="text-end">{{ formatMoney(totalFor(t, 'credit')) }}</th>
                          </tr>
                        </tfoot>
                      </table>
                      <div class="mt-2 small text-muted">
                        <strong>Balance check:</strong>
                        <span :class="isBalanced(t) ? 'text-success' : 'text-danger'">
                          {{ isBalanced(t) ? 'OK — debits equal credits' : 'Out of balance' }}
                        </span>
                        <span v-if="t.createdBy" class="ms-3">Created by {{ t.createdBy }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * RecurringJeTemplates — Phase 2b list view.
 *
 * Read-only template browser. Shows every template (activeOnly filter
 * default = true), with expandable rows that reveal the line detail.
 * Clicking a row toggles expand. Clicking "Drafts Workflow" jumps to
 * the daily-use approve/reject view.
 *
 * Template editing (create/update/delete lines) is deferred past Phase 2b —
 * the current 6 seeded templates are the Phase 2a delivery and edits go
 * straight to SQL until an edit UI is built.
 */
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const templates = ref([])
const loading = ref(false)
const activeOnlyFilter = ref(true)
const expanded = ref({})
const banner = ref({ message: '', title: '', cssClass: 'alert-info' })

async function loadTemplates() {
  loading.value = true
  try {
    const resp = await api.get(`recurring-je/templates?activeOnly=${activeOnlyFilter.value}`)
    templates.value = resp.data
  } catch (e) {
    setBanner('error', 'Load failed', describeError(e))
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}

function totalFor(t, side) {
  return (t.lines || []).reduce((sum, l) => sum + Number(l[side] || 0), 0)
}

function isBalanced(t) {
  return Math.abs(totalFor(t, 'debit') - totalFor(t, 'credit')) < 0.01
}

function formatMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function setBanner(type, title, message) {
  const cssMap = { success: 'alert-success', info: 'alert-info', warning: 'alert-warning', error: 'alert-danger' }
  banner.value = { message, title, cssClass: cssMap[type] || 'alert-info' }
}

function describeError(e) {
  if (e?.response?.data?.message) return e.response.data.message
  if (typeof e?.response?.data === 'string') return e.response.data
  if (e?.message) return e.message
  return 'Unknown error'
}

onMounted(loadTemplates)
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: rgba(0,0,0,0.03);
}
</style>
