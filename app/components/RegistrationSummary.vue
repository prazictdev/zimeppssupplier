<template>
  <div class="card card-border bg-base-100">

    <!-- Card header -->
    <div class="flex flex-col items-stretch justify-between gap-4 border-b border-base-200 px-5 py-4 sm:flex-row sm:items-center">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary/10 p-2">
          <Icon name="lucide:clipboard-list" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-base-content">Supplier registrations</h2>
          <p class="text-xs text-base-content/50">{{ currentYear }} financial year</p>
        </div>
      </div>
      <NuxtLink to="/suppliernewapplication" class="btn btn-primary btn-sm w-full gap-2 sm:w-auto">
        <Icon name="lucide:file-plus-2" class="h-4 w-4" />
        New registration
      </NuxtLink>
    </div>

    <div class="card-body p-4">

      <!-- Loading skeleton -->
      <div v-if="store.pending" class="space-y-2">
        <div v-for="n in 4" :key="n" class="skeleton h-10" />
      </div>

      <!-- Table -->
      <div v-else-if="allRegistrations.length" class="overflow-x-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr class="text-xs text-base-content/50">
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
            <tr v-for="reg in allRegistrations" :key="reg.id" class="block border-b border-base-200 py-2 last:border-0 sm:table-row sm:border-0 sm:py-0">
              <td class="block sm:table-cell">
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
              <td class="block pt-2 text-left sm:table-cell sm:pt-2 sm:text-right">
                <div v-if="hasActions(reg)" class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    v-if="canDownload(reg)"
                    type="button"
                    class="btn btn-outline btn-sm w-full gap-2 whitespace-nowrap sm:w-auto"
                    :disabled="downloadingId === reg.id"
                    :title="downloadTitle(reg)"
                    @click="onDownload(reg)"
                  >
                    <span v-if="downloadingId === reg.id" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:download" class="h-4 w-4" />
                    {{ downloadingId === reg.id ? 'Downloading' : 'Download certificate' }}
                  </button>

                  <button
                    v-if="allowAutorenewal && canEnrolAutorenewal(reg)"
                    type="button"
                    class="btn btn-soft btn-sm w-full gap-2 whitespace-nowrap sm:w-auto"
                    :disabled="isEnrolled(reg) || enrollingId === reg.id"
                    :title="autorenewalTitle(reg)"
                    @click="onEnrolAutorenewal(reg)"
                  >
                    <span v-if="enrollingId === reg.id" class="loading loading-spinner loading-xs" />
                    <Icon v-else :name="isEnrolled(reg) ? 'lucide:check-circle-2' : 'lucide:refresh-cw'" class="h-4 w-4" />
                    {{ enrollingId === reg.id ? 'Adding' : isEnrolled(reg) ? 'On autorenewal' : 'Add to autorenewal' }}
                  </button>
                </div>
                <span v-else class="hidden text-base-content/30 sm:inline">—</span>
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
          <p class="font-semibold text-base-content/70">No active supplier category found</p>
          <p class="mt-1 text-sm leading-5 text-base-content/50">Choose a category and register your company to start participating in procurement.</p>
        </div>
        <button class="btn btn-sm btn-primary mt-1 gap-1.5" @click="navigateTo('/suppliernewapplication')">
          <Icon name="lucide:rocket" class="h-4 w-4" />
          Get started
        </button>
      </div>
    </div>

  </div>
</template>


<script setup>
const props = defineProps({
  allowAutorenewal: {
    type: Boolean,
    default: false,
  },
})

const store = useRegistrationStore()
const autorenewalStore = useAutorenewalStore()
const toast = useToast()
const downloadingId = ref(null)
const enrollingId = ref(null)

const canDownload = (reg) => !reg?.is_locked && reg?.approval_status === 'APPROVED' && !!reg?.certificate_number
const canEnrolAutorenewal = (reg) => reg?.approval_status === 'APPROVED'
const isEnrolled = (reg) => autorenewalStore.enrolledCategoryIds.has(reg?.suppliercategory_id)
const hasActions = (reg) => canDownload(reg) || (props.allowAutorenewal && canEnrolAutorenewal(reg))

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
    PENDING: 'badge-warning badge-soft',
    AWAITING: 'badge-info badge-soft',
    PAID: 'badge-success badge-soft',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}

function approvalLabel(status) {
  const labels = { PENDING: 'Pending', AWAITING: 'Awaiting', APPROVED: 'Approved', REJECTED: 'Rejected' }
  return labels[status] ?? status ?? '—'
}

function approvalBadge(status) {
  const classes = {
    PENDING: 'badge-warning badge-soft',
    AWAITING: 'badge-info badge-soft',
    APPROVED: 'badge-success badge-soft',
    REJECTED: 'badge-error badge-soft',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}
</script>
