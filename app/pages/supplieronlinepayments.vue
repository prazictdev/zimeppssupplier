<template>
  <div class="space-y-4">

    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:credit-card" class="h-6 w-6" />
            Online Payments
          </h1>
          <p class="mt-1 text-green-100 text-sm">All Paynow online payment transactions for your organisation.</p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <LedgerCounter label="Total" :value="transactions.length" tone="base" />
      <LedgerCounter label="Pending" :value="countByStatus('PENDING')" tone="yellow" />
      <LedgerCounter label="Successful" :value="countByStatus('PAID')" tone="green" />
      <LedgerCounter label="Failed" :value="countByStatus('CANCELLED') + countByStatus('FAILED')" tone="red" />
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
            <input v-model="search" type="text" placeholder="Search invoice or transaction id" class="input input-sm input-bordered pl-9 w-full sm:w-64" />
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
                <th class="hidden md:table-cell">Transaction ID</th>
                <th class="text-right">Amount</th>
                <th class="hidden md:table-cell">Currency</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filtered" :key="t.id" class="hover">
                <td class="text-sm text-base-content/70">{{ formatDateTime(t.created_at) }}</td>
                <td class="font-mono text-sm">{{ t.invoicenumber ?? '—' }}</td>
                <td class="hidden md:table-cell font-mono text-xs text-base-content/60 max-w-xs truncate" :title="t.transactionid">{{ t.transactionid ?? '—' }}</td>
                <td class="text-right text-sm font-medium">{{ formatAmount(t.amount) }}</td>
                <td class="hidden md:table-cell">
                  <span class="badge badge-xs bg-base-200 border-base-300">{{ t.currency ?? '—' }}</span>
                </td>
                <td><span class="badge badge-sm" :class="statusBadge(t.status)">{{ statusLabel(t.status) }}</span></td>
                <td class="text-right">
                  <a v-if="t.pollurl" :href="t.pollurl" target="_blank" rel="noopener" class="btn btn-xs btn-ghost gap-1" title="Open poll URL">
                    <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
          <div class="rounded-full bg-base-200 p-3"><Icon name="lucide:credit-card" class="h-6 w-6 text-base-content/30" /></div>
          <p class="text-sm text-base-content/50">{{ search ? 'No transactions match your search.' : 'No online payments yet.' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Online Payments' })

const { listOnlineTransactions } = useSupplierLedger()
const toast = useToast()

const transactions = ref([])
const loading = ref(false)
const search = ref('')
const filter = ref('all')

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'PAID', label: 'Paid' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'FAILED', label: 'Failed' },
]

onMounted(reload)

async function reload() {
  loading.value = true
  const { ok, data, error } = await listOnlineTransactions()
  loading.value = false
  if (ok) transactions.value = data?.data ?? []
  else toast.error({ title: 'Could not load transactions', message: error, position: 'topRight', layout: 2 })
}

const filtered = computed(() => {
  let list = transactions.value
  if (filter.value !== 'all') list = list.filter(t => t.status === filter.value)
  const term = search.value.trim().toLowerCase()
  if (term) list = list.filter(t =>
    (t.invoicenumber ?? '').toLowerCase().includes(term) ||
    (t.transactionid ?? '').toLowerCase().includes(term)
  )
  return list
})

function countByStatus(s) { return transactions.value.filter(t => t.status === s).length }

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatAmount(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0)
}

function statusLabel(s) {
  return ({ PENDING: 'Pending', PAID: 'Paid', CANCELLED: 'Cancelled', FAILED: 'Failed', SENT: 'Sent' })[s] ?? s ?? '—'
}

function statusBadge(s) {
  return ({
    PENDING:   'bg-yellow-100 text-yellow-700 border-yellow-300',
    PAID:      'bg-green-100 text-green-700 border-green-300',
    CANCELLED: 'bg-base-200 text-base-content/60 border-base-300',
    FAILED:    'bg-red-100 text-red-700 border-red-300',
    SENT:      'bg-blue-100 text-blue-700 border-blue-300',
  })[s] ?? 'bg-base-200 text-base-content/50'
}
</script>
