<template>
  <section v-if="store.actionsPending || store.outstandingActions.length" aria-live="polite" class="space-y-3">
    <div v-if="store.actionsPending" class="h-32 animate-pulse rounded-2xl bg-error/15" />

    <article
      v-for="action in store.outstandingActions"
      v-else
      :key="action.id"
      role="alert"
      class="overflow-hidden rounded-2xl border-2 bg-gradient-to-r to-base-100 shadow-lg"
      :class="action.reverification_available
        ? 'border-warning from-warning/30 via-warning/15 shadow-warning/15'
        : 'border-error from-error/30 via-error/15 shadow-error/15'"
    >
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div class="flex min-w-0 flex-1 items-start gap-4">
          <span
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-md"
            :class="action.reverification_available ? 'bg-warning text-warning-content' : 'bg-error text-error-content'"
          >
            <span class="absolute inset-0 animate-ping rounded-full opacity-25" :class="action.reverification_available ? 'bg-warning' : 'bg-error'" />
            <Icon name="lucide:triangle-alert" class="relative h-6 w-6" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-black" :class="action.reverification_available ? 'text-warning' : 'text-error'">
                {{ action.reverification_available ? 'Corrections required before verification' : 'Supplier verification action required' }}
              </h2>
              <span v-if="action.area" class="badge badge-sm font-semibold" :class="action.reverification_available ? 'badge-warning' : 'badge-error'">{{ action.area }}</span>
            </div>
            <blockquote class="mt-2 whitespace-pre-line text-base font-medium leading-relaxed text-base-content">
              “{{ action.comment }}”
            </blockquote>
            <p class="mt-2 text-xs text-base-content/60">
              Requested by {{ action.author }} · {{ formatDate(action.created_at) }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-col gap-2 sm:items-end">
          <NuxtLink v-if="action.edit_url" :to="action.edit_url" class="btn btn-warning btn-outline gap-2 font-bold">
            <Icon name="lucide:pencil" class="h-4 w-4" />
            Edit organisation profile
          </NuxtLink>
          <button
            class="btn shrink-0 gap-2 font-bold shadow-md"
            :class="action.reverification_available ? 'btn-warning' : 'btn-error'"
            @click="open(action)"
          >
            <Icon name="lucide:refresh-cw" class="h-5 w-5" />
            {{ action.reverification_available ? 'I’ve corrected the details — Reverify' : 'I have actioned this' }}
          </button>
        </div>
      </div>
    </article>

    <dialog ref="dialog" class="modal modal-bottom sm:modal-middle">
      <div class="modal-box max-w-xl">
        <h3 class="text-lg font-bold">{{ selected?.reverification_available ? 'Confirm corrections and reverify' : 'Confirm action completed' }}</h3>
        <div class="mt-3 rounded-xl border p-4" :class="selected?.reverification_available ? 'border-warning/40 bg-warning/10' : 'border-error/30 bg-error/10'">
          <p class="text-xs font-bold uppercase tracking-wide text-base-content/50">Reviewer’s request</p>
          <p class="mt-1 whitespace-pre-line text-sm">{{ selected?.comment }}</p>
        </div>

        <label class="fieldset mt-4">
          <span class="fieldset-legend">Your response (optional)</span>
          <textarea
            v-model="form.message"
            rows="4"
            maxlength="1000"
            class="textarea textarea-bordered w-full"
            placeholder="Briefly explain what you updated or uploaded…"
          />
          <span class="mt-1 text-right text-xs text-base-content/40">{{ form.message.length }}/1000</span>
        </label>

        <div class="mt-4 flex items-start gap-3 rounded-xl border border-info/25 bg-info/10 p-4 text-sm">
          <Icon :name="selected?.reverification_available ? 'lucide:refresh-cw' : 'lucide:mail-check'" class="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <span v-if="selected?.reverification_available">
            Press confirm only after saving all corrections. The system will immediately submit your profile for automatic Companies and Deeds verification again.
          </span>
          <span v-else>The assigned reviewer will automatically receive an email and in-app notification when you confirm.</span>
        </div>

        <p v-if="submitError" class="mt-3 text-sm text-error">{{ submitError }}</p>

        <div class="modal-action">
          <button class="btn btn-ghost" :disabled="saving" @click="close">Cancel</button>
          <button class="btn gap-2" :class="selected?.reverification_available ? 'btn-warning' : 'btn-error'" :disabled="saving" @click="submit">
            <span v-if="saving" class="loading loading-spinner loading-xs" />
            <Icon v-else name="lucide:check-check" class="h-4 w-4" />
            {{ selected?.reverification_available ? 'Confirm and reverify' : 'Confirm actioned' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </section>
</template>

<script setup>
const store = useRegistrationStore()
const toast = useToast()
const dialog = ref(null)
const selected = ref(null)
const saving = ref(false)
const submitError = ref('')
const form = reactive({ message: '' })

onMounted(() => store.fetchOutstandingActions())

function open(action) {
  selected.value = action
  form.message = ''
  submitError.value = ''
  dialog.value?.showModal()
}

function close() {
  dialog.value?.close()
  selected.value = null
}

async function submit() {
  if (!selected.value || saving.value) return
  saving.value = true
  submitError.value = ''
  const result = await store.actionRequirement(selected.value.id, {
    message: form.message.trim() || null,
  })
  saving.value = false

  if (!result.ok) {
    submitError.value = result.error
    return
  }

  close()
  toast.success({
    title: result.data?.reverification_started ? 'Reverification started' : result.data?.notified ? 'Reviewer notified' : 'Action recorded',
    message: result.message,
    position: 'topRight',
    layout: 2,
  })
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
</script>
