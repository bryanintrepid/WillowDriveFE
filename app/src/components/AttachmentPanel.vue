<template>
  <div class="attachment-panel">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0">
        <i class="ri-attachment-2 me-1"></i>
        Attachments
        <span v-if="attachments.length > 0" class="badge bg-secondary ms-1">{{ attachments.length }}</span>
      </h6>
      <button
        class="btn btn-soft-primary btn-sm"
        @click="showUploadForm = !showUploadForm"
        :disabled="uploading"
      >
        <i class="ri-upload-2-line me-1"></i>
        {{ showUploadForm ? 'Cancel' : 'Upload' }}
      </button>
    </div>

    <!-- Upload Form -->
    <div v-if="showUploadForm" class="upload-form mb-3 p-3 bg-light rounded">
      <div class="mb-2">
        <input
          type="file"
          ref="fileInput"
          class="form-control form-control-sm"
          @change="onFileChange"
          :disabled="uploading"
        />
        <small class="text-muted">Max file size: 25MB</small>
      </div>
      <div class="mb-2">
        <input
          type="text"
          v-model="description"
          class="form-control form-control-sm"
          placeholder="Description (optional)"
          :disabled="uploading"
        />
      </div>
      <button
        class="btn btn-success btn-sm"
        @click="uploadFile"
        :disabled="!selectedFile || uploading"
      >
        <span v-if="uploading">
          <span class="spinner-border spinner-border-sm me-1"></span>
          Uploading...
        </span>
        <span v-else>
          <i class="ri-upload-line me-1"></i>
          Upload File
        </span>
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="alert alert-danger alert-sm py-2 mb-3">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-3">
      <span class="spinner-border spinner-border-sm"></span>
      Loading attachments...
    </div>

    <!-- Attachments List -->
    <div v-else-if="attachments.length > 0" class="attachment-list">
      <div
        v-for="attachment in attachments"
        :key="attachment.attachmentId"
        class="attachment-item d-flex align-items-center p-2 border-bottom"
      >
        <div class="attachment-icon me-2">
          <i :class="getFileIcon(attachment.contentType)" class="fs-4"></i>
        </div>
        <div class="attachment-info flex-grow-1">
          <div class="fw-medium">{{ attachment.fileName }}</div>
          <small class="text-muted">
            {{ formatFileSize(attachment.fileSizeBytes) }}
            <span class="mx-1">|</span>
            {{ formatDate(attachment.uploadedAt) }}
            <span class="mx-1">|</span>
            {{ attachment.uploadedBy }}
          </small>
          <div v-if="attachment.description" class="text-muted small">
            {{ attachment.description }}
          </div>
        </div>
        <div class="attachment-actions">
          <a
            :href="attachment.downloadUrl"
            target="_blank"
            class="btn btn-soft-primary btn-sm btn-icon me-1"
            title="Download"
          >
            <i class="ri-download-line"></i>
          </a>
          <button
            class="btn btn-soft-danger btn-sm btn-icon"
            @click="confirmDelete(attachment)"
            title="Delete"
          >
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-muted py-4">
      <i class="ri-folder-open-line fs-1"></i>
      <p class="mb-0 mt-2">No attachments</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirm"
      class="modal fade show d-block"
      style="background: rgba(0,0,0,0.5)"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">Confirm Delete</h6>
            <button type="button" class="btn-close" @click="deleteConfirm = null"></button>
          </div>
          <div class="modal-body">
            <p>Delete <strong>{{ deleteConfirm.fileName }}</strong>?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" @click="deleteConfirm = null">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="deleteAttachment">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../services/api';

const props = defineProps({
  entityType: {
    type: String,
    required: true,
    validator: (value) => ['GlTransaction', 'VendorInvoice', 'ApCheck', 'CashReceipt', 'Vendor', 'ExpenseReportLine', 'TaxRateEvidence', 'EmployeeExemption'].includes(value)
  },
  entityId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['updated']);

const attachments = ref([]);
const loading = ref(false);
const error = ref(null);
const showUploadForm = ref(false);
const selectedFile = ref(null);
const description = ref('');
const uploading = ref(false);
const deleteConfirm = ref(null);
const fileInput = ref(null);

const loadAttachments = async () => {
  if (!props.entityId) return;

  loading.value = true;
  error.value = null;

  try {
    const response = await api.get(`attachments/${props.entityType}/${props.entityId}`);
    attachments.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load attachments';
    attachments.value = [];
  } finally {
    loading.value = false;
  }
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 25 * 1024 * 1024) {
      error.value = 'File size exceeds 25MB limit';
      selectedFile.value = null;
      event.target.value = '';
      return;
    }
    selectedFile.value = file;
    error.value = null;
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  error.value = null;

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  if (description.value) {
    formData.append('description', description.value);
  }

  try {
    await api.post(`attachments/${props.entityType}/${props.entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Reset form
    selectedFile.value = null;
    description.value = '';
    showUploadForm.value = false;
    if (fileInput.value) fileInput.value.value = '';

    // Reload attachments
    await loadAttachments();
    emit('updated');
  } catch (err) {
    error.value = err.response?.data?.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
};

const confirmDelete = (attachment) => {
  deleteConfirm.value = attachment;
};

const deleteAttachment = async () => {
  if (!deleteConfirm.value) return;

  try {
    await api.delete(`attachments/${deleteConfirm.value.attachmentId}`);
    deleteConfirm.value = null;
    await loadAttachments();
    emit('updated');
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed';
    deleteConfirm.value = null;
  }
};

const getFileIcon = (contentType) => {
  if (!contentType) return 'ri-file-line';
  if (contentType.startsWith('image/')) return 'ri-image-line text-success';
  if (contentType.includes('pdf')) return 'ri-file-pdf-line text-danger';
  if (contentType.includes('word') || contentType.includes('document')) return 'ri-file-word-line text-primary';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'ri-file-excel-line text-success';
  if (contentType.includes('zip') || contentType.includes('compressed')) return 'ri-file-zip-line text-warning';
  return 'ri-file-line';
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Watch for entity changes
watch(() => [props.entityType, props.entityId], () => {
  loadAttachments();
}, { immediate: false });

onMounted(() => {
  loadAttachments();
});
</script>

<style scoped>
.attachment-panel {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background: #fff;
}

.attachment-item:last-child {
  border-bottom: none !important;
}

.attachment-item:hover {
  background-color: #f8f9fa;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
