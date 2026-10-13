<template>
  <div class="space-y-4">
    <header class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <div class="rounded-lg bg-primary/10 p-2"><Icon name="lucide:radio-tower" class="h-5 w-5 text-primary" /></div>
          <div><h1 class="text-sm font-semibold text-base-content">Bid-opening sessions</h1><p class="mt-0.5 max-w-2xl text-xs text-base-content/50">Select a submitted tender to view its scheduled opening, live status and official register.</p></div>
        </div>
        <div class="flex items-center gap-2 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5 text-xs text-base-content/60">
          <span class="relative flex h-3 w-3"><span v-if="polling" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" /><span class="relative inline-flex h-3 w-3 rounded-full" :class="polling ? 'bg-success' : 'bg-base-300'" /></span>
          {{ polling ? 'Watching active sessions' : 'All sessions up to date' }}
        </div>
      </div>
    </header>

    <div v-if="errorMessage" class="alert alert-error"><Icon name="lucide:triangle-alert" class="h-5 w-5" /><span>{{ errorMessage }}</span><button class="btn btn-sm" @click="loadSessions">Retry</button></div>
    <div v-if="loading" class="flex justify-center py-24"><span class="loading loading-spinner loading-lg text-primary" /></div>
    <div v-else-if="!sessions.length" class="card border border-base-200 bg-base-100 px-6 py-12 text-center shadow-sm">
      <Icon name="lucide:radio-tower" class="mx-auto h-14 w-14 text-base-content/25" />
      <h2 class="mt-4 text-xl font-bold">No bid-opening sessions yet</h2>
      <p class="mx-auto mt-2 max-w-lg text-sm text-base-content/55">Sessions appear here after your organisation has submitted a bid. Drafts and recalled responses are not shown.</p>
      <NuxtLink to="/mysupplierbids" class="btn btn-primary btn-sm mt-5">View My Bids</NuxtLink>
    </div>

    <section v-else class="card overflow-hidden border border-base-200 bg-base-100 shadow-sm">
      <div class="border-b border-base-200 px-5 py-4"><h2 class="text-sm font-semibold text-base-content">Your submitted tenders</h2><p class="text-xs text-base-content/50">{{ sessions.length }} opening {{ sessions.length === 1 ? 'session' : 'sessions' }}</p></div>
      <div class="overflow-x-auto">
        <table class="table table-sm min-w-[980px]">
          <thead>
            <tr class="text-xs uppercase text-base-content/50">
              <th>Reference</th><th>Tender</th><th>Procuring entity</th><th>Your response</th><th>Opening</th><th>Status</th><th class="text-center">Responses</th>
              <th class="sticky right-0 z-20 border-l border-base-200 bg-base-100 text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="session in sessions" :key="session.tender_uuid" class="group hover">
              <td class="whitespace-nowrap font-mono text-xs text-base-content/60">{{ session.reference || 'Tender' }}</td>
              <td class="min-w-64"><NuxtLink :to="`/supplierbidopening/${session.tender_uuid}`" class="text-sm font-medium text-base-content hover:text-primary hover:underline">{{ session.title }}</NuxtLink></td>
              <td class="min-w-48 text-sm text-base-content/70">{{ session.procuring_entity }}</td>
              <td class="whitespace-nowrap text-sm text-base-content/70">{{ bidStatusLabel(session.bid_status) }}</td>
              <td class="whitespace-nowrap text-sm text-base-content/70">{{ formatDateTime(session.opening_at) }}</td>
              <td><span class="badge badge-sm whitespace-nowrap" :class="stateClass(session.opening_state)">{{ stateLabel(session.opening_state) }}</span></td>
              <td class="text-center text-sm font-semibold">{{ session.submission_count ?? '—' }}</td>
              <td class="sticky right-0 z-10 border-l border-base-200 bg-base-100 text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)] group-hover:bg-base-200">
                <NuxtLink :to="`/supplierbidopening/${session.tender_uuid}`" class="btn btn-primary btn-xs gap-1 whitespace-nowrap"><span>View</span><Icon name="lucide:chevron-right" class="h-3.5 w-3.5" /></NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } });
useHead({ title: 'Bid-opening Sessions' });
const route = useRoute();
const openingApi = useSupplierBidOpening();
const sessions = ref([]); const loading = ref(true); const errorMessage = ref('');
let pollTimer;
const polling = computed(() => sessions.value.some(session => session.opening_state !== 'OPENED'));
async function loadSessions(silent = false) { if (!silent) loading.value = true; errorMessage.value = ''; const result = await openingApi.list(); if (!silent) loading.value = false; if (!result.ok) { errorMessage.value = result.error; return; } sessions.value = Array.isArray(result.data) ? result.data : []; }
function stateLabel(state) { return ({ SCHEDULED: 'Scheduled', AWAITING_OPENING: 'Live · awaiting opening', OPENED: 'Opened' })[state] ?? state; }
function stateClass(state) { return ({ SCHEDULED: 'border-blue-300 bg-blue-100 text-blue-700', AWAITING_OPENING: 'border-green-300 bg-green-100 text-green-700', OPENED: 'border-teal-300 bg-teal-100 text-teal-700' })[state] ?? 'border-base-300 bg-base-200 text-base-content/60'; }
function bidStatusLabel(status) { return String(status ?? '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
function formatDateTime(value) { return value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not scheduled'; }
onMounted(async () => {
  const legacyTenderUuid = String(route.query.tender ?? '');
  if (legacyTenderUuid) { await navigateTo(`/supplierbidopening/${legacyTenderUuid}`, { replace: true }); return; }
  await loadSessions();
  pollTimer = window.setInterval(() => { if (!document.hidden && polling.value) loadSessions(true); }, 5000);
});
onBeforeUnmount(() => window.clearInterval(pollTimer));
</script>
