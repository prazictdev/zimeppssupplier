<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:clipboard-list" class="h-6 w-6" />
            Supplier Registrations
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            All your supplier category registrations for {{ currentYear }}.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 shrink-0">
          <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">Dashboard</span>
            <span class="sm:hidden">Back</span>
          </NuxtLink>
          <button
            v-if="!pendingUpgrade"
            class="btn btn-sm bg-white text-green-700 hover:bg-green-50 border-0 font-semibold gap-1.5"
            @click="navigateTo('/suppliernewapplication')"
          >
            <Icon name="lucide:plus" class="h-4 w-4" />
            New Registration
          </button>
        </div>
      </div>
    </div>

    <!-- Pending upgrade warning -->
    <div v-if="pendingUpgrade" class="rounded-xl border border-error/50 bg-error/8 px-5 py-4">
      <div class="flex items-start gap-3">
        <div class="rounded-lg bg-error/15 p-2 shrink-0">
          <Icon name="lucide:triangle-alert" class="h-4 w-4 text-error" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-error text-sm">Existing registrations are locked</p>
          <p class="text-sm text-base-content/70 mt-0.5">
            Settle upgrade invoice <span class="font-mono font-medium">{{ pendingUpgrade.invoice_number }}</span> to unlock your registrations and create new ones.
          </p>
        </div>
      </div>
    </div>

    <!-- Counter summary -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <button
        v-for="counter in counters"
        :key="counter.key"
        class="card border bg-base-100 shadow-sm p-3 text-left transition hover:shadow-md"
        :class="activeFilter === counter.key ? 'border-primary bg-primary/5' : 'border-base-200'"
        @click="activeFilter = counter.key"
      >
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full shrink-0" :class="counter.dot" />
          <span class="text-xs text-base-content/50 uppercase">{{ counter.label }}</span>
        </div>
        <p class="text-2xl font-bold mt-1" :class="counter.text">{{ counter.count }}</p>
      </button>
    </div>

    <!-- Filter & search -->
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 border-b border-base-200">
        <div class="flex flex-wrap gap-1.5 flex-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="btn btn-xs"
            :class="activeFilter === tab.key ? 'btn-primary' : 'btn-ghost'"
            @click="activeFilter = tab.key"
          >
            {{ tab.label }}
            <span class="badge badge-xs ml-1" :class="activeFilter === tab.key ? 'bg-white/20 text-white border-0' : 'bg-base-200'">
              {{ countFor(tab.key) }}
            </span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-base-content/40" />
            <input
              v-model="search"
              type="text"
              placeholder="Search category or certificate"
              class="input input-sm input-bordered pl-9 w-full sm:w-64"
            />
          </div>
          <button class="btn btn-sm btn-ghost gap-1.5" :disabled="store.pending" @click="onRefresh">
            <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': store.pending }" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div class="card-body p-4">

        <!-- Loading -->
        <div v-if="store.pending" class="space-y-2">
          <div v-for="n in 5" :key="n" class="h-12 rounded bg-base-200 animate-pulse" />
        </div>

        <!-- Table -->
        <div v-else-if="filteredRegistrations.length" class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase">
                <th>Category</th>
                <th class="hidden md:table-cell">Section</th>
                <th class="hidden md:table-cell">Reg. Date</th>
                <th class="hidden md:table-cell">Expiry</th>
                <th class="hidden lg:table-cell">Certificate</th>
                <th class="hidden sm:table-cell">Payment</th>
                <th class="hidden sm:table-cell">Approval</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="reg in filteredRegistrations" :key="reg.id" class="hover">
                <td>
                  <p class="font-medium text-sm">{{ reg.suppliercategory?.name ?? '—' }}</p>
                  <p class="text-xs text-base-content/40 md:hidden">
                    {{ formatDate(reg.registrationdate) }} → {{ formatDate(reg.expirydate) }}
                  </p>
                  <div class="flex flex-wrap gap-2 mt-1.5 sm:hidden">
                    <span class="badge badge-xs" :class="paymentBadge(reg.payment_status)">{{ paymentLabel(reg.payment_status) }}</span>
                    <span class="badge badge-xs" :class="approvalBadge(reg.approval_status)">{{ approvalLabel(reg.approval_status) }}</span>
                  </div>
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">
                  {{ reg.suppliercategory?.section?.name ?? '—' }}
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">{{ formatDate(reg.registrationdate) }}</td>
                <td class="hidden md:table-cell text-sm text-base-content/70">
                  <span :class="isExpired(reg) ? 'text-error font-medium' : ''">{{ formatDate(reg.expirydate) }}</span>
                </td>
                <td class="hidden lg:table-cell text-sm font-mono text-base-content/70">{{ reg.certificate_number ?? '—' }}</td>
                <td class="hidden sm:table-cell">
                  <span class="badge badge-sm" :class="paymentBadge(reg.payment_status)">{{ paymentLabel(reg.payment_status) }}</span>
                </td>
                <td class="hidden sm:table-cell">
                  <span class="badge badge-sm" :class="approvalBadge(reg.approval_status)">{{ approvalLabel(reg.approval_status) }}</span>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="canDownload(reg)"
                      class="btn btn-xs btn-ghost gap-1"
                      :disabled="downloadingId === reg.id"
                      :title="`Download certificate ${reg.certificate_number}`"
                      @click="onDownload(reg)"
                    >
                      <span v-if="downloadingId === reg.id" class="loading loading-spinner loading-xs" />
                      <Icon v-else name="lucide:download" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">Download</span>
                    </button>
                    <button
                      v-if="canAutorenewal && canEnrolAutorenewal(reg)"
                      class="btn btn-xs gap-1"
                      :class="isEnrolled(reg) ? 'btn-disabled bg-green-50 text-green-700 border-green-200' : 'btn-outline btn-primary'"
                      :disabled="isEnrolled(reg) || enrollingId === reg.id"
                      :title="isEnrolled(reg) ? 'This category is already enrolled in autorenewal.' : 'Add this category to your autorenewal list.'"
                      @click="onEnrolAutorenewal(reg)"
                    >
                      <span v-if="enrollingId === reg.id" class="loading loading-spinner loading-xs" />
                      <Icon v-else :name="isEnrolled(reg) ? 'lucide:check' : 'lucide:refresh-cw'" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">{{ isEnrolled(reg) ? 'On autorenewal' : 'Add to autorenewal' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-col items-center gap-3 py-12 text-center">
          <div class="rounded-full bg-base-200 p-4">
            <Icon :name="emptyIcon" class="h-8 w-8 text-base-content/30" />
          </div>
          <div>
            <p class="font-semibold text-base-content/60">{{ emptyTitle }}</p>
            <p class="text-sm text-base-content/40 mt-0.5">{{ emptyHint }}</p>
          </div>
          <button
            v-if="activeFilter === 'all' && allRegistrations.length === 0 && !pendingUpgrade"
            class="btn btn-sm btn-primary gap-1.5 mt-1"
            @click="navigateTo('/suppliernewapplication')"
          >
            <Icon name="lucide:rocket" class="h-4 w-4" />
            Get Started
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Supplier Registrations',
})

const store = useRegistrationStore()
const autorenewalStore = useAutorenewalStore()
const toast = useToast()
const { user } = useSanctumAuth()
const { can } = useAbility()

const pendingUpgrade = computed(() => user.value?.data?.pending_upgrade_invoice ?? null)
const downloadingId = ref(null)
const enrollingId = ref(null)
const search = ref('')
const activeFilter = ref('all')
const canAutorenewal = computed(() => can('can.access.supplierautorenewals'))

const currentYear = new Date().getFullYear()
const groupKeys = ['pending', 'awaiting', 'approved', 'rejected', 'expired']

onMounted(() => {
  store.fetchRegistrations()
  if (canAutorenewal.value) autorenewalStore.fetch()
})

const allRegistrations = computed(() =>
  groupKeys.flatMap(key =>
    (store.registrations[key] ?? []).map(r => ({ ...r, _group: key }))
  )
)

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'awaiting', label: 'Awaiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
]

function countFor(key) {
  if (key === 'all') return allRegistrations.value.length
  return store.registrations[key]?.length ?? 0
}

const counters = computed(() => [
  { key: 'all',      label: 'All',      dot: 'bg-base-content/40', text: 'text-base-content',     count: countFor('all') },
  { key: 'pending',  label: 'Pending',  dot: 'bg-yellow-400',      text: 'text-yellow-600',       count: countFor('pending') },
  { key: 'awaiting', label: 'Awaiting', dot: 'bg-blue-400',        text: 'text-blue-600',         count: countFor('awaiting') },
  { key: 'approved', label: 'Approved', dot: 'bg-green-400',       text: 'text-green-600',        count: countFor('approved') },
  { key: 'rejected', label: 'Rejected', dot: 'bg-red-400',         text: 'text-red-600',          count: countFor('rejected') },
  { key: 'expired',  label: 'Expired',  dot: 'bg-gray-400',        text: 'text-base-content/60',  count: countFor('expired') },
])

const filteredRegistrations = computed(() => {
  let list = activeFilter.value === 'all'
    ? allRegistrations.value
    : (store.registrations[activeFilter.value] ?? []).map(r => ({ ...r, _group: activeFilter.value }))

  const term = search.value.trim().toLowerCase()
  if (term) {
    list = list.filter(r =>
      (r.suppliercategory?.name ?? '').toLowerCase().includes(term) ||
      (r.suppliercategory?.section?.name ?? '').toLowerCase().includes(term) ||
      (r.certificate_number ?? '').toLowerCase().includes(term)
    )
  }

  return list
})

const emptyIcon = computed(() => activeFilter.value === 'all' ? 'lucide:file-plus' : 'lucide:search-x')

const emptyTitle = computed(() => {
  if (search.value) return 'No registrations match your search'
  if (activeFilter.value === 'all') return `No registrations for ${currentYear}`
  return `No ${activeFilter.value} registrations`
})

const emptyHint = computed(() => {
  if (search.value) return 'Try a different search term or clear the filter.'
  if (activeFilter.value === 'all') return 'Register your company in a supplier category to start participating in procurement.'
  return 'Switch tabs above to see registrations in other states.'
})

const canDownload = (reg) => !reg?.is_locked && reg?.approval_status === 'APPROVED' && !!reg?.certificate_number
const canEnrolAutorenewal = (reg) => reg?.approval_status === 'APPROVED'
const isEnrolled = (reg) => autorenewalStore.enrolledCategoryIds.has(reg?.suppliercategory_id)

function isExpired(reg) {
  if (!reg?.expirydate) return false
  return new Date(reg.expirydate) < new Date()
}

const onRefresh = () => {
  store.fetchRegistrations()
  if (canAutorenewal.value) autorenewalStore.fetch()
}

const onDownload = async (reg) => {
  if (!canDownload(reg) || downloadingId.value === reg.id) return
  downloadingId.value = reg.id
  const { ok, error } = await store.downloadCertificate(reg.id, reg.certificate_number)
  downloadingId.value = null
  if (!ok) {
    toast.error({ title: 'Download failed', message: error, position: 'topRight', layout: 2 })
  }
}

const onEnrolAutorenewal = async (reg) => {
  if (!canEnrolAutorenewal(reg) || isEnrolled(reg) || enrollingId.value === reg.id) return
  enrollingId.value = reg.id
  const { ok, error } = await autorenewalStore.subscribe(reg.id)
  enrollingId.value = null
  if (ok) {
    toast.success({
      title: 'Added to autorenewal',
      message: `${reg.suppliercategory?.name ?? 'Category'} will renew automatically before it expires.`,
      position: 'topRight',
      layout: 2,
    })
  } else {
    toast.error({ title: 'Could not enrol', message: error, position: 'topRight', layout: 2 })
  }
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function paymentLabel(status) {
  const labels = { PENDING: 'Pending', AWAITING: 'Awaiting', PAID: 'Paid' }
  return labels[status] ?? status ?? '—'
}

function paymentBadge(status) {
  const classes = {
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    AWAITING: 'bg-blue-100 text-blue-700 border-blue-300',
    PAID:     'bg-green-100 text-green-700 border-green-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}

function approvalLabel(status) {
  const labels = { PENDING: 'Pending', AWAITING: 'Awaiting', APPROVED: 'Approved', REJECTED: 'Rejected' }
  return labels[status] ?? status ?? '—'
}

function approvalBadge(status) {
  const classes = {
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    AWAITING: 'bg-blue-100 text-blue-700 border-blue-300',
    APPROVED: 'bg-green-100 text-green-700 border-green-300',
    REJECTED: 'bg-red-100 text-red-700 border-red-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}
</script>
