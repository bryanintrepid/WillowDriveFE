<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Notifications</h4>
      <div class="d-flex gap-2 align-items-center">
        <div class="form-check form-check-inline mb-0">
          <input class="form-check-input" type="checkbox" id="unreadOnly" v-model="unreadOnly" @change="load">
          <label class="form-check-label small" for="unreadOnly">Unread only</label>
        </div>
        <button class="btn btn-sm btn-outline-secondary" :disabled="notifications.length === 0" @click="markAllRead">
          Mark all read
        </button>
        <button class="btn btn-sm btn-outline-danger" :disabled="notifications.length === 0" @click="dismissAll">
          Dismiss all
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="notifications.length === 0" class="alert alert-info">No notifications.</div>

    <div v-else class="card">
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th></th>
              <th>Severity</th>
              <th>Title</th>
              <th>Message</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in notifications" :key="n.notificationId" :class="{ 'fw-bold': !n.readAt }">
              <td style="width: 20px;">
                <span v-if="!n.readAt" class="badge bg-primary" style="font-size: 0.55rem;">NEW</span>
              </td>
              <td>
                <span class="badge" :class="sevClass(n.severity)">{{ n.severity }}</span>
              </td>
              <td>{{ n.title }}</td>
              <td class="small text-muted" style="max-width: 400px;">{{ n.message }}</td>
              <td class="small">{{ fmtTime(n.createdAt) }}</td>
              <td class="text-end">
                <router-link v-if="n.actionUrl" :to="n.actionUrl" class="btn btn-sm btn-outline-primary py-0 me-1" @click="markRead(n)">
                  Open
                </router-link>
                <button v-if="!n.readAt" class="btn btn-sm btn-outline-secondary py-0 me-1" @click="markRead(n)">Read</button>
                <button class="btn btn-sm btn-outline-danger py-0" @click="dismiss(n)">Dismiss</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const notifications = ref([]);
const loading = ref(false);
const unreadOnly = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('notifications', { params: { unreadOnly: unreadOnly.value, limit: 200 } });
    notifications.value = data;
  } finally {
    loading.value = false;
  }
}

async function markRead(n) {
  if (n.readAt) return;
  await api.post(`notifications/${n.notificationId}/read`);
  n.readAt = new Date().toISOString();
}

async function dismiss(n) {
  await api.post(`notifications/${n.notificationId}/dismiss`);
  notifications.value = notifications.value.filter(x => x.notificationId !== n.notificationId);
}

async function markAllRead() {
  await api.post('notifications/read-all');
  await load();
}

async function dismissAll() {
  if (!confirm('Dismiss all notifications?')) return;
  await api.post('notifications/dismiss-all');
  await load();
}

function sevClass(sev) {
  return sev === 'Critical' ? 'bg-danger'
       : sev === 'Warning' ? 'bg-warning text-dark'
       : 'bg-info text-dark';
}

function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}

onMounted(load);
</script>
