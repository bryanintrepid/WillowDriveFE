<template>
  <span
    v-if="period"
    class="badge fiscal-period-badge d-inline-flex align-items-center gap-1"
    :class="stateClass"
    :title="tooltip"
  >
    <i class="ri-calendar-line"></i>
    <span class="fpb-text">FY {{ period.fiscalYear }} · P{{ period.period }} · {{ stateLabel }}</span>
  </span>
</template>

<script setup>
/**
 * FiscalPeriodBadge — read-only chip showing today's fiscal year, period,
 * and close state. Fetched once on mount from GET /api/fiscal-period/current
 * and rendered in the topbar plus any accounting page headers that want it.
 *
 * Part of Phase 0 of the accounting modernization plan. In Phase 0 the state
 * is always "Open" (no state machine yet). Phase 1 adds the close workflow
 * which can land a period in InClose / SoftClose / HardClose / Audited.
 *
 * Fiscal year convention: FY N = Jul year N → Jun year N+1. Today 2026-04-11
 * is FY 2025, Period 10 (April 2026 = Period 10 of FY 2025).
 */
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const period = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    // Skip if there's no auth token yet — the topbar renders inside an
    // authenticated layout, but this guard prevents a noisy 401 during
    // pre-login states (e.g. the login screen briefly mounts the layout).
    if (!localStorage.getItem('token')) return
    const resp = await api.get('fiscal-period/current')
    period.value = resp.data
  } catch (e) {
    error.value = e
    // Swallow — the badge is informational; a failure shouldn't break the topbar.
    console.warn('FiscalPeriodBadge: failed to load current period', e)
  }
})

const stateLabel = computed(() => {
  const s = period.value?.state
  if (!s) return ''
  // Insert a space before interior capitals: "SoftClose" → "Soft Close".
  return s.replace(/([a-z])([A-Z])/g, '$1 $2')
})

const stateClass = computed(() => {
  switch (period.value?.state) {
    case 'Open':      return 'text-bg-success-subtle text-success-emphasis'
    case 'InClose':   return 'text-bg-warning-subtle text-warning-emphasis'
    case 'SoftClose': return 'text-bg-warning-subtle text-warning-emphasis'
    case 'HardClose': return 'text-bg-secondary-subtle text-secondary-emphasis'
    case 'Audited':   return 'text-bg-info-subtle text-info-emphasis'
    default:          return 'text-bg-light text-muted'
  }
})

const tooltip = computed(() => {
  if (!period.value) return ''
  const start = new Date(period.value.startDate).toLocaleDateString()
  const end = new Date(period.value.endDate).toLocaleDateString()
  return `Period runs ${start} – ${end}\nState: ${stateLabel.value}`
})
</script>

<style scoped>
.fiscal-period-badge {
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  line-height: 1;
  white-space: nowrap;
}
.fiscal-period-badge .ri-calendar-line {
  font-size: 0.875rem;
}
</style>
