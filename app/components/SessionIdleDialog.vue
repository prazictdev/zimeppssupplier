<template>
  <dialog ref="dialogRef" class="modal" @cancel.prevent>
    <div class="modal-box max-w-md text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Icon name="lucide:timer-reset" class="h-7 w-7" />
      </div>

      <h2 class="mt-5 text-xl font-bold text-base-content">Are you still using ZimEpps?</h2>
      <p class="mt-2 text-sm leading-6 text-base-content/65">
        This session has been inactive. For your security, you will be signed out unless you choose to continue.
      </p>

      <div class="mt-6 rounded-box bg-base-200 px-5 py-4">
        <p class="text-xs font-medium text-base-content/55">Signing out in</p>
        <p class="mt-1 font-mono text-3xl font-bold text-base-content">
          <span aria-live="polite" :aria-label="`${secondsRemaining} seconds remaining`">{{ secondsRemaining }}</span>
          <span class="ml-1 text-sm font-medium text-base-content/55">seconds</span>
        </p>
      </div>

      <div class="modal-action justify-center">
        <button type="button" class="btn btn-ghost" :disabled="signingOut" @click="signOut">
          <span v-if="signingOut" class="loading loading-spinner loading-xs" />
          {{ signingOut ? 'Signing out' : 'Sign out now' }}
        </button>
        <button type="button" class="btn btn-primary min-w-36" :disabled="signingOut" @click="staySignedIn">
          I’m still here
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup>
const ACTIVITY_STORAGE_KEY = 'supplier-last-activity-at'
const ACTIVITY_THROTTLE_MS = 1000
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart']

const config = useRuntimeConfig()
const { logoutUser } = useAuthHelper()
const dialogRef = ref(null)
const idleTimeoutSeconds = Math.max(1, Number(config.public.idleTimeoutSeconds) || 900)
const idleWarningSeconds = Math.max(1, Number(config.public.idleWarningSeconds) || 60)
const secondsRemaining = ref(idleWarningSeconds)
const signingOut = ref(false)

const idleTimeoutMs = idleTimeoutSeconds * 1000
const warningDurationMs = idleWarningSeconds * 1000

let idleTimer
let countdownTimer
let warningDeadline = 0
let lastRecordedActivity = 0

function clearTimers() {
  window.clearTimeout(idleTimer)
  window.clearInterval(countdownTimer)
}

function scheduleWarning(activityTime = Date.now()) {
  window.clearTimeout(idleTimer)
  const delay = Math.max(0, idleTimeoutMs - (Date.now() - activityTime))
  idleTimer = window.setTimeout(showWarning, delay)
}

function showWarning() {
  if (dialogRef.value?.open || signingOut.value) return

  warningDeadline = Date.now() + warningDurationMs
  secondsRemaining.value = idleWarningSeconds
  dialogRef.value?.showModal()
  updateCountdown()
  countdownTimer = window.setInterval(updateCountdown, 250)
}

function updateCountdown() {
  secondsRemaining.value = Math.max(0, Math.ceil((warningDeadline - Date.now()) / 1000))
  if (secondsRemaining.value === 0) {
    void signOut()
  }
}

function recordActivity() {
  if (dialogRef.value?.open || signingOut.value) return

  const now = Date.now()
  if (now - lastRecordedActivity < ACTIVITY_THROTTLE_MS) return

  lastRecordedActivity = now
  localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
  scheduleWarning(now)
}

function staySignedIn() {
  if (signingOut.value) return

  window.clearInterval(countdownTimer)
  if (dialogRef.value?.open) dialogRef.value.close()
  recordActivity()
}

async function signOut() {
  if (signingOut.value) return

  signingOut.value = true
  clearTimers()
  await logoutUser()
  await navigateTo('/login')
}

function handleStorage(event) {
  if (event.key !== ACTIVITY_STORAGE_KEY || !event.newValue) return

  const activityTime = Number(event.newValue)
  if (!Number.isFinite(activityTime)) return

  if (dialogRef.value?.open) {
    window.clearInterval(countdownTimer)
    dialogRef.value.close()
  }
  scheduleWarning(activityTime)
}

function handleVisibilityChange() {
  if (document.visibilityState !== 'visible' || dialogRef.value?.open) return

  const storedActivity = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY))
  if (Number.isFinite(storedActivity) && Date.now() - storedActivity >= idleTimeoutMs) {
    showWarning()
  }
}

onMounted(() => {
  recordActivity()
  ACTIVITY_EVENTS.forEach(eventName => window.addEventListener(eventName, recordActivity, { passive: true }))
  window.addEventListener('storage', handleStorage)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  clearTimers()
  ACTIVITY_EVENTS.forEach(eventName => window.removeEventListener(eventName, recordActivity))
  window.removeEventListener('storage', handleStorage)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>
