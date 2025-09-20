<template>
  <div class="kiosk-wrapper" :class="{ 'cursor-hidden': cursorHidden }">
    <router-view :key="viewKey" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Idle handling
const IDLE_RESET_MS = 90 * 1000 // 90 seconds
const IDLE_CURSOR_MS = 10 * 1000 // 10 seconds

const viewKey = ref(0)
const cursorHidden = ref(false)
let idleResetTimer = null
let idleCursorTimer = null

function softReset() {
  // Remount child view to reset its internal state
  viewKey.value += 1
}

function resetIdleTimers() {
  // Show cursor on activity
  cursorHidden.value = false
  if (idleCursorTimer) clearTimeout(idleCursorTimer)
  idleCursorTimer = setTimeout(() => {
    cursorHidden.value = true
  }, IDLE_CURSOR_MS)

  // Reset view after prolonged inactivity
  if (idleResetTimer) clearTimeout(idleResetTimer)
  idleResetTimer = setTimeout(() => {
    softReset()
  }, IDLE_RESET_MS)
}

function preventShortcuts(e) {
  const k = e.key?.toLowerCase()
  const ctrl = e.ctrlKey || e.metaKey
  const blocked =
    // refresh / dev / find / print / save / open / new tab / close tab / nav bar
    (k === 'f5') ||
    (ctrl && ['r', 'f', 'p', 's', 'o', 'n', 'w', 'l'].includes(k)) ||
    // back/forward
    (k === 'backspace' && !['input', 'textarea'].includes((e.target?.tagName || '').toLowerCase()))

  if (blocked) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function preventContextMenu(e) {
  e.preventDefault()
}

onMounted(() => {
  // Disable context menu
  window.addEventListener('contextmenu', preventContextMenu)
  // Disable common shortcuts
  window.addEventListener('keydown', preventShortcuts, true)

  // Track activity for idle
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
  activityEvents.forEach(evt => window.addEventListener(evt, resetIdleTimers, { passive: true }))
  resetIdleTimers()
})

onBeforeUnmount(() => {
  window.removeEventListener('contextmenu', preventContextMenu)
  window.removeEventListener('keydown', preventShortcuts, true)
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
  activityEvents.forEach(evt => window.removeEventListener(evt, resetIdleTimers))
  if (idleResetTimer) clearTimeout(idleResetTimer)
  if (idleCursorTimer) clearTimeout(idleCursorTimer)
})
</script>

<style scoped>
.kiosk-wrapper {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
}

.cursor-hidden {
  cursor: none !important;
}
</style>
