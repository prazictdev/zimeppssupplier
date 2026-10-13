<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
    <div class="flex items-center gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        <Icon name="lucide:file-text" class="w-5 h-5" />
      </span>
      <div>
        <h2 class="text-sm font-bold text-base-content">Document Uploads</h2>
        <p class="text-xs text-base-content/50">Upload the required registration and compliance documents for your organisation.</p>
      </div>
    </div>

    <div class="p-6">
      <div v-if="docsLoading" class="flex justify-center py-16">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>

      <div v-else-if="!requiredDocs.length" class="text-center py-12">
        <Icon name="lucide:check-circle" class="w-12 h-12 text-success mx-auto mb-3" />
        <p class="text-base-content/60 text-sm">No documents are required for your customer type.</p>
      </div>

      <div v-else class="space-y-4">

        <!-- Requirement group selector -->
        <div v-if="requirementGroups.length" class="flex flex-col gap-1">
          <label class="text-sm font-semibold text-base-content" for="doc-group-select">Select your document group</label>
          <select
            id="doc-group-select"
            v-model="selectedGroupId"
            class="select select-bordered w-full max-w-sm"
          >
            <option :value="null">— All documents —</option>
            <option
              v-for="group in requirementGroups"
              :key="group.id"
              :value="group.id"
              :disabled="!group.document_count"
            >
              {{ group.name }}{{ group.document_count ? '' : ' — no documents configured' }}
            </option>
          </select>
        </div>

        <!-- Upload progress summary -->
        <div :class="['alert text-sm', allDocumentsUploaded ? 'alert-success' : 'alert-warning']">
          <Icon :name="allDocumentsUploaded ? 'lucide:check-circle' : 'lucide:alert-circle'" class="w-4 h-4 shrink-0" />
          <span v-if="allDocumentsUploaded">All required documents uploaded — you can proceed.</span>
          <span v-else>{{ missingDocs.length }} of {{ activeDocs.length }} document(s) still required before you can proceed.</span>
        </div>
        <div
          v-for="doc in activeDocs"
          :key="doc.id"
          class="rounded-xl border border-base-200 overflow-hidden"
        >
          <!-- Doc header -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 bg-base-50 border-b border-base-200">
            <div class="flex items-center gap-2 min-w-0">
              <Icon name="lucide:file" class="w-4 h-4 shrink-0 text-base-content/40" />
              <span class="text-sm font-semibold truncate">{{ doc.document?.name }}</span>
              <span class="badge badge-xs badge-ghost shrink-0">{{ doc.locality }}</span>
            </div>
            <span v-if="uploadedMap[doc.document_id]" class="badge badge-sm badge-success shrink-0">
              <Icon name="lucide:check" class="w-3 h-3 mr-0.5" /> Uploaded
            </span>
            <span v-else class="badge badge-sm badge-ghost shrink-0">Required</span>
          </div>

          <!-- Uploaded file row -->
          <div v-if="uploadedMap[doc.document_id]" class="flex items-center gap-3 px-4 py-3 text-sm">
            <Icon name="lucide:paperclip" class="w-4 h-4 text-base-content/40 shrink-0" />
            <span class="truncate text-base-content/70">{{ uploadedMap[doc.document_id].file_name }}</span>
            <span class="text-xs text-base-content/40 shrink-0">{{ formatBytes(uploadedMap[doc.document_id].file_size) }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-xs text-error ml-auto shrink-0"
              :disabled="uploadingId === doc.document_id"
              @click="removeDoc(doc.document_id)"
            >
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
              Remove
            </button>
          </div>

          <!-- Upload area -->
          <div class="px-4 py-4">
            <label
              :for="`file-${doc.document_id}`"
              :class="[
                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-all',
                uploadingId === doc.document_id
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-base-300 hover:border-green-400 hover:bg-green-50/40'
              ]"
            >
              <span v-if="uploadingId === doc.document_id" class="loading loading-spinner loading-sm text-primary"></span>
              <Icon v-else name="lucide:upload-cloud" class="w-7 h-7 text-base-content/30" />
              <span class="text-xs text-base-content/50">
                {{ uploadedMap[doc.document_id] ? 'Click to replace' : 'Click to upload' }} &middot; PDF, JPG, PNG, DOC &middot; max 10 MB
              </span>
              <input
                :id="`file-${doc.document_id}`"
                type="file"
                class="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                :disabled="uploadingId === doc.document_id"
                @change="(e) => handleFileChange(e, doc.document_id, doc.locality)"
              />
            </label>
            <p v-if="uploadErrors[doc.document_id]" class="mt-1 text-xs text-error">{{ uploadErrors[doc.document_id] }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  companyId: { type: Number, default: null },
  customertypeId: { type: Number, default: null },
});

const {
  getDocumentRequirementGroups,
  getRequiredDocuments,
  getUploadedDocuments,
  uploadDocument,
  removeDocument,
} = useOrganisationHelper();

const docsLoading = ref(false);
const requiredDocs = ref([]);
const uploadedDocs = ref([]);
const uploadingId = ref(null);
const uploadErrors = reactive({});
const selectedGroupId = ref(null);
const requirementGroups = ref([]);

const uploadedMap = computed(() =>
  Object.fromEntries(uploadedDocs.value.map((d) => [d.document_id, d]))
);

const activeDocs = computed(() => {
  if (selectedGroupId.value === null) return requiredDocs.value;
  return requiredDocs.value.filter(
    (d) => d.documentrequirementgroup_id === selectedGroupId.value
  );
});

// Docs in the active group not yet uploaded — used for validation and the progress banner
const missingDocs = computed(() =>
  activeDocs.value.filter((d) => !uploadedMap.value[d.document_id])
);

const allDocumentsUploaded = computed(() =>
  !docsLoading.value && activeDocs.value.length > 0 && missingDocs.value.length === 0
);

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const load = async () => {
  if (!props.companyId || !props.customertypeId) return;
  docsLoading.value = true;
  const [reqRes, upRes, groupRes] = await Promise.all([
    getRequiredDocuments(props.customertypeId),
    getUploadedDocuments(props.companyId),
    getDocumentRequirementGroups(),
  ]);
  requiredDocs.value = reqRes.data?.data ?? [];
  uploadedDocs.value = upRes.data?.data ?? [];

  const documentCounts = requiredDocs.value.reduce((counts, document) => {
    const groupId = document.documentrequirementgroup_id;
    if (groupId) counts[groupId] = (counts[groupId] ?? 0) + 1;
    return counts;
  }, {});
  const groupsFromDocuments = requiredDocs.value
    .map((document) => document.documentrequirementgroup)
    .filter(Boolean)
    .filter((group, index, groups) => groups.findIndex((candidate) => candidate.id === group.id) === index);
  const allGroups = groupRes.ok ? (groupRes.data?.data ?? []) : groupsFromDocuments;
  requirementGroups.value = allGroups.map((group) => ({
    ...group,
    document_count: documentCounts[group.id] ?? 0,
  }));

  // Auto-select the first group if groups exist and nothing is selected yet
  if (selectedGroupId.value === null) {
    selectedGroupId.value = requirementGroups.value.find((group) => group.document_count > 0)?.id ?? null;
  }
  docsLoading.value = false;
};

const handleFileChange = async (event, documentId, locality) => {
  const file = event.target.files?.[0];
  if (!file) return;
  uploadErrors[documentId] = '';
  uploadingId.value = documentId;
  const { ok, error } = await uploadDocument(props.companyId, documentId, file, locality, selectedGroupId.value);
  if (ok) {
    await load();
  } else {
    uploadErrors[documentId] = error;
  }
  uploadingId.value = null;
  event.target.value = '';
};

const removeDoc = async (documentId) => {
  const record = uploadedMap.value[documentId];
  if (!record) return;
  uploadingId.value = documentId;
  const { ok, error } = await removeDocument(props.companyId, record.id);
  if (ok) {
    uploadedDocs.value = uploadedDocs.value.filter((d) => d.document_id !== documentId);
  } else {
    uploadErrors[documentId] = error;
  }
  uploadingId.value = null;
};

defineExpose({ load, allDocumentsUploaded, missingDocs });
</script>
