<template>
  <div class="space-y-6">
    <header class="rounded-3xl bg-gradient-to-br from-success to-emerald-700 p-6 text-white shadow-lg">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p class="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Organisation library</p><h1 class="mt-1 text-3xl font-bold">Media Center</h1><p class="mt-2 max-w-2xl text-sm text-white/80">Upload a document once, then reference it in any number of tender responses without storing duplicate copies.</p></div>
        <label class="btn border-0 bg-white text-success hover:bg-white/90"><Icon name="lucide:upload" class="h-4 w-4" />Upload document<input type="file" class="hidden" @change="uploadDocument"></label>
      </div>
    </header>

    <div v-if="error" class="alert alert-error"><Icon name="lucide:triangle-alert" class="h-5 w-5" /><span>{{ error }}</span></div>
    <section class="rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <div class="flex flex-col gap-3 border-b border-base-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 class="font-bold">Reusable documents</h2><p class="text-xs text-base-content/55">Archived documents remain available to bids that already reference them.</p></div>
        <label class="input input-bordered input-sm flex items-center gap-2 sm:w-72"><Icon name="lucide:search" class="h-4 w-4" /><input v-model="search" class="grow" placeholder="Search documents" @input="loadDocuments"></label>
      </div>
      <div v-if="loading" class="p-12 text-center"><span class="loading loading-spinner text-success" /></div>
      <div v-else-if="documents.length" class="overflow-x-auto">
        <table class="table"><thead><tr><th>Document</th><th>Category</th><th>Size</th><th>Expiry</th><th>References</th><th class="text-right">Actions</th></tr></thead>
          <tbody><tr v-for="document in documents" :key="document.uuid">
            <td><div class="flex items-center gap-3"><span class="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success"><Icon name="lucide:file-text" class="h-5 w-5" /></span><div><p class="font-semibold">{{ document.title }}</p><p class="max-w-xs truncate text-xs text-base-content/50">{{ document.original_filename }}</p></div></div></td>
            <td>{{ document.category || 'General' }}</td><td>{{ formatBytes(document.file_size) }}</td><td>{{ document.expires_at || 'No expiry' }}</td><td><span class="badge badge-ghost">{{ document.bid_versions_count || 0 }} bid(s)</span></td>
            <td><div class="flex justify-end gap-2"><button class="btn btn-ghost btn-sm" @click="download(document)"><Icon name="lucide:download" class="h-4 w-4" /></button><button class="btn btn-ghost btn-sm text-error" @click="archive(document)"><Icon name="lucide:archive" class="h-4 w-4" /></button></div></td>
          </tr></tbody>
        </table>
      </div>
      <div v-else class="p-12 text-center text-base-content/50"><Icon name="lucide:library" class="mx-auto mb-3 h-10 w-10" /><p class="font-medium">No reusable documents yet</p><p class="text-sm">Upload your first document to start saving storage.</p></div>
    </section>

    <dialog ref="detailsDialog" class="modal"><div class="modal-box"><h3 class="text-lg font-bold">Document details</h3><div class="mt-4 space-y-3"><label class="fieldset"><span class="fieldset-legend">Display name</span><input v-model="form.title" class="input input-bordered w-full"></label><label class="fieldset"><span class="fieldset-legend">Category</span><input v-model="form.category" class="input input-bordered w-full" placeholder="e.g. Statutory, Financial"></label><label class="fieldset"><span class="fieldset-legend">Expiry date (optional)</span><input v-model="form.expires_at" type="date" class="input input-bordered w-full"></label></div><div class="modal-action"><button class="btn" @click="cancelUpload">Cancel</button><button class="btn btn-success" :disabled="saving || !form.title" @click="saveUpload"><span v-if="saving" class="loading loading-spinner loading-xs" />Save to Media Center</button></div></div></dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
const media = useMediaCenter();
const uploader = useS3Upload();
const documents = ref([]); const loading = ref(false); const saving = ref(false); const error = ref(''); const search = ref('');
const detailsDialog = ref(null); const pendingFile = ref(null); const form = reactive({ title: '', category: '', expires_at: '' });
const formatBytes = size => size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
async function loadDocuments() { loading.value = true; error.value = ''; const result = await media.list(search.value); loading.value = false; if (result.ok) { const payload = result.data; documents.value = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.items) ? payload.items : [])); } else error.value = result.error; }
function uploadDocument(event) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; pendingFile.value = file; form.title = file.name.replace(/\.[^.]+$/, ''); form.category = ''; form.expires_at = ''; detailsDialog.value?.showModal(); }
function cancelUpload() { pendingFile.value = null; detailsDialog.value?.close(); }
async function saveUpload() { saving.value = true; error.value = ''; const file = pendingFile.value; const upload = await uploader.presignAndUpload(file, 'supplier-media-center'); if (!upload.ok) { error.value = upload.error; saving.value = false; return; } const result = await media.create({ ...upload.data, ...form, expires_at: form.expires_at || null }); saving.value = false; if (!result.ok) { error.value = result.error; return; } detailsDialog.value?.close(); pendingFile.value = null; await loadDocuments(); }
async function download(document) { const result = await media.download(document.uuid); if (result.ok && result.data?.url) window.open(result.data.url, '_blank', 'noopener'); else error.value = result.error; }
async function archive(document) { if (!confirm(`Archive “${document.title}”? Existing bid references will remain valid.`)) return; const result = await media.archive(document.uuid); if (result.ok) await loadDocuments(); else error.value = result.error; }
onMounted(loadDocuments);
</script>
