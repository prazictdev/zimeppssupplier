<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:refresh-cw" class="h-6 w-6" />
            Autorenewal
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            Categories enrolled here renew automatically before they expire.
            We try your wallet first; if funds fall short, we email you an invoice with a payment link.
          </p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white text-green-700 hover:bg-green-50 border-0 font-semibold gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Back to Dashboard</span>
          <span class="sm:hidden">Back</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card border border-base-200 bg-base-100 shadow-sm p-4">
        <p class="text-xs text-base-content/50 uppercase">Active</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ activeCount }}</p>
      </div>
      <div class="card border border-base-200 bg-base-100 shadow-sm p-4">
        <p class="text-xs text-base-content/50 uppercase">Due in 30 days</p>
        <p class="text-2xl font-bold text-orange-500 mt-1">{{ dueSoonCount }}</p>
      </div>
      <div class="card border border-base-200 bg-base-100 shadow-sm p-4">
        <p class="text-xs text-base-content/50 uppercase">Cancelled</p>
        <p class="text-2xl font-bold text-base-content/60 mt-1">{{ cancelledCount }}</p>
      </div>
      <div class="card border border-base-200 bg-base-100 shadow-sm p-4">
        <p class="text-xs text-base-content/50 uppercase">Total</p>
        <p class="text-2xl font-bold text-base-content mt-1">{{ store.subscriptions.length }}</p>
      </div>
    </div>

    <!-- Subscriptions card -->
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-200">
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary/10 p-2">
            <Icon name="lucide:list-checks" class="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-base-content">Enrolled Categories</h2>
            <p class="text-xs text-base-content/50">
              {{ store.subscriptions.length }} subscription{{ store.subscriptions.length === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost gap-1.5" :disabled="store.pending" @click="onRefresh">
          <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': store.pending }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div class="card-body p-4">

        <!-- Loading -->
        <div v-if="store.pending" class="space-y-2">
          <div v-for="n in 4" :key="n" class="h-12 rounded bg-base-200 animate-pulse" />
        </div>

        <!-- Table -->
        <div v-else-if="store.subscriptions.length" class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase">
                <th>Category</th>
                <th class="hidden md:table-cell">Section</th>
                <th class="hidden md:table-cell">Next Attempt</th>
                <th class="hidden lg:table-cell">Last Attempt</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in store.subscriptions" :key="sub.id" class="hover">
                <td>
                  <p class="font-medium text-sm">{{ sub.suppliercategory?.name ?? '—' }}</p>
                  <p class="text-xs text-base-content/40 md:hidden">
                    Next: {{ formatDate(sub.next_due_at) }}
                  </p>
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">
                  {{ sub.suppliercategory?.section?.name ?? '—' }}
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">
                  {{ formatDate(sub.next_due_at) }}
                </td>
                <td class="hidden lg:table-cell text-sm text-base-content/70">
                  <div v-if="sub.last_attempt_at">
                    <p>{{ formatDateTime(sub.last_attempt_at) }}</p>
                    <p class="text-xs text-base-content/50">
                      <span class="badge badge-xs" :class="attemptBadge(sub.last_attempt_status)">
                        {{ attemptLabel(sub.last_attempt_status) }}
                      </span>
                    </p>
                  </div>
                  <span v-else class="text-base-content/40">—</span>
                </td>
                <td>
                  <span class="badge badge-sm" :class="statusBadge(sub.status)">
                    {{ statusLabel(sub.status) }}
                  </span>
                </td>
                <td class="text-right">
                  <button
                    v-if="sub.status === 'ACTIVE'"
                    class="btn btn-xs btn-outline btn-error gap-1"
                    :disabled="cancellingId === sub.id"
                    @click="onCancel(sub)"
                  >
                    <span v-if="cancellingId === sub.id" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:x-circle" class="h-3.5 w-3.5" />
                    <span class="hidden sm:inline">Cancel</span>
                  </button>
                  <span v-else class="text-xs text-base-content/40">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty -->
        <div v-else class="flex flex-col items-center gap-3 py-12 text-center">
          <div class="rounded-full bg-base-200 p-4">
            <Icon name="lucide:refresh-cw" class="h-8 w-8 text-base-content/30" />
          </div>
          <div>
            <p class="font-semibold text-base-content/60">No autorenewals yet</p>
            <p class="text-sm text-base-content/40 mt-0.5 max-w-sm">
              Open the dashboard and click <strong>"Add to autorenewal"</strong> on any approved category to enrol it.
            </p>
          </div>
          <NuxtLink to="/dashboard" class="btn btn-sm btn-primary gap-1.5 mt-1">
            <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
            Go to Dashboard
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="card-body p-5">
        <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
          <Icon name="lucide:info" class="h-4 w-4 text-primary" />
          How autorenewal works
        </h3>
        <ol class="list-decimal pl-5 mt-3 space-y-1.5 text-sm text-base-content/70">
          <li>30 days before a category expires, we create a renewal registration on your behalf.</li>
          <li>We attempt to settle the renewal fee from your wallet balance automatically.</li>
          <li>If wallet funds are sufficient, your new certificate is issued and emailed to you immediately.</li>
          <li>If funds are insufficient, we email you an invoice with a payment link — once you settle, the certificate is generated and emailed automatically.</li>
          <li>You can cancel any active autorenewal at any time using the <strong>Cancel</strong> button above.</li>
        </ol>
      </div>
    </div>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Autorenewal',
})

const store = useAutorenewalStore()
const toast = useToast()
const cancellingId = ref(null)

onMounted(() => {
  store.fetch()
})

const activeCount = computed(() => store.activeSubscriptions.length)
const cancelledCount = computed(() => store.subscriptions.filter(s => s.status === 'CANCELLED').length)
const dueSoonCount = computed(() => {
  const today = new Date()
  const horizon = new Date()
  horizon.setDate(today.getDate() + 30)
  return store.activeSubscriptions.filter(s => {
    if (!s.next_due_at) return false
    const due = new Date(s.next_due_at)
    return due >= today && due <= horizon
  }).length
})

const onRefresh = () => store.fetch()

const onCancel = async (sub) => {
  if (cancellingId.value === sub.id) return
  if (!confirm(`Cancel autorenewal for "${sub.suppliercategory?.name ?? 'this category'}"?`)) return

  cancellingId.value = sub.id
  const { ok, error } = await store.cancel(sub.id)
  cancellingId.value = null

  if (ok) {
    toast.success({
      title: 'Autorenewal cancelled',
      message: `${sub.suppliercategory?.name ?? 'Category'} will not renew automatically.`,
      position: 'topRight',
      layout: 2,
    })
  } else {
    toast.error({ title: 'Could not cancel', message: error, position: 'topRight', layout: 2 })
  }
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-ZW', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusLabel(status) {
  const labels = { ACTIVE: 'Active', CANCELLED: 'Cancelled' }
  return labels[status] ?? status ?? '—'
}

function statusBadge(status) {
  const classes = {
    ACTIVE:    'bg-green-100 text-green-700 border-green-300',
    CANCELLED: 'bg-base-200 text-base-content/60 border-base-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}

function attemptLabel(status) {
  const labels = {
    RENEWED:  'Renewed',
    INVOICED: 'Invoice sent',
    FAILED:   'Failed',
  }
  return labels[status] ?? status ?? '—'
}

function attemptBadge(status) {
  const classes = {
    RENEWED:  'bg-green-100 text-green-700 border-green-300',
    INVOICED: 'bg-orange-100 text-orange-700 border-orange-300',
    FAILED:   'bg-red-100 text-red-700 border-red-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}
</script>
