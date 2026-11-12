<template>
  <div class="space-y-6">
    <div
      v-for="session in pendingFeedbackSessions"
      :key="session.uuid"
      role="alert"
      class="alert alert-vertical items-stretch gap-4 border-l-4 border-primary bg-base-100 p-4 text-base-content shadow-sm sm:alert-horizontal sm:items-center sm:p-5"
    >
      <div class="flex min-w-0 items-start gap-3 sm:contents">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-box bg-primary/10 text-primary">
          <Icon name="lucide:message-square-more" class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
            <h3 class="text-base font-bold leading-6">{{ session.title }}</h3>
            <span v-if="session.closes_at" class="text-xs text-base-content/55">Complete by {{ formatFeedbackDate(session.closes_at) }}</span>
          </div>
          <p class="mt-1 max-w-4xl text-sm leading-6 text-base-content/65">
            {{ session.description || 'Tell us about your experience so we can improve the supplier portal.' }}
          </p>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-sm w-full shrink-0 sm:w-auto" @click="openFeedback(session.uuid)">
        {{ feedbackSubmission(session) ? 'Continue feedback' : 'Give feedback' }}
        <Icon name="lucide:arrow-right" class="h-4 w-4" />
      </button>
    </div>

    <div v-if="pendingUpgradeInvoice && canViewRegistrations" role="alert" class="alert alert-error alert-soft sm:alert-horizontal">
      <Icon name="lucide:triangle-alert" class="h-5 w-5 shrink-0" />
      <div class="min-w-0 flex-1">
        <h3 class="font-bold">Upgrade payment is holding your registrations</h3>
        <p class="mt-0.5 text-sm opacity-80">
          Pay invoice {{ pendingUpgradeInvoice.invoice_number }} for {{ pendingUpgradeInvoice.upgradesuppliergroup?.name }} to unlock existing and new registrations.
        </p>
      </div>
      <NuxtLink :to="`/invoice/upgrade/${pendingUpgradeInvoice.uuid}`" class="btn btn-error btn-sm">Review invoice</NuxtLink>
    </div>

    <div
      v-if="affectedRegistrationCount > 0 && canViewRegistrations"
      role="alert"
      class="alert alert-warning alert-soft sm:alert-horizontal"
    >
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-box bg-warning/20 text-warning-content">
        <Icon name="lucide:refresh-cw" class="h-5 w-5" :class="{ 'animate-spin': reconciliationPending }" />
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-bold">Paid registration status needs synchronizing</h3>
          <span class="badge badge-warning badge-sm">
            {{ affectedRegistrationCount }} {{ affectedRegistrationCount === 1 ? 'registration' : 'registrations' }}
          </span>
        </div>
        <p class="mt-1 text-sm opacity-80">
          Payment has been confirmed, but approval processing has not started.
          <template v-if="!reconciliationAttempted && !reconciliationPending">
            Automatic correction starts in <strong>{{ reconciliationCountdown }}s</strong>.
          </template>
          <template v-else-if="reconciliationPending">Synchronizing now…</template>
          <template v-else>Automatic correction could not complete. You can retry or contact support.</template>
        </p>
      </div>
      <button
        type="button"
        class="btn btn-warning btn-sm shrink-0"
        :disabled="reconciliationPending"
        @click="runPaymentReconciliation"
      >
        <span v-if="reconciliationPending" class="loading loading-spinner loading-xs" />
        {{ reconciliationPending ? 'Correcting' : reconciliationAttempted ? 'Retry correction' : 'Correct now' }}
      </button>
    </div>

    <SupplierVerificationActions v-if="canViewRegistrations" />

    <DashboardsBidder
      v-if="company"
      :company="company"
      :wallets="wallets"
      :show-wallets="canViewFinances"
      :show-registrations="canViewRegistrations"
      :show-autorenewals="canViewAutorenewals"
    />

    <div v-else class="card card-border bg-base-100">
      <div class="card-body items-center py-12 text-center">
        <Icon name="lucide:building-2" class="h-9 w-9 text-base-content/25" />
        <h2 class="card-title mt-2 text-base">No organisation workspace yet</h2>
        <p class="max-w-md text-sm text-base-content/55">Complete your organisation setup or ask an administrator to link this account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import DashboardsBidder from '~/components/dashboards/bidder.vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'Supplier workspace' })

const { user } = useSanctumAuth()
const { can, canAny } = useAbility()
const company = computed(() => user.value?.data?.company ?? null)
const pendingUpgradeInvoice = computed(() => user.value?.data?.pending_upgrade_invoice ?? null)
const walletStore = useWalletStore()
const wallets = computed(() => walletStore.wallets)
const { getWalletBalances } = useWallet()
const feedbackApi = useFeedbackHelper()
const registrationStore = useRegistrationStore()
const toast = useToast()
const feedbackSessions = ref([])
const canViewRegistrations = computed(() => can('can.access.myregistrations'))
const canViewAutorenewals = computed(() => can('can.access.supplierautorenewals'))
const canViewFinances = computed(() => canAny([
  'can.acccess.supplierinvoices', 'can.access.supplierstatement',
  'can.access.supplierbankpayments', 'can.access.onlinepayments',
]))
const feedbackSubmission = session => session.submissions?.[0] ?? null
const pendingFeedbackSessions = computed(() => feedbackSessions.value.filter(session => feedbackSubmission(session)?.status !== 'SUBMITTED'))
const formatFeedbackDate = value => new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value))
const reconciliationCountdown = ref(10)
const reconciliationAttempted = ref(false)
const reconciliationPending = computed(() => registrationStore.reconciliationPending)
const affectedRegistrationCount = computed(() => registrationStore.paymentReconciliation.affected_registration_count ?? 0)
let reconciliationTimer = null

const loadFeedbackSessions = async () => {
  try {
    feedbackSessions.value = (await feedbackApi.available()).data ?? []
  } catch {
    feedbackSessions.value = []
  }
}

const openFeedback = uuid => navigateTo(`/feedback/${uuid}`)

const stopReconciliationCountdown = () => {
  if (reconciliationTimer) {
    clearInterval(reconciliationTimer)
    reconciliationTimer = null
  }
}

const runPaymentReconciliation = async () => {
  if (registrationStore.reconciliationPending) return

  stopReconciliationCountdown()
  reconciliationAttempted.value = true
  const result = await registrationStore.reconcilePaidRegistrations()

  if (!result.ok) {
    toast.error({ title: 'Correction failed', message: result.error, position: 'topRight', layout: 2 })
    return
  }

  await registrationStore.fetchRegistrations()

  if ((result.data?.affected_registration_count ?? 0) === 0) {
    toast.success({
      title: 'Registration status corrected',
      message: `${result.data?.corrected_registration_count ?? 0} paid registration status updated.`,
      position: 'topRight',
      layout: 2,
    })
  } else {
    toast.error({
      title: 'Support review required',
      message: 'Some paid registrations could not be corrected automatically.',
      position: 'topRight',
      layout: 2,
    })
  }
}

const loadPaymentReconciliation = async () => {
  const result = await registrationStore.fetchPaymentReconciliation()
  if (!result.ok || (result.data?.affected_registration_count ?? 0) === 0) return

  reconciliationCountdown.value = 10
  stopReconciliationCountdown()
  reconciliationTimer = setInterval(() => {
    reconciliationCountdown.value -= 1
    if (reconciliationCountdown.value <= 0) runPaymentReconciliation()
  }, 1000)
}

onMounted(() => {
  loadFeedbackSessions()
  if (canViewFinances.value) getWalletBalances()
  if (canViewRegistrations.value) loadPaymentReconciliation()
})

onBeforeUnmount(stopReconciliationCountdown)
</script>
