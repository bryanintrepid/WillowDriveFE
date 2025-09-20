<template>
  <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
    <div class="d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center">
        <div class="page-title">
          <h1 class="page-title-text">Cash Planning</h1>
          <ol class="breadcrumb page-title-breadcrumbs align-items-center">
            <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
            <li class="breadcrumb-item">Accounting</li>
            <li class="breadcrumb-item active">Cash Planning</li>
          </ol>
        </div>
      </div>
    </div>
  </div>

  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="row justify-content-end mb-3">
              <div class="col-auto">
                <label class="form-label text-muted">Find Unpaid Invoices</label>
                <div class="d-flex gap-2">
                  <Datepicker v-model="startDate" placeholder="Start Date" style="width: 150px;" />
                  <Datepicker v-model="endDate" placeholder="End Date" style="width: 150px;" />
                  <ClearableSearchInput v-model="searchQuery" placeholder="Search..." style="width: 200px;" />
                </div>
              </div>
            </div>
            <div class="row justify-content-end">
              <div class="col-auto">
                <label class="form-label text-muted">Create Checks</label>
                <div class="d-flex gap-2">
                  <Datepicker v-model="paymentDate" placeholder="Payment Date" style="width: 150px;" />
                  <button class="btn btn-primary">Pay Selected</button>
                  <button class="btn btn-info">Pay Discounted</button>
                  <button class="btn btn-success">Add to Check Run</button>
                  <button class="btn btn-secondary">Print</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="row gy-3 text-center">
          <div class="col-lg-2 col-md-4">
            <label class="text-muted">Invoice Total</label>
            <h5 class="mb-0">{{ formatCurrency(sumInvoices) }}</h5>
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="text-muted">Valid Discounts</label>
            <h5 class="mb-0">{{ formatCurrency(sumValid) }}</h5>
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="text-muted">Cash Required</label>
            <h5 class="mb-0">{{ formatCurrency(sumCashRequired) }}</h5>
          </div>
          <div class="col-lg-2 col-md-4">
            <label class="text-muted">Lost Discounts</label>
            <h5 class="mb-0">{{ formatCurrency(sumLostDiscounts) }}</h5>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover align-middle table-nowrap mb-0">
            <thead>
              <tr>
                <th>
                  <input class="form-check-input" type="checkbox" :checked="allSelected" :indeterminate="anySelected && !allSelected" @change="toggleSelectAll">
                </th>
                <th>Vendor</th>
                <th>Invoice Number</th>
                <th>Due Date</th>
                <th>Invoice Amount</th>
                <th>Discount Amount</th>
                <th>Net Amount</th>
                <th>Lost Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in pagination.results" :key="invoice.invoiceId">
                <td><input class="form-check-input" type="checkbox" v-model="invoice.selected"></td>
                <td>{{ invoice.vendorName }}</td>
                <td>{{ invoice.invoiceNumber }}</td>
                <td>{{ invoice.dueDate }}</td>
                <td>{{ formatCurrency(invoice.invoiceAmount) }}</td>
                <td>{{ formatCurrency(invoice.validAmount) }}</td>
                <td>{{ formatCurrency(invoice.netAmount) }}</td>
                <td>{{ formatCurrency(invoice.lostAmount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Paginate :pagination="pagination" @page-changed="handlePageChange" class="mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import Datepicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import ClearableSearchInput from '@/components/ClearableSearchInput.vue';
import Paginate from '@/components/Paginate.vue';
import { formatCurrency } from '@/utils/format.js';

// --- Refs and Reactive State ---
const startDate = ref(new Date());
const endDate = ref(new Date());
const paymentDate = ref(new Date());
const searchQuery = ref('');

const pagination = reactive({
  currentPage: 1,
  totalPages: 1,
  results: [
    { invoiceId: 1, vendorName: 'Vendor A', invoiceNumber: 'INV-001', dueDate: '2023-10-01', invoiceAmount: 100.00, validAmount: 5.00, netAmount: 95.00, lostAmount: 0, selected: false },
    { invoiceId: 2, vendorName: 'Vendor B', invoiceNumber: 'INV-002', dueDate: '2023-10-05', invoiceAmount: 250.50, validAmount: 10.00, netAmount: 240.50, lostAmount: 0, selected: false },
    { invoiceId: 3, vendorName: 'Vendor C', invoiceNumber: 'INV-003', dueDate: '2023-10-10', invoiceAmount: 75.25, validAmount: 0, netAmount: 75.25, lostAmount: 0, selected: false },
  ]
});

// --- Computed Properties ---
const anySelected = computed(() => pagination.results.some(i => i.selected));
const allSelected = computed(() => pagination.results.length > 0 && pagination.results.every(i => i.selected));

const sumInvoices = computed(() => pagination.results.reduce((sum, i) => sum + i.invoiceAmount, 0));
const sumValid = computed(() => pagination.results.reduce((sum, i) => sum + i.validAmount, 0));

const sumCashRequired = computed(() => {
  const selectedTotal = pagination.results.filter(i => i.selected).reduce((sum, i) => sum + i.invoiceAmount, 0);
  const selectedDiscount = pagination.results.filter(i => i.selected).reduce((sum, i) => sum + i.validAmount, 0);
  return selectedTotal - selectedDiscount;
});

const sumLostDiscounts = computed(() => {
  return pagination.results
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.lostAmount, 0);
});

// --- Methods ---
const toggleSelectAll = (event) => {
  const isChecked = event.target.checked;
  pagination.results.forEach(i => i.selected = isChecked);
};

const handlePageChange = (page) => {
  pagination.currentPage = page;
  // Here you would fetch data for the new page
};
</script>

<style scoped>
.dashhead {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}
.page-title {
    margin-right: 2rem;
}
.page-title-text {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.page-title-breadcrumbs {
    margin-bottom: 0;
    padding-left: 0;
}
.fs-14 {
    font-size: 14px;
}
</style>
