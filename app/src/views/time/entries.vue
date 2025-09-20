<template>
  <div class="container-fluid mt-4">
    <h2>Time Entries</h2>
    <!-- Alert for errors or messages -->
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <!-- Filters -->
    <div class="row align-items-end">
      <div class="col-3">
        <label class="form-label">Pay Period</label>
        <select class="form-select" v-model="selectedRange" @change="onRangeChange">
          <option v-for="range in ranges" :key="range.range" :value="range">
            {{ range.name }}
          </option>
        </select>
      </div>
      <div class="col-2 ">
        <label class="form-label">Start Date</label>
        <input type="text" class="form-control" v-model="start" @change="onDateChange" placeholder="MM/DD/YYYY" />
      </div>
      <div class="col-2 ">
        <label class="form-label">End Date</label>
        <input type="text" class="form-control" v-model="end" @change="onDateChange" placeholder="MM/DD/YYYY" />
      </div>
      <div class="col-2">
        <label class="form-label">Crew Boss</label>
        <select class="form-select" v-model="selectedBoss">
          <option :value="null">All Bosses</option>
          <option v-for="boss in crewBosses" :key="boss.id" :value="boss">
            {{ boss.name }} 
          </option>
        </select>
      </div>
      <div class="col-2">
        <label class="form-label">Employee (optional)</label>
        <select class="form-select" v-model="selectedEmployee">
          <option :value="null">All Employees</option>
          <option v-for="emp in filteredEmployees" :key="emp.id" :value="emp">
            {{ emp.name }} ({{ emp.employeeNumber }})
          </option>
        </select>
      </div>
      <div class="col-1 d-grid">
        <button class="btn btn-primary w-100 h-100" @click="fetchEntries" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Search
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
        <table class="table table-striped table-bordered align-middle">
    <thead>
      <tr>
        <th>Name</th>
        <th>Time In</th>
        <th>Time Out</th>
        <th>Subtotal</th>
        <th>Total</th>
        <th>Type</th>
        <th>Product</th>
        <th>Product Year</th>
        <th>Activity</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="group in filteredEntries" :key="group.dateReference">
        <tr class="table-group-header bg-light fw-bold">
          <td colspan="11">{{ group.dateReference }}</td>
        </tr>
        <template v-for="entry in group.clockEntries" :key="group.dateReference + '-' + entry.clockEntryId">
          <!-- Editing Row -->
          <tr v-if="editingEntry === entry">
            <td>
              <input v-model="editForm.employeeName" class="form-control form-control-sm" />
            </td>
            <td>
              <input v-model="editForm.timeIn" class="form-control form-control-sm" :disabled="editForm.type == 3 || editForm.type == 4 || editForm.type == 5" />
            </td>
            <td>
              <input v-model="editForm.timeOut" class="form-control form-control-sm" :disabled="editForm.type == 3 || editForm.type == 4 || editForm.type == 5" />
            </td>
            <td>
              <span v-if="editForm.type == 1 || editForm.type == 2">
                <input v-model="editForm.adjusted" class="form-control form-control-sm" />
              </span>
              <span v-else></span>
            </td>
            <td>
              <input v-if="editForm.type == 3 || editForm.type == 4" v-model="editForm.total" class="form-control form-control-sm" />
              <span v-else>{{ entry.total }}</span>
            </td>
            <td>
              <select v-model="editForm.type" class="form-select form-select-sm">
                <option v-for="opt in typeOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
              </select>
            </td>
            <td>
              <select v-model="editForm.productId" class="form-select form-select-sm">
                <option v-for="prod in products" :key="prod.id" :value="prod.id">{{ prod.name }}</option>
              </select>
            </td>
            <td>
              <select v-model="editForm.productYearId" class="form-select form-select-sm">
                <option v-for="year in productYears" :key="year.id" :value="year.id">{{ year.name }}</option>
              </select>
            </td>
            <td>
              <select v-model="editForm.activityId" class="form-select form-select-sm">
                <option v-for="act in activities" :key="act.id" :value="act.id">{{ act.name }}</option>
              </select>
            </td>
            <td>
              <button class="btn btn-link p-0 me-2" @click="saveInlineEdit(editForm, group.dateReference)" title="Save">
                <i class="bi bi-check-circle-fill text-success"></i>
              </button>
              <button class="btn btn-link p-0" @click="cancelInlineEdit" title="Cancel">
                <i class="bi bi-x-circle-fill text-danger"></i>
              </button>
            </td>
          </tr>
          <!-- Display Row -->
          <tr v-else>
            <td>{{ entry.employeeName }} ({{ entry.employeeNumber }})</td>
            <td>{{ formatTimeDisplay(entry.timeInTime) }}</td>
            <td>{{ formatTimeDisplay(entry.timeOutTime) }}</td>
            <td>{{ entry.adjusted }}</td>
            <td>{{ entry.total }}</td>
            <td>{{ entry.typeName || (typeOptions.find(opt => opt.id === entry.type)?.name || entry.type) }}</td>
            <td>{{ entry.productName }}</td>
            <td>{{ entry.productYearName }}</td>
            <td>{{ entry.activityName }}</td>
            <td>
              <button class="btn btn-link p-0 me-2" @click="startInlineEdit(entry)" title="Edit">
                <i class="bi bi-pencil-square text-primary"></i>
              </button>
              <button class="btn btn-link p-0 me-2" @click="addRow(group.dateReference, entry)" title="Add">
                <i class="bi bi-plus-circle-fill text-success"></i>
              </button>
              <button class="btn btn-link p-0 me-2" @click="copyRow(group.dateReference, entry)" title="Copy">
                <i class="bi bi-files text-primary"></i>
              </button>
              <button class="btn btn-link p-0" @click="deleteRow(entry.clockEntryId)" title="Delete">
                <i class="bi bi-trash-fill text-danger"></i>
              </button>
            </td>
          </tr>
        </template>
      </template>
</tbody>
    <!-- Loading overlay -->
    <div v-if="loading" class="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style="background:rgba(255,255,255,0.7);z-index:10;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </table>
    </div>

   
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '@/services/api'

const form = ref({ date: '', employeeName: '', hours: '', notes: '', id: null })

const entries = ref([])

const filteredEntries = computed(() => {
  if (!selectedEmployee.value) {
    return entries.value;
  }
  return entries.value
    .map(group => ({
      ...group,
      clockEntries: group.clockEntries.filter(entry => entry.employeeId === selectedEmployee.value.id)
    }))
    .filter(group => group.clockEntries.length > 0);
});

// Inline editing state
const editingEntry = ref(null);
const editForm = ref({})
const originalEditForm = ref(null) // To store the state before editing
const successTimeout = ref(null)
const success = ref('')

watch(success, (val) => {
  if (val) {
    if (successTimeout.value) clearTimeout(successTimeout.value)
    successTimeout.value = setTimeout(() => { success.value = '' }, 5000)
  }
})

// Watch for Vacation or Sick type selection and clear timeIn/timeOut
watch(() => editForm.value.type, (newType) => {
  // Logic from old handleTypeChange
  if ([3, 4].includes(newType)) { // Vacation or Sick
    editForm.value.timeIn = ''
    editForm.value.timeOut = ''
    editForm.value.adjusted = ''
  } else if (newType === 5) { // No Show
    editForm.value.timeIn = ''
    editForm.value.timeOut = ''
    editForm.value.total = 0
    editForm.value.adjusted = ''
  }
})

// Watch for time changes to calculate total
watch([() => editForm.value.timeIn, () => editForm.value.timeOut], ([newTimeIn, newTimeOut]) => {
  if (editForm.value.type && ![3, 4, 5].includes(editForm.value.type)) {
    if (newTimeIn && newTimeOut) {
      try {
        const start = new Date(`1970-01-01T${newTimeIn}`)
        const end = new Date(`1970-01-01T${newTimeOut}`)
        if (end > start) {
          const diff = (end - start) / 1000 / 60 / 60 // difference in hours
          editForm.value.total = parseFloat(diff.toFixed(2))
        } else {
          editForm.value.total = 0
        }
      } catch (e) {
        editForm.value.total = 0
      }
    }
  }
})

const startInlineEdit = (entry) => {
  // Use a deep copy to completely decouple the form from the original data
  originalEditForm.value = JSON.parse(JSON.stringify(entry));
  const form = JSON.parse(JSON.stringify(entry));

  // For existing entries, extract just the time part for the input fields.
  if (form.timeIn) {
    form.timeIn = new Date(form.timeIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (form.timeOut) {
    form.timeOut = new Date(form.timeOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  
  editForm.value = form;
  editingEntry.value = entry;
};

const cancelInlineEdit = () => {
  if (editForm.value && editForm.value.isNew) {
    // If it was a new, unsaved row, just remove it.
    const group = entries.value.find(g => g.dateReference === editForm.value.dateReference);
    if (group) {
      group.clockEntries = group.clockEntries.filter(e => e.clockEntryId !== editForm.value.clockEntryId);
    }
  } else if (originalEditForm.value) {
    // For an existing row, find it in the array and restore its original state from our backup.
    const group = entries.value.find(g => g.dateReference === originalEditForm.value.dateReference);
    if (group) {
      const index = group.clockEntries.findIndex(e => e.clockEntryId === originalEditForm.value.clockEntryId);
      if (index !== -1) {
        // Replace the item at the index with the original data to restore it.
        group.clockEntries.splice(index, 1, originalEditForm.value);
      }
    }
  }
  // Reset editing state
  editingEntry.value = null;
  originalEditForm.value = null;
};

const formatTime = (val) => {
  if (!val) return null;
  
  // Handle common time formats
  const timePattern = /^(1[0-9]|2[0-3]|0[0-9]|[0-9])([:.][0-5]\d{0,1}){0,1}(:[0-5]\d){0,1}[ap]{0,1}$/;
  
  if (timePattern.test(val)) {
    // Extract AM/PM indicator if present
    let ampm = val[val.length - 1];
    if (ampm != 'a' && ampm != 'p') {
      // Default to AM if not specified
      ampm = "a";
    }
    
    // Determine separator (. or :)
    const minSep = val.indexOf('.') > -1 ? '.' : ':';
    
    // Extract hours
    let hour;
    if (val.indexOf(minSep) > -1) {
      hour = parseInt(val.split(minSep)[0]);
    } else if (val.indexOf(ampm) > -1) {
      hour = parseInt(val.substring(0, val.indexOf(ampm)));
    } else {
      hour = parseInt(val);
    }
    
    // Handle PM conversion for internal storage (still using 24h format)
    let hour24 = hour;
    if (hour <= 12 && ampm === "p") {
      hour24 = hour === 12 ? 12 : hour + 12; // 12pm stays as 12, others add 12
    } else if (hour === 12 && ampm === "a") {
      hour24 = 0; // 12am should be 00 in 24-hour format
    }
    
    // Ensure hour is in valid range
    if (hour24 < 0 || hour24 > 23) return null;
    
    // Extract minutes
    let min;
    if (val.indexOf(minSep) > -1) {
      min = val.split(minSep)[1];
      // Remove am/pm from minutes if present
      const ampmIndex = min.indexOf('a') > -1 ? min.indexOf('a') : min.indexOf('p');
      if (ampmIndex > -1) min = min.substring(0, ampmIndex);
      // Ensure minutes has two digits
      if (min.length === 1) min = min + "0";
    } else {
      min = "00";
    }
    
    // Format as HH:MM:00 for internal storage (still using 24h format)
    return (hour24 < 10 ? "0" + hour24 : hour24) + ":" + min + ":00";
  }
  
  return null;
}

const rowValidate = (entry) => {
  error.value = null;
  // For regular hours, both in and out times are required
  if (entry.type == 1 && !entry.timeOut) {
    error.value = "Please enter a valid time out";
    return false;
  }
  // For overtime, time in is required
  if (entry.type == 2 && !entry.timeIn) {
    error.value = "Please enter a valid time in";
    return false;
  }
  return true;
};

const saveInlineEdit = async (form, dateRef, options = { refresh: true }) => {
  try {
    let payload = { ...form };

    // 1. Format and Validate Times
    if (![3, 4, 5].includes(payload.type)) {
      const timeIn = formatTime(payload.timeIn);
      const timeOut = formatTime(payload.timeOut);

      if (timeIn == null) {
        error.value = "Please enter a valid time in";
        throw new Error("Invalid time in");
      }
      payload.timeIn = `${dateRef} ${timeIn}`;
      payload.timeOut = timeOut ? `${dateRef} ${timeOut}` : null;
    } else {
      payload.timeIn = null;
      payload.timeOut = null;
    }

    if (!rowValidate(payload)) {
      throw new Error(error.value);
    }

    // 2. Prepare payload with correct data types, matching legacy `updateEntry`
    payload = {
      "clockEntryId": payload.clockEntryId,
      "employeeId": parseInt(payload.employeeId),
      "timeIn": payload.timeIn,
      "timeOut": payload.timeOut,
      "type": parseInt(payload.type),
      "productId": payload.productId ? payload.productId.toString() : "0",
      "productYearId": payload.productYear ? payload.productYear.toString() : "0",
      "activityId": payload.activityId ? payload.activityId.toString() : "0",
      "note": payload.note || "",
      "dateRef": dateRef,
      "total": parseFloat(payload.total || 0),
      "adjusted": parseFloat(payload.adjusted || 0)
    };

    // 3. Determine endpoint (add or update)
    const isNewEntry = !payload.clockEntryId || payload.clockEntryId === 0;
    const endpoint = isNewEntry ? 'addentry' : 'updateentry';

    const response = await api.post(endpoint, payload);

    if (response.data.success) {
      success.value = 'Entry saved successfully!';
      if (options.refresh) {
        await fetchEntries(); // Refresh data
        editingEntry.value = null; // Close edit mode on success
        originalEditForm.value = null;
      }
    } else {
      error.value = response.data.message || `Failed to ${isNewEntry ? 'add' : 'update'} entry.`;
      throw new Error(error.value);
    }
  } catch (err) {
    if (!error.value) {
      error.value = 'An API error occurred while saving.';
    }
    // Re-throw the error so that Promise.all in copyRow can catch it.
    throw err;
  }
};

function formatTimeDisplay(timeString) {
  if (!timeString) return '';
  
  // Remove seconds if present
  let timeWithoutSeconds = timeString;
  if (timeString.split(':').length === 3) {
    timeWithoutSeconds = timeString.split(':').slice(0, 2).join(':');
  }
  
  // Parse the time
  const [hoursStr, minutesStr] = timeWithoutSeconds.split(':');
  const hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);
  
  if (isNaN(hours) || isNaN(minutes)) {
    return timeWithoutSeconds; // Return original if parsing fails
  }
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  // Format the time as h:MM AM/PM
  return `${hours12}:${minutesStr.padStart(2, '0')} ${period}`;
}

const deleteEntry = async (entry) => {
  if (window.confirm(`Are you sure you want to delete this entry for ${entry.employeeName}?`)) {
    try {
      const response = await api.post('deleteentry', entry);
      if (response.data.success) {
        success.value = 'Entry deleted successfully!';
        // Remove from local array to update UI instantly
        entries.value.forEach(group => {
          group.clockEntries = group.clockEntries.filter(e => e.clockEntryId !== entry.clockEntryId);
        });
      } else {
        error.value = response.data.message || 'Failed to delete entry.';
      }
    } catch (err) {
      error.value = 'An API error occurred while deleting.';
    }
  }
};

const addRow = (dateReference, anchorEntry) => {
  const group = entries.value.find(g => g.dateReference === dateReference);
  if (group) {
    const newEntry = {
      clockEntryId: 0,
      employeeId: anchorEntry.employeeId,
      employeeName: anchorEntry.employeeName,
      employeeNumber: anchorEntry.employeeNumber,
      dateReference: dateReference,
      timeIn: '',
      timeOut: '',
      total: 0,
      adjusted: '',
      type: 1, // Default to Regular
      productId: null,
      productYear: null,
      activityId: null,
      isNew: true
    };
    const anchorIndex = group.clockEntries.findIndex(e => e.clockEntryId === anchorEntry.clockEntryId);
    group.clockEntries.splice(anchorIndex + 1, 0, newEntry);
    startInlineEdit(newEntry);
  }
};

const deleteRow = async (clockEntryId) => {
  if (!confirm('Are you sure you want to delete this entry?')) {
    return;
  }

  try {
    const response = await api.delete(`deleteentry/${clockEntryId}`);
    if (response.data.success) {
      success.value = 'Entry deleted successfully!';
      await fetchEntries(); // Refresh data
    } else {
      error.value = response.data.message || 'Failed to delete entry.';
    }
  } catch (err) {
    error.value = 'An API error occurred while deleting the entry.';
  }
};

const copyRow = async (dateReference, entryToCopy) => {
  const group = entries.value.find(g => g.dateReference === dateReference);
  if (!group) {
    error.value = "Could not find the date group to copy to.";
    return;
  }

  // Find all other entries in the same group to apply the changes to.
  const targetEntries = group.clockEntries.filter(e => e.clockEntryId !== entryToCopy.clockEntryId);

  if (targetEntries.length === 0) {
    success.value = "No other entries in this group to copy to.";
    return;
  }

  // Prepare the data to be copied from the source entry.
  const dataToCopy = {
    timeIn: entryToCopy.timeIn ? new Date(entryToCopy.timeIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    timeOut: entryToCopy.timeOut ? new Date(entryToCopy.timeOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
    type: entryToCopy.type,
    productId: entryToCopy.productId,
    productYear: entryToCopy.productYear,
    activityId: entryToCopy.activityId,
    note: entryToCopy.note,
  };

  // Create a save promise for each target entry without refreshing immediately.
  const savePromises = targetEntries.map(targetEntry => {
    const payload = { ...targetEntry, ...dataToCopy };
    return saveInlineEdit(payload, dateReference, { refresh: false });
  });

  try {
    // Wait for all save operations to complete.
    await Promise.all(savePromises);
    success.value = `Successfully copied entry details to ${targetEntries.length} other employees.`;
  } catch (err) {
    // The error is already set inside saveInlineEdit.
    error.value = "An error occurred during the copy operation. Some entries may not have been updated.";
  } finally {
    // Refresh the entire entry list once all operations are done.
    await fetchEntries();
  }
};

// Mapping of type codes to display names
const typeOptions = [
  { id: 1, name: 'Regular' },
  { id: 2, name: 'Overtime' },
  { id: 3, name: 'Vacation' },
  { id: 4, name: 'Sick' },
  { id: 5, name: 'No Show / Absent' }
]

const products = ref([])
const productYears = ref([])
const activities = ref([])
const ranges = ref([])
const employees = ref([])
const crewBosses = ref([])
const filteredEmployees = computed(() => {
  if (!selectedBoss.value) {
    return employees.value
  }
  return employees.value.filter(emp => emp.crewBossId === selectedBoss.value.id)
})
const selectedBoss = ref(null)
const selectedRange = ref(null)
const start = ref('')
const end = ref('')
const selectedEmployee = ref(null)
const loading = ref(false)
const error = ref('')

// Helper function for MM/DD/YYYY formatting
function getFormattedDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}/${d}/${y}`
}

// Fetch supporting data (products, activities, ranges, etc.)
const fetchSupportingData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('gettimesheetdata')
    products.value = res.data.accountProducts
    productYears.value = res.data.accountProductYears
    activities.value = res.data.timesheetActivities
    ranges.value = res.data.dateRangeOptions
    employees.value = res.data.employees || []
    if (!employees.value || employees.value.length === 0) {
      const empRes = await api.get('getEmployees')
      employees.value = empRes.data || []
    }
    const today = getFormattedDate(new Date())
    selectedRange.value = ranges.value.find(val => {
      const [rangeStart, rangeEnd] = val.range.split('|')
      return rangeStart <= today && rangeEnd >= today
    })
    if (selectedRange.value) {
      [start.value, end.value] = selectedRange.value.range.split('|')
    }
    await fetchCrewBosses()
  } catch (e) {
    error.value = 'Failed to load supporting data.'
  } finally {
    loading.value = false
  }
}

const fetchCrewBosses = async () => {
  try {
    const res = await api.get('getcrewbosses')
    crewBosses.value = res.data || []
  } catch (e) {
    error.value = 'Failed to load crew bosses.'
  }
}

// Fetch time entries using selected filters
const fetchEntries = async () => {
  if (!start.value || !end.value) {
    error.value = 'Please select a valid date range.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    let bossId = selectedBoss.value && selectedBoss.value.id ? selectedBoss.value.id : 'null'
    let url = `crewclockentries?start=${start.value}&end=${end.value}&id=${bossId}`
    const res = await api.get(url)
    entries.value = res.data
    if (Array.isArray(entries.value)) {
      entries.value.forEach(group => {
        if (Array.isArray(group.clockEntries)) {
          group.clockEntries.forEach(entry => {
            if (!entry.typeName) {
              const typeOpt = typeOptions.find(opt => opt.id === entry.type)
              entry.typeName = typeOpt ? typeOpt.name : entry.type
            }
          })
        }
      })
    }
  } catch (e) {
    error.value = 'Failed to load time entries.'
  } finally {
    loading.value = false
  }
}

// --- Watchers for Reactive Filtering ---
watch(selectedBoss, (newBoss, oldBoss) => {
  if (newBoss !== oldBoss) {
    selectedEmployee.value = null; // Reset employee when boss changes
    fetchEntries();
  }
});

function onRangeChange() {
  if (selectedRange.value) {
    [start.value, end.value] = selectedRange.value.range.split('|');
    fetchEntries();
  }
}

function onDateChange() {
  selectedRange.value = null; // Clear pay period if custom date is used
  fetchEntries();
}

onMounted(async () => {
  await fetchSupportingData();
  if (start.value && end.value) {
    fetchEntries();
  }
});

function clearMessages() {
  error.value = '';
  success.value = '';
}

function validateDate(dateStr) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)
}
</script>