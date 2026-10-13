<template>
  <div class="mx-auto max-w-lg px-4 py-10">
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="card-body p-6 sm:p-8">
        <div class="mb-2 flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
            <Icon name="lucide:monitor-smartphone" class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 class="text-xl font-bold">Authorise a desktop app</h1>
            <p class="text-sm text-base-content/60">Confirm the code shown on your desktop app to sign it in.</p>
          </div>
        </div>

        <!-- Done state -->
        <div v-if="done" class="mt-4 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <Icon :name="done === 'approved' ? 'lucide:check-circle-2' : 'lucide:x-circle'" class="mx-auto h-10 w-10" :class="done === 'approved' ? 'text-green-600' : 'text-base-content/40'" />
          <p class="mt-2 font-semibold">{{ doneMessage }}</p>
          <p class="mt-1 text-sm text-base-content/60">You can close this tab and return to the desktop app.</p>
          <NuxtLink to="/dashboard" class="btn btn-success btn-sm mt-4">Back to dashboard</NuxtLink>
        </div>

        <template v-else>
          <!-- Code entry -->
          <label class="form-control mt-4 w-full">
            <span class="label-text text-xs font-medium">Pairing code</span>
            <input
              v-model="code"
              type="text"
              inputmode="text"
              autocomplete="off"
              class="input input-bordered w-full text-center font-mono text-lg tracking-[0.3em] uppercase"
              placeholder="XXXX-XXXX"
              :disabled="submitting"
              @input="onCodeInput"
            />
          </label>

          <div v-if="error" class="alert alert-error mt-3 py-2 text-sm">
            <Icon name="lucide:alert-triangle" class="h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <!-- Matched device info -->
          <div v-if="device" class="mt-3 rounded-lg border border-base-200 bg-base-200/30 p-3 text-sm">
            <div class="flex items-center gap-2">
              <Icon name="lucide:laptop" class="h-4 w-4 text-base-content/50" />
              <span class="font-medium">{{ device.device_name || 'Desktop application' }}</span>
            </div>
            <p class="mt-1 text-xs text-base-content/60">
              Approving will sign this device in to your supplier account. Only do this for a device you control.
            </p>
          </div>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              class="btn btn-success flex-1"
              :disabled="submitting || !normalisedCode"
              @click="approve"
            >
              <span v-if="submitting === 'approve'" class="loading loading-spinner loading-sm" />
              <Icon v-else name="lucide:check" class="h-4 w-4" />
              Approve &amp; sign in
            </button>
            <button
              class="btn btn-ghost border border-base-300"
              :disabled="submitting || !normalisedCode"
              @click="deny"
            >
              <span v-if="submitting === 'deny'" class="loading loading-spinner loading-sm" />
              Deny
            </button>
          </div>

          <p class="mt-4 text-center text-xs text-base-content/40">
            Never enter a code that you did not generate from your own desktop app.
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Authorise a desktop app' })

const route = useRoute()
const { lookupDevice, approveDevice, denyDevice } = useDesktopAuthHelper()

const code = ref('')
const device = ref(null)
const error = ref('')
const submitting = ref(null)
const done = ref('')

const normalisedCode = computed(() => code.value.replace(/[^a-z0-9]/gi, '').toUpperCase())

const doneMessage = computed(() =>
  done.value === 'approved' ? 'Desktop app authorised.' : 'Request denied.',
)

function formatCode(raw) {
  const clean = raw.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

let lookupTimer = null
function onCodeInput() {
  code.value = formatCode(code.value)
  error.value = ''
  device.value = null
  clearTimeout(lookupTimer)
  if (normalisedCode.value.length === 8) {
    lookupTimer = setTimeout(runLookup, 250)
  }
}

async function runLookup() {
  const res = await lookupDevice(code.value)
  if (res.ok) {
    device.value = res.data
    if (res.data?.expired) error.value = 'That pairing code has expired. Start again on the desktop app.'
  } else if (res.notFound) {
    device.value = null
  } else {
    error.value = res.error
  }
}

async function approve() {
  if (!normalisedCode.value) return
  submitting.value = 'approve'
  error.value = ''
  const res = await approveDevice(code.value)
  submitting.value = null
  if (res.ok) done.value = 'approved'
  else error.value = res.error
}

async function deny() {
  if (!normalisedCode.value) return
  submitting.value = 'deny'
  error.value = ''
  const res = await denyDevice(code.value)
  submitting.value = null
  if (res.ok) done.value = 'denied'
  else error.value = res.error
}

onMounted(() => {
  const prefill = route.query.code
  if (prefill) {
    code.value = formatCode(String(prefill))
    if (normalisedCode.value.length === 8) runLookup()
  }
})
</script>
