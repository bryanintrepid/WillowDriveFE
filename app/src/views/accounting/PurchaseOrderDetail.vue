<template>
  <div>
    <!-- Header -->
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="mb-1">{{ isNew ? 'New Purchase Order' : po?.poNumber || 'Purchase Order' }}</h4>
          <ol class="breadcrumb m-0 align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item"><router-link to="/accounting/purchase-orders">Purchase Orders</router-link></li>
            <li class="breadcrumb-item active">{{ isNew ? 'New' : po?.poNumber }}</li>
          </ol>
        </div>
        <div class="d-flex gap-2" v-if="po">
          <span class="badge fs-6" :class="getStatusClass(po.status)">{{ formatStatus(po.status) }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- PO Form/View -->
    <div v-else class="row">
      <!-- Left: Main Form -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">PO Details</h5>
            <div class="d-flex gap-2">
              <!-- Action buttons based on status -->
              <button v-if="po?.canEdit" class="btn btn-primary btn-sm" @click="save" :disabled="saving">
                <i class="ri-save-line me-1"></i>{{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button v-if="po?.canApprove && po?.status === 'Draft'" class="btn btn-outline-warning btn-sm" @click="submit">
                <i class="ri-send-plane-line me-1"></i>Submit for Approval
              </button>
              <button v-if="po?.canApprove && po?.status === 'PendingApproval'" class="btn btn-success btn-sm" @click="approve">
                <i class="ri-check-line me-1"></i>Approve
              </button>
              <button v-if="po?.canReceive" class="btn btn-info btn-sm" @click="showReceiveModal = true">
                <i class="ri-inbox-archive-line me-1"></i>Receive
              </button>
              <button v-if="po?.canClose" class="btn btn-dark btn-sm" @click="closePO">
                <i class="ri-check-double-line me-1"></i>Close
              </button>
              <button v-if="po?.canCancel" class="btn btn-outline-danger btn-sm" @click="cancel">
                <i class="ri-close-line me-1"></i>Cancel
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">Vendor <span class="text-danger">*</span></label>
                <select class="form-select" v-model="form.vendorId" :disabled="!canEdit" required>
                  <option value="">Select vendor...</option>
                  <option v-for="v in vendors" :key="v.vendorId" :value="v.vendorId">
                    {{ v.name }}
                  </option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Order Date <span class="text-danger">*</span></label>
                <input type="date" class="form-control" v-model="form.orderDate" :disabled="!canEdit" required />
              </div>
              <div class="col-md-3">
                <label class="form-label">Expected Delivery</label>
                <input type="date" class="form-control" v-model="form.expectedDeliveryDate" :disabled="!canEdit" />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-12">
                <label class="form-label">Ship To</label>
                <input type="text" class="form-control" v-model="form.shipTo" :disabled="!canEdit"
                       placeholder="Shipping address or location" />
              </div>
            </div>

            <!-- Line Items -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Line Items</label>
                <button v-if="canEdit" class="btn btn-outline-primary btn-sm" @click="addLine">
                  <i class="ri-add-line me-1"></i>Add Line
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-sm table-bordered mb-0">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 40px">#</th>
                      <th>Description</th>
                      <th style="width: 150px">GL Account</th>
                      <th style="width: 100px" class="text-end">Qty</th>
                      <th style="width: 120px" class="text-end">Unit Price</th>
                      <th style="width: 120px" class="text-end">Total</th>
                      <th v-if="!isNew" style="width: 80px" class="text-end">Rcvd</th>
                      <th v-if="canEdit" style="width: 50px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(line, idx) in form.lines" :key="idx">
                      <td class="text-muted">{{ idx + 1 }}</td>
                      <td>
                        <input v-if="canEdit" type="text" class="form-control form-control-sm"
                               v-model="line.description" placeholder="Description" />
                        <span v-else>{{ line.description }}</span>
                      </td>
                      <td>
                        <select v-if="canEdit" class="form-select form-select-sm" v-model="line.glAccountNumber">
                          <option value="">Select...</option>
                          <option v-for="a in expenseAccounts" :key="a.accountNumber" :value="a.accountNumber">
                            {{ a.accountNumber }} - {{ a.description }}
                          </option>
                        </select>
                        <span v-else>{{ line.glAccountNumber }}</span>
                      </td>
                      <td>
                        <input v-if="canEdit" type="number" class="form-control form-control-sm text-end"
                               v-model.number="line.quantity" step="0.01" />
                        <span v-else class="text-end d-block">{{ line.quantity }}</span>
                      </td>
                      <td>
                        <input v-if="canEdit" type="number" class="form-control form-control-sm text-end"
                               v-model.number="line.unitPrice" step="0.01" />
                        <span v-else class="text-end d-block">{{ formatCurrency(line.unitPrice) }}</span>
                      </td>
                      <td class="text-end fw-medium">{{ formatCurrency(line.quantity * line.unitPrice) }}</td>
                      <td v-if="!isNew" class="text-end">{{ line.quantityReceived || 0 }}</td>
                      <td v-if="canEdit">
                        <button class="btn btn-link btn-sm text-danger p-0" @click="removeLine(idx)">
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="table-light">
                    <tr>
                      <td :colspan="canEdit ? (isNew ? 5 : 6) : (isNew ? 5 : 6)" class="text-end">Subtotal:</td>
                      <td class="text-end fw-medium">{{ formatCurrency(subtotal) }}</td>
                      <td v-if="canEdit"></td>
                    </tr>
                    <tr>
                      <td :colspan="canEdit ? (isNew ? 5 : 6) : (isNew ? 5 : 6)" class="text-end">Tax:</td>
                      <td>
                        <input v-if="canEdit" type="number" class="form-control form-control-sm text-end"
                               v-model.number="form.taxAmount" step="0.01" />
                        <span v-else class="text-end d-block">{{ formatCurrency(form.taxAmount) }}</span>
                      </td>
                      <td v-if="canEdit"></td>
                    </tr>
                    <tr>
                      <td :colspan="canEdit ? (isNew ? 5 : 6) : (isNew ? 5 : 6)" class="text-end">Shipping:</td>
                      <td>
                        <input v-if="canEdit" type="number" class="form-control form-control-sm text-end"
                               v-model.number="form.shippingAmount" step="0.01" />
                        <span v-else class="text-end d-block">{{ formatCurrency(form.shippingAmount) }}</span>
                      </td>
                      <td v-if="canEdit"></td>
                    </tr>
                    <tr class="fw-bold">
                      <td :colspan="canEdit ? (isNew ? 5 : 6) : (isNew ? 5 : 6)" class="text-end">Total:</td>
                      <td class="text-end">{{ formatCurrency(total) }}</td>
                      <td v-if="canEdit"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-3">
              <label class="form-label">Notes</label>
              <textarea class="form-control" v-model="form.notes" :disabled="!canEdit" rows="2"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Info & History -->
      <div class="col-lg-4">
        <!-- PO Info -->
        <div class="card" v-if="po && !isNew">
          <div class="card-header"><h5 class="card-title mb-0">Info</h5></div>
          <div class="card-body">
            <div class="mb-2"><strong>PO Number:</strong> {{ po.poNumber }}</div>
            <div class="mb-2"><strong>Created:</strong> {{ formatDateTime(po.dateCreated) }}</div>
            <div class="mb-2" v-if="po.creator"><strong>Created By:</strong> {{ po.creator }}</div>
            <div class="mb-2" v-if="po.approvedBy">
              <strong>Approved By:</strong> {{ po.approvedBy }}<br>
              <small class="text-muted">{{ formatDateTime(po.approvedAt) }}</small>
            </div>
            <hr>
            <div class="mb-2"><strong>Total:</strong> {{ formatCurrency(po.totalAmount) }}</div>
            <div class="mb-2"><strong>Received:</strong> {{ formatCurrency(po.receivedAmount) }}</div>
            <div class="mb-2"><strong>Invoiced:</strong> {{ formatCurrency(po.invoicedAmount) }}</div>
            <div><strong>Open:</strong> <span class="fw-bold text-primary">{{ formatCurrency(po.openAmount) }}</span></div>
          </div>
        </div>

        <!-- Receipts -->
        <div class="card" v-if="po?.receipts?.length">
          <div class="card-header"><h5 class="card-title mb-0">Receiving History</h5></div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <div v-for="r in po.receipts" :key="r.receiptId" class="list-group-item">
                <div class="d-flex justify-content-between">
                  <strong>{{ r.receiptNumber }}</strong>
                  <small>{{ formatDate(r.receivedDate) }}</small>
                </div>
                <small class="text-muted">By {{ r.receivedBy }}</small>
                <div v-if="r.notes" class="small text-muted mt-1">{{ r.notes }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Linked Invoices -->
        <div class="card" v-if="po?.linkedInvoices?.length">
          <div class="card-header"><h5 class="card-title mb-0">Linked Invoices</h5></div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <router-link v-for="inv in po.linkedInvoices" :key="inv.vendorInvoiceId"
                           :to="`/accounting/vendors/${po.vendorId}/invoices/${inv.invoiceNumber}`"
                           class="list-group-item list-group-item-action">
                <div class="d-flex justify-content-between">
                  <strong>{{ inv.invoiceNumber }}</strong>
                  <span>{{ formatCurrency(inv.totalAmount) }}</span>
                </div>
                <small class="text-muted">{{ formatDate(inv.invoiceDate) }}</small>
                <span v-if="inv.isPaid" class="badge bg-success ms-2">Paid</span>
                <span v-else-if="inv.isPosted" class="badge bg-primary ms-2">Posted</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Receive Modal -->
    <div class="modal fade" :class="{ show: showReceiveModal }" :style="{ display: showReceiveModal ? 'block' : 'none' }"
         tabindex="-1" v-if="showReceiveModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Receive Goods - {{ po?.poNumber }}</h5>
            <button type="button" class="btn-close" @click="showReceiveModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Received Date</label>
              <input type="date" class="form-control" v-model="receiveForm.receivedDate" />
            </div>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead class="table-light">
                  <tr>
                    <th>Description</th>
                    <th class="text-end">Ordered</th>
                    <th class="text-end">Prev Rcvd</th>
                    <th class="text-end">Open</th>
                    <th class="text-end" style="width: 120px">Receive Now</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in receiveForm.lines" :key="line.poLineId">
                    <td>{{ line.description }}</td>
                    <td class="text-end">{{ line.quantity }}</td>
                    <td class="text-end">{{ line.quantityReceived }}</td>
                    <td class="text-end">{{ line.quantityOpen }}</td>
                    <td>
                      <input type="number" class="form-control form-control-sm text-end"
                             v-model.number="line.receiveNow" step="0.01" :max="line.quantityOpen" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mb-3">
              <label class="form-label">Notes</label>
              <input type="text" class="form-control" v-model="receiveForm.notes" placeholder="Optional notes" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showReceiveModal = false">Cancel</button>
            <button class="btn btn-info" @click="submitReceive" :disabled="!hasReceiveQty">
              <i class="ri-inbox-archive-line me-1"></i>Receive
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showReceiveModal"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const po = ref(null)
const vendors = ref([])
const expenseAccounts = ref([])
const showReceiveModal = ref(false)

const isNew = computed(() => route.params.poId === 'new')
const canEdit = computed(() => isNew.value || po.value?.canEdit)

const form = reactive({
  purchaseOrderId: null,
  vendorId: '',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '',
  taxAmount: 0,
  shippingAmount: 0,
  notes: '',
  shipTo: '',
  lines: []
})

const receiveForm = reactive({
  receivedDate: new Date().toISOString().split('T')[0],
  notes: '',
  lines: []
})

const subtotal = computed(() => form.lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice || 0), 0))
const total = computed(() => subtotal.value + (form.taxAmount || 0) + (form.shippingAmount || 0))
const hasReceiveQty = computed(() => receiveForm.lines.some(l => l.receiveNow > 0))

const formatCurrency = (value) => {
  if (value == null) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const formatStatus = (status) => {
  const map = {
    'Draft': 'Draft',
    'PendingApproval': 'Pending Approval',
    'Approved': 'Approved',
    'PartiallyReceived': 'Partially Received',
    'Received': 'Fully Received',
    'Closed': 'Closed',
    'Cancelled': 'Cancelled'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  switch (status) {
    case 'Draft': return 'bg-secondary'
    case 'PendingApproval': return 'bg-warning'
    case 'Approved': return 'bg-success'
    case 'PartiallyReceived': return 'bg-info'
    case 'Received': return 'bg-primary'
    case 'Closed': return 'bg-dark'
    case 'Cancelled': return 'bg-danger'
    default: return 'bg-light text-dark'
  }
}

const addLine = () => {
  form.lines.push({
    poLineId: null,
    description: '',
    glAccountNumber: '',
    quantity: 1,
    unitPrice: 0,
    productId: null,
    productYearId: null,
    quantityReceived: 0,
    quantityInvoiced: 0
  })
}

const removeLine = (idx) => {
  form.lines.splice(idx, 1)
}

const loadPO = async () => {
  if (isNew.value) {
    loading.value = false
    addLine()
    return
  }

  try {
    const response = await api.get(`purchase-orders/${route.params.poId}`)
    po.value = response.data

    // Populate form
    form.purchaseOrderId = po.value.purchaseOrderId
    form.vendorId = po.value.vendorId
    form.orderDate = po.value.orderDate?.split('T')[0] || ''
    form.expectedDeliveryDate = po.value.expectedDeliveryDate?.split('T')[0] || ''
    form.taxAmount = po.value.taxAmount
    form.shippingAmount = po.value.shippingAmount
    form.notes = po.value.notes || ''
    form.shipTo = po.value.shipTo || ''
    form.lines = po.value.lines.map(l => ({
      poLineId: l.poLineId,
      description: l.description,
      glAccountNumber: l.glAccountNumber,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      productId: l.productId,
      productYearId: l.productYearId,
      quantityReceived: l.quantityReceived,
      quantityInvoiced: l.quantityInvoiced
    }))

    // Setup receive form
    receiveForm.lines = po.value.lines.map(l => ({
      poLineId: l.poLineId,
      description: l.description,
      quantity: l.quantity,
      quantityReceived: l.quantityReceived,
      quantityOpen: l.quantity - l.quantityReceived,
      receiveNow: 0
    }))
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load PO'
  } finally {
    loading.value = false
  }
}

const loadVendors = async () => {
  try {
    const response = await api.get('gl/vendors')
    vendors.value = response.data
  } catch (err) {
    console.error('Failed to load vendors:', err)
  }
}

const loadAccounts = async () => {
  try {
    const response = await api.get('gl/chart-of-accounts')
    // Filter to expense accounts (type 4) and assets (for inventory)
    expenseAccounts.value = response.data.filter(a => a.type === 4 || a.type === 0)
  } catch (err) {
    console.error('Failed to load accounts:', err)
  }
}

const save = async () => {
  if (!form.vendorId) {
    alert('Please select a vendor')
    return
  }
  if (form.lines.length === 0) {
    alert('Please add at least one line item')
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form,
      lines: form.lines.map(l => ({
        poLineId: l.poLineId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        glAccountNumber: l.glAccountNumber,
        productId: l.productId,
        productYearId: l.productYearId
      }))
    }

    const response = await api.post('purchase-orders', payload)

    if (isNew.value) {
      router.replace(`/accounting/purchase-orders/${response.data.purchaseOrderId}`)
    } else {
      po.value = response.data
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save PO')
  } finally {
    saving.value = false
  }
}

const submit = async () => {
  if (!confirm('Submit this PO for approval?')) return
  try {
    await api.post(`purchase-orders/${po.value.purchaseOrderId}/submit`)
    await loadPO()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to submit')
  }
}

const approve = async () => {
  if (!confirm('Approve this PO?')) return
  try {
    await api.post(`purchase-orders/${po.value.purchaseOrderId}/approve`)
    await loadPO()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to approve')
  }
}

const cancel = async () => {
  const reason = prompt('Reason for cancellation (optional):')
  if (reason === null) return
  try {
    await api.post(`purchase-orders/${po.value.purchaseOrderId}/cancel`, { reason })
    await loadPO()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to cancel')
  }
}

const closePO = async () => {
  if (!confirm('Close this PO? This cannot be undone.')) return
  try {
    await api.post(`purchase-orders/${po.value.purchaseOrderId}/close`)
    await loadPO()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to close')
  }
}

const submitReceive = async () => {
  const linesToReceive = receiveForm.lines
    .filter(l => l.receiveNow > 0)
    .map(l => ({
      poLineId: l.poLineId,
      quantityReceived: l.receiveNow,
      notes: ''
    }))

  if (linesToReceive.length === 0) {
    alert('Enter quantities to receive')
    return
  }

  try {
    await api.post(`purchase-orders/${po.value.purchaseOrderId}/receive`, {
      purchaseOrderId: po.value.purchaseOrderId,
      receivedDate: receiveForm.receivedDate,
      notes: receiveForm.notes,
      lines: linesToReceive
    })
    showReceiveModal.value = false
    await loadPO()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to receive')
  }
}

onMounted(() => {
  loadVendors()
  loadAccounts()
  loadPO()
})
</script>

<style scoped>
.modal.show { display: block; }
</style>
