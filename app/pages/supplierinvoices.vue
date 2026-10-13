<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:receipt" class="h-6 w-6" />
            Registration Invoices
          </h1>
          <p class="mt-1 text-green-100 text-sm">All invoices issued for your supplier registrations and upgrades.</p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <LedgerCounter label="Total" :value="invoices.length" tone="base" />
      <LedgerCounter label="Pending" :value="countByStatus('PENDING')" tone="yellow" />
      <LedgerCounter label="Awaiting" :value="countByStatus('AWAITING')" tone="blue" />
      <LedgerCounter label="Paid" :value="countByStatus('PAID')" tone="green" />
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
            <input v-model="search" type="text" placeholder="Search invoice number" class="input input-sm input-bordered pl-9 w-full sm:w-56" />
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
                <th>Invoice</th>
                <th class="hidden md:table-cell">Date</th>
                <th class="hidden md:table-cell">Type</th>
                <th class="text-right">Total</th>
                <th class="text-right hidden lg:table-cell">Receipted</th>
                <th class="text-right hidden lg:table-cell">Outstanding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in filtered" :key="inv.id" class="hover">
                <td>
                  <p class="font-medium font-mono text-sm">{{ inv.invoice_number }}</p>
                  <p class="text-xs text-base-content/50">Ref: <span class="font-mono">{{ inv.paymentreference }}</span></p>
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">{{ formatDate(inv.invoice_date) }}</td>
                <td class="hidden md:table-cell">
                  <span class="badge badge-xs bg-base-200 border-base-300">{{ inv.type ?? 'REGISTRATION' }}</span>
                </td>
                <td class="text-right text-sm font-medium">{{ inv.currency?.code }} {{ formatAmount(inv.total) }}</td>
                <td class="text-right text-sm hidden lg:table-cell">{{ formatAmount(receiptedTotal(inv)) }}</td>
                <td class="text-right text-sm font-medium hidden lg:table-cell" :class="outstanding(inv) > 0 ? 'text-error' : 'text-base-content/50'">
                  {{ formatAmount(outstanding(inv)) }}
                </td>
                <td><span class="badge badge-sm" :class="statusBadge(inv.status)">{{ statusLabel(inv.status) }}</span></td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <NuxtLink
                      v-if="inv.type === 'UPGRADE' && inv.uuid"
                      :to="`/invoice/upgrade/${inv.uuid}`"
                      class="btn btn-xs btn-ghost gap-1"
                    >
                      <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">View</span>
                    </NuxtLink>
                    <NuxtLink
                      v-if="inv.status === 'PENDING' && inv.uuid"
                      :to="`/invoice/settle/${inv.uuid}`"
                      class="btn btn-xs btn-primary gap-1"
                    >
                      <Icon name="lucide:credit-card" class="h-3.5 w-3.5" />
                      <span>Settle</span>
                    </NuxtLink>
                    <button
                      v-if="inv.status === 'PENDING' && isFeeInvoice(inv)"
                      class="btn btn-xs btn-ghost text-error gap-1"
                      :disabled="deletingId === inv.id"
                      @click="removeInvoice(inv)"
                    >
                      <Icon v-if="deletingId === inv.id" name="lucide:loader-2" class="h-3.5 w-3.5 animate-spin" />
                      <Icon v-else name="lucide:trash-2" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
          <div class="rounded-full bg-base-200 p-3"><Icon name="lucide:receipt" class="h-6 w-6 text-base-content/30" /></div>
          <p class="text-sm text-base-content/50">{{ search ? 'No invoices match your search.' : 'No invoices yet.' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Invoices' })

const { listInvoices, deleteFeeInvoice } = useSupplierLedger()
const toast = useToast()

const invoices = ref([])
const loading = ref(false)
const deletingId = ref(null)
const route = useRoute()
const search = ref(typeof route.query?.q === 'string' ? route.query.q : '')
const filter = ref('all')

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'AWAITING', label: 'Awaiting' },
  { key: 'PAID', label: 'Paid' },
]

onMounted(reload)

async function reload() {
  loading.value = true
  const { ok, data, error } = await listInvoices()
  loading.value = false
  if (ok) invoices.value = data?.data ?? []
  else toast.error({ title: 'Could not load invoices', message: error, position: 'topRight', layout: 2 })
}

const filtered = computed(() => {
  let list = invoices.value
  if (filter.value !== 'all') list = list.filter(i => i.status === filter.value)
  const term = search.value.trim().toLowerCase()
  if (term) list = list.filter(i =>
    (i.invoice_number ?? '').toLowerCase().includes(term) ||
    (i.paymentreference ?? '').toLowerCase().includes(term)
  )
  return list
})

function countByStatus(status) {
  return invoices.value.filter(i => i.status === status).length
}

// Only pending tender-fee invoices (bid security / administration fee) can be deleted.
function isFeeInvoice(inv) {
  return ['BID_SECURITY', 'TENDER_ADMIN_FEE'].includes(inv.type)
}

async function removeInvoice(inv) {
  if (!confirm(`Delete pending invoice ${inv.invoice_number}? You can generate it again from the desktop app.`)) return
  deletingId.value = inv.id
  const { ok, error } = await deleteFeeInvoice(inv.id)
  deletingId.value = null
  if (ok) {
    invoices.value = invoices.value.filter(i => i.id !== inv.id)
    toast.success({
      title: 'Invoice deleted',
      message: 'The pending invoice has been removed.',
      position: 'topRight',
      layout: 2,
    })
  } else {
    toast.error({ title: 'Could not delete invoice', message: error, position: 'topRight', layout: 2 })
  }
}

function receiptedTotal(inv) {
  return (inv.receipts ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0)
}

function outstanding(inv) {
  return Math.max(0, Number(inv.total ?? 0) - receiptedTotal(inv))
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0)
}

function statusLabel(s) {
  return ({ PENDING: 'Pending', AWAITING: 'Awaiting', PAID: 'Paid', VOID: 'Void' })[s] ?? s ?? '—'
}

function statusBadge(s) {
  return ({
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    AWAITING: 'bg-blue-100 text-blue-700 border-blue-300',
    PAID:     'bg-green-100 text-green-700 border-green-300',
    VOID:     'bg-base-200 text-base-content/60 border-base-300',
  })[s] ?? 'bg-base-200 text-base-content/50'
}
</script>
