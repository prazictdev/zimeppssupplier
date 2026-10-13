<template>
  <div class="flex h-[calc(100vh-4rem)]">

    <!-- Sidebar -->
    <aside class="hidden lg:flex flex-col w-72 shrink-0 bg-base-100 border-r border-base-200">
      <div class="bg-green-600 text-white p-6">
        <h1 class="text-lg font-bold leading-snug">New Registration</h1>
        <p class="text-green-100 text-xs mt-1">Complete all steps to submit your application.</p>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <button
          v-for="(s, idx) in steps"
          :key="idx"
          type="button"
          :disabled="step < idx + 1"
          :class="[
            'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
            step === idx + 1
              ? 'bg-green-50 text-green-700 font-semibold border border-green-200'
              : step > idx + 1
              ? 'text-base-content/60 hover:bg-base-200 cursor-pointer'
              : 'text-base-content/40 cursor-default',
          ]"
          @click="step > idx + 1 ? (step = idx + 1) : null"
        >
          <span
            :class="[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2',
              step > idx + 1
                ? 'bg-green-500 border-green-500 text-white'
                : step === idx + 1
                ? 'border-green-500 text-green-600 bg-white'
                : 'border-base-300 text-base-content/30 bg-white',
            ]"
          >
            <Icon v-if="step > idx + 1" name="lucide:check" class="w-3.5 h-3.5" />
            <span v-else>{{ idx + 1 }}</span>
          </span>
          <div class="min-w-0">
            <div class="text-sm truncate">{{ s.label }}</div>
            <div class="text-xs truncate" :class="step === idx + 1 ? 'text-green-600/70' : 'text-base-content/40'">{{ s.sub }}</div>
          </div>
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex flex-1 flex-col min-w-0">

      <!-- Mobile step bar -->
      <div class="lg:hidden bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{{ step }}</span>
        <div>
          <div class="font-semibold text-sm">{{ steps[step - 1].label }}</div>
          <div class="text-green-200 text-xs">Step {{ step }} of {{ steps.length }}</div>
        </div>
        <div class="ml-auto text-xs text-green-200">{{ Math.round(((step - 1) / steps.length) * 100) }}%</div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto p-6 lg:p-8">

          <div v-if="progressLoading" class="flex justify-center py-20">
            <span class="loading loading-spinner loading-lg text-base-content/30" />
          </div>

          <template v-else>

          <ApplicationStepCategory
            v-if="step === 1"
            :application="application"
            @init="onInitCategories"
            @select="onSelectCategory"
            @remove="onRemoveCategory"
            @invoice-voided="onInvoiceVoided"
          />

          <ApplicationStepCurrency
            v-else-if="step === 2"
            :application="application"
            @select="onSelectCurrency"
            @confirm="v => application.invoiceConfirmed = v"
          />

          <ApplicationStepInvoice
            v-else-if="step === 3"
            :application="application"
          />

          <div v-else-if="step === 4" class="space-y-4">
            <div v-if="walletChecking" class="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
              <span class="loading loading-spinner loading-sm text-primary shrink-0" />
              <div>
                <p class="text-sm font-medium text-primary">Checking your PRAZ CRM wallet…</p>
                <p class="text-xs text-base-content/60">A sufficient wallet balance will settle this invoice automatically.</p>
              </div>
            </div>
            <div v-else-if="walletSettled" class="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-5 py-4">
              <Icon name="lucide:wallet-cards" class="h-5 w-5 text-success shrink-0" />
              <p class="text-sm font-medium text-success">Your invoice was settled from your wallet. Registration processing will continue.</p>
            </div>
            <div
              v-else-if="walletChecked && wallet && walletBalance < Number(application.invoice?.total ?? 0)"
              class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/50 px-5 py-4"
            >
              <Icon name="lucide:wallet-cards" class="h-5 w-5 text-base-content/60 shrink-0" />
              <div class="text-sm">
                <p class="font-medium">
                  {{ wallet.currency || application.invoice?.currency?.code }}
                  {{ formatAmount(walletBalance) }} available in your {{ wallet.type || 'applicable' }} wallet
                </p>
                <p class="text-xs text-base-content/60">
                  The balance is below the invoice total of
                  {{ application.invoice?.currency?.code }} {{ formatAmount(application.invoice?.total) }}.
                  Choose another payment method below.
                </p>
              </div>
            </div>

            <!-- Payment verification banner -->
            <div v-if="paymentChecking" class="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
              <span class="loading loading-spinner loading-sm text-primary shrink-0" />
              <p class="text-sm font-medium text-primary">Confirming your payment with PRAZ CRM, please wait…</p>
            </div>
            <div v-else-if="paymentCheckResult === 'success'" class="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-5 py-4">
              <Icon name="lucide:circle-check" class="h-5 w-5 text-success shrink-0" />
              <p class="text-sm font-medium text-success">Payment confirmed! Your registration is being processed.</p>
            </div>
            <div v-else-if="paymentCheckResult === 'processing'" class="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-5 py-4">
              <Icon name="lucide:clock" class="h-5 w-5 text-warning shrink-0" />
              <p class="text-sm font-medium text-warning">Payment received. PRAZ CRM is still receipting your invoice — do not pay again, please refresh shortly.</p>
            </div>
            <div v-else-if="paymentCheckResult === 'error'" class="flex items-center gap-3 rounded-xl border border-error/30 bg-error/5 px-5 py-4">
              <Icon name="lucide:alert-circle" class="h-5 w-5 text-error shrink-0" />
              <p class="text-sm font-medium text-error">Payment could not be verified. Please try again or choose another method.</p>
            </div>

            <ApplicationStepPayment
              v-if="!walletChecking && !walletSettled && !paymentChecking && !['success', 'processing'].includes(paymentCheckResult)"
              :application="application"
              @payment="onPayment"
            />
          </div>

          </template>

        </div>
      </div>

      <!-- Footer nav -->
      <div class="shrink-0 border-t border-base-200 bg-base-100 px-6 py-4 flex items-center justify-between gap-4">
        <button v-if="step > 1" type="button" class="btn btn-ghost gap-2" @click="step--">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Back
        </button>
        <button v-else type="button" class="btn btn-ghost gap-2" @click="navigateTo('/dashboard')">
          <Icon name="lucide:x" class="w-4 h-4" />
          Cancel
        </button>

        <div class="flex items-center gap-3">
          <div class="lg:hidden flex gap-1">
            <span
              v-for="(_, idx) in steps"
              :key="idx"
              :class="['w-2 h-2 rounded-full', step === idx + 1 ? 'bg-green-500' : step > idx + 1 ? 'bg-green-300' : 'bg-base-300']"
            />
          </div>

          <button
            v-if="step < steps.length"
            type="button"
            class="btn btn-success gap-2"
            :disabled="!canProceed || generatingInvoice"
            @click="handleNext"
          >
            <span v-if="generatingInvoice" class="loading loading-spinner loading-xs" />
            <template v-else>
              Next
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </template>
          </button>

          <template v-else>
            <button
              v-if="walletChecking"
              type="button"
              class="btn btn-disabled gap-2"
              disabled
            >
              <span class="loading loading-spinner loading-xs" />
              Checking Wallet
            </button>

            <button
              v-else-if="walletSettled || paymentCheckResult === 'success'"
              type="button"
              class="btn btn-success gap-2"
              @click="navigateTo('/dashboard')"
            >
              Continue
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </button>

            <button
              v-else-if="isOnlinePayment"
              type="button"
              class="btn btn-primary gap-2"
              :disabled="submitting || !canSubmit"
              @click="handleSubmit"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs" />
              <template v-else>
                <Icon name="lucide:external-link" class="w-4 h-4" />
                Continue to Online Payment
              </template>
            </button>

            <button
              v-else
              type="button"
              class="btn btn-success gap-2"
              :disabled="submitting || !canSubmit"
              @click="handleSubmit"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs" />
              <template v-else>
                Submit Bank Payment
                <Icon name="lucide:send" class="w-4 h-4" />
              </template>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  sanctum: { authenticated: true },
})
const route = useRoute()
useHead({ title: 'New Supplier Registration' })

const steps = [
  { label: 'Category Selection', sub: 'Choose a supplier category',      icon: 'lucide:tag' },
  { label: 'Currency Selection', sub: 'Select your payment currency',     icon: 'lucide:coins' },
  { label: 'Invoice',            sub: 'Review your registration invoice', icon: 'lucide:file-text' },
  { label: 'Payment',            sub: 'Select your payment method',          icon: 'lucide:credit-card' },
]

const step = ref(1)
const submitting = ref(false)
const progressLoading = ref(true)


const application = reactive({
  suppliercategories: [],
  currency_id: null,
  currency: null,
  invoiceConfirmed: false,
  invoice: null,
  payment: null,
})

const generatingInvoice = ref(false)

const canProceed = computed(() => {
  if (step.value === 1) return application.suppliercategories.length > 0
  if (step.value === 2) return !!application.currency_id && application.invoiceConfirmed
  return true
})

const canSubmit = computed(() => {
  const p = application.payment
  if (!p) return false
  if (p.channel === 'online') return true
  const commonBankDetails = !!(
    p.channel === 'bank' &&
    p.sourceBank &&
    p.accountName &&
    p.paymentDate &&
    p.sourceReference &&
    p.proofKey
  )
  if (!commonBankDetails) return false
  if (p.transferType === 'rtgs') return !!p.accountNumber
  if (p.transferType === 'zipit') return !!(p.accountNumber && p.stanCode)
  if (p.transferType === 'foreign_deposit') {
    return !!(p.bankCountry && p.depositBranch && p.remittanceCurrency && Number(p.amountSent) > 0)
  }
  if (p.transferType === 'foreign_transfer') {
    return !!(p.bankCountry && p.accountNumber && p.swiftCode && p.remittanceCurrency && Number(p.amountSent) > 0)
  }
  return false
})

const isOnlinePayment = computed(() => application.payment?.channel === 'online')

function onPayment(payload) {
  application.payment = payload
}

function onInitCategories(registrations) {
  if (!application.suppliercategories.length) {
    application.suppliercategories = registrations
  }
}

function onSelectCategory(registration) {
  if (!application.suppliercategories.find(r => r.id === registration.id)) {
    application.suppliercategories.push(registration)
  }
}

function onRemoveCategory(registrationId) {
  application.suppliercategories = application.suppliercategories.filter(r => r.id !== registrationId)
}

function onInvoiceVoided() {
  application.invoice = null
  application.invoiceConfirmed = false
}

function onSelectCurrency(currency) {
  application.currency_id = currency.id
  application.currency = currency
  application.invoiceConfirmed = false
  application.invoice = null
}

const client = useSupplierClient()
const { initiateOnline, payBank, payWallet } = usePayment()
const { getInvoiceWalletBalance } = useWallet()
const { confirmPaymentReturn } = useCrmPaymentReturn()
const toast = useToast()

const paymentCheckResult = ref(null)
const paymentChecking = ref(false)
const wallet = ref(null)
const walletChecking = ref(false)
const walletChecked = ref(false)
const walletSettled = ref(false)
const walletSettlementAttemptedFor = ref(null)

const walletBalance = computed(() => {
  const parsed = Number(String(wallet.value?.balance ?? '0').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : 0
})

const formatAmount = value => Number(value ?? 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

async function checkWalletAndSettle() {
  const invoice = application.invoice
  if (!invoice?.id || invoice.status === 'PAID' || route.query.payment_reference) return
  if (walletSettlementAttemptedFor.value === invoice.id) return

  walletSettlementAttemptedFor.value = invoice.id
  walletChecking.value = true
  walletChecked.value = false
  wallet.value = null

  try {
    wallet.value = await getInvoiceWalletBalance(invoice.id)
    walletChecked.value = true

    const amountDue = Number(invoice.total ?? 0)
    if (!wallet.value || amountDue <= 0 || walletBalance.value < amountDue) return

    const result = await payWallet(invoice.id)
    if (!result?.status) {
      toast.error({
        title: 'Wallet settlement failed',
        message: result?.message ?? 'The invoice could not be settled from your wallet.',
        position: 'topRight',
        layout: 2,
      })
      return
    }

    walletSettled.value = true
    application.invoice.status = 'PAID'
    toast.success({
      title: 'Invoice settled',
      message: 'Your wallet balance was sufficient and the registration invoice has been paid.',
      position: 'topRight',
      layout: 2,
    })
    await navigateTo('/dashboard')
  } finally {
    walletChecking.value = false
  }
}

watch(step, (currentStep) => {
  if (currentStep === 4) {
    void checkWalletAndSettle()
  }
})

onMounted(async () => {
  try {
    const res = await client('/api/supplier/v1/application/progress', { method: 'GET' })
    const progress = res?.data
    if (progress) {
      application.suppliercategories = progress.registrations ?? []
      if (progress.invoice) {
        application.invoice = progress.invoice
        application.currency = progress.invoice.currency ?? null
        application.currency_id = progress.invoice.currency_id ?? null
        application.invoiceConfirmed = true
      }
      step.value = progress.step ?? 1
    }

    const paymentReference = route.query.payment_reference
    if (typeof paymentReference === 'string' && paymentReference && application.invoice) {
      paymentChecking.value = true
      const status = await confirmPaymentReturn(application.invoice.id, paymentReference)
      // PROCESSING means the gateway took the money but PRAZ CRM has not
      // receipted it yet — never show that as a failure, or the supplier is
      // told to pay a second time for an invoice that is already settled.
      paymentCheckResult.value = status?.status === 'PAID'
        ? 'success'
        : (status?.status === 'PROCESSING' ? 'processing' : 'error')
      if (status?.status === 'PAID') {
        toast.success({ title: 'Payment confirmed', message: 'Your registration is being processed.', position: 'topRight', layout: 2 })
        if (application.invoice) application.invoice.status = 'PAID'
        paymentChecking.value = false
        await navigateTo('/dashboard')
        return
      } else if (status?.status === 'PROCESSING') {
        toast.success({ title: 'Payment received', message: 'PRAZ CRM is still receipting your invoice.', position: 'topRight', layout: 2 })
      } else {
        toast.error({ title: 'Payment not confirmed', message: 'Payment could not be confirmed.', position: 'topRight', layout: 2 })
      }
      paymentChecking.value = false
    }
  } catch {
    // proceed from step 1 if progress fails
  } finally {
    progressLoading.value = false
  }
})

async function handleNext() {
  if (step.value === 2 && application.invoiceConfirmed && !application.invoice) {
    generatingInvoice.value = true
    try {
      const res = await client('/api/supplier/v1/registrations/invoice', {
        method: 'POST',
        body: { currency_id: application.currency_id },
      })
      application.invoice = res?.data ?? null
    } catch {
      // keep on step if invoice generation fails
      generatingInvoice.value = false
      return
    }
    generatingInvoice.value = false
  }
  step.value++
}

async function handleSubmit() {
  const p = application.payment
  const invoiceId = application.invoice?.id
  if (!p || !invoiceId) return

  submitting.value = true
  try {
    let res

    if (p.channel === 'online') {
      const returnUrl = `${window.location.origin}/suppliernewapplication`
      res = await initiateOnline(invoiceId, returnUrl)

      if (!res?.status) {
        toast.error({
          title: 'Online payment failed',
          message: res?.message ?? 'Online payment could not be started. Please try again.',
          position: 'topRight',
          layout: 2,
        })
        return
      }

      if (res?.data?.redirect_url) {
        return navigateTo(res.data.redirect_url, { external: true })
      }

      if (res?.data?.settled) {
        toast.success({
          title: 'Invoice already paid',
          message: res?.message ?? 'Your invoice is already paid. Registration processing will continue.',
          position: 'topRight',
          layout: 2,
        })
        return navigateTo('/dashboard')
      }

      toast.error({
        title: 'Payment gateway unavailable',
        message: 'PRAZ CRM did not return a payment-gateway redirect URL. Please try again.',
        position: 'topRight',
        layout: 2,
      })
      return
    } else if (p.channel === 'bank') {
      res = await payBank(invoiceId, {
        transfer_type: p.transferType,
        source_bank: p.sourceBank,
        account_name: p.accountName,
        account_number: p.accountNumber,
        payment_date: p.paymentDate,
        source_reference: p.sourceReference,
        proof_key: p.proofKey,
        stan_code: p.stanCode || null,
        mobile_number: p.mobileNumber || null,
        bank_country: p.bankCountry || null,
        swift_code: p.swiftCode || null,
        remittance_currency: p.remittanceCurrency || null,
        amount_sent: p.amountSent || null,
        deposit_branch: p.depositBranch || null,
        correspondent_reference: p.correspondentReference || null,
      })
    }

    if (res?.status) {
      navigateTo('/dashboard')
    } else if (res && !res.status) {
      toast.error({
        title: 'Payment submission failed',
        message: res.message ?? 'Payment submission failed. Please try again.',
        position: 'topRight',
        layout: 2,
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>
