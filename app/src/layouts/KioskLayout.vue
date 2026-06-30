<template>
  <div class="kiosk-wrapper" :class="{ 'cursor-hidden': cursorHidden }">
    <!-- Fallback control: browsers only allow fullscreen from a user gesture, so we
         auto-request it on the first touch and surface this button whenever we're
         not fullscreen (e.g. the user exited with Esc). -->
    <button v-if="!isFullscreen" class="kiosk-fs-btn" @click="enterFullscreen" title="Full screen">
      &#x26F6; Full screen
    </button>
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
const isFullscreen = ref(false)
let idleResetTimer = null
let idleCursorTimer = null
let fsRequested = false

// Enter fullscreen. Cross-browser (standard + webkit). Swallows the promise
// rejection browsers throw when there's no active user gesture.
function enterFullscreen() {
  const el = document.documentElement
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen
  if (!req) return
  try { Promise.resolve(req.call(el)).catch(() => {}) } catch (e) { /* ignore */ }
}

function onFsChange() {
  isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement)
}

// First user gesture only -- this is the moment the browser will honor the request.
function requestFsOnce() {
  if (fsRequested) return
  fsRequested = true
  enterFullscreen()
  window.removeEventListener('pointerdown', requestFsOnce, true)
}

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

  // Fullscreen: track state + arm a one-time request on the first user gesture.
  document.addEventListener('fullscreenchange', onFsChange)
  document.addEventListener('webkitfullscreenchange', onFsChange)
  window.addEventListener('pointerdown', requestFsOnce, true)
  onFsChange()
})

onBeforeUnmount(() => {
  window.removeEventListener('contextmenu', preventContextMenu)
  window.removeEventListener('keydown', preventShortcuts, true)
  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
  activityEvents.forEach(evt => window.removeEventListener(evt, resetIdleTimers))
  if (idleResetTimer) clearTimeout(idleResetTimer)
  if (idleCursorTimer) clearTimeout(idleCursorTimer)
  document.removeEventListener('fullscreenchange', onFsChange)
  document.removeEventListener('webkitfullscreenchange', onFsChange)
  window.removeEventListener('pointerdown', requestFsOnce, true)
})
</script>

<style scoped>
.kiosk-wrapper {
  height: 100dvh;
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
  overflow: hidden;
  overscroll-behavior: none;
}

.cursor-hidden {
  cursor: none !important;
}

.kiosk-fs-btn {
  position: fixed;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1050;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #6c757d;
  border-radius: 0.4rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  line-height: 1;
  touch-action: manipulation;
}
.kiosk-fs-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}
</style>
