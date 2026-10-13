<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <!-- Back -->
    <div>
      <NuxtLink to="/supplierinvoices" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Invoices
      </NuxtLink>
    </div>

    <!-- Verifying the online payment after returning from Paynow -->
    <div v-if="verifying" class="flex flex-col items-center gap-4 py-24">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p class="text-sm font-medium text-base-content">Verifying your payment…</p>
      <p class="text-xs text-base-content/40">Please wait, this may take a few seconds.</p>
    </div>

    <template v-else-if="verifyResult">
      <div class="rounded-xl px-5 py-5 flex items-start gap-4" :class="verifyResult.success ? 'border border-success/40 bg-success/5' : verifyResult.processing ? 'border border-warning/40 bg-warning/5' : 'border border-error/40 bg-error/5'">
        <div class="rounded-xl p-3 shrink-0" :class="verifyResult.success ? 'bg-success/15' : verifyResult.processing ? 'bg-warning/15' : 'bg-error/15'">
          <Icon :name="verifyResult.success ? 'lucide:circle-check' : verifyResult.processing ? 'lucide:clock' : 'lucide:circle-x'" class="h-6 w-6" :class="verifyResult.success ? 'text-success' : verifyResult.processing ? 'text-warning' : 'text-error'" />
        </div>
        <div class="flex-1">
          <p class="font-semibold" :class="verifyResult.success ? 'text-success' : verifyResult.processing ? 'text-warning' : 'text-error'">
            {{ verifyResult.success ? 'Payment Verified' : verifyResult.processing ? 'Payment Processing' : 'Payment Not Confirmed' }}
          </p>
          <p class="text-sm text-base-content/60 mt-0.5">{{ verifyResult.message }}</p>
          <div class="mt-4">
            <NuxtLink to="/supplierinvoices" class="btn btn-sm" :class="verifyResult.success ? 'btn-success' : verifyResult.processing ? 'btn-warning' : 'btn-ghost'">Back to invoices</NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <!-- Loading invoice -->
    <div v-else-if="pending" class="flex flex-col items-center gap-3 py-24">
      <span class="loading loading-spinner loading-lg text-base-content/30" />
      <p class="text-sm text-base-content/40">Loading invoice…</p>
    </div>

    <!-- Not found -->
    <template v-else-if="!invoice">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body flex flex-col items-center gap-3 py-16 text-center text-base-content/40">
          <Icon name="lucide:file-x" class="h-10 w-10" />
          <p class="font-semibold">Invoice not found</p>
          <NuxtLink to="/supplierinvoices" class="btn btn-sm btn-ghost">Back to invoices</NuxtLink>
        </div>
      </div>
    </template>

    <!-- Already settled -->
    <template v-else-if="invoice.status === 'PAID'">
      <div class="rounded-xl border border-success/40 bg-success/5 px-5 py-5 flex items-center gap-4">
        <div class="rounded-xl bg-success/15 p-3 shrink-0">
          <Icon name="lucide:circle-check" class="h-6 w-6 text-success" />
        </div>
        <div>
          <p class="font-semibold text-success">Invoice already settled</p>
          <p class="text-sm text-base-content/60 mt-0.5">Invoice <span class="font-mono">{{ invoice.invoice_number }}</span> has already been paid.</p>
        </div>
      </div>
    </template>

    <!-- Awaiting verification -->
    <template v-else-if="invoice.status === 'AWAITING'">
      <div class="rounded-xl border border-blue-300/60 bg-blue-50 px-5 py-5 flex items-center gap-4">
        <div class="rounded-xl bg-blue-100 p-3 shrink-0">
          <Icon name="lucide:hourglass" class="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p class="font-semibold text-blue-700">Payment awaiting verification</p>
          <p class="text-sm text-base-content/60 mt-0.5">A payment for invoice <span class="font-mono">{{ invoice.invoice_number }}</span> has been submitted and is being verified.</p>
        </div>
      </div>
    </template>

    <template v-else>
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold text-base-content">Settle invoice</h1>
        <p class="text-sm text-base-content/50 mt-0.5">Pay invoice <span class="font-mono font-medium text-base-content">{{ invoice.invoice_number }}</span></p>
      </div>

      <!-- Invoice summary -->
      <div class="rounded-xl border border-base-200 bg-base-100 overflow-hidden">
        <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200 bg-base-50">
          <div class="flex items-center gap-3 min-w-0">
            <div class="rounded-lg bg-primary/10 p-2 shrink-0">
              <Icon name="lucide:receipt" class="h-4 w-4 text-primary" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-base-content truncate">{{ invoice.invoice_number }}</p>
              <p class="text-xs text-base-content/50">{{ typeLabel(invoice.type) }}</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-lg font-bold text-primary">{{ currencyCode }} {{ formatNum(invoice.total) }}</p>
            <p class="text-xs text-base-content/50">Total due</p>
          </div>
        </div>
      </div>

      <!-- Payment success -->
      <div v-if="paymentSuccess" class="rounded-xl border border-success/40 bg-success/5 px-5 py-6 flex items-start gap-4">
        <div class="rounded-xl bg-success/15 p-3 shrink-0">
          <Icon name="lucide:circle-check" class="h-6 w-6 text-success" />
        </div>
        <div class="flex-1">
          <p class="font-semibold text-success">{{ paymentSuccess.title }}</p>
          <p class="text-sm text-base-content/60 mt-1">{{ paymentSuccess.message }}</p>
          <div class="mt-4 flex items-center gap-3">
            <span class="loading loading-spinner loading-xs text-base-content/40" />
            <span class="text-xs text-base-content/40">Returning to your dashboard…</span>
          </div>
        </div>
      </div>

      <!-- Payment channels -->
      <template v-else>
        <div v-if="walletLoading" class="rounded-xl border border-base-200 bg-base-100 px-5 py-4 flex items-center gap-3">
          <span class="loading loading-spinner loading-sm text-primary" />
          <div>
            <p class="text-sm font-semibold">Checking wallet balance</p>
            <p class="text-xs text-base-content/50">Confirming whether this invoice can be settled from your PRAZ CRM wallet.</p>
          </div>
        </div>

        <div v-else-if="canSettleFromWallet" class="rounded-xl border border-success/40 bg-success/5 px-5 py-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <div class="rounded-xl bg-success/15 p-3 shrink-0">
                <Icon name="lucide:wallet-cards" class="h-6 w-6 text-success" />
              </div>
              <div>
                <p class="font-semibold text-success">Wallet funds available</p>
                <p class="mt-1 text-sm text-base-content/60">
                  Your {{ walletType }} wallet has
                  <strong>{{ currencyCode }} {{ formatNum(walletBalance) }}</strong>,
                  enough to settle this invoice.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-success gap-2 shrink-0"
              :disabled="submitting"
              @click="settleFromWallet"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              <Icon v-else name="lucide:wallet-cards" class="h-4 w-4" />
              Settle Invoice
            </button>
          </div>
        </div>

        <template v-if="!walletLoading && !canSettleFromWallet">
          <ApplicationStepPayment :application="paymentApplication" @payment="onPaymentUpdate" />

          <div class="flex items-center justify-between gap-4">
            <NuxtLink to="/supplierinvoices" class="btn btn-ghost btn-sm">Cancel</NuxtLink>
            <button
              class="btn btn-primary gap-2"
              :disabled="!paymentData || submitting"
              @click="handlePayment"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              <template v-else>
                <Icon name="lucide:send" class="h-4 w-4" />
                Submit Payment
              </template>
            </button>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Settle Invoice' })

const route = useRoute()
const toast = useToast()
const { listInvoices } = useSupplierLedger()
const { initiateOnline, verifyPaynow, payRtgs, payZipit, payWallet } = usePayment()
const { getInvoiceWalletBalance } = useWallet()
const { confirmPaymentReturn } = useCrmPaymentReturn()

const invoice = ref(null)
const pending = ref(true)
const paymentData = ref(null)
const submitting = ref(false)
const paymentSuccess = ref(null)
const verifying = ref(false)
const verifyResult = ref(null)
const wallet = ref(null)
const walletLoading = ref(false)
const walletError = ref(null)

const isBond = computed(() => invoice.value?.bid_security_type === 'BID_BOND')
const walletBalance = computed(() => {
  const parsed = Number(String(wallet.value?.balance ?? '0').replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : 0
})
const walletType = computed(() =>
  wallet.value?.type
  ?? invoice.value?.inventoryitem?.bankaccounttype?.name
  ?? 'applicable',
)
const canSettleFromWallet = computed(() => {
  const amountDue = Number(invoice.value?.total ?? 0)
  return !walletLoading.value
    && !walletError.value
    && amountDue > 0
    && walletBalance.value >= amountDue
})

onMounted(async () => {
  const paymentReference = route.query.payment_reference
  if (typeof paymentReference === 'string' && paymentReference) {
    verifying.value = true
    await loadInvoice({ silent: true })
    const inv = invoice.value
    const status = inv
      ? await confirmPaymentReturn(inv.id, paymentReference)
      : null
    const succeeded = status?.status === 'PAID'
    verifyResult.value = {
      success: succeeded,
      processing: status?.status === 'PROCESSING',
      message: succeeded
        ? 'Payment confirmed successfully.'
        : (status?.status === 'PROCESSING'
            ? 'Your payment succeeded and PRAZ CRM is still receipting the invoice. Please refresh shortly.'
            : 'Payment could not be confirmed.'),
    }
    if (succeeded) {
      toast.success({ title: 'Payment confirmed', message: 'Payment confirmed successfully.', position: 'topRight', layout: 2 })
      await navigateTo('/dashboard', { replace: true })
      return
    }
    verifying.value = false
    return
  }

  // Returning from Paynow: verify the online payment (updates the online-payment
  // table + reconciles), exactly as supplier-registration invoices do.
  const transactionid = route.query.transactionid
  if (typeof transactionid === 'string' && transactionid) {
    verifying.value = true
    await loadInvoice({ silent: true })
    const inv = invoice.value
    if (inv) {
      const bankAccount = inv.inventoryitem?.bankaccounttype?.bankaccounts?.[0] ?? null
      const res = await verifyPaynow({
        transactionid,
        currency_id: inv.currency_id,
        amount: inv.total,
        bankaccounttype_id: inv.inventoryitem?.bankaccounttype?.id ?? null,
        bankaccount_id: bankAccount?.id ?? null,
      })
      const succeeded = res?.status === true
      verifyResult.value = {
        success: succeeded,
        message: res?.message ?? (succeeded ? 'Payment confirmed successfully.' : 'Payment could not be confirmed.'),
      }
      if (succeeded) {
        toast.success({ title: 'Payment confirmed', message: verifyResult.value.message, position: 'topRight', layout: 2 })
        await navigateTo('/dashboard', { replace: true })
        return
      }
    } else {
      verifyResult.value = { success: false, message: 'Invoice could not be loaded for verification.' }
    }
    verifying.value = false
    return
  }

  await loadInvoice()
  await loadWalletBalance()
})

async function loadInvoice({ silent = false } = {}) {
  if (!silent) pending.value = true
  const { ok, data } = await listInvoices()
  if (!silent) pending.value = false
  if (!ok) {
    if (!silent) showError('Could not load the invoice.')
    return
  }
  invoice.value = (data?.data ?? []).find(i => i.uuid === route.params.uuid) ?? null
}

async function loadWalletBalance() {
  const inv = invoice.value

  wallet.value = null
  walletError.value = null

  if (!inv || inv.status !== 'PENDING') return

  walletLoading.value = true
  try {
    const result = await getInvoiceWalletBalance(inv.id)
    if (result && result.balance !== undefined && result.balance !== null) {
      wallet.value = result
    } else {
      walletError.value = 'Wallet balance is unavailable.'
    }
  } catch {
    walletError.value = 'Wallet balance is unavailable.'
  } finally {
    walletLoading.value = false
  }
}

const currencyCode = computed(() => invoice.value?.currency?.code ?? '—')

const paymentApplication = computed(() => ({
  invoice: invoice.value,
  currency: invoice.value?.currency ?? null,
}))

function onPaymentUpdate(p) {
  paymentData.value = p
}

async function showSuccessThenReturn(title, message) {
  paymentSuccess.value = { title, message }
  toast.success({ title, message, position: 'topRight', layout: 2 })
  await navigateTo('/dashboard')
}

function showError(message) {
  toast.error({
    title: 'Payment unsuccessful',
    message,
    position: 'topRight',
    layout: 2,
  })
}

async function settleFromWallet() {
  const invoiceId = invoice.value?.id
  if (!invoiceId || !canSettleFromWallet.value || submitting.value) return

  submitting.value = true
  try {
    const res = await payWallet(invoiceId)
    if (res?.status) {
      await showSuccessThenReturn('Payment successful', 'Your invoice has been settled from your wallet.')
    } else {
      showError(res?.message ?? 'Wallet payment failed. Please try again.')
      await loadWalletBalance()
    }
  } finally {
    submitting.value = false
  }
}

async function handlePayment() {
  const p = paymentData.value
  const invoiceId = invoice.value?.id
  if (!p || !invoiceId) return

  submitting.value = true
  try {
    let res

    if (p.channel === 'wallet') {
      res = await payWallet(invoiceId)
      if (res?.status) {
        await showSuccessThenReturn('Payment successful', 'Your invoice has been settled from your wallet.')
      } else {
        showError(res?.message ?? 'Wallet payment failed. Please try again.')
      }
      return
    }

    if (p.channel === 'online') {
      if (isBond.value) {
        showError('The bid bond must be paid by bank transfer, not online.')
        return
      }

      const returnUrl = `${window.location.origin}/invoice/settle/${route.params.uuid}`

      res = await initiateOnline(invoiceId, p.method, returnUrl)

      if (res?.status && res?.data?.settled) {
        await showSuccessThenReturn(
          'Invoice already settled',
          res?.message ?? 'PRAZ CRM confirmed the payment and eGP has been updated.',
        )
      } else if (res?.status && res?.data?.redirect_url) {
        navigateTo(res.data.redirect_url, { external: true })
      } else {
        if ((res?.message ?? '').toLowerCase().includes('sufficient balance in wallet')) {
          await loadWalletBalance()
          showError('Your wallet has enough funds for this invoice. Use the Settle Invoice option above.')
          return
        }
        showError(res?.message ?? 'Failed to start the online payment.')
      }
      return
    }

    if (p.transferType === 'rtgs') {
      res = await payRtgs(invoiceId, {
        source_bank: p.sourceBank,
        account_name: p.accountName,
        account_number: p.accountNumber,
        payment_date: p.paymentDate,
        source_reference: p.sourceReference,
        proof_key: p.proofKey,
      })
    } else if (p.transferType === 'zipit') {
      res = await payZipit(invoiceId, {
        source_bank: p.sourceBank,
        account_name: p.accountName,
        account_number: p.accountNumber,
        payment_date: p.paymentDate,
        stan_code: p.stanCode,
      })
    }

    if (res?.status) {
      await showSuccessThenReturn(
        'Payment submitted',
        'Your payment details have been received and are awaiting verification. You will be notified once confirmed.',
      )
    } else if (res && !res.status) {
      showError(res.message ?? 'Payment submission failed. Please try again.')
    }
  } finally {
    submitting.value = false
  }
}

function typeLabel(type) {
  return ({
    REGISTRATION: 'Supplier registration',
    UPGRADE: 'Supplier group upgrade',
    BID_SUBMISSION_KEY: 'Bid submission key',
    BID_SECURITY: 'Bid security',
    TENDER_ADMIN_FEE: 'Tender administration fee',
    PLAN_AUTHORIZATION: 'Plan authorization',
  })[type] ?? (type ?? 'Invoice')
}

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0)
}
</script>
