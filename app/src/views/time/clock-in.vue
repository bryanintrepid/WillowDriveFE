<template>
  <div class="container-fluid" style="padding: 1.25rem; margin-top: 0.5rem;">
    <div class="row">
      <!-- Left: employee & crew -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-body">
            <!-- Status / Errors -->
            <div v-if="successClockIn || successClockOut" class="alert alert-success d-flex align-items-center" role="alert">
              <i class="ri-checkbox-circle-line me-2"></i>
              <div>{{ successClockIn ? 'Clock-in successful.' : 'Clock-out successful.' }}</div>
            </div>
            <div v-if="errorMsg" class="alert alert-danger" role="alert">{{ errorMsg }}</div>

            <!-- Headline / Prompt -->
            <div class="text-center mb-3">
              <h2 v-if="employee.name" class="fw-semibold">{{ employee.name }}</h2>
              <h2 v-else class="fw-semibold">Please enter your PIN<br /><small class="text-muted">Por favor ingresa tu pin</small></h2>
            </div>

            <!-- PIN input -->
            <div v-if="record.entry.clockEntryId === 0" class="d-flex justify-content-center mb-4">
              <input
                v-model="pin"
                maxlength="4"
                class="form-control text-center"
                style="max-width: 320px; font-size: 2rem; letter-spacing: 0.3rem;"
                placeholder="PIN"
                autocomplete="one-time-code"
              />
            </div>

            <!-- Code input when already clocked in (for clock-out) -->
            <div v-if="record.entry.clockEntryId !== 0 && alreadyClockedIn && !successClockOut" class="d-flex justify-content-center mb-3">
              <input
                v-model="code"
                class="form-control text-center"
                style="max-width: 420px; font-size: 1.5rem;"
                placeholder="Enter 9-digit code to clock out"
                autocomplete="off"
              />
            </div>

            <!-- Action: Clock In -->
            <div v-if="record.entry.clockEntryId !== 0 && !alreadyClockedIn && !successClockIn" class="text-center mb-3">
              <button class="btn btn-primary btn-lg" @click="clockIn(pin)" :disabled="working">
                <span v-if="working" class="spinner-border spinner-border-sm me-2"></span>
                Clock In
              </button>
            </div>

            <!-- Preset buttons for code entry when already clocked in -->
            <div v-if="!errorMsg && alreadyClockedIn && !successClockOut" class="text-center mb-3">
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
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="selectAllCrew" v-model="selectAll" @change="selectAllCrewMembers" />
                  <label class="form-check-label" for="selectAllCrew">Select All Available</label>
                </div>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 60px"></th>
                      <th>Name</th>
                      <th class="text-center">Time In</th>
                      <th>Product</th>
                      <th>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cm in crewMembers" :key="cm.id">
                      <td>
                        <input class="form-check-input" type="checkbox" v-model="cm.clockIn" :disabled="(cm.timeIn && !employee.timeIn) || (!cm.timeIn && employee.timeIn)" />
                      </td>
                      <td>{{ cm.name }}</td>
                      <td class="text-center">{{ cm.timeIn || '-' }}</td>
                      <td>{{ cm.productName || '-' }}</td>
                      <td>{{ cm.productYearName || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: keypad -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-body">
            <div class="d-grid gap-3" style="max-width: 420px; margin: 0 auto;">
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(9)">9</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(8)">8</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(7)">7</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(6)">6</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(5)">5</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(4)">4</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(3)">3</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(2)">2</button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(1)">1</button>
              </div>
              <div class="d-flex justify-content-center align-items-center gap-3">
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press('back')">
                  <i class="ri-arrow-go-back-line fs-3"></i>
                </button>
                <button class="btn btn-light btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="press(0)">0</button>
                <button class="btn btn-success btn-lg shadow-sm" style="width: 100px; height: 100px;" @click="enterTime()">
                  <i class="ri-check-line fs-3"></i>
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
        setTimeout(() => {
          errorMsg.value = ''
        }, 3000)
      }
      if (response.data.clockEntry.clockEntryId > 0) {
        record.value.employee.id = response.data.clockEntry.employeeId
        record.value.employee.name = response.data.clockEntry.employeeName
        record.value.entry = response.data.clockEntry
        successClockIn.value = response.data.success
        alreadyClockedIn.value = response.data.clockedIn
        errorMsg.value = ''

        // Clock in selected crew members
        crewMembers.value.forEach((cm) => {
          if (!cm.clockIn) return
          const cmPin = cm.pin
          api.get(`clockin?pin=${cmPin}`).catch((msg) => {
            errorMsg.value = msg?.response?.data?.error || 'Crew clock-in failed'
          })
        })
      } else {
        errorMsg.value = 'Invalid PIN'
        setTimeout(() => {
          errorMsg.value = ''
          clearData()
        }, 1000)
      }
    })
    .catch(() => {})
    .finally(() => {
      working.value = false
      setTimeout(() => clearData(), 1000)
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
  }
  crewMembers.value = []
  selectAll.value = false
}

function enterTime(val) {
  const data = {
    entryId: employee.value.entryId,
    employeeId: employee.value.id,
    code: val == null ? code.value : val,
  }
  if (!data.code || String(data.code).length < 9) {
    errorMsg.value = 'Please enter a valid code'
    setTimeout(() => (errorMsg.value = ''), 2000)
    return
  }
  api
    .post('clockout', data)
    .then((response) => {
      record.value.entry = response.data.clockEntry
      successClockOut.value = response.data.success && !response.data.clockedIn
      alreadyClockedIn.value = false
      setTimeout(() => clearData(), 2000)
    })
    .catch((msg) => {
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
</style>
