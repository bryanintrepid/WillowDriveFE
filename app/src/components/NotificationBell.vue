<template>
  <div class="dropdown">
    <button
      type="button"
      class="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle position-relative"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      @click="loadIfNeeded">
      <i class="bx bx-bell fs-22"></i>
      <span
        v-if="unreadCount > 0"
        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
        style="font-size: 0.65rem;">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>
    <div class="dropdown-menu dropdown-menu-end p-0" style="width: 360px; max-height: 480px; overflow-y: auto;">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
        <h6 class="mb-0">Notifications</h6>
        <div>
          <button v-if="notifications.length > 0" class="btn btn-sm btn-link py-0" @click.stop="markAllRead">Mark all read</button>
          <router-link class="btn btn-sm btn-link py-0" to="/notifications">View all</router-link>
        </div>
      </div>
      <div v-if="loading" class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>
      <div v-else-if="notifications.length === 0" class="text-center py-4 text-muted small">No notifications</div>
      <div v-else>
        <div
          v-for="n in notifications.slice(0, 10)"
          :key="n.notificationId"
          class="p-2 border-bottom"
          :class="{ 'bg-light': !n.readAt }"
          style="cursor: pointer;"
          @click.stop="onClick(n)">
          <div class="d-flex justify-content-between align-items-start">
            <span class="badge me-2" :class="sevClass(n.severity)">{{ n.severity }}</span>
            <button class="btn btn-sm btn-link py-0 text-muted" @click.stop="dismiss(n)" title="Dismiss">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="fw-medium small mt-1">{{ n.title }}</div>
          <div class="small text-muted" style="word-break: break-word;">{{ n.message }}</div>
          <div class="text-muted" style="font-size: 0.7rem;">{{ fmtTime(n.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const unreadCount = ref(0);
const notifications = ref([]);
const loading = ref(false);
let pollTimer = null;

async function refreshCount() {
  try {
    const { data } = await api.get('notifications/unread-count');
    unreadCount.value = data.count || 0;
  } catch { /* silent */ }
}

async function loadIfNeeded() {
  loading.value = true;
  try {
    const { data } = await api.get('notifications', { params: { limit: 20 } });
    notifications.value = data;
  } catch { /* silent */ } finally {
    loading.value = false;
  }
}

async function markAllRead() {
  await api.post('notifications/read-all');
  notifications.value.forEach(n => { if (!n.readAt) n.readAt = new Date().toISOString(); });
  await refreshCount();
}

async function dismiss(n) {
  await api.post(`notifications/${n.notificationId}/dismiss`);
  notifications.value = notifications.value.filter(x => x.notificationId !== n.notificationId);
  await refreshCount();
}

async function onClick(n) {
  if (!n.readAt) {
    await api.post(`notifications/${n.notificationId}/read`);
    n.readAt = new Date().toISOString();
    await refreshCount();
  }
  if (n.actionUrl) router.push(n.actionUrl);
}

function sevClass(sev) {
  return sev === 'Critical' ? 'bg-danger'
       : sev === 'Warning' ? 'bg-warning text-dark'
       : 'bg-info text-dark';
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

onMounted(() => {
  refreshCount();
  pollTimer = setInterval(refreshCount, 60000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>
