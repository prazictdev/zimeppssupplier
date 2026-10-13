<template>
  <div class="card border border-base-200 bg-base-100 shadow-sm">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-primary/10 p-2">
          <Icon name="lucide:refresh-cw" class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-base-content">Autorenewal</h2>
          <p class="text-xs text-base-content/50">
            Keep your approved categories active without lifting a finger.
          </p>
        </div>
      </div>
      <NuxtLink to="/supplierautorenewals" class="btn btn-sm btn-ghost gap-1.5">
        <span class="hidden sm:inline">Manage</span>
        <Icon name="lucide:arrow-right" class="h-4 w-4" />
      </NuxtLink>
    </div>

    <div class="card-body p-4 space-y-3">

      <!-- How it works -->
      <div class="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-base-content/70 leading-relaxed">
        <p class="font-medium text-base-content/90 mb-1">How it works</p>
        <ul class="list-disc pl-4 space-y-0.5">
          <li>Enrol any approved category and we will renew it automatically before it expires.</li>
          <li>If your wallet has enough funds, the new certificate is issued and emailed to you immediately.</li>
          <li>If funds fall short, we will email you an invoice with a payment link so you can settle and stay active.</li>
        </ul>
      </div>

      <!-- Counters -->
      <div class="flex flex-wrap gap-2">
        <div class="flex items-center gap-1.5 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-green-400 shrink-0" />
          <span class="text-xs font-medium text-base-content">{{ activeCount }}</span>
          <span class="text-xs text-base-content/50">Active</span>
        </div>
        <div class="flex items-center gap-1.5 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-orange-400 shrink-0" />
          <span class="text-xs font-medium text-base-content">{{ dueSoonCount }}</span>
          <span class="text-xs text-base-content/50">Due within 30 days</span>
        </div>
        <div class="flex items-center gap-1.5 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5">
          <span class="inline-block h-2 w-2 rounded-full bg-gray-400 shrink-0" />
          <span class="text-xs font-medium text-base-content">{{ cancelledCount }}</span>
          <span class="text-xs text-base-content/50">Cancelled</span>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="store.pending" class="space-y-2">
        <div v-for="n in 2" :key="n" class="h-9 rounded bg-base-200 animate-pulse" />
      </div>

      <!-- Active subscriptions preview -->
      <div v-else-if="store.activeSubscriptions.length" class="space-y-1">
        <div
          v-for="sub in previewSubscriptions"
          :key="sub.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-base-200 px-3 py-2"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-base-content truncate">
              {{ sub.suppliercategory?.name ?? 'Category' }}
            </p>
            <p class="text-xs text-base-content/50">
              Next attempt: {{ formatDate(sub.next_due_at) }}
            </p>
          </div>
          <span class="badge badge-xs bg-green-100 text-green-700 border-green-300 shrink-0">Active</span>
        </div>
        <NuxtLink
          v-if="store.activeSubscriptions.length > previewSubscriptions.length"
          to="/supplierautorenewals"
          class="block text-xs text-primary hover:underline mt-1"
        >
          View all {{ store.activeSubscriptions.length }} subscriptions →
        </NuxtLink>
      </div>

      <!-- Empty state -->
      <div v-else class="flex items-center gap-3 rounded-lg border border-dashed border-base-200 px-4 py-4">
        <Icon name="lucide:info" class="h-5 w-5 text-base-content/40 shrink-0" />
        <p class="text-xs text-base-content/60">
          You have no categories enrolled yet. Use the
          <span class="font-medium">"Add to autorenewal"</span> button beside any approved category below.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const store = useAutorenewalStore()

const previewSubscriptions = computed(() => store.activeSubscriptions.slice(0, 3))

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

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
