<template>
  <div>
    <div class="dashhead" style="padding: 1.25rem; margin-top: 0.5rem;">
      <div class="page-title">
        <h4>Invoice Detail</h4>
        <ol class="breadcrumb m-0 align-items-center">
          <li class="breadcrumb-item"><router-link to="/"><i class="ri-home-fill"></i></router-link></li>
          <li class="breadcrumb-item">Accounting</li>
          <li class="breadcrumb-item">Payables</li>
          <li class="breadcrumb-item"><router-link :to="{ name: 'accounting-vendor-invoices' }">Invoices</router-link></li>
          <li class="breadcrumb-item active" aria-current="page">Detail</li>
        </ol>
      </div>
    </div>
    <div class="row">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-body">
                    <p>Vendor ID: {{ $route.params.vendorId }}</p>
                    <p>Invoice Number: {{ $route.params.invoiceNumber }}</p>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
// Placeholder for invoice detail logic
</script>

<style scoped>

</style>
