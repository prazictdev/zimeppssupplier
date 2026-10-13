<template>
  <div class="card border border-base-200 bg-base-100 shadow-sm">

    <!-- Card header -->
    <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary/10 p-2">
          <Icon name="lucide:clipboard-list" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-base-content">Supplier Registrations</h2>
          <p class="text-xs text-base-content/50">{{ currentYear }} financial year</p>
        </div>
      </div>
      <button v-if="!pendingUpgrade" class="btn btn-sm btn-primary gap-1.5" @click="navigateTo('/suppliernewapplication')">
        <Icon name="lucide:plus" class="h-4 w-4" />
        <span class="hidden sm:inline">New Registration</span>
      </button>
    </div>

    <div class="card-body p-4">

      <!-- Counters -->
      <div class="flex flex-wrap gap-2 pb-3 border-b border-base-200">
        <div
          v-for="counter in counters"
          :key="counter.label"
          class="flex items-center gap-1.5 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5"
        >
          <span class="inline-block h-2 w-2 rounded-full shrink-0" :class="counter.dot" />
          <span class="text-xs font-medium text-base-content">{{ counter.count }}</span>
          <span class="text-xs text-base-content/50">{{ counter.label }}</span>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="store.pending" class="space-y-2">
        <div v-for="n in 4" :key="n" class="h-10 rounded bg-base-200 animate-pulse" />
      </div>

      <!-- Table -->
      <div v-else-if="allRegistrations.length" class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr class="text-xs text-base-content/50 uppercase">
              <th>Category</th>
              <th class="hidden md:table-cell">Reg. Date</th>
              <th class="hidden md:table-cell">Expiry</th>
              <th class="hidden lg:table-cell">Certificate</th>
              <th class="hidden sm:table-cell">Payment</th>
              <th class="hidden sm:table-cell">Approval</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reg in allRegistrations" :key="reg.id" class="hover">
              <td>
                <p class="font-medium text-sm">{{ reg.suppliercategory?.name ?? '—' }}</p>
                <div class="flex flex-wrap gap-2 mt-1.5 sm:hidden">
                  <span class="flex items-center gap-1">
                    <span class="text-xs text-base-content/40">Payment:</span>
                    <span class="badge badge-xs" :class="paymentBadge(reg.payment_status)">{{ paymentLabel(reg.payment_status) }}</span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="text-xs text-base-content/40">Approval:</span>
                    <span class="badge badge-xs" :class="approvalBadge(reg.approval_status)">{{ approvalLabel(reg.approval_status) }}</span>
                  </span>
                </div>
              </td>
              <td class="hidden md:table-cell text-sm text-base-content/70">{{ formatDate(reg.registrationdate) }}</td>
              <td class="hidden md:table-cell text-sm text-base-content/70">{{ formatDate(reg.expirydate) }}</td>
              <td class="hidden lg:table-cell text-sm font-mono text-base-content/70">{{ reg.certificate_number ?? '—' }}</td>
              <td class="hidden sm:table-cell">
                <span class="badge badge-sm" :class="paymentBadge(reg.payment_status)">
                  {{ paymentLabel(reg.payment_status) }}
                </span>
              </td>
              <td class="hidden sm:table-cell">
                <span class="badge badge-sm" :class="approvalBadge(reg.approval_status)">
                  {{ approvalLabel(reg.approval_status) }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    v-if="canDownload(reg)"
                    class="btn btn-xs btn-ghost gap-1"
                    :disabled="downloadingId === reg.id"
                    :title="downloadTitle(reg)"
                    @click="onDownload(reg)"
                  >
                    <span v-if="downloadingId === reg.id" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:download" class="h-3.5 w-3.5" />
                    <span class="hidden sm:inline">Download</span>
                  </button>
                  <button
                    v-if="allowAutorenewal && canEnrolAutorenewal(reg)"
                    class="btn btn-xs gap-1"
                    :class="isEnrolled(reg) ? 'btn-disabled bg-green-50 text-green-700 border-green-200' : 'btn-outline btn-primary'"
                    :disabled="isEnrolled(reg) || enrollingId === reg.id"
                    :title="autorenewalTitle(reg)"
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
          <Icon name="lucide:file-plus" class="h-8 w-8 text-base-content/30" />
        </div>
        <div>
          <p class="font-semibold text-base-content/60">No registrations for {{ currentYear }}</p>
          <p class="text-sm text-base-content/40 mt-0.5">Register your company to start participating in procurement.</p>
        </div>
        <button class="btn btn-sm btn-primary gap-1.5 mt-1" @click="navigateTo('/suppliernewapplication')">
          <Icon name="lucide:rocket" class="h-4 w-4" />
          Get Started
        </button>
      </div>
    </div>

  </div>
</template>


<script setup>
defineProps({
  allowAutorenewal: {
    type: Boolean,
    default: false,
  },
})

const store = useRegistrationStore()
const autorenewalStore = useAutorenewalStore()
const toast = useToast()
const { user } = useSanctumAuth()
const pendingUpgrade = computed(() => user.value?.data?.pending_upgrade_invoice ?? null)

const downloadingId = ref(null)
const enrollingId = ref(null)

const canDownload = (reg) => !reg?.is_locked && reg?.approval_status === 'APPROVED' && !!reg?.certificate_number
const canEnrolAutorenewal = (reg) => reg?.approval_status === 'APPROVED'
const isEnrolled = (reg) => autorenewalStore.enrolledCategoryIds.has(reg?.suppliercategory_id)

const autorenewalTitle = (reg) => {
  if (isEnrolled(reg)) return 'This category is already enrolled in autorenewal.'
  return 'Add this category to your autorenewal list.'
}

const downloadTitle = (reg) => {
  if (reg?.is_locked) return 'Certificate locked until the supplier type upgrade invoice is settled.'
  if (reg?.approval_status !== 'APPROVED') return 'Certificate available once your registration is approved.'
  if (!reg?.certificate_number) return 'Certificate is being prepared. Try again shortly.'
  return `Download certificate ${reg.certificate_number}`
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

const currentYear = new Date().getFullYear()

const groupKeys = ['pending', 'awaiting', 'approved', 'rejected', 'expired']

const allRegistrations = computed(() =>
  groupKeys.flatMap(key =>
    (store.registrations[key] ?? []).map(r => ({ ...r, _group: key }))
  )
)

const counters = computed(() => [
  {
    label: 'Pending',
    dot: 'bg-yellow-400',
    count: allRegistrations.value.filter(r => r.payment_status === 'PENDING').length,
  },
  {
    label: 'Awaiting Payment',
    dot: 'bg-orange-400',
    count: allRegistrations.value.filter(r => r.payment_status === 'AWAITING').length,
  },
  {
    label: 'Paid',
    dot: 'bg-teal-400',
    count: allRegistrations.value.filter(r => r.payment_status === 'PAID').length,
  },
  {
    label: 'Awaiting Approval',
    dot: 'bg-blue-400',
    count: allRegistrations.value.filter(r => r.payment_status !== 'PENDING' && r.payment_status !== 'AWAITING' && ['PENDING', 'AWAITING'].includes(r.approval_status)).length,
  },
  {
    label: 'Approved',
    dot: 'bg-green-400',
    count: store.registrations.approved?.length ?? 0,
  },
  {
    label: 'Rejected',
    dot: 'bg-red-400',
    count: store.registrations.rejected?.length ?? 0,
  },
  {
    label: 'Expired',
    dot: 'bg-gray-400',
    count: store.registrations.expired?.length ?? 0,
  },
])

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
