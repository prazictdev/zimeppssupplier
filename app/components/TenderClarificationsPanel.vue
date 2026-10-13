<template>
  <section class="rounded-2xl border border-base-200 bg-base-100 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <Icon name="lucide:messages-square" class="h-5 w-5 text-green-600" />
          <h2 class="text-lg font-bold">Tender clarifications</h2>
          <span v-if="authenticated && total" class="badge badge-success badge-sm">{{ total }}</span>
        </div>
        <p class="mt-1 text-sm text-base-content/60">Ask the procuring entity a question and keep every response in one thread.</p>
      </div>
      <button v-if="authenticated" type="button" class="btn btn-success btn-sm" @click="showQuestionForm = !showQuestionForm">
        <Icon name="lucide:message-circle-question" class="h-4 w-4" />
        Ask a question
      </button>
    </div>

    <div v-if="!authenticated" class="mt-4 rounded-xl border border-dashed border-base-300 bg-base-200/30 p-5 text-center">
      <p class="text-sm text-base-content/65">Sign in as a supplier to ask a question and view your organisation's correspondence.</p>
      <NuxtLink :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`" class="btn btn-success btn-sm mt-3">Sign in to ask</NuxtLink>
    </div>

    <form v-else-if="showQuestionForm" class="mt-4 space-y-3 rounded-xl border border-green-200 bg-green-50/40 p-4" @submit.prevent="submitQuestion">
      <label class="form-control">
        <span class="label-text mb-1 text-sm font-medium">Subject</span>
        <input v-model.trim="question.subject" class="input input-bordered w-full" maxlength="200" required placeholder="Briefly describe what needs clarification" />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-sm font-medium">Question</span>
        <textarea v-model.trim="question.message" class="textarea textarea-bordered min-h-28 w-full" maxlength="10000" required placeholder="State your question clearly and include the relevant tender section or item." />
      </label>
      <label class="form-control">
        <span class="label-text mb-1 text-sm font-medium">Attachment <span class="font-normal text-base-content/50">(optional)</span></span>
        <input type="file" class="file-input file-input-bordered file-input-sm w-full" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" :disabled="questionUploading" @change="uploadQuestionAttachment" />
        <span class="mt-1 text-xs text-base-content/50">PDF, JPG, PNG, DOC or DOCX, up to 10 MB.</span>
      </label>
      <div v-if="questionUploading || questionAttachment" class="flex items-center gap-2 text-sm">
        <span v-if="questionUploading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="lucide:paperclip" class="h-4 w-4" />
        <span class="truncate">{{ questionUploading ? 'Uploading attachment…' : questionAttachment.file_name }}</span>
        <button v-if="questionAttachment && !questionUploading" type="button" class="btn btn-ghost btn-xs" @click="questionAttachment = null">Remove</button>
      </div>
      <p v-if="formError" class="text-sm text-error">{{ formError }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-ghost btn-sm" :disabled="submitting" @click="showQuestionForm = false">Cancel</button>
        <button type="submit" class="btn btn-success btn-sm" :disabled="submitting || questionUploading || !question.subject || !question.message">
          <span v-if="submitting" class="loading loading-spinner loading-xs" />
          Submit question
        </button>
      </div>
    </form>

    <div v-if="authenticated" class="mt-5">
      <div v-if="loading" class="flex items-center gap-2 py-6 text-sm text-base-content/50"><span class="loading loading-spinner loading-sm" /> Loading correspondence…</div>
      <div v-else-if="loadError" class="alert alert-error py-3 text-sm">{{ loadError }}</div>
      <div v-else-if="threads.length === 0" class="rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50">Your organisation has not asked a question about this tender.</div>
      <div v-else class="space-y-3">
        <article v-for="thread in threads" :key="thread.uuid" class="overflow-hidden rounded-xl border border-base-200">
          <button type="button" class="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-base-200/30" @click="toggleThread(thread)">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold">{{ thread.subject }}</h3>
                <span class="badge badge-sm" :class="thread.status === 'ANSWERED' ? 'badge-success' : 'badge-warning'">{{ prettyStatus(thread.status) }}</span>
              </div>
              <p class="mt-1 text-xs text-base-content/50">Last activity {{ formatDateTime(thread.last_correspondence_at) }}</p>
            </div>
            <span class="badge badge-ghost shrink-0 gap-1"><Icon name="lucide:messages-square" class="h-3.5 w-3.5" />{{ thread.correspondence_count }}</span>
          </button>

          <div v-if="openUuid === thread.uuid" class="border-t border-base-200 bg-base-200/15 p-4">
            <div v-if="threadLoading" class="py-4 text-center"><span class="loading loading-spinner loading-sm" /></div>
            <template v-else-if="activeThread">
              <div class="space-y-3">
                <div v-for="message in activeThread.messages" :key="message.uuid" class="flex" :class="message.sender_type === 'BIDDER' ? 'justify-end' : 'justify-start'">
                  <div class="max-w-[88%] rounded-xl px-4 py-3 text-sm" :class="message.sender_type === 'BIDDER' ? 'bg-success text-success-content' : 'border border-base-300 bg-base-100'">
                    <div class="mb-1 flex items-center gap-2 text-xs font-semibold opacity-70">
                      <span>{{ message.sender_type === 'BIDDER' ? 'Your organisation' : 'Procuring entity' }}</span>
                      <span>·</span><span>{{ formatDateTime(message.created_at) }}</span>
                    </div>
                    <p class="whitespace-pre-line">{{ message.message }}</p>
                    <button v-if="message.attachment" type="button" class="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-current/20 px-2.5 py-2 text-left text-xs hover:bg-black/5" :disabled="downloadingMessageUuid === message.uuid" @click="downloadAttachment(message)">
                      <span v-if="downloadingMessageUuid === message.uuid" class="loading loading-spinner loading-xs" />
                      <Icon v-else name="lucide:paperclip" class="h-4 w-4 shrink-0" />
                      <span class="min-w-0"><span class="block truncate font-semibold">{{ message.attachment.name }}</span><span class="opacity-65">{{ formatFileSize(message.attachment.size) }}</span></span>
                    </button>
                  </div>
                </div>
              </div>
              <form class="mt-4 space-y-2" @submit.prevent="submitFollowUp">
                <div class="flex gap-2">
                  <textarea v-model.trim="followUp" class="textarea textarea-bordered min-h-20 flex-1" maxlength="10000" required placeholder="Add a follow-up question…" />
                  <button type="submit" class="btn btn-success self-end" :disabled="followUpSubmitting || followUpUploading || !followUp">
                    <span v-if="followUpSubmitting" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:send" class="h-4 w-4" />
                  </button>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <label class="btn btn-outline btn-xs">
                    <span v-if="followUpUploading" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:paperclip" class="h-3.5 w-3.5" />
                    Attach file
                    <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" :disabled="followUpUploading" @change="uploadFollowUpAttachment" />
                  </label>
                  <span v-if="followUpAttachment" class="max-w-xs truncate text-xs">{{ followUpAttachment.file_name }}</span>
                  <button v-if="followUpAttachment" type="button" class="btn btn-ghost btn-xs" @click="followUpAttachment = null">Remove</button>
                  <span class="text-xs text-base-content/45">Maximum 10 MB</span>
                </div>
              </form>
              <p v-if="followUpError" class="mt-2 text-sm text-error">{{ followUpError }}</p>
            </template>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({ tenderUuid: { type: [String, Object], required: true } })
const route = useRoute()
const { user } = useSanctumAuth()
const { listClarifications, getClarification, askQuestion, addFollowUp, getAttachmentUrl } = useTenderClarification()
const { presignAndUpload } = useS3Upload()

const authenticated = computed(() => Boolean(user.value))
const loading = ref(false)
const loadError = ref('')
const threads = ref([])
const total = ref(0)
const showQuestionForm = ref(false)
const question = reactive({ subject: '', message: '' })
const submitting = ref(false)
const formError = ref('')
const questionAttachment = ref(null)
const questionUploading = ref(false)
const openUuid = ref(null)
const activeThread = ref(null)
const threadLoading = ref(false)
const followUp = ref('')
const followUpSubmitting = ref(false)
const followUpError = ref('')
const followUpAttachment = ref(null)
const followUpUploading = ref(false)
const downloadingMessageUuid = ref('')

const tenderUuid = computed(() => String(unref(props.tenderUuid)))

async function loadThreads() {
  if (!authenticated.value) return
  loading.value = true
  loadError.value = ''
  const result = await listClarifications(tenderUuid.value)
  loading.value = false
  if (!result.ok) return void (loadError.value = result.error)
  const paginator = result.data?.data ?? {}
  threads.value = paginator.data ?? []
  total.value = paginator.total ?? threads.value.length
}

async function submitQuestion() {
  submitting.value = true
  formError.value = ''
  const result = await askQuestion(tenderUuid.value, { ...question, ...(questionAttachment.value ?? {}) })
  submitting.value = false
  if (!result.ok) return void (formError.value = result.error)
  question.subject = ''
  question.message = ''
  questionAttachment.value = null
  showQuestionForm.value = false
  await loadThreads()
}

async function toggleThread(thread) {
  if (openUuid.value === thread.uuid) {
    openUuid.value = null
    activeThread.value = null
    return
  }
  openUuid.value = thread.uuid
  await loadThread(thread.uuid)
}

async function loadThread(clarificationUuid) {
  threadLoading.value = true
  const result = await getClarification(tenderUuid.value, clarificationUuid)
  activeThread.value = result.ok ? result.data?.data ?? null : null
  threadLoading.value = false
}

async function submitFollowUp() {
  if (!openUuid.value || !followUp.value) return
  followUpSubmitting.value = true
  followUpError.value = ''
  const result = await addFollowUp(tenderUuid.value, openUuid.value, { message: followUp.value, ...(followUpAttachment.value ?? {}) })
  followUpSubmitting.value = false
  if (!result.ok) return void (followUpError.value = result.error)
  followUp.value = ''
  followUpAttachment.value = null
  await loadThread(openUuid.value)
  await loadThreads()
}

async function uploadQuestionAttachment(event) {
  await uploadAttachment(event, questionAttachment, questionUploading, formError)
}

async function uploadFollowUpAttachment(event) {
  await uploadAttachment(event, followUpAttachment, followUpUploading, followUpError)
}

async function uploadAttachment(event, attachment, uploading, error) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  const result = await presignAndUpload(file, 'tender-clarifications')
  uploading.value = false
  event.target.value = ''
  if (!result.ok) return void (error.value = result.error)
  attachment.value = result.data
}

async function downloadAttachment(message) {
  if (!openUuid.value || downloadingMessageUuid.value) return
  const openedWindow = window.open('', '_blank')
  downloadingMessageUuid.value = message.uuid
  followUpError.value = ''
  const result = await getAttachmentUrl(tenderUuid.value, openUuid.value, message.uuid)
  downloadingMessageUuid.value = ''
  if (!result.ok) {
    openedWindow?.close()
    return void (followUpError.value = result.error)
  }
  const url = result.data?.data?.url
  if (url && openedWindow) openedWindow.location.href = url
  else if (url) window.location.href = url
}

function prettyStatus(status) { return status === 'ANSWERED' ? 'Answered' : 'Awaiting response' }
function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

watch(authenticated, value => { if (value) loadThreads() }, { immediate: true })
</script>
