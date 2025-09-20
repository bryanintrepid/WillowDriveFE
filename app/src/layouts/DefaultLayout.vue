<template>
  <div id="layout-wrapper">
    <Topbar />
    <Sidebar />
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid">
          <router-view></router-view>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>



<script setup>
import Sidebar from '../components/Sidebar.vue';
import Topbar from '../components/Topbar.vue';
import Footer from '../components/Footer.vue';
</script>

<style>
/* Basic styling to position content correctly next to the sidebar */
.main-content {
  margin-left: 250px; /* Same as sidebar width */
  padding-top: 70px; /* Space for topbar */
  position: relative;
  min-height: 100vh;
  transition: margin-left 0.2s;
}

.page-content {
    padding: 0 calc(1.5rem / 2) 60px calc(1.5rem / 2);
}
</style>