<template>
  <div class="container-fluid kiosk-screen">
    <div class="row align-items-center g-3 w-100 m-0">
      <!-- Left: employee & crew -->
      <div class="col-lg-7">
        <div class="card">
          <div class="card-body">
            <!-- Status / Errors -->
            <div v-if="successClockIn || successClockOut" class="alert alert-success d-flex align-items-center justify-content-center fs-3" role="alert">
              <i class="ri-checkbox-circle-line me-2"></i>
              <div>{{ successClockIn ? 'Clock-in successful.' : 'Clock-out successful.' }}</div>
            </div>
            <div v-if="errorMsg" class="alert alert-danger text-center fs-3" role="alert">{{ errorMsg }}</div>

            <!-- Headline / Prompt -->
            <div class="text-center mb-4">
              <h1 v-if="employee.name" class="fw-semibold display-4">{{ employee.name }}</h1>
              <h1 v-else class="fw-semibold display-5">Please enter your PIN<br /><span class="text-muted">Por favor ingresa tu pin</span></h1>
            </div>

            <!-- PIN input -->
            <div v-if="record.entry.clockEntryId === 0" class="d-flex justify-content-center mb-4">
              <input
                v-model="pin"
                maxlength="4"
                class="form-control text-center"
                style="max-width: 560px; font-size: 5rem; letter-spacing: 0.75rem; height: auto; padding: 1.25rem;"
                placeholder="PIN"
                autocomplete="one-time-code"
              />
            </div>

            <!-- Code input when already clocked in (for clock-out). Hidden for crew whose
                 crew boss auto-assigns the code -- they clock out with no code. -->
            <div v-if="record.entry.clockEntryId !== 0 && alreadyClockedIn && !successClockOut && !employee.inheritCrewCode" class="d-flex justify-content-center mb-3">
              <input
                v-model="code"
                class="form-control text-center"
                style="max-width: 420px; font-size: 1.5rem;"
                placeholder="Enter 9-digit code to clock out"
                autocomplete="off"
              />
            </div>

            <!-- Clock Out (no code): crew whose boss auto-assigns the code -->
            <div v-if="record.entry.clockEntryId !== 0 && alreadyClockedIn && !successClockOut && employee.inheritCrewCode" class="text-center mb-3">
              <button class="btn btn-primary btn-lg" @click="enterTime()" :disabled="working">
                <span v-if="working" class="spinner-border spinner-border-sm me-2"></span>
                Clock Out
              </button>
            </div>

            <!-- Action: Clock In -->
            <div v-if="record.entry.clockEntryId !== 0 && !alreadyClockedIn && !successClockIn" class="text-center mb-3">
              <button class="btn btn-primary btn-lg" @click="clockIn(pin)" :disabled="working">
                <span v-if="working" class="spinner-border spinner-border-sm me-2"></span>
                Clock In
              </button>
            </div>

            <!-- Preset buttons for code entry when already clocked in (skip for auto-assign crew) -->
            <div v-if="!errorMsg && alreadyClockedIn && !successClockOut && !employee.inheritCrewCode" class="text-center mb-3">
              <div class="row g-2 justify-content-center">
                <div class="col-auto" v-for="preset in presets" :key="preset.code">
                  <button class="btn btn-outline-secondary btn-lg" @click="enterTime(preset.code)">{{ preset.code }}</button>
                </div>
              </div>
            </div>

            <!-- Current entry summary when clocked in -->
            <div v-if="employee.clockIn" class="table-responsive mb-4">
              <table class="table table-sm table-bordered align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="text-center" style="width: 15%">Time In</th>
                    <th class="text-center" style="width: 15%">Time Out</th>
                    <th style="width: 25%">Product</th>
                    <th class="text-center" style="width: 15%">Year</th>
                    <th style="width: 30%">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center">{{ employee.timeIn }}</td>
                    <td class="text-center">{{ record.entry.timeOut }}</td>
                    <td>{{ record.entry.productName }}</td>
                    <td class="text-center">{{ record.entry.productYearName }}</td>
                    <td>{{ record.entry.activityName }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Crew members -->
            <div v-if="crewMembers.length > 0">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Crew Members</h6>
                <div class="form-check d-flex align-items-center gap-2">
                  <input class="form-check-input crew-check" type="checkbox" id="selectAllCrew" v-model="selectAll" @change="selectAllCrewMembers" />
                  <label class="form-check-label" for="selectAllCrew">Select All Available</label>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 90px"></th>
                      <th>Name</th>
                      <th class="text-center">Time In</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cm in crewMembers" :key="cm.id">
                      <td>
                        <input class="form-check-input crew-check" type="checkbox" v-model="cm.clockIn" :disabled="(cm.timeIn && !employee.timeIn) || (!cm.timeIn && employee.timeIn)" />
                      </td>
                      <td>{{ cm.name }}</td>
                      <td class="text-center">{{ cm.timeIn || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: keypad -->
      <div class="col-lg-5">
        <div class="card">
          <div class="card-body">
            <div class="d-grid gap-3 keypad" style="max-width: 480px; margin: 0 auto;">
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(1)">1</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(2)">2</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(3)">3</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(4)">4</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(5)">5</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(6)">6</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(7)">7</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(8)">8</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(9)">9</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press('back')">
                  <i class="ri-arrow-go-back-line"></i>
                </button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="press(0)">0</button>
                <button class="btn btn-success btn-lg shadow-sm" style="width: 140px; height: 140px;" @click="enterTime()">
                  <i class="ri-check-line"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '@/services/api'

const entries = ref([{ timeOut: '' }])
const record = ref({
  employee: {
    id: null,
    name: null,
    firstName: null,
    lastName: null,
    crewMembers: [],
    timeIn: null,
    timeOut: null,
    entryId: null,
    clockIn: false,
  },
  entry: {
    activityId: null,
    activityName: null,
    clockEntryId: 0,
    employeeId: null,
    employeeName: null,
    productId: null,
    productName: null,
    productYear: null,
    productYearName: null,
    timeIn: null,
    timeOut: null,
  },
})

const employee = ref({
  id: null,
  name: null,
  firstName: null,
  lastName: null,
  crewMembers: [],
  timeIn: null,
  timeOut: null,
  entryId: null,
  clockIn: false,
  // True when this employee's crew boss auto-assigns the clock-out code,
  // so we let them clock out without entering a 9-digit code.
  inheritCrewCode: false,
})

const pin = ref('')
const code = ref('')
const presets = ref([])
const alreadyClockedIn = ref(false)
const successClockIn = ref(false)
const successClockOut = ref(false)
const errorMsg = ref('')
const working = ref(false)
const selectAll = ref(false)
const crewMembers = ref([])

function press(val) {
  if (val === 'back') {
    // Once an employee is selected, the PIN input is hidden -- a back press should reset, not backspace.
    if (record.value.entry.clockEntryId !== 0) {
      clearData()
      return
    }
    if (pin.value.length > 0) pin.value = pin.value.substring(0, pin.value.length - 1)
    if (code.value.length > 0) code.value = code.value.substring(0, code.value.length - 1)
    if (pin.value.length === 0 && code.value.length === 0) {
      // Soft reset
      clearData()
    }
    return
  }
  if (pin.value.length < 4 && !alreadyClockedIn.value) {
    pin.value = pin.value + String(val)
  }
  if (code.value.length < 9 && alreadyClockedIn.value) {
    code.value = code.value + String(val)
  }
}

function selectAllCrewMembers() {
  crewMembers.value.forEach((cm) => {
    cm.clockIn = selectAll.value
  })
}

function clockIn(val) {
  if (!val || String(val).length < 4) return
  working.value = true
  api
    .get(`clockin?pin=${val}`)
    .then((response) => {
      alreadyClockedIn.value = response.data.clockedIn
      if (!response.data.clockOverride && response.data.error) {
        errorMsg.value = response.data.error
      }
      // Guard: a rejected punch (e.g. "Closed") returns clockEntry === null.
      if (response.data.clockEntry?.clockEntryId > 0) {
        record.value.employee.id = response.data.clockEntry.employeeId
        record.value.employee.name = response.data.clockEntry.employeeName
        record.value.entry = response.data.clockEntry
        successClockIn.value = response.data.success
        alreadyClockedIn.value = response.data.clockedIn
        errorMsg.value = ''

        // Clock in selected crew members. By id, not PIN: the crew list no longer
        // carries PINs (H-003), so a PIN-based call would send an empty PIN and fail.
        crewMembers.value.forEach((cm) => {
          if (!cm.clockIn) return
          api.get(`clockinbyid?id=${cm.id}`).catch((msg) => {
            errorMsg.value = msg?.response?.data?.error || 'Crew clock-in failed'
          })
        })
      } else if (!errorMsg.value) {
        // Only fall back to "Invalid PIN" when the server didn't already give a reason.
        errorMsg.value = 'Invalid PIN'
      }
    })
    .catch(() => {})
    .finally(() => {
      working.value = false
      // Hold the result (success or error) on screen ~3s so people can follow the punch before reset.
      setTimeout(() => clearData(), 3000)
    })
}

watch(pin, (val) => {
  if (!val || String(val).length < 4) return
  api
    .get(`getemployeebypin?pin=${val}`)
    .then((response) => {
      const data = response?.data || {}
      // If no valid employee found, show error and refresh; do NOT set entryId to reveal clock-in
      if (!data.id) {
        errorMsg.value = 'Invalid PIN'
        setTimeout(() => {
          errorMsg.value = ''
          clearData()
        }, 1000)
        return
      }
      alreadyClockedIn.value = data.clockIn
      employee.value.id = data.id
      employee.value.name = data.name
      employee.value.timeIn = data.timeIn
      employee.value.entryId = data.entryId
      employee.value.clockIn = data.clockIn
      employee.value.inheritCrewCode = data.inheritCrewCode
      record.value.entry.clockEntryId = data.entryId
      errorMsg.value = ''
      crewMembers.value = data.crewMembers || []
    })
    .catch(() => {
      // On request failure, briefly show error and soft reset
      errorMsg.value = 'A network error occurred. Please try again.'
      setTimeout(() => {
        errorMsg.value = ''
        clearData()
      }, 1200)
    })
})

function clearData() {
  pin.value = ''
  code.value = ''
  record.value.entry = {
    activityId: null,
    activityName: null,
    clockEntryId: 0,
    employeeId: null,
    productId: null,
    productName: null,
    productYear: null,
    productYearName: null,
    timeIn: null,
    timeOut: null,
  }
  record.value.employee = {
    id: null,
    name: null,
    firstName: null,
    lastName: null,
  }
  successClockIn.value = false
  successClockOut.value = false
  // Reset clocked-in state too, else after canceling a clock-out the preset
  // buttons (gated on alreadyClockedIn) keep showing on the PIN screen.
  alreadyClockedIn.value = false
  errorMsg.value = ''
  working.value = false
  employee.value = {
    id: null,
    name: null,
    firstName: null,
    lastName: null,
    crewMembers: [],
    timeIn: null,
    timeOut: null,
    entryId: null,
    clockIn: false,
    inheritCrewCode: false,
  }
  crewMembers.value = []
  selectAll.value = false
}

function enterTime(val) {
  // Crew members whose boss auto-assigns the code clock out with no code; the
  // backend resolves it from the boss's punch (or back-fills when the boss clocks out).
  const inherit = employee.value.inheritCrewCode
  const data = {
    entryId: employee.value.entryId,
    employeeId: employee.value.id,
    code: inherit ? '' : (val == null ? code.value : val),
  }
  if (!inherit && (!data.code || String(data.code).length < 9)) {
    errorMsg.value = 'Please enter a valid code'
    setTimeout(() => (errorMsg.value = ''), 2000)
    return
  }
  working.value = true
  api
    .post('clockout', data)
    .then((response) => {
      working.value = false
      record.value.entry = response.data.clockEntry
      successClockOut.value = response.data.success && !response.data.clockedIn
      alreadyClockedIn.value = false
      // Hold the result ~3s so people can follow the punch before reset.
      setTimeout(() => clearData(), 3000)
    })
    .catch((msg) => {
      working.value = false
      errorMsg.value = msg?.response?.data?.error || 'Clock-out failed'
      setTimeout(() => (errorMsg.value = ''), 2000)
    })

  // Also clock-out crew members selected
  crewMembers.value.forEach((cm) => {
    if (!cm.clockIn) return
    const crewData = {
      entryId: cm.entryId,
      employeeId: cm.id,
      code: data.code,
    }
    api.post('clockout', crewData).catch((msg) => {
      errorMsg.value = msg?.response?.data?.error || 'Crew clock-out failed'
      setTimeout(() => (errorMsg.value = ''), 2000)
    })
  })
}

function init() {
  api
    .get('gettimesheetdata')
    .then((response) => {
      const settings = response.data.clockSettings
      presets.value = response.data.clockPresets || []
      // The Quasar version had RFID integration and time-window refresh logic; skipping hardware here.
    })
    .catch(() => {})
}

onMounted(() => init())
</script>

<style scoped>
.dashhead .breadcrumb {
  margin-bottom: 0;
}
/* Tablet touch responsiveness: the default viewport allows double-tap-to-zoom,
   so the browser delays each tap ~300ms waiting for a second tap. manipulation
   disables that delay (and double-tap zoom) on buttons without blocking pinch-zoom,
   so keypad presses register on the first touch. user-select/tap-highlight keep
   rapid taps from selecting text or flashing. */
button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* Lock the kiosk to the viewport so the page itself never scrolls when typing.
   Any overflow (e.g. a long crew list) scrolls inside its own card instead. */
.kiosk-screen {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0.75rem;
}
.kiosk-screen :deep(.card) {
  max-height: calc(100dvh - 1.5rem);
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}
.kiosk-screen :deep(.card-body) {
  overflow-y: auto;
}

/* Size the keypad to the viewport height so all four rows always fit without
   scrolling. clamp keeps it tappable on small screens and capped on large ones.
   !important overrides the per-button inline width/height in the template. */
.keypad button {
  border-radius: 50%;
  border: 2px solid #000;
  font-weight: 600;
  width: clamp(64px, 12vh, 140px) !important;
  height: clamp(64px, 12vh, 140px) !important;
  font-size: clamp(1.4rem, 4.5vh, 3.5rem) !important;
}
.keypad {
  gap: clamp(0.4rem, 1.2vh, 1rem) !important;
}
.keypad > div {
  gap: clamp(0.4rem, 1.2vh, 1rem) !important;
}
.crew-check {
  width: 2rem;
  height: 2rem;
  cursor: pointer;
}
</style>
