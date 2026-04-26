<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">
            {{ employee?.name || 'Employee Detail' }}
            <span v-if="employee?.preferredName" class="text-muted fs-14">({{ employee.preferredName }})</span>
            <span v-if="isDirty" class="badge bg-warning-subtle text-warning ms-2 fs-12">Unsaved</span>
          </h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'employee-list' }">Employees</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">{{ employee?.employeeNumber || 'Detail' }}</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button v-if="!employee?.lastTermDate" class="btn btn-outline-danger btn-sm" @click="showTermModal = true">
            <i class="ri-user-unfollow-line me-1"></i>Terminate
          </button>
          <button v-if="employee?.lastTermDate" class="btn btn-outline-success btn-sm" @click="showRehireModal = true">
            <i class="ri-user-follow-line me-1"></i>Rehire
          </button>
          <button class="btn btn-primary btn-sm" @click="saveEmployee" :disabled="!isDirty || saving">
            <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Save' }}
          </button>
          <router-link :to="{ name: 'employee-list' }" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger mx-3">{{ error }}</div>

    <div v-else-if="employee">
      <!-- Save feedback -->
      <div v-if="saveMessage" class="alert alert-success mx-0 py-2" role="alert">{{ saveMessage }}</div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item" v-for="tab in tabs" :key="tab.id">
          <a class="nav-link" :class="{ active: activeTab === tab.id }" href="#" @click.prevent="activeTab = tab.id">
            {{ tab.label }}
          </a>
        </li>
      </ul>

      <!-- Tab: Info -->
      <div v-show="activeTab === 'info'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Personal Information</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <label class="form-label">Employee #</label>
                    <input type="text" class="form-control form-control-sm" :value="employee.employeeNumber" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">First Name</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.firstName" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Last Name</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.lastName" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Middle Names</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.middleNames" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Preferred Name</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.preferredName" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.title" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Job Title</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.jobTitle" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Sex</label>
                    <select class="form-select form-select-sm" v-model="employee.sex">
                      <option :value="null">—</option>
                      <option :value="0">Male</option>
                      <option :value="1">Female</option>
                    </select>
                  </div>
                  <div class="col-4">
                    <label class="form-label">Marital Status</label>
                    <select class="form-select form-select-sm" v-model="employee.maritalStatus">
                      <option :value="null">—</option>
                      <option :value="0">Married</option>
                      <option :value="1">Single</option>
                    </select>
                  </div>
                  <div class="col-4">
                    <label class="form-label">Birth Date</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.birthDate" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">SSN</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.socialSecurityNumber" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">License #</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.licenseNumber" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Contact</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.phoneNumber" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Phone 2</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.phoneNumber2" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control form-control-sm" v-model="employee.emailAddress" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Email 2</label>
                    <input type="email" class="form-control form-control-sm" v-model="employee.emailAddress2" />
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Address</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Street</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.street1" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Street 2</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.street2" />
                  </div>
                  <div class="col-5">
                    <label class="form-label">City</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.city" />
                  </div>
                  <div class="col-3">
                    <label class="form-label">State</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.state" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Zip</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.zip" />
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Emergency Contact</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.ecName" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Phone</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.ecPhone" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control form-control-sm" v-model="employee.ecEmailAddress" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Compensation -->
      <div v-show="activeTab === 'compensation'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Pay Information</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Pay Type</label>
                    <select class="form-select form-select-sm" v-model="employee.payType">
                      <option :value="0">Hourly</option>
                      <option :value="1">Salaried</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Pay Period</label>
                    <select class="form-select form-select-sm" v-model="employee.payPeriod">
                      <option :value="0">Weekly</option>
                      <option :value="1">Biweekly</option>
                      <option :value="2">Monthly</option>
                    </select>
                  </div>
                  <div class="col-4">
                    <label class="form-label">Base Rate</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.baseRate" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Extra Rate</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.extraRate" />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Pay Rate</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.payRate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Extra Reason</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.extraReason" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Salary</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.salary" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Rate Change Reason</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.rateReason"
                      placeholder="Optional reason for pay rate change" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Crew Boss</label>
                    <select class="form-select form-select-sm" v-model="employee.crewBossId">
                      <option :value="null">— None —</option>
                      <option v-for="cb in crewBosses" :key="cb.id" :value="cb.id">{{ cb.name }}</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-4">
                      <input class="form-check-input" type="checkbox" v-model="employee.compensationProtected" id="compProtected" />
                      <label class="form-check-label" for="compProtected">Compensation Protected</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Employment Dates</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Original Hire</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.originalHireDate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Last Hire</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.lastHireDate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Last Term Date</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.lastTermDate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Layoff Date</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.layoffDate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Last Raise Date</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.lastRaiseDate" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Salaried Date</label>
                    <input type="date" class="form-control form-control-sm" v-model="employee.salariedDate" />
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" v-model="employee.temporary" id="temporary" />
                      <label class="form-check-label" for="temporary">Temporary</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" v-model="employee.doNotRehire" id="doNotRehire" />
                      <label class="form-check-label" for="doNotRehire">Do Not Rehire</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Vacation & Sick Leave</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <label class="form-label">Vacation Available</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" :value="employee.vacationAvailable" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Vacation Used</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" :value="employee.vacationHoursUsed" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Vacation Left</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" :value="employee.vacationHoursLeft" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Hrs/Year</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.vacationHoursPerYear" />
                  </div>
                  <div class="col-4">
                    <div class="form-check mt-4">
                      <input class="form-check-input" type="checkbox" v-model="employee.accrueVacation" id="accrueVac" />
                      <label class="form-check-label" for="accrueVac">Accrue Vacation</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check mt-4">
                      <input class="form-check-input" type="checkbox" v-model="employee.holidayEligible" id="holiday" />
                      <label class="form-check-label" for="holiday">Holiday Eligible</label>
                    </div>
                  </div>
                  <hr />
                  <div class="col-4">
                    <label class="form-label">Sick Available</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" :value="employee.sickLeaveAvailable" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Sick Used</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" :value="employee.sickLeaveHoursUsed" disabled />
                  </div>
                  <div class="col-4">
                    <label class="form-label">Sick Hrs/Year</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.sickLeaveHoursPerYear" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Tax & Withholding -->
      <div v-show="activeTab === 'tax'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Federal Withholding</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Exemptions</label>
                    <input type="number" class="form-control form-control-sm" v-model="employee.exemptions" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Extra Federal W/H</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.extraFederalWithholding" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Tax Exemptions</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.fdwhExempt" id="fdwhExempt" />
                      <label class="form-check-label" for="fdwhExempt">FDWH Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.ficaExempt" id="ficaExempt" />
                      <label class="form-check-label" for="ficaExempt">FICA Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.futaExempt" id="futaExempt" />
                      <label class="form-check-label" for="futaExempt">FUTA Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.sutaExempt" id="sutaExempt" />
                      <label class="form-check-label" for="sutaExempt">SUTA Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.lniExempt" id="lniExempt" />
                      <label class="form-check-label" for="lniExempt">LNI Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.ltcaExempt" id="ltcaExempt" />
                      <label class="form-check-label" for="ltcaExempt">LTCA Exempt</label>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.nonResidentAlien" id="nra" />
                      <label class="form-check-label" for="nra">Non-Resident Alien</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: ACH -->
      <div v-show="activeTab === 'ach'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Primary Bank Account</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Routing Number</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankRoutingNumber" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Account Number</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankAccountNumber" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Account Type</label>
                    <select class="form-select form-select-sm" v-model="employee.bankAccountType">
                      <option :value="null">—</option>
                      <option :value="0">Checking</option>
                      <option :value="1">Savings</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Bank Code</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankCode" />
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" v-model="employee.achAutoDeposit" id="achAuto" />
                      <label class="form-check-label" for="achAuto">Auto Deposit</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" v-model="employee.bankPreauthorization" id="bankPreauth" />
                      <label class="form-check-label" for="bankPreauth">Preauthorization</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Secondary Bank Account</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Routing Number</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankRoutingNumber2" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Account Number</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankAccountNumber2" />
                  </div>
                  <div class="col-6">
                    <label class="form-label">Account Type</label>
                    <select class="form-select form-select-sm" v-model="employee.bankAccountType2">
                      <option :value="null">—</option>
                      <option :value="0">Checking</option>
                      <option :value="1">Savings</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Bank Code</label>
                    <input type="text" class="form-control form-control-sm" v-model="employee.bankCode2" />
                  </div>
                  <div class="col-6">
                    <div class="form-check mt-2">
                      <input class="form-check-input" type="checkbox" v-model="employee.bankPreauthorization2" id="bankPreauth2" />
                      <label class="form-check-label" for="bankPreauth2">Preauthorization</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Benefits -->
      <div v-show="activeTab === 'benefits'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">Insurance Enrollment</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.healthInsuranceEnrolled" id="healthEnrolled" />
                      <label class="form-check-label" for="healthEnrolled">Health Insurance Enrolled</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.healthInsuranceSigned" id="healthSigned" />
                      <label class="form-check-label" for="healthSigned">Health Signed</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.dentalInsuranceSigned" id="dentalSigned" />
                      <label class="form-check-label" for="dentalSigned">Dental Signed</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.visionInsuranceSigned" id="visionSigned" />
                      <label class="form-check-label" for="visionSigned">Vision Signed</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.lifeInsuranceSigned" id="lifeSigned" />
                      <label class="form-check-label" for="lifeSigned">Life Insurance Signed</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.voluntaryLife" id="volLife" />
                      <label class="form-check-label" for="volLife">Voluntary Life</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Health Premium</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.healthInsurancePremium" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">401k & Other</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.enrolled401K" id="enrolled401k" />
                      <label class="form-check-label" for="enrolled401k">Enrolled 401k</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.eligibleFor401k" id="eligible401k" />
                      <label class="form-check-label" for="eligible401k">Eligible for 401k</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Repayment Amount</label>
                    <input type="number" step="0.01" class="form-control form-control-sm" v-model="employee.repaymentAmount" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Dependents -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Dependents</h5>
                <button class="btn btn-sm btn-primary" @click="addDependent">
                  <i class="ri-add-line"></i> Add
                </button>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive" v-if="employee.dependents?.length">
                  <table class="table table-sm table-nowrap align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Relationship</th>
                        <th>DOB</th>
                        <th style="width: 50px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="dep in employee.dependents" :key="dep.id">
                        <td><input type="text" class="form-control form-control-sm" v-model="dep.name" /></td>
                        <td><input type="text" class="form-control form-control-sm" v-model="dep.relationship" /></td>
                        <td><input type="date" class="form-control form-control-sm" v-model="dep.dateOfBirth" /></td>
                        <td>
                          <button class="btn btn-sm btn-outline-danger" @click="removeDependent(dep)">
                            <i class="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="p-3 text-muted text-center">No dependents</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Deductions -->
      <div v-show="activeTab === 'deductions'">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Employee Deductions</h5>
            <button class="btn btn-sm btn-primary" @click="showAddDeduction = !showAddDeduction">
              <i class="ri-add-line"></i> Add Deduction
            </button>
          </div>
          <div v-if="showAddDeduction" class="card-body border-bottom">
            <div class="row g-2 align-items-end">
              <div class="col-3">
                <label class="form-label">Deduction Code</label>
                <input type="text" class="form-control form-control-sm" v-model="newDeduction.deductionCode" placeholder="Code" />
              </div>
              <div class="col-3">
                <label class="form-label">Rate</label>
                <input type="number" step="0.01" class="form-control form-control-sm" v-model="newDeduction.rate" />
              </div>
              <div class="col-3">
                <button class="btn btn-sm btn-primary" @click="addEmployeeDeduction">Add</button>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive" v-if="employee.deductions?.length">
              <table class="table table-nowrap align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th class="text-end">Rate</th>
                    <th>Added</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ded in employee.deductions" :key="ded.deductionCode">
                    <td>{{ ded.deductionCode }}</td>
                    <td>{{ ded.description }}</td>
                    <td class="text-end">{{ ded.rate }}</td>
                    <td>{{ ded.createdDate }}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-danger" @click="removeEmployeeDeduction(ded)">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-3 text-muted text-center">No deductions assigned</div>
          </div>
        </div>
      </div>

      <!-- Tab: HR -->
      <div v-show="activeTab === 'hr'">
        <div class="row">
          <div class="col-lg-6">
            <div class="card">
              <div class="card-header"><h5 class="card-title mb-0">HR Checklist</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.application" id="application" />
                      <label class="form-check-label" for="application">Application</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.workerInfoNotice" id="workerInfo" />
                      <label class="form-check-label" for="workerInfo">Worker Info Notice</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.w4" id="w4" />
                      <label class="form-check-label" for="w4">W-4</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.i9" id="i9" />
                      <label class="form-check-label" for="i9">I-9</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.socialSecurityCard" id="ssCard" />
                      <label class="form-check-label" for="ssCard">Social Security Card</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.driversLicenseCopy" id="dlCopy" />
                      <label class="form-check-label" for="dlCopy">Driver's License Copy</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.handbook" id="handbook" />
                      <label class="form-check-label" for="handbook">Handbook</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.directDeposit" id="ddForm" />
                      <label class="form-check-label" for="ddForm">Direct Deposit Form</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.orientation" id="orientation" />
                      <label class="form-check-label" for="orientation">Orientation</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.orientationClass" id="orientClass" />
                      <label class="form-check-label" for="orientClass">Orientation Class</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" v-model="employee.safetyClass" id="safetyClass" />
                      <label class="form-check-label" for="safetyClass">Safety Class</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <!-- Notes -->
            <div class="card" v-for="noteType in noteTypes" :key="noteType.id">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">{{ noteType.label }}</h5>
                <button class="btn btn-sm btn-outline-primary" @click="noteType.showAdd = !noteType.showAdd">
                  <i class="ri-add-line"></i>
                </button>
              </div>
              <div v-if="noteType.showAdd" class="card-body border-bottom">
                <textarea class="form-control form-control-sm" rows="2" v-model="noteType.newNote" placeholder="Add a note..."></textarea>
                <button class="btn btn-sm btn-primary mt-2" @click="addNote(noteType)" :disabled="!noteType.newNote">Save Note</button>
              </div>
              <div class="card-body p-0">
                <div v-if="noteType.notes?.length" class="list-group list-group-flush">
                  <div v-for="note in noteType.notes" :key="note.id" class="list-group-item py-2">
                    <div class="d-flex justify-content-between">
                      <small class="text-muted">{{ note.createdDate }} — {{ note.createdBy }}</small>
                    </div>
                    <p class="mb-0 mt-1">{{ note.note }}</p>
                  </div>
                </div>
                <div v-else class="p-3 text-muted text-center">No notes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Files -->
      <div v-show="activeTab === 'files'">
        <div class="row">
          <div class="col-lg-4" v-for="ft in fileTypes" :key="ft.id">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">{{ ft.label }}</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <input type="file" class="form-control form-control-sm" :ref="el => ft.fileInput = el" />
                  <input type="text" class="form-control form-control-sm mt-1" v-model="ft.description" placeholder="Description (optional)" />
                  <button class="btn btn-sm btn-primary mt-1" @click="uploadFile(ft)" :disabled="ft.uploading">
                    <i class="ri-upload-2-line me-1"></i>{{ ft.uploading ? 'Uploading...' : 'Upload' }}
                  </button>
                </div>
                <div v-if="ft.files?.length" class="list-group list-group-flush">
                  <div v-for="f in ft.files" :key="f.id" class="list-group-item py-2 px-0">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <a :href="f.url" target="_blank" class="text-decoration-none">{{ f.fileName }}</a>
                        <br /><small class="text-muted">{{ f.fileSize }} KB — {{ f.createdDate }} — {{ f.createdBy }}</small>
                        <span v-if="f.description"><br /><small>{{ f.description }}</small></span>
                      </div>
                      <button class="btn btn-sm btn-outline-danger" @click="deleteFile(ft, f)" title="Delete">
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-muted text-center">No files</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: History -->
      <div v-show="activeTab === 'history'">
        <div class="card">
          <div class="card-header"><h5 class="card-title mb-0">Employee History</h5></div>
          <div class="card-body p-0">
            <div v-if="history.length" class="list-group list-group-flush">
              <div v-for="item in history" :key="item.notationId" class="list-group-item py-2">
                <div class="d-flex justify-content-between">
                  <span class="badge bg-primary-subtle text-primary">{{ item.categoryName || item.summary || 'Note' }}</span>
                  <small class="text-muted">{{ item.createdDate }} — {{ item.createdBy }}</small>
                </div>
                <p class="mb-0 mt-1">{{ item.note }}</p>
              </div>
            </div>
            <div v-else class="p-3 text-muted text-center">No history records</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Terminate Modal -->
    <div v-if="showTermModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger-subtle">
            <h5 class="modal-title">Terminate Employee</h5>
            <button type="button" class="btn-close" @click="showTermModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Termination Date</label>
                <input type="date" class="form-control" v-model="termForm.termDate" />
              </div>
              <div class="col-6">
                <label class="form-label">Type</label>
                <select class="form-select" v-model="termForm.termKind">
                  <option :value="0">General</option>
                  <option :value="1">Layoff</option>
                  <option :value="2">Voluntary</option>
                  <option :value="3">Temporary</option>
                  <option :value="4">For Cause</option>
                  <option :value="5">Leave of Absence</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Reason</label>
                <textarea class="form-control" v-model="termForm.termReason" rows="2"></textarea>
              </div>
              <div class="col-12">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" v-model="termForm.doNotRehire" id="termDoNotRehire" />
                  <label class="form-check-label" for="termDoNotRehire">Do Not Rehire</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="showTermModal = false">Cancel</button>
            <button type="button" class="btn btn-danger" @click="terminateEmployee"
              :disabled="!termForm.termDate || !termForm.termReason">
              Terminate
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rehire Modal -->
    <div v-if="showRehireModal" class="modal d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success-subtle">
            <h5 class="modal-title">Rehire Employee</h5>
            <button type="button" class="btn-close" @click="showRehireModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Rehire Date</label>
                <input type="date" class="form-control" v-model="rehireForm.hireDate" />
              </div>
              <div class="col-6">
                <label class="form-label">Crew Boss</label>
                <select class="form-select" v-model="rehireForm.crewBossId">
                  <option :value="null">— None —</option>
                  <option v-for="cb in crewBosses" :key="cb.id" :value="cb.id">{{ cb.name }}</option>
                </select>
              </div>
              <div class="col-12">
                <div class="form-check"><input class="form-check-input" type="checkbox" v-model="rehireForm.keepOldHireDate" id="rhKeepDate" />
                  <label class="form-check-label" for="rhKeepDate">Keep old hire date</label></div>
                <div class="form-check"><input class="form-check-input" type="checkbox" v-model="rehireForm.resetHoursWorked" id="rhResetHours" />
                  <label class="form-check-label" for="rhResetHours">Reset hours worked</label></div>
                <div class="form-check"><input class="form-check-input" type="checkbox" v-model="rehireForm.resetBaseRate" id="rhResetRate" />
                  <label class="form-check-label" for="rhResetRate">Reset pay rate to base rate</label></div>
                <div class="form-check"><input class="form-check-input" type="checkbox" v-model="rehireForm.terminate401kEligibility" id="rhReset401k" />
                  <label class="form-check-label" for="rhReset401k">Terminate 401K eligibility</label></div>
                <div class="form-check"><input class="form-check-input" type="checkbox" v-model="rehireForm.clearVacationBalance" id="rhClearVac" />
                  <label class="form-check-label" for="rhClearVac">Clear vacation balance</label></div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="showRehireModal = false">Cancel</button>
            <button type="button" class="btn btn-success" @click="rehireEmployee" :disabled="!rehireForm.hireDate">
              Rehire
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const saveMessage = ref('')
const employee = ref(null)
const originalState = ref('')
const activeTab = ref('info')
const crewBosses = ref([])
const history = ref([])
const showAddDeduction = ref(false)

const newDeduction = reactive({ deductionCode: '', rate: 0, companyId: 1 })
const showTermModal = ref(false)
const showRehireModal = ref(false)
const termForm = reactive({ termDate: '', termKind: 0, termReason: '', doNotRehire: false })
const rehireForm = reactive({ hireDate: '', keepOldHireDate: false, resetHoursWorked: false, resetBaseRate: false, terminate401kEligibility: false, clearVacationBalance: false, crewBossId: null })

const fileTypes = reactive([
  { id: 'general', label: 'General Files', files: [], description: '', uploading: false, fileInput: null },
  { id: 'hr', label: 'HR Files', files: [], description: '', uploading: false, fileInput: null },
  { id: 'benefits', label: 'Benefits Files', files: [], description: '', uploading: false, fileInput: null },
])

const tabs = [
  { id: 'info', label: 'Info' },
  { id: 'compensation', label: 'Compensation' },
  { id: 'tax', label: 'Tax' },
  { id: 'ach', label: 'ACH' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'hr', label: 'HR' },
  { id: 'files', label: 'Files' },
  { id: 'history', label: 'History' },
]

const noteTypes = reactive([
  { id: 'info', label: 'Info Notes', notes: [], showAdd: false, newNote: '' },
  { id: 'hr', label: 'HR Notes', notes: [], showAdd: false, newNote: '' },
  { id: 'payroll', label: 'Payroll Notes', notes: [], showAdd: false, newNote: '' },
  { id: 'benefits', label: 'Benefits Notes', notes: [], showAdd: false, newNote: '' },
  { id: 'discipline', label: 'Discipline', notes: [], showAdd: false, newNote: '' },
  { id: 'safety', label: 'Safety', notes: [], showAdd: false, newNote: '' },
])

const isDirty = computed(() => {
  if (!employee.value) return false
  return JSON.stringify(employee.value) !== originalState.value
})

const loadEmployee = async () => {
  loading.value = true
  error.value = null
  try {
    const employeeId = route.params.employeeId
    const [empResponse, cbResponse] = await Promise.all([
      api.get(`employees/${employeeId}`),
      api.get('employees/crewbosses')
    ])
    employee.value = empResponse.data
    crewBosses.value = cbResponse.data
    originalState.value = JSON.stringify(employee.value)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load employee'
  } finally {
    loading.value = false
  }
}

const saveEmployee = async () => {
  if (!employee.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    await api.put(`employees/${employee.value.employeeId}`, employee.value)
    // Clear rate reason after save (it's a one-time annotation, not persisted)
    employee.value.rateReason = ''
    // Update name field from first/last
    if (employee.value.firstName && employee.value.lastName) {
      employee.value.name = `${employee.value.lastName}, ${employee.value.firstName}`
    }
    originalState.value = JSON.stringify(employee.value)
    saveMessage.value = 'Employee saved successfully'
    // Reload history to show any new pay rate change entries
    loadHistory()
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to save employee'
  } finally {
    saving.value = false
  }
}

const loadNotes = async (noteType) => {
  try {
    const response = await api.get(`employees/${route.params.employeeId}/notes/${noteType.id}`)
    noteType.notes = response.data
  } catch (err) {
    // silently fail for notes
  }
}

const addNote = async (noteType) => {
  try {
    await api.post(`employees/${route.params.employeeId}/notes/${noteType.id}`, { note: noteType.newNote })
    noteType.newNote = ''
    noteType.showAdd = false
    await loadNotes(noteType)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to save note'
  }
}

const terminateEmployee = async () => {
  try {
    await api.post(`employees/${route.params.employeeId}/terminate`, termForm)
    showTermModal.value = false
    saveMessage.value = 'Employee terminated'
    await loadEmployee()
    loadHistory()
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to terminate employee'
  }
}

const rehireEmployee = async () => {
  try {
    await api.post(`employees/${route.params.employeeId}/rehire`, rehireForm)
    showRehireModal.value = false
    saveMessage.value = 'Employee rehired'
    await loadEmployee()
    loadHistory()
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to rehire employee'
  }
}

const loadFiles = async (ft) => {
  try {
    const response = await api.get(`employees/${route.params.employeeId}/files/${ft.id}`)
    ft.files = response.data
  } catch (err) {
    // silently fail for files
  }
}

const uploadFile = async (ft) => {
  const fileInput = ft.fileInput
  if (!fileInput || !fileInput.files || !fileInput.files.length) return
  ft.uploading = true
  try {
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    if (ft.description) formData.append('description', ft.description)
    await api.post(`employees/${route.params.employeeId}/files/${ft.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    ft.description = ''
    fileInput.value = ''
    await loadFiles(ft)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to upload file'
  } finally {
    ft.uploading = false
  }
}

const deleteFile = async (ft, file) => {
  if (!confirm(`Delete ${file.fileName}?`)) return
  try {
    await api.delete(`employees/${route.params.employeeId}/files/${ft.id}/${file.id}`)
    await loadFiles(ft)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to delete file'
  }
}

const loadHistory = async () => {
  try {
    const response = await api.get(`employees/${route.params.employeeId}/history`)
    history.value = response.data
  } catch (err) {
    // silently fail
  }
}

const addDependent = () => {
  if (!employee.value.dependents) employee.value.dependents = []
  employee.value.dependents.push({
    id: 0,
    employeeId: employee.value.employeeId,
    name: '',
    relationship: '',
    dateOfBirth: '',
    ssn: ''
  })
}

const removeDependent = async (dep) => {
  if (dep.id > 0) {
    try {
      await api.delete(`employees/${employee.value.employeeId}/dependents/${dep.id}`)
    } catch (err) {
      error.value = 'Failed to remove dependent'
      return
    }
  }
  employee.value.dependents = employee.value.dependents.filter(d => d !== dep)
}

const addEmployeeDeduction = async () => {
  try {
    await api.post(`employees/${employee.value.employeeId}/deductions`, {
      employeeId: employee.value.employeeId,
      companyId: newDeduction.companyId,
      deductionCode: newDeduction.deductionCode,
      rate: newDeduction.rate
    })
    newDeduction.deductionCode = ''
    newDeduction.rate = 0
    showAddDeduction.value = false
    // Reload deductions
    const response = await api.get(`employees/${employee.value.employeeId}/deductions`)
    employee.value.deductions = response.data
    originalState.value = JSON.stringify(employee.value)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to add deduction'
  }
}

const removeEmployeeDeduction = async (ded) => {
  try {
    await api.delete(`employees/${employee.value.employeeId}/deductions/${ded.deductionCode}`)
    employee.value.deductions = employee.value.deductions.filter(d => d !== ded)
    originalState.value = JSON.stringify(employee.value)
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to remove deduction'
  }
}

onMounted(async () => {
  await loadEmployee()
  // Load notes, files, and history in parallel
  noteTypes.forEach(nt => loadNotes(nt))
  fileTypes.forEach(ft => loadFiles(ft))
  loadHistory()
})
</script>

<style scoped>
</style>
