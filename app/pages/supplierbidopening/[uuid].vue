<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <NuxtLink to="/mysupplierbids" class="btn btn-ghost btn-sm self-start"><Icon name="lucide:arrow-left" class="h-4 w-4" />My bids</NuxtLink>
      <div class="flex items-center gap-2 rounded-lg border border-base-200 bg-base-50 px-3 py-1.5 text-xs text-base-content/60"><span class="relative flex h-3 w-3"><span v-if="polling" class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" /><span class="relative inline-flex h-3 w-3 rounded-full" :class="polling ? 'bg-success' : 'bg-base-300'" /></span>{{ polling ? 'Tracking updates automatically' : 'Final outcome recorded' }}</div>
    </div>
    <div v-if="errorMessage" class="alert alert-error"><Icon name="lucide:triangle-alert" class="h-5 w-5" /><span>{{ errorMessage }}</span><button class="btn btn-sm" @click="loadSession">Retry</button></div>
    <div v-if="loading" class="flex justify-center py-24"><span class="loading loading-spinner loading-lg text-primary" /></div>

    <template v-else-if="session">
      <header class="card overflow-hidden border border-base-200 bg-base-100 shadow-sm">
        <div class="p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><p class="font-mono text-xs text-base-content/50">{{ session.reference || 'Tender' }}</p><span v-if="session.evaluation_method?.name" class="badge badge-outline badge-sm">{{ session.evaluation_method.name }}</span></div><h1 class="mt-1.5 text-lg font-semibold text-base-content">{{ session.title }}</h1><p class="mt-0.5 text-xs text-base-content/50">{{ session.procuring_entity }}</p></div><div class="flex flex-wrap items-center gap-2"><span class="badge badge-sm font-medium" :class="stateClass(session.opening_state)">{{ stateLabel(session.opening_state) }}</span><NuxtLink :to="`/supplieropportunities/${session.tender_uuid}`" class="btn btn-ghost btn-xs"><Icon name="lucide:external-link" class="h-3.5 w-3.5" />Tender details</NuxtLink></div></div>
          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-base-200 bg-base-50 p-4"><p class="text-xs text-base-content/45">Your response</p><p class="mt-1 text-sm font-semibold">{{ bidStatusLabel(session.bid_status) }}</p><p class="mt-1 text-xs text-base-content/50">{{ formatDateTime(session.submitted_at) }}</p></div>
            <div class="rounded-xl border border-base-200 bg-base-50 p-4"><p class="text-xs text-base-content/45">Scheduled opening</p><p class="mt-1 text-sm font-semibold">{{ formatDateTime(session.opening_at) }}</p><p v-if="session.opening_state === 'SCHEDULED'" class="mt-1 text-xs text-primary">{{ countdown(session.opening_at) }}</p></div>
            <div class="rounded-xl border border-base-200 bg-base-50 p-4"><p class="text-xs text-base-content/45">Responses opened</p><p class="mt-1 text-base font-bold">{{ session.submission_count ?? '—' }}</p><p class="mt-1 text-xs text-base-content/50">Published after controlled opening</p></div>
          </div>
        </div>
      </header>

      <section class="card card-border bg-base-100">
        <div class="card-body gap-5 p-4 sm:p-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">Response progress</p>
              <h2 class="card-title mt-1 text-lg">Tender stages</h2>
              <p class="mt-1 text-sm text-base-content/60">Follow your sealed response from submission through the published procurement outcome.</p>
            </div>
            <span class="badge badge-outline badge-sm whitespace-nowrap">{{ prettyStatus(session.tender_status) }}</span>
          </div>

          <ul class="steps steps-vertical w-full sm:steps-horizontal">
            <li
              v-for="(stage, index) in tenderStages"
              :key="stage.key"
              class="step min-h-20 sm:min-h-0"
              :class="stage.state === 'complete' ? 'step-success' : stage.state === 'current' ? 'step-primary' : ''"
              :data-content="stage.state === 'complete' ? '✓' : String(index + 1)"
            >
              <span class="flex flex-col px-2 text-left sm:items-center sm:text-center">
                <span class="text-sm font-semibold">{{ stage.label }}</span>
                <span class="mt-1 max-w-48 text-xs font-normal text-base-content/50">{{ stage.description }}</span>
              </span>
            </li>
          </ul>

          <div role="status" class="alert alert-info alert-soft items-start">
            <Icon :name="currentStage.icon" class="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p class="font-semibold">{{ currentStage.title }}</p>
              <p class="mt-1 text-sm">{{ currentStage.message }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="session.opening_state !== 'OPENED'" class="rounded-xl border bg-base-100 p-8 text-center shadow-sm" :class="session.is_live ? 'border-success/40' : 'border-base-200'"><span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full" :class="session.is_live ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'"><Icon :name="session.is_live ? 'lucide:radio-tower' : 'lucide:clock-3'" class="h-7 w-7" /></span><h2 class="mt-4 text-sm font-semibold">{{ session.is_live ? 'Waiting for the opening team' : 'Opening has not started' }}</h2><p class="mx-auto mt-1 max-w-xl text-xs text-base-content/50">{{ session.is_live ? 'The scheduled time has arrived. Keep this page open—the official register will appear automatically after controlled decryption.' : `This session is scheduled for ${formatDateTime(session.opening_at)}.` }}</p><span v-if="session.is_live" class="loading loading-dots loading-lg mt-4 text-success" /></section>

      <section v-else class="overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-sm">
        <div class="flex flex-col gap-3 border-b border-base-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-start gap-3"><div class="rounded-lg bg-green-100 p-2"><Icon name="lucide:file-check-2" class="h-5 w-5 text-green-700" /></div><div><h2 class="text-sm font-semibold text-base-content">{{ isConsultancySelection ? 'Official proposal-opening register' : 'Official opening register' }}</h2><p class="text-xs text-base-content/50">Opened {{ formatDateTime(session.opened_at) }} · This register does not rank bidders.</p></div></div><button type="button" class="btn btn-outline btn-success btn-sm" @click="downloadReport"><Icon name="lucide:download" class="h-4 w-4" />Download register</button></div>
        <div v-if="isConsultancySelection" class="overflow-x-auto"><table class="table table-sm min-w-[720px]"><thead><tr class="text-xs uppercase text-base-content/50"><th>Consultant</th><th>Technical proposal</th><th>Financial proposal</th></tr></thead><tbody><tr v-for="(row, index) in session.report?.rows ?? []" :key="`${row.bidder_name}-${index}`" :class="row.is_my_bid ? 'bg-primary/5' : ''"><td><div class="flex flex-wrap items-center gap-2"><span class="text-sm font-medium">{{ row.bidder_name }}</span><span v-if="row.is_my_bid" class="badge h-auto min-h-6 whitespace-nowrap border-blue-300 bg-blue-100 px-3 py-1 text-xs font-medium leading-tight text-blue-700">Your proposal</span></div></td><td><span class="badge h-auto min-h-6 whitespace-nowrap border-green-300 bg-green-100 px-3 py-1 text-xs font-medium leading-tight text-green-700">Opened securely</span></td><td><span class="badge h-auto min-h-6 whitespace-nowrap px-3 py-1 text-xs font-medium leading-tight" :class="financialEnvelopeClass">{{ financialEnvelopeLabel }}</span></td></tr><tr v-if="!session.report?.rows?.length"><td colspan="3" class="py-10 text-center text-base-content/45">No consultancy proposals were recorded.</td></tr></tbody></table></div>
        <div v-else class="overflow-x-auto"><table class="table table-sm min-w-[760px]"><thead><tr class="text-xs uppercase text-base-content/50"><th>Bidder</th><th>Item responded to</th><th class="text-right">Quantity</th><th class="text-right">Unit price</th><th class="text-right">Amount quoted</th></tr></thead><tbody><tr v-for="(row, index) in session.report?.rows ?? []" :key="`${row.bidder_name}-${row.responded_to}-${index}`" :class="row.is_my_bid ? 'bg-primary/5' : ''"><td><div class="flex items-center gap-2"><span class="text-sm font-medium">{{ row.bidder_name }}</span><span v-if="row.is_my_bid" class="badge badge-primary badge-xs">Your bid</span></div></td><td class="min-w-64">{{ row.responded_to }}</td><td class="text-right font-mono">{{ formatQuantity(row.quantity) }}</td><td class="text-right font-mono">{{ formatMoney(row.unit_price) }}</td><td class="text-right font-mono font-bold">{{ formatMoney(row.amount_quoted) }}</td></tr><tr v-if="!session.report?.rows?.length"><td colspan="5" class="py-10 text-center text-base-content/45">No opening rows were recorded.</td></tr></tbody></table></div>
        <div class="border-t border-base-200 p-4 text-xs text-base-content/50"><p>{{ isConsultancySelection ? consultancyOpeningNotice : session.report?.notice }}</p><p v-if="session.report_hash" class="mt-2 break-all font-mono">Report integrity hash: {{ session.report_hash }}</p></div>
      </section>

      <section v-if="session.minutes" class="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm"><h2 class="text-sm font-semibold">Opening minutes</h2><p class="mt-2 whitespace-pre-wrap text-sm text-base-content/65">{{ session.minutes }}</p><p v-if="session.minutes_reference" class="mt-2 text-xs font-mono text-base-content/45">Reference: {{ session.minutes_reference }}</p></section>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } });
useHead({ title: 'Tender Response Progress' });
const route = useRoute(); const openingApi = useSupplierBidOpening(); const tenderUuid = String(route.params.uuid);
const session = ref(null); const loading = ref(true); const refreshing = ref(false); const errorMessage = ref(''); const now = ref(Date.now());
let pollTimer; let clockTimer;
const outcomeStatuses = ['INTENTION_TO_AWARD', 'STANDSTILL', 'AWARDED', 'CONTRACTED', 'CANCELLED'];
const evaluationStatuses = ['OPENED', 'UNDER_EVALUATION', 'EVALUATED'];
const polling = computed(() => Boolean(
  session.value
  && !['AWARDED', 'FAILED'].includes(session.value.bid_status)
  && !outcomeStatuses.includes(session.value.tender_status),
));
const isConsultancySelection = computed(() => Boolean(session.value?.is_consultancy_selection));
const currentStageIndex = computed(() => {
  if (['AWARDED', 'FAILED'].includes(session.value?.bid_status) || outcomeStatuses.includes(session.value?.tender_status)) return 3;
  if (evaluationStatuses.includes(session.value?.tender_status) || session.value?.opening_state === 'OPENED') return 2;
  return 1;
});
const tenderStages = computed(() => [
  { key: 'submitted', label: 'Response submitted', description: formatDateTime(session.value?.submitted_at) },
  { key: 'opening', label: 'Bid opening', description: session.value?.opening_state === 'OPENED' ? `Opened ${formatDateTime(session.value?.opened_at)}` : formatDateTime(session.value?.opening_at) },
  { key: 'evaluation', label: 'Evaluation', description: currentStageIndex.value >= 2 ? prettyStatus(session.value?.tender_status) : 'Starts after bid opening' },
  { key: 'outcome', label: 'Outcome', description: currentStageIndex.value >= 3 ? prettyStatus(session.value?.bid_status === 'FAILED' ? 'NOT_AWARDED' : session.value?.tender_status) : 'Published after evaluation' },
].map((stage, index) => ({ ...stage, state: index < currentStageIndex.value ? 'complete' : index === currentStageIndex.value ? 'current' : 'upcoming' })));
const currentStage = computed(() => {
  if (currentStageIndex.value === 3) {
    const awarded = session.value?.bid_status === 'AWARDED';
    return {
      icon: awarded ? 'lucide:trophy' : 'lucide:megaphone',
      title: awarded ? 'Your response was successful' : 'The procurement outcome is available',
      message: awarded ? 'Continue to the award and contracting area for the next required actions.' : 'Review the published award notice for the final result and any applicable standstill period.',
    };
  }
  if (currentStageIndex.value === 2) return { icon: 'lucide:clipboard-check', title: 'Evaluation in progress', message: 'The procuring entity is evaluating opened responses. Your sealed response remains read-only while this stage is underway.' };
  if (session.value?.opening_state === 'AWAITING_OPENING') return { icon: 'lucide:radio-tower', title: 'Waiting for controlled opening', message: 'The opening time has arrived. This page updates automatically when the official opening record is published.' };
  return { icon: 'lucide:shield-check', title: 'Response received securely', message: 'Your signed and sealed response is awaiting the scheduled bid opening. You can use the receipt details below to verify the submission.' };
});
const financialEnvelopeLabel = computed(() => { if (session.value?.proposal_mode !== 'TWO') return 'Not applicable for QBS'; return session.value?.financial_opened ? 'Opened' : 'Sealed pending technical evaluation'; });
const financialEnvelopeClass = computed(() => session.value?.proposal_mode === 'TWO' && !session.value?.financial_opened ? 'border-yellow-300 bg-yellow-100 text-yellow-700' : 'border-green-300 bg-green-100 text-green-700');
const consultancyOpeningNotice = computed(() => session.value?.proposal_mode === 'TWO' ? 'Only technical proposals are disclosed at this stage. Financial proposals remain sealed until the technical evaluation and consensus are complete.' : 'Only technical proposals are required for QBS. Cost is established during negotiations with the highest-ranked consultant.');
async function loadSession(silent = false) { if (refreshing.value) return; if (!silent) loading.value = true; refreshing.value = true; errorMessage.value = ''; const result = await openingApi.show(tenderUuid); refreshing.value = false; if (!silent) loading.value = false; if (!result.ok) { errorMessage.value = result.error; return; } session.value = result.data; }
function stateLabel(state) { return ({ SCHEDULED: 'Scheduled', AWAITING_OPENING: 'Live · awaiting opening', OPENED: 'Opened' })[state] ?? state; }
function stateClass(state) { return ({ SCHEDULED: 'border-blue-300 bg-blue-100 text-blue-700', AWAITING_OPENING: 'border-green-300 bg-green-100 text-green-700', OPENED: 'border-teal-300 bg-teal-100 text-teal-700' })[state] ?? 'border-base-300 bg-base-200 text-base-content/60'; }
function bidStatusLabel(status) { return String(status ?? '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
function prettyStatus(status) { return bidStatusLabel(status) || 'Pending'; }
function formatDateTime(value) { return value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not scheduled'; }
function formatMoney(value) { return value === null || value === undefined || value === '' ? '—' : new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)); }
function formatQuantity(value) { return value === null || value === undefined || value === '' ? '—' : new Intl.NumberFormat('en-ZW', { maximumFractionDigits: 2 }).format(Number(value)); }
function countdown(value) { const difference = new Date(value).getTime() - now.value; if (!Number.isFinite(difference) || difference <= 0) return 'Opening time reached'; const minutes = Math.floor(difference / 60000); const days = Math.floor(minutes / 1440); const hours = Math.floor((minutes % 1440) / 60); const remaining = minutes % 60; return days ? `Starts in ${days}d ${hours}h ${remaining}m` : `Starts in ${hours}h ${remaining}m`; }
function downloadReport() { if (!session.value?.report) return; const blob = new Blob([JSON.stringify({ tender: { reference: session.value.reference, title: session.value.title }, report_hash: session.value.report_hash, ...session.value.report }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `bid-opening-${session.value.reference || session.value.tender_uuid}.json`; link.click(); URL.revokeObjectURL(url); }
onMounted(async () => { await loadSession(); pollTimer = window.setInterval(() => { if (!document.hidden && polling.value) loadSession(true); }, 5000); clockTimer = window.setInterval(() => { now.value = Date.now(); }, 30000); });
onBeforeUnmount(() => { window.clearInterval(pollTimer); window.clearInterval(clockTimer); });
</script>
