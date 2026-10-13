<template>
  <div class="space-y-4">

    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:book-open" class="h-6 w-6" />
            Account Statement
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            Source funds, applied receipts, and remaining balance per suspense entry.
          </p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Currency totals -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div v-for="n in 3" :key="n" class="rounded-lg p-5 border border-base-200 bg-base-200 animate-pulse h-28" />
    </div>

    <div v-else-if="currencies.length" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div v-for="c in currencies" :key="c.currency_id ?? 'na'" class="card border border-base-200 bg-base-100 shadow-sm p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs uppercase text-base-content/50">{{ c.currency_code ?? 'N/A' }}</p>
          <span class="badge badge-xs bg-base-200 border-base-300">Total</span>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-2 text-sm">
          <div>
            <p class="text-xs text-base-content/50">Source</p>
            <p class="font-bold text-base-content">{{ formatAmount(c.total_source) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/50">Receipts</p>
            <p class="font-bold text-blue-600">{{ formatAmount(c.total_receipts) }}</p>
          </div>
          <div>
            <p class="text-xs text-base-content/50">Remaining</p>
            <p class="font-bold" :class="c.remaining > 0 ? 'text-green-600' : 'text-base-content/50'">
              {{ formatAmount(c.remaining) }}
            </p>
          </div>
        </div>
      </div>
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
        <button class="btn btn-sm btn-ghost gap-1.5" :disabled="loading" @click="reload">
          <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div class="card-body p-4">
        <div v-if="loading" class="space-y-2">
          <div v-for="n in 5" :key="n" class="h-14 rounded bg-base-200 animate-pulse" />
        </div>

        <div v-else-if="filtered.length" class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase">
                <th>Date</th>
                <th>Source</th>
                <th class="hidden md:table-cell">Account Type</th>
                <th class="text-right">Source Amount</th>
                <th class="text-right">Receipts</th>
                <th class="text-right">Remaining</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="entry in filtered" :key="entry.id">
                <tr class="hover">
                  <td class="text-sm text-base-content/70">{{ formatDateTime(entry.created_at) }}</td>
                  <td>
                    <span class="badge badge-xs" :class="sourceBadge(entry.sourcetype)">{{ sourceLabel(entry.sourcetype) }}</span>
                    <p class="text-xs text-base-content/50 mt-0.5 font-mono">#{{ entry.source_id }}</p>
                  </td>
                  <td class="hidden md:table-cell text-sm text-base-content/70">{{ entry.bankaccounttype?.name ?? '—' }}</td>
                  <td class="text-right text-sm font-medium">{{ entry.currency?.code }} {{ formatAmount(entry.source_amount) }}</td>
                  <td class="text-right text-sm text-blue-600">{{ formatAmount(entry.total_receipts) }}</td>
                  <td class="text-right text-sm font-bold" :class="entry.remaining > 0 ? 'text-green-600' : 'text-base-content/50'">
                    {{ formatAmount(entry.remaining) }}
                  </td>
                  <td><span class="badge badge-sm" :class="statusBadge(entry.status)">{{ statusLabel(entry.status) }}</span></td>
                  <td class="text-right">
                    <button
                      v-if="entry.receipts?.length"
                      class="btn btn-xs btn-ghost gap-1"
                      @click="toggle(entry.id)"
                    >
                      <Icon :name="expanded.has(entry.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">{{ entry.receipts.length }} receipt{{ entry.receipts.length === 1 ? '' : 's' }}</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="expanded.has(entry.id) && entry.receipts?.length" class="bg-base-50">
                  <td colspan="8" class="p-0">
                    <div class="px-6 py-3">
                      <p class="text-xs uppercase text-base-content/50 mb-2">Receipts applied</p>
                      <table class="table table-xs w-full">
                        <thead>
                          <tr class="text-xs text-base-content/50">
                            <th>Date</th>
                            <th>Receipt</th>
                            <th>Invoice</th>
                            <th class="text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="r in entry.receipts" :key="r.id">
                            <td class="text-sm">{{ formatDate(r.receipt_date) }}</td>
                            <td class="text-sm font-mono">{{ r.receipt_number ?? '—' }}</td>
                            <td class="text-sm font-mono">{{ r.invoice_number ?? '—' }}</td>
                            <td class="text-right text-sm font-medium">{{ formatAmount(r.amount) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
          <div class="rounded-full bg-base-200 p-3"><Icon name="lucide:book-open" class="h-6 w-6 text-base-content/30" /></div>
          <p class="text-sm text-base-content/50">No statement entries yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Statement' })

const { getStatement } = useSupplierLedger()
const toast = useToast()

const entries = ref([])
const currencies = ref([])
const loading = ref(false)
const filter = ref('all')
const expanded = ref(new Set())

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'UTILIZED', label: 'Utilized' },
]

onMounted(reload)

async function reload() {
  loading.value = true
  expanded.value = new Set()
  const { ok, data, error } = await getStatement()
  loading.value = false
  if (ok) {
    const payload = data?.data ?? {}
    entries.value = payload.entries ?? []
    currencies.value = payload.currencies ?? []
  } else {
    toast.error({ title: 'Could not load statement', message: error, position: 'topRight', layout: 2 })
  }
}

const filtered = computed(() => {
  if (filter.value === 'all') return entries.value
  return entries.value.filter(e => e.status === filter.value)
})

function toggle(id) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  expanded.value = next
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatAmount(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0)
}

function sourceLabel(s) {
  return ({
    BANKTRANSACTION: 'Bank',
    PAYNOW: 'Online',
    WALLETTOPUP: 'Wallet top-up',
    RTGS: 'RTGS',
    ZIPIT: 'ZipIt',
  })[s] ?? s ?? '—'
}

function sourceBadge(s) {
  return ({
    BANKTRANSACTION: 'bg-blue-100 text-blue-700 border-blue-300',
    PAYNOW:          'bg-purple-100 text-purple-700 border-purple-300',
    WALLETTOPUP:     'bg-emerald-100 text-emerald-700 border-emerald-300',
    RTGS:            'bg-cyan-100 text-cyan-700 border-cyan-300',
    ZIPIT:           'bg-pink-100 text-pink-700 border-pink-300',
  })[s] ?? 'bg-base-200 text-base-content/50'
}

function statusLabel(s) {
  return ({ PENDING: 'Pending', UTILIZED: 'Utilized' })[s] ?? s ?? '—'
}

function statusBadge(s) {
  return ({
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    UTILIZED: 'bg-green-100 text-green-700 border-green-300',
  })[s] ?? 'bg-base-200 text-base-content/50'
}
</script>
