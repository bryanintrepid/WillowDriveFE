<template>
  <footer class="footer">
    <div class="container-fluid">
      <div class="row">
        <div class="col-sm-12 text-end">
           © {{ new Date().getFullYear() }} Willow Drive Nursery
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No script needed for this simple footer
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  padding: 20px 1.5rem;
  font-size: 14px;
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 60px; /* Set a fixed height */
  box-sizing: border-box;
}
</style>
