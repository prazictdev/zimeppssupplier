<template>
  <div class="space-y-5">
    <header class="rounded-box bg-success p-5 text-success-content shadow-sm sm:p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-2xl font-bold">
            <Icon name="lucide:wallet-cards" class="h-6 w-6" />
            Cancelled tender funds
          </h1>
          <p class="mt-1 max-w-2xl text-sm opacity-85">Choose how eligible paid regulatory fees should be handled. Bid-security refunds are released automatically.</p>
        </div>
        <button type="button" class="btn btn-sm border-0 bg-white/15 text-current hover:bg-white/25" :disabled="loading" @click="load">
          <Icon name="lucide:refresh-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </button>
      </div>
    </header>

    <div v-if="message" class="alert" :class="messageOk ? 'alert-success' : 'alert-error'">
      <Icon :name="messageOk ? 'lucide:check-circle-2' : 'lucide:circle-alert'" class="h-5 w-5" />
      <span>{{ message }}</span>
    </div>

    <div v-if="loading" class="grid gap-3">
      <div v-for="index in 3" :key="index" class="h-40 animate-pulse rounded-box bg-base-200" />
    </div>

    <div v-else-if="!settlements.length" class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="card-body items-center py-12 text-center">
        <Icon name="lucide:circle-check-big" class="h-10 w-10 text-success" />
        <h2 class="card-title text-lg">No fund elections outstanding</h2>
        <p class="text-sm text-base-content/60">Any cancellation-related payments will appear here.</p>
      </div>
    </div>

    <div v-else class="grid gap-4">
      <article v-for="settlement in settlements" :key="settlement.uuid" class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body gap-4 p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="font-mono text-xs text-base-content/55">{{ settlement.cancellation?.tender?.tendernumber || 'Tender' }}</p>
              <h2 class="truncate text-lg font-semibold">{{ settlement.cancellation?.tender?.title }}</h2>
              <p class="text-sm text-base-content/60">{{ settlement.cancellation?.tender?.company?.name }}</p>
            </div>
            <span class="badge" :class="statusClass(settlement.status)">{{ label(settlement.status) }}</span>
          </div>

          <div class="grid gap-3 rounded-box bg-base-200/60 p-3 text-sm sm:grid-cols-3">
            <div><p class="text-xs text-base-content/55">Fund type</p><p class="font-medium">{{ label(settlement.fund_type) }}</p></div>
            <div><p class="text-xs text-base-content/55">Amount</p><p class="font-semibold">{{ settlement.currency?.code }} {{ money(settlement.amount) }}</p></div>
            <div><p class="text-xs text-base-content/55">Invoice</p><p class="font-mono">{{ settlement.invoice?.invoice_number || '—' }}</p></div>
          </div>

          <form v-if="settlement.status === 'AWAITING_SELECTION'" class="space-y-3" @submit.prevent="submit(settlement)">
            <fieldset class="space-y-2">
              <legend class="text-sm font-semibold">What would you like us to do with these funds?</legend>
              <label v-for="option in settlement.available_options" :key="option" class="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 p-3 hover:bg-base-200/50">
                <input v-model="forms[settlement.uuid].election" type="radio" class="radio radio-success radio-sm mt-0.5" :value="option" />
                <span><span class="block font-medium">{{ optionLabel(option) }}</span><span class="block text-xs text-base-content/60">{{ optionHelp(option) }}</span></span>
              </label>
            </fieldset>
            <label class="form-control">
              <span class="label-text text-xs">Notes (optional)</span>
              <textarea v-model.trim="forms[settlement.uuid].notes" class="textarea textarea-bordered" rows="2" placeholder="Add payment or banking information for the processing team…" />
            </label>
            <button type="submit" class="btn btn-success btn-sm" :disabled="saving === settlement.uuid || !forms[settlement.uuid].election">
              <span v-if="saving === settlement.uuid" class="loading loading-spinner loading-xs" />
              Submit instruction
            </button>
          </form>

          <div v-else-if="settlement.status === 'REFUND_PENDING'" class="alert alert-info py-3 text-sm">
            <Icon name="lucide:landmark" class="h-4 w-4" />
            <span>Your bid-security release has been initiated automatically. No election is required.</span>
          </div>
          <div v-else-if="settlement.election" class="text-sm">
            <span class="text-base-content/60">Your instruction:</span>
            <span class="ml-1 font-semibold">{{ optionLabel(settlement.election) }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } })
useHead({ title: 'Cancelled tender funds' })

const { list, elect } = useTenderCancellationFunds()
const loading = ref(true)
const saving = ref('')
const settlements = ref([])
const forms = reactive({})
const message = ref('')
const messageOk = ref(true)

function hydrateForms() {
  for (const settlement of settlements.value) {
    forms[settlement.uuid] ??= { election: settlement.election || '', notes: settlement.bidder_notes || '' }
  }
}

async function load() {
  loading.value = true
  message.value = ''
  const result = await list()
  if (result.ok) {
    settlements.value = result.data?.data?.data ?? []
    hydrateForms()
  } else {
    messageOk.value = false
    message.value = result.error
  }
  loading.value = false
}

async function submit(settlement) {
  saving.value = settlement.uuid
  message.value = ''
  const form = forms[settlement.uuid]
  const result = await elect(settlement.uuid, form.election, form.notes || null)
  messageOk.value = result.ok
  message.value = result.ok ? 'Your instruction was submitted for PRAZ processing.' : result.error
  if (result.ok) await load()
  saving.value = ''
}

const label = value => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/^\w/, character => character.toUpperCase())
const money = value => Number(value || 0).toLocaleString('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const optionLabel = option => ({ REFUND: 'Request a refund', WALLET: 'Credit my PRAZ wallet', REPLACEMENT_TENDER: 'Transfer to the replacement tender' }[option] || label(option))
const optionHelp = option => ({
  REFUND: 'Submit the amount for refund review; applicable processing rules may apply.',
  WALLET: 'Keep the amount in your PRAZ account for eligible future regulatory charges.',
  REPLACEMENT_TENDER: 'Carry the payment forward to the re-advertised procurement after approval.',
}[option] || '')
const statusClass = status => ({ AWAITING_SELECTION: 'badge-warning', APPROVAL_PENDING: 'badge-info', REFUND_PENDING: 'badge-info', VOIDED: 'badge-neutral', NON_REFUNDABLE: 'badge-error' }[status] || 'badge-ghost')

onMounted(load)
</script>
