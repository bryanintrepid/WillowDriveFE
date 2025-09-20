<template>
  <header id="page-topbar">
    <div class="layout-width">
      <div class="navbar-header">
        <div class="d-flex">
        </div>

        <div class="d-flex align-items-center">
          <div class="ms-3 header-item d-none d-sm-flex">
            <button type="button" class="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle" @click="initFullScreen">
              <i class='bx bx-fullscreen fs-22'></i>
            </button>
          </div>

          <div class="dropdown ms-sm-3 header-item topbar-user">
            <button type="button" class="btn" id="page-header-user-dropdown" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span class="d-flex align-items-center">
                <img class="rounded-circle header-profile-user" src="@/assets/images/users/user-dummy-img.jpg" alt="Header Avatar">
                <span class="ms-2 fw-medium user-name-text">{{ displayName }}</span>
              </span>
            </button>
            <div class="dropdown-menu dropdown-menu-end">
              <!-- item-->
              <h6 class="dropdown-header">Welcome {{ displayName }}!</h6>
              <router-link class="dropdown-item" to="/profile"><i class="ri-user-line text-muted fs-16 align-middle me-1"></i> <span class="align-middle">Profile</span></router-link>
              <div class="dropdown-divider"></div>
              <a class="dropdown-item" href="#" @click.prevent="logout"><i class="ri-logout-box-r-line text-muted fs-16 align-middle me-1"></i> <span class="align-middle" data-key="t-logout">Logout</span></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMainStore } from '@/stores/mainStore'

const router = useRouter()
const mainStore = useMainStore()

const displayName = computed(() => {
  const u = mainStore.user || {}
  return u.name || u.fullName || u.username || 'User'
})

const logout = () => {
  // Clear auth
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  } catch (e) {}
  mainStore.setUser({})
  // Redirect to login
  router.push({ path: '/login' })
}

const initFullScreen = () => {
  document.body.classList.toggle("fullscreen-enable");
  if (
    !document.fullscreenElement &&
    /* alternative standard method */
    !document.mozFullScreenElement &&
    !document.webkitFullscreenElement
  ) {
    // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(
        Element.ALLOW_KEYBOARD_INPUT
      );
    }
  } else {
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
  }
};
</script>

<style scoped>

#page-topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 250px; /* Same as sidebar width */
  z-index: 1002;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.08);
  height: 70px;
  transition: left .2s ease-in-out;
}
.navbar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 auto;
    height: 70px;
    padding: 0 calc(1.5rem / 2) 0 1.5rem;
}
</style>
