<template>
  <dialog ref="dialog" class="modal" @cancel.prevent>
    <div v-if="currentNotice" class="modal-box max-w-2xl overflow-hidden p-0">
      <div class="bg-warning px-6 py-5 text-warning-content">
        <div class="flex items-start gap-3">
          <span class="rounded-xl bg-warning-content/10 p-2.5">
            <Icon name="lucide:file-warning" class="h-6 w-6" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-[0.18em]">Important tender update</p>
            <h2 class="mt-1 text-xl font-black">Addendum acknowledgement required</h2>
          </div>
        </div>
      </div>

      <div class="space-y-5 p-6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="badge badge-warning font-bold">Addendum #{{ currentNotice.addendum_number }}</span>
          <span v-if="pendingNotices.length > 1" class="text-xs text-base-content/50">
            {{ currentIndex + 1 }} of {{ pendingNotices.length }} notices
          </span>
        </div>

        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/50">
            {{ currentNotice.tender_reference || 'Tender' }}
          </p>
          <h3 class="mt-1 text-lg font-bold text-base-content">{{ currentNotice.tender_title }}</h3>
          <p class="mt-3 font-semibold text-base-content">{{ currentNotice.addendum_title }}</p>
          <p class="mt-2 whitespace-pre-line text-sm leading-6 text-base-content/70">
            {{ currentNotice.description || currentNotice.message }}
          </p>
          <p v-if="currentNotice.published_at" class="mt-3 text-xs text-base-content/45">
            Published {{ formatDate(currentNotice.published_at) }}
          </p>
        </div>

        <div class="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-base-content/70">
          Review the addendum before continuing with or submitting your bid response. The amended requirements form part of the tender.
        </div>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 p-4">
          <input v-model="confirmed" type="checkbox" class="checkbox checkbox-warning mt-0.5" />
          <span class="text-sm font-medium leading-6">
            I confirm that I have read and understood this addendum notice.
          </span>
        </label>

        <p v-if="error" class="text-sm text-error">{{ error }}</p>

        <button
          class="btn btn-warning w-full"
          :disabled="!confirmed || saving"
          @click="acknowledge"
        >
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ saving ? 'Saving acknowledgement…' : 'Confirm acknowledgement' }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup>
const dialog = ref(null)
const pendingNotices = ref([])
const currentIndex = ref(0)
const confirmed = ref(false)
const saving = ref(false)
const error = ref('')

const currentNotice = computed(() => pendingNotices.value[currentIndex.value] ?? null)

async function loadPendingNotices() {
  try {
    const client = useSupplierClient()
    const response = await client('/api/supplier/v1/notifications/pending-addenda', { method: 'GET' })
    pendingNotices.value = response?.data?.addenda ?? []
    currentIndex.value = 0

    if (pendingNotices.value.length) {
      await nextTick()
      if (!dialog.value?.open) dialog.value?.showModal()
    }
  } catch (exception) {
    error.value = exception?.data?.message ?? 'Unable to load addendum notices.'
  }
}

async function acknowledge() {
  if (!confirmed.value || !currentNotice.value || saving.value) return

  saving.value = true
  error.value = ''
  try {
    const client = useSupplierClient()
    await client(`/api/supplier/v1/notifications/addenda/${currentNotice.value.uuid}/acknowledge`, {
      method: 'POST',
    })

    pendingNotices.value.splice(currentIndex.value, 1)
    confirmed.value = false

    if (!pendingNotices.value.length) {
      dialog.value?.close()
      await useNotificationStore().refreshUnreadCount()
      await navigateTo('/mysupplierbids')
    }
  } catch (exception) {
    error.value = exception?.data?.message ?? 'Unable to save your acknowledgement. Please try again.'
  } finally {
    saving.value = false
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-ZW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

onMounted(loadPendingNotices)
</script>
