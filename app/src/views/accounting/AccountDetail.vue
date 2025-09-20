<template>
  <div>
    <div class="dashhead">
      <div class="dashhead-titles">
        <h6 class="dashhead-subtitle">Accounting</h6>
        <h1 class="dashhead-title">Account Detail</h1>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Account Details</h5>
        <p>Fiscal Year: <strong>{{ $route.params.fiscalYear }}</strong></p>
        <p>Account Number: <strong>{{ $route.params.accountNumber }}</strong></p>
        <p class="text-muted"><em>(Account detail view is under construction)</em></p>
        <router-link to="/accounting/chart-of-accounts" class="btn btn-secondary">Back to Chart of Accounts</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// This is a placeholder component for the account detail view.
// It displays the route parameters passed to it.
</script>

<style scoped>
.card {
  margin-top: 20px;
}
</style>
