<template>
  <div class="space-y-4">

    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:coins" class="h-6 w-6" />
            Payments
          </h1>
          <p class="mt-1 text-green-100 text-sm">Every payment you submitted, and how its verification is going.</p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Needs your attention -->
    <div v-if="needsAttention.length" class="rounded-xl border border-error/40 bg-error/5 px-5 py-4">
      <div class="flex items-start gap-3">
        <Icon name="lucide:circle-alert" class="h-5 w-5 text-error shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-error">
            {{ needsAttention.length }}
            {{ needsAttention.length === 1 ? 'payment could not be verified' : 'payments could not be verified' }}
          </p>
          <p class="text-sm text-base-content/60 mt-0.5">
            Open the verification report to see exactly why, and correct the details if the problem is on your side.
          </p>
        </div>
      </div>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <LedgerCounter label="Total" :value="payments.length" tone="base" />
      <LedgerCounter label="Awaiting" :value="countByStatus('PENDING')" tone="yellow" />
      <LedgerCounter label="Verified" :value="countByStatus('VERIFIED')" tone="green" />
      <LedgerCounter label="Not verified" :value="countByStatus('MATCH_FAILED')" tone="red" />
    </div>

    <!-- Filters & table -->
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 border-b border-base-200">
        <div class="flex flex-wrap gap-1.5 flex-1">
          <button
            v-for="tab in tabs" :key="tab.key"
            class="btn btn-xs"
            :class="filter === tab.key ? 'btn-primary' : 'btn-ghost'"
            @click="filter = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40" />
            <input v-model="search" type="text" placeholder="Search reference / invoice" class="input input-sm input-bordered pl-9 w-full sm:w-64">
          </div>
          <button class="btn btn-sm btn-ghost gap-1.5" :disabled="loading" @click="reload">
            <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div class="card-body p-4">
        <div v-if="loading" class="space-y-2">
          <div v-for="n in 5" :key="n" class="h-12 rounded bg-base-200 animate-pulse" />
        </div>

        <div v-else-if="filtered.length" class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase">
                <th>Date</th>
                <th>Invoice</th>
                <th>Reference</th>
                <th class="hidden lg:table-cell">Method</th>
                <th class="text-right">Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in filtered" :key="payment.uuid" class="hover">
                <td class="text-sm text-base-content/70 whitespace-nowrap">{{ formatDate(payment.payment_date ?? payment.created_at) }}</td>
                <td class="font-mono text-xs">{{ payment.invoice_number ?? '—' }}</td>
                <td>
                  <p class="font-mono text-sm">{{ payment.source_reference ?? '—' }}</p>
                  <p v-if="payment.stan_code" class="text-xs text-base-content/50 font-mono">STAN {{ payment.stan_code }}</p>
                </td>
                <td class="hidden lg:table-cell text-sm text-base-content/70">{{ methodLabel(payment) }}</td>
                <td class="text-right text-sm font-medium whitespace-nowrap">{{ payment.currency_code }} {{ formatAmount(payment.amount) }}</td>
                <td>
                  <span class="badge badge-sm" :class="statusBadge(payment.status)">{{ statusLabel(payment.status) }}</span>
                </td>
                <td class="text-right">
                  <NuxtLink
                    v-if="isBankTransfer(payment)"
                    :to="`/payments/verification/${payment.uuid}`"
                    class="btn btn-xs gap-1"
                    :class="linkTone(payment)"
                  >
                    <Icon :name="linkIcon(payment)" class="h-3.5 w-3.5" />
                    <span class="hidden sm:inline">{{ linkLabel(payment) }}</span>
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
          <div class="rounded-full bg-base-200 p-3"><Icon name="lucide:coins" class="h-6 w-6 text-base-content/30" /></div>
          <p class="text-sm text-base-content/50">{{ search ? 'No payments match your search.' : 'You have not submitted any payments yet.' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Payments' })

const { listTransactions } = usePayment()
const toast = useToast()

const payments = ref([])
const loading = ref(false)
const search = ref('')
const filter = ref('all')

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Awaiting' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'MATCH_FAILED', label: 'Not verified' },
  { key: 'REJECTED', label: 'Rejected' },
]

const needsAttention = computed(() => payments.value.filter((p) => p.status === 'MATCH_FAILED'))

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return payments.value.filter((payment) => {
    if (filter.value !== 'all' && payment.status !== filter.value) return false
    if (!term) return true
    return [payment.source_reference, payment.stan_code, payment.invoice_number]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  })
})

function countByStatus(status) {
  return payments.value.filter((payment) => payment.status === status).length
}

function isBankTransfer(payment) {
  return payment.channel === 'bank_transfer'
}

// A payment can be edited while it is still being matched, so PENDING rows get
// an Edit action rather than a read-only report link.
function linkLabel(payment) {
  return { MATCH_FAILED: 'Fix', PENDING: 'Edit' }[payment.status] ?? 'Report'
}

function linkTone(payment) {
  return { MATCH_FAILED: 'btn-error', PENDING: 'btn-outline' }[payment.status] ?? 'btn-ghost'
}

function linkIcon(payment) {
  return payment.status === 'PENDING' ? 'lucide:pencil-line' : 'lucide:search-check'
}

function methodLabel(payment) {
  return (payment.method ?? payment.channel ?? '—').toString().toUpperCase()
}

function statusLabel(status) {
  return {
    PENDING: 'Awaiting verification',
    VERIFIED: 'Verified',
    MATCH_FAILED: 'Not verified',
    REJECTED: 'Rejected',
  }[status] ?? status
}

function statusBadge(status) {
  return {
    PENDING: 'badge-warning',
    VERIFIED: 'badge-success',
    MATCH_FAILED: 'badge-error',
    REJECTED: 'badge-error',
  }[status] ?? 'badge-ghost'
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatAmount(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed.toLocaleString(undefined, { minimumFractionDigits: 2 }) : value
}

async function reload() {
  loading.value = true
  const { ok, data, error } = await listTransactions()
  loading.value = false

  if (ok) {
    payments.value = data ?? []
    return
  }

  toast.error({ title: 'Could not load payments', message: error, position: 'topRight', layout: 2 })
}

onMounted(reload)
</script>
