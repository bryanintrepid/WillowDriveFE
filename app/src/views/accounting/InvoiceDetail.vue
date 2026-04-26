<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">Invoice {{ invoice?.invoiceNumber || '' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item">Payables</li>
            <li class="breadcrumb-item"><router-link :to="{ name: 'accounting-vendor-invoices' }">Invoices</router-link></li>
            <li class="breadcrumb-item active" aria-current="page">{{ invoice?.invoiceNumber || 'Detail' }}</li>
          </ol>
        </div>
        <div class="d-flex align-items-center gap-2">
          <router-link :to="{ name: 'accounting-vendor-invoices' }" class="btn btn-secondary btn-sm">
            <i class="ri-arrow-left-line me-1"></i>Back to Invoices
          </router-link>
          <router-link v-if="invoice && invoice.canEdit" :to="{ name: 'accounting-vendor-invoice-edit', params: { invoiceId: invoice.vendorInvoiceId } }" class="btn btn-primary btn-sm">
            <i class="ri-pencil-line me-1"></i>Edit
          </router-link>
          <router-link v-if="invoice" :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: invoice.vendorId } }" class="btn btn-outline-primary btn-sm">
            <i class="ri-user-line me-1"></i>View Vendor
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

    <div v-else-if="invoice">
      <!-- Invoice Header -->
      <div class="row">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Invoice Information</h5></div>
            <div class="card-body">
              <div class="row mb-2">
                <div class="col-5 text-muted">Invoice #:</div>
                <div class="col-7"><strong>{{ invoice.invoiceNumber }}</strong></div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Vendor:</div>
                <div class="col-7">
                  <router-link :to="{ name: 'accounting-payables-vendors-detail', params: { vendorId: invoice.vendorId } }">
                    {{ invoice.vendorName }}
                  </router-link>
                </div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Invoice Date:</div>
                <div class="col-7">{{ formatDate(invoice.invoiceDate) }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Due Date:</div>
                <div class="col-7">{{ formatDate(invoice.dueDate) }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Description:</div>
                <div class="col-7">{{ invoice.description || '—' }}</div>
              </div>
              <div class="row mb-2" v-if="invoice.expenseAccount">
                <div class="col-5 text-muted">Expense Account:</div>
                <div class="col-7">{{ invoice.expenseAccount }}</div>
              </div>
              <div class="row mb-2" v-if="invoice.batch">
                <div class="col-5 text-muted">Batch:</div>
                <div class="col-7">{{ invoice.batch }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header"><h5 class="card-title mb-0">Payment Status</h5></div>
            <div class="card-body">
              <div v-if="invoice.isCreditMemo" class="mb-3">
                <span class="badge bg-danger fs-6">Credit Memo</span>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Total Amount:</div>
                <div class="col-7" :class="{ 'text-danger': invoice.totalAmount < 0 }"><strong class="fs-16">{{ formatCurrency(invoice.totalAmount) }}</strong></div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Amount Paid:</div>
                <div class="col-7 text-success">{{ formatCurrency(invoice.amountPaid) }}</div>
              </div>
              <div class="row mb-2">
                <div class="col-5 text-muted">Amount Due:</div>
                <div class="col-7" :class="invoice.amountDue > 0 ? 'text-danger fw-bold' : ''">{{ formatCurrency(invoice.amountDue) }}</div>
              </div>
              <hr />
              <div class="row mb-2">
                <div class="col-5 text-muted">Status:</div>
                <div class="col-7">
                  <span class="badge" :class="invoice.isPaid ? 'bg-success' : invoice.isPosted ? 'bg-info' : 'bg-warning'">
                    {{ invoice.isPaid ? 'Paid' : invoice.isPosted ? 'Posted' : 'Open' }}
                  </span>
                </div>
              </div>
              <div class="row mb-2" v-if="invoice.postedDate">
                <div class="col-5 text-muted">Posted Date:</div>
                <div class="col-7">{{ formatDate(invoice.postedDate) }}</div>
              </div>
              <div class="row mb-2" v-if="invoice.paidDate">
                <div class="col-5 text-muted">Paid Date:</div>
                <div class="col-7">{{ formatDate(invoice.paidDate) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="card" v-if="invoice.lines && invoice.lines.length">
        <div class="card-header"><h5 class="card-title mb-0">Line Items</h5></div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-nowrap align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 20%">Account</th>
                  <th style="width: 55%">Description</th>
                  <th style="width: 25%; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in invoice.lines" :key="line.vendorInvoiceLineId">
                  <td>{{ line.accountNumber }}</td>
                  <td>{{ line.description }}</td>
                  <td class="text-end">{{ formatCurrency(line.amount) }}</td>
                </tr>
              </tbody>
              <tfoot class="table-light">
                <tr>
                  <td colspan="2" class="text-end"><strong>Total:</strong></td>
                  <td class="text-end"><strong>{{ formatCurrency(invoice.totalAmount) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card" v-if="invoice.notes">
        <div class="card-header"><h5 class="card-title mb-0">Notes</h5></div>
        <div class="card-body"><p class="mb-0">{{ invoice.notes }}</p></div>
      </div>

      <!-- Attachments -->
      <div class="card" v-if="invoice.vendorInvoiceId">
        <div class="card-header"><h5 class="card-title mb-0">Documents</h5></div>
        <div class="card-body">
          <AttachmentPanel
            entityType="VendorInvoice"
            :entityId="invoice.vendorInvoiceId"
          />
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

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const invoice = ref(null)

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const loadInvoice = async () => {
  loading.value = true
  error.value = null
  try {
    const { vendorId, invoiceNumber } = route.params
    const response = await api.get(`vendor-invoices/${vendorId}/${invoiceNumber}`)
    invoice.value = response.data
  } catch (err) {
    error.value = err.response?.data || err.message || 'Failed to load invoice'
  } finally {
    loading.value = false
  }
}

onMounted(loadInvoice)
</script>

<style scoped>
</style>
