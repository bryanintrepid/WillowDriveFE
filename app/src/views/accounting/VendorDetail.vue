<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ vendor?.name || 'Vendor Detail' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'accounting-vendors' }">Vendors</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">{{ vendor?.name || 'Detail' }}</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link :to="{ name: 'accounting-vendors' }" class="btn btn-secondary btn-sm">
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

    <div v-else-if="vendor">
      <!-- Vendor Info -->
      <div class="row">
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Contact Information</h5>
            </div>
            <div class="card-body">
              <div class="mb-2"><strong>Phone:</strong> {{ vendor.phone || '—' }}</div>
              <div class="mb-2"><strong>Fax:</strong> {{ vendor.fax || '—' }}</div>
              <div class="mb-2"><strong>Email:</strong> {{ vendor.emailAddress || '—' }}</div>
              <hr />
              <div class="mb-2"><strong>Address:</strong></div>
              <div>{{ vendor.street }}</div>
              <div v-if="vendor.street2">{{ vendor.street2 }}</div>
              <div>{{ vendor.city }}, {{ vendor.state }} {{ vendor.zip }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Account Details</h5>
            </div>
            <div class="card-body">
              <div class="mb-2"><strong>GL Account:</strong> {{ vendor.accountNumber || '—' }}</div>
              <div class="mb-2"><strong>Default Expense:</strong> {{ vendor.defaultExpenseAccount || '—' }}</div>
              <div class="mb-2"><strong>Terms:</strong> {{ vendor.terms || '—' }}</div>
              <div class="mb-2">
                <strong>Status:</strong>
                <span class="badge ms-1" :class="vendor.isActive ? 'bg-success' : 'bg-danger'">
                  {{ vendor.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Tax & ACH</h5>
            </div>
            <div class="card-body">
              <div class="mb-2">
                <strong>1099 Vendor:</strong>
                <span class="badge ms-1" :class="vendor.is1099 ? 'bg-info' : 'bg-secondary'">
                  {{ vendor.is1099 ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="mb-2"><strong>Tax ID:</strong> {{ vendor.taxId ? '***-**-' + vendor.taxId.slice(-4) : '—' }}</div>
              <hr />
              <div class="mb-2"><strong>ACH Routing:</strong> {{ vendor.achRoutingNumber ? '****' + vendor.achRoutingNumber.slice(-4) : '—' }}</div>
              <div class="mb-2"><strong>ACH Account:</strong> {{ vendor.achAccountNumber ? '****' + vendor.achAccountNumber.slice(-4) : '—' }}</div>
              <div class="mb-2"><strong>ACH Type:</strong> {{ vendor.achAccountType || '—' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card" v-if="vendor.notes">
        <div class="card-header"><h5 class="card-title mb-0">Notes</h5></div>
        <div class="card-body"><p class="mb-0">{{ vendor.notes }}</p></div>
      </div>

      <!-- Attachments -->
      <div class="card">
        <div class="card-header"><h5 class="card-title mb-0">Documents</h5></div>
        <div class="card-body">
          <AttachmentPanel
            entityType="Vendor"
            :entityId="vendor.vendorId"
          />
        </div>
      </div>

      <!-- Custom Fields -->
      <div class="card">
        <div class="card-header"><h5 class="card-title mb-0">Custom Fields</h5></div>
        <div class="card-body">
          <CustomFieldsPanel
            entityType="Vendor"
            :entityId="vendor.vendorId"
          />
        </div>
      </div>

      <!-- Invoices Tab -->
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">Invoices ({{ vendor.invoices?.length || 0 }})</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive" v-if="vendor.invoices && vendor.invoices.length">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th class="text-end">Amount</th>
                  <th class="text-end">Paid</th>
                  <th class="text-end">Due</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in vendor.invoices" :key="inv.vendorInvoiceId">
                  <td>
                    <router-link :to="{ name: 'accounting-payables-invoices-detail', params: { vendorId: vendor.vendorId, invoiceNumber: inv.invoiceNumber } }">
                      {{ inv.invoiceNumber }}
                    </router-link>
                  </td>
                  <td>{{ formatDate(inv.invoiceDate) }}</td>
                  <td>{{ formatDate(inv.dueDate) }}</td>
                  <td class="text-end">{{ formatCurrency(inv.totalAmount) }}</td>
                  <td class="text-end">{{ formatCurrency(inv.amountPaid) }}</td>
                  <td class="text-end">{{ formatCurrency(inv.amountDue) }}</td>
                  <td class="text-center">
                    <span class="badge" :class="inv.isPaid ? 'bg-success-subtle text-success' : inv.isPosted ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'">
                      {{ inv.isPaid ? 'Paid' : inv.isPosted ? 'Posted' : 'Open' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="p-3 text-muted text-center">No invoices for this vendor.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'
import AttachmentPanel from '../../components/AttachmentPanel.vue'
import CustomFieldsPanel from '../../components/CustomFieldsPanel.vue'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const vendor = ref(null)

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const loadVendor = async () => {
  loading.value = true
  error.value = null
  try {
    const vendorId = route.params.vendorId
    const response = await api.get(`vendors/${vendorId}`)
    vendor.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load vendor'
  } finally {
    loading.value = false
  }
}

onMounted(loadVendor)
</script>

<style scoped>
</style>
