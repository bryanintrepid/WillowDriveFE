<template>
  <div>
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-header">
            <ul class="nav nav-tabs nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
              <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'products' }" @click="tab = 'products'" data-bs-toggle="tab" href="#products" role="tab">
                  Products
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'productyears' }" @click="tab = 'productyears'" data-bs-toggle="tab" href="#productyears" role="tab">
                  Product Years
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'activities' }" @click="tab = 'activities'" data-bs-toggle="tab" href="#activities" role="tab">
                  Activities
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'admin' }" @click="tab = 'admin'" data-bs-toggle="tab" href="#admin" role="tab">
                  Admin
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'presets' }" @click="tab = 'presets'" data-bs-toggle="tab" href="#presets" role="tab">
                  Presets
                </a>
              </li>
            </ul>
          </div>
          <div class="card-body">
            <div class="tab-content">
              <!-- Products Tab -->
              <div class="tab-pane" :class="{ active: tab === 'products' }" id="products" role="tabpanel">
                <h5 class="card-title">Products</h5>
                <ul class="list-group">
                  <li v-for="(product, index) in products" :key="product.id" class="list-group-item d-flex align-items-center">
                    <div class="form-check form-switch me-3">
                      <input class="form-check-input" type="checkbox" role="switch" v-model="products[index].inTimeClock" @change="toggleProduct(product.id)">
                    </div>
                    <span>{{ product.code }} - {{ product.name }}</span>
                  </li>
                </ul>
              </div>

              <!-- Product Years Tab -->
              <div class="tab-pane" :class="{ active: tab === 'productyears' }" id="productyears" role="tabpanel">
                <h5 class="card-title">Product Years</h5>
                <ul class="list-group">
                  <li v-for="(product, index) in productYears" :key="product.id" class="list-group-item d-flex align-items-center">
                    <div class="form-check form-switch me-3">
                      <input class="form-check-input" type="checkbox" role="switch" v-model="productYears[index].inTimeClock" @change="toggleProductYear(product.id)">
                    </div>
                    <span>{{ product.name }}</span>
                  </li>
                </ul>
              </div>

              <!-- Activities Tab -->
              <div class="tab-pane" :class="{ active: tab === 'activities' }" id="activities" role="tabpanel">
                <h5 class="card-title">Activities</h5>
                <ul class="list-group">
                  <li v-for="(activity, index) in activities" :key="activity.id" class="list-group-item d-flex align-items-center">
                    <div class="form-check form-switch me-3">
                      <input class="form-check-input" type="checkbox" role="switch" v-model="activities[index].inTimeClock" @change="toggleActivity(activity.id)">
                    </div>
                    <span>{{ activity.code }} - {{ activity.name }}</span>
                  </li>
                </ul>
              </div>

              <!-- Admin Tab -->
              <div class="tab-pane" :class="{ active: tab === 'admin' }" id="admin" role="tabpanel">
                <h5 class="card-title">Admin Settings</h5>
                <hr/>
                <div class="list-group list-group-flush">
                  <div class="list-group-item">
                    <div class="row align-items-center">
                      <div class="col-md-3 fw-medium">Min Time</div>
                      <div class="col-md-6">
                        <input type="time" class="form-control" v-model="minClockTime" style="width: 200px;">
                      </div>
                      <div class="col-md-3">
                        <button class="btn btn-primary btn-sm" @click="updateMinTime">Update</button>
                      </div>
                    </div>
                  </div>
                  <div class="list-group-item">
                    <div class="row align-items-center">
                      <div class="col-md-3 fw-medium">Max Time</div>
                      <div class="col-md-6">
                        <input type="time" class="form-control" v-model="maxClockTime" style="width: 200px;">
                      </div>
                      <div class="col-md-3">
                        <button class="btn btn-primary btn-sm" @click="updateMaxTime">Update</button>
                      </div>
                    </div>
                  </div>
                  <div class="list-group-item">
                    <div class="row align-items-center">
                      <div class="col-md-3 fw-medium">Tardy After</div>
                      <div class="col-md-6">
                        <input type="time" class="form-control" v-model="tardyAfter" style="width: 200px;">
                      </div>
                      <div class="col-md-3">
                        <button class="btn btn-primary btn-sm" @click="updateTardyTime">Update</button>
                      </div>
                    </div>
                  </div>
                  <div class="list-group-item">
                    <div class="row align-items-center">
                      <div class="col-md-3 fw-medium">Max Login Wait (seconds)</div>
                      <div class="col-md-6">
                        <label for="maxLoginWaitSlider" class="form-label">{{ maxLoginWait }} seconds</label>
                        <input type="range" class="form-range" min="0" max="60" step="1" v-model="maxLoginWait" @change="updateMaxLoginWait(maxLoginWait)">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Presets Tab -->
              <div class="tab-pane" :class="{ active: tab === 'presets' }" id="presets" role="tabpanel">
                <h5 class="card-title">Preset Codes</h5>
                <div style="max-width: 400px;">
                  <ul class="list-group mb-3">
                    <li v-for="p in presets" :key="p.code" class="list-group-item d-flex justify-content-between align-items-center">
                      {{ p.code }}
                      <button class="btn btn-sm btn-danger" @click="deletePreset(p.code)">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </li>
                  </ul>
                  <div class="input-group">
                    <input type="text" class="form-control" placeholder="Add 9-digit code" v-model="preset">
                    <button class="btn btn-success" type="button" @click="addPreset">Add</button>
                  </div>
                  <div v-if="error" class="text-danger mt-2">{{ error }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fix for time input padding issue with form-control class */
input[type="time"].form-control {
  padding-top: 0.375rem; 
  padding-bottom: 0.375rem;
}
</style>

<script setup >
import { ref, onMounted, computed, watch } from 'vue'
import api from '@/services/api'

const options = ref([])
const products = ref([])
const productYears = ref([])
const activities = ref([])
const error = ref(null)
const message = ref(null)
const tab = ref('products')
const selectedProducts = ref(null)
const minClockTime = ref('8:00')
const maxClockTime = ref('17:00')
const tardyAfter = ref('08:07')
const maxLoginWait = ref(5)
const presets = ref([])
const preset = ref(null)
const settings = ref({})
const objMarkerLabel = { 0: '0', 5: '5', 10: '10', 15: '15', 20: '20', 25: '25', 30: '30', 35: '35', 40: '40', 45: '45', 50: '50', 55: '55' }

function showAlert(val) {
  alert(val);
}

function updateMinTime() {
  api.post("updateMinClockTime", minClockTime.value).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Updated"
    } else {

    }
  }).catch(function (error) {

  });
}

function updateMaxTime() {

  api.post("updateMaxClockTime", maxClockTime.value).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Updated"
      
    } else {

    }
  }).catch(function (error) {

  });
}

function updateTardyTime() {

api.post("updateTardyTime", tardyAfter.value).then(function (response) {
  //debugger;
  if(response.data) {
    message.value = "Updated"
    
  } else {

  }
}).catch(function (error) {

});
}

function updateMaxLoginWait(val) {
  var data = { "value": val };
  api.post("updateMaxLoginWait", val).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Updated"
    } else {

    }
  }).catch(function (error) {

  });
}

function addPreset() {
  var data = { "key": preset.value };
  //debugger;
  if(preset.value.length != 9) {
    return;
  }
  api.post("addpreset", data).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Updated"
      
      presets.value.push({ "code": preset.value })
      console.log(presets.value)
      preset.value = null
      message.value = ""
      error.value = ""
    } else {
      error.value = "Invalid Code"
    }
  }).catch(function (error) {

  });
}

function deletePreset(val) {
  var data = { "key": val };
  if(val.length != 9) {
    return;
  }
  api.post("deletePreset", data).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Updated"
      getPresets();
    } else {

    }
  }).catch(function (error) {

  });
}

function toggleProduct(val) {
  var data = { "key": val };
  api.post("toggleproduct", data).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Toggled"
      products.value = response.data.accountProducts;
    } else {

    }
  }).catch(function (error) {

  });
}

function toggleProductYear(val) {
  var data = { "key": val };
  api.post("toggleproductyear", data).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Toggled"
      productYears.value = response.data.accountProductYears;
    } else {

    }
  }).catch(function (error) {

  });
}

function toggleActivity(val) {
  var data = { "key": val };
  api.post("toggleactivity", data).then(function (response) {
    //debugger;
    if(response.data) {
      message.value = "Toggled"
      activities.value = response.data.timesheetActivities;
    } else {

    }
  }).catch(function (error) {

  });
}

function getProductData() {
  api.get("getproductdata").then(function (response) {
            //debugger;
            products.value = response.data.accountProducts;
            productYears.value = response.data.accountProductYears;
            activities.value = response.data.timesheetActivities;

          }).catch(function (error) {
            debugger;
            // if (error.response == null) {
            //   hasError = true;
            //   mainStore.setError("A network or other connection error has occurred.");
            //   //this.setError("A network or other connection error has occurred.");
            //   //alert("A network or other connection error has occurred.");
            // } else if (error.response.status == 400) {
            //   that.hasError = true;
            //   that.mainStore.setError("An error has occurred, please try again. ");
            //   //this.setError("An error has occurred, please try again. ");
            //   //alert("An error has occurred, please try again. ");
            // };
          });
}

function getSettings() {
  api.get("getclocksettings").then(function (response) {
            //debugger;
            minClockTime.value = response.data.minClockTime;
            maxClockTime.value = response.data.maxClockTime;
            maxLoginWait.value = response.data.maxLoginWait;
            tardyAfter.value = response.data.tardyTime;

           getPresets();
          }).catch(function (error) {
            debugger;
            // if (error.response == null) {
            //   hasError = true;
            //   mainStore.setError("A network or other connection error has occurred.");
            //   //this.setError("A network or other connection error has occurred.");
            //   //alert("A network or other connection error has occurred.");
            // } else if (error.response.status == 400) {
            //   that.hasError = true;
            //   that.mainStore.setError("An error has occurred, please try again. ");
            //   //this.setError("An error has occurred, please try again. ");
            //   //alert("An error has occurred, please try again. ");
            // };
          });
}

function getPresets() {
  api.get("getpresets").then(function (response) {
              //debugger;
              presets.value = response.data;
            }).catch(function (error) {
              debugger;
              // if (error.response == null) {
              //   hasError = true;
              //   mainStore.setError("A network or other connection error has occurred.");
              //   //this.setError("A network or other connection error has occurred.");
              //   //alert("A network or other connection error has occurred.");
              // } else if (error.response.status == 400) {
              //   that.hasError = true;
              //   that.mainStore.setError("An error has occurred, please try again. ");
              //   //this.setError("An error has occurred, please try again. ");
              //   //alert("An error has occurred, please try again. ");
              // };
            });
}


function init() {
  getProductData()
  getSettings()
}


function filterFnAutoselect (val, update, abort) {
  // call abort() at any time if you can't retrieve data somehow
  var yes = val;
  setTimeout(() => {
    update(
      () => {
        if (val === '') {
          options.value = employees.value
        }
        else {
        //debugger;
          const needle = val.toLowerCase()
          options.value = employees.value.filter(v => v.name.toLowerCase().indexOf(needle) > -1 ||
          v.employeeNumber.toLowerCase().indexOf(needle) > -1)
        }
      },

      // "ref" is the Vue reference to the QSelect
      ref => {
        if (val !== '' && ref.options.length > 0 && ref.getOptionIndex() === -1) {
          ref.moveOptionSelection(1, true) // focus the first selectable option and do not update the input-value
          ref.toggleOption(ref.options[ ref.optionIndex ], true) // toggle the focused option
        }
      }
    )
  }, 300)
}

init()

</script>
