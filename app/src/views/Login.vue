<template>
  <div class="auth-page-wrapper pt-5">
    <div class="auth-one-bg-position auth-one-bg" id="auth-particles">
      <div class="bg-overlay"></div>
      <div class="shape">
        <!-- SVG or background shape here if needed -->
      </div>
    </div>
    <div class="auth-page-content">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6 col-xl-5">
            <div class="card mt-4 card-bg-fill">
              <div class="card-body p-4">
                <div class="text-center mt-2">
                  <h5 class="text-primary">Welcome Back!</h5>
                  <p class="text-muted">Sign in to continue to WillowDrive.</p>
                </div>
                <div class="p-2 mt-4">
                  <!-- Error Alert -->
                  <div v-if="hasError" class="alert alert-danger text-center">
                    {{ errorMessage || "Please check your username and password and try again." }}
                  </div>
                  <!-- Success Alert -->
                  <div v-if="successMessage" class="alert alert-success text-center">
                    {{ successMessage }}
                  </div>
                  <form @submit.prevent="signin">
                    <div class="mb-3">
                      <label for="username" class="form-label">Username</label>
                      <input v-model="username" type="text" class="form-control" id="username" placeholder="Enter username" :disabled="processing" autocomplete="username" />
                    </div>
                    <div class="mb-3">
                      <label class="form-label" for="password-input">Password</label>
                      <div class="position-relative auth-pass-inputgroup mb-3">
                        <input v-model="password" :disabled="processing" type="password" class="form-control pe-5" placeholder="Enter password" id="password-input" autocomplete="current-password" />
                      </div>
                    </div>
                    <div class="mt-4">
                      <button class="btn btn-success w-100" type="submit" :disabled="processing">
                        <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
                        Sign In
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <!-- Optionally, social login, etc. -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMainStore } from '@/stores/mainStore' // Adjust the path as needed
import api from '@/services/api' // Adjust the path to your Axios instance

const router = useRouter()
const route = useRoute()
const mainStore = useMainStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const processing = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const signin = async () => {
  processing.value = true
  hasError.value = false
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await api.post('login', {
      Username: username.value,
      Password: password.value,
    })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    try { localStorage.setItem('user', JSON.stringify(user)) } catch (e) {}
    mainStore.setUser(user)
    mainStore.setError(null)
    successMessage.value = 'Login successful!'
    // If redirected from a protected route, go back there first
    const redirectTo = route.query.redirect
    const uname = (user?.name || user?.fullName || user?.username || '').toString().trim().toLowerCase()
    const isKiosk = uname === 'kiosk'
    if (isKiosk) {
      router.push('/time/clock-in')
      return
    }
    if (redirectTo && typeof redirectTo === 'string') {
      router.push(redirectTo)
      return
    }
    // Redirect logic based on user role
    if (user) {
      router.push('/accounting/accounts')
    } else if (user.isAdmin) {
      router.push('/customers')
    } else if (user.salesNumber > 0) {
      router.push('/sales')
    }
  } catch (error) {
    hasError.value = true
    if (!error.response) {
      errorMessage.value = 'A network or other connection error has occurred.'
      mainStore.setError(errorMessage.value)
    } else if (error.response.status === 400) {
      errorMessage.value = 'An error has occurred, please try again.'
      mainStore.setError(errorMessage.value)
    } else {
      errorMessage.value = 'Login failed. Please try again.'
      mainStore.setError(errorMessage.value)
    }
  } finally {
    processing.value = false
  }
}
</script>