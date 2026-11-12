<template>
  <div class="space-y-6 pb-10">
    <header class="flex flex-col gap-5 border-b border-base-300 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <div class="mb-2 flex items-center gap-2 text-sm font-medium text-base-content/55">
          <Icon name="lucide:briefcase-business" class="h-4 w-4" />
          Supplier response workspace
        </div>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">My bids</h1>
        <p class="mt-2 max-w-xl text-sm leading-6 text-base-content/65 sm:text-base">
          Prepare responses, watch closing dates and keep track of every signed and sealed submission.
        </p>
      </div>
      <NuxtLink to="/supplieropportunities" class="btn btn-primary w-full sm:w-auto">
        <Icon name="lucide:search" class="h-4 w-4" />
        Find opportunities
      </NuxtLink>
    </header>

    <div v-if="loading" class="flex min-h-80 flex-col items-center justify-center gap-3">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p class="text-sm text-base-content/55">Loading your response workspace…</p>
    </div>

    <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
      <Icon name="lucide:circle-alert" />
      <div class="min-w-0">
        <p class="font-semibold">My bids could not be loaded</p>
        <p class="text-sm">{{ error }}</p>
      </div>
      <button type="button" class="btn btn-sm" @click="loadBids">Try again</button>
    </div>

    <div v-else-if="!bids.length" class="card card-border overflow-hidden bg-base-100">
      <div class="card-body items-center px-6 py-16 text-center">
        <div class="mb-2 grid h-14 w-14 place-items-center rounded-box bg-base-200 text-base-content/35">
          <Icon name="lucide:folder-open" class="h-7 w-7" />
        </div>
        <h2 class="card-title text-xl">Your bid workspace is empty</h2>
        <p class="max-w-md text-sm leading-6 text-base-content/60">
          Add a tender or expression of interest to start preparing a response and tracking its submission.
        </p>
        <div class="card-actions mt-3">
          <NuxtLink to="/supplieropportunities" class="btn btn-primary">Browse opportunities</NuxtLink>
        </div>
      </div>
    </div>

    <template v-else>
      <section aria-label="Bid summary" class="grid overflow-hidden rounded-box border border-base-300 bg-base-100 sm:grid-cols-3">
        <div class="flex items-center gap-4 border-b border-base-300 p-4 sm:border-r sm:border-b-0 sm:p-5">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-box bg-warning/12 text-warning">
            <Icon name="lucide:file-pen-line" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums">{{ summary.drafts }}</p>
            <p class="text-sm text-base-content/55">Responses in progress</p>
          </div>
        </div>
        <div class="flex items-center gap-4 border-b border-base-300 p-4 sm:border-r sm:border-b-0 sm:p-5">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-box bg-success/12 text-success">
            <Icon name="lucide:shield-check" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums">{{ summary.submitted }}</p>
            <p class="text-sm text-base-content/55">Signed and sealed</p>
          </div>
        </div>
        <div class="flex items-center gap-4 p-4 sm:p-5">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-box bg-error/12 text-error">
            <Icon name="lucide:circle-alert" class="h-5 w-5" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums">{{ summary.attention }}</p>
            <p class="text-sm text-base-content/55">Need attention</p>
          </div>
        </div>
      </section>

      <section class="space-y-3" aria-labelledby="responses-heading">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="responses-heading" class="text-lg font-bold">Response workspace</h2>
            <p class="text-sm text-base-content/55">{{ filteredBids.length }} of {{ bids.length }} responses shown</p>
          </div>
          <div class="grid gap-2 sm:grid-cols-[minmax(15rem,1fr)_auto_auto]">
            <label class="input input-sm w-full sm:min-w-64">
              <Icon name="lucide:search" class="h-4 w-4 text-base-content/45" />
              <input v-model.trim="searchTerm" type="search" placeholder="Search title, reference or entity" aria-label="Search bids">
            </label>
            <select v-model="typeFilter" class="select select-sm" aria-label="Filter by response type">
              <option value="ALL">All response types</option>
              <option value="TENDER">Tenders</option>
              <option value="EOI">Expressions of interest</option>
            </select>
            <select v-model="statusFilter" class="select select-sm" aria-label="Filter by response status">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">In progress</option>
              <option value="SUBMITTED">Signed and sealed</option>
              <option value="ATTENTION">Needs attention</option>
            </select>
          </div>
        </div>

        <div v-if="!filteredBids.length" class="card card-border bg-base-100">
          <div class="card-body items-center py-12 text-center">
            <Icon name="lucide:search-x" class="h-8 w-8 text-base-content/30" />
            <h3 class="card-title text-base">No responses match these filters</h3>
            <p class="text-sm text-base-content/55">Try a different search or clear the selected filters.</p>
            <button type="button" class="btn btn-sm mt-2" @click="clearFilters">Clear filters</button>
          </div>
        </div>

        <div v-else class="overflow-hidden rounded-box border border-base-300 bg-base-100">
          <article
            v-for="bid in filteredBids"
            :key="bid.uuid"
            class="relative border-b border-base-300 p-4 last:border-b-0 sm:p-5"
          >
            <div class="absolute inset-y-0 left-0 w-1" :class="bid.response_type === 'EOI' ? 'bg-info' : 'bg-success'" />
            <div class="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(10rem,.65fr)_minmax(11rem,.75fr)_auto] xl:items-center">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-sm" :class="bid.response_type === 'EOI' ? 'badge-info badge-soft' : 'badge-success badge-soft'">
                    {{ bid.response_type === 'EOI' ? 'Expression of interest' : 'Tender' }}
                  </span>
                  <span class="text-xs font-medium text-base-content/50">{{ bid.reference || 'Reference pending' }}</span>
                </div>
                <h3 class="mt-2 text-base font-bold leading-6 sm:text-lg">{{ bid.title }}</h3>
                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
                  <span class="inline-flex items-center gap-1.5">
                    <Icon name="lucide:building-2" class="h-4 w-4" />
                    {{ bid.entity || 'Entity not provided' }}
                  </span>
                  <span class="inline-flex items-center gap-1.5">
                    <Icon name="lucide:workflow" class="h-4 w-4" />
                    {{ bid.method || 'Method not provided' }}
                  </span>
                </div>
              </div>

              <div>
                <p class="text-xs font-medium text-base-content/45">Closing date</p>
                <p class="mt-1 font-semibold tabular-nums">{{ formatDateTime(bid.closing_at) }}</p>
                <p class="mt-1 text-xs font-medium" :class="closingTone(bid.closing_at)">{{ closingContext(bid.closing_at) }}</p>
              </div>

              <div>
                <p class="text-xs font-medium text-base-content/45">Response status</p>
                <span class="badge badge-sm mt-1.5" :class="statusMeta(bid).classes">
                  <Icon :name="statusMeta(bid).icon" class="h-3.5 w-3.5" />
                  {{ statusMeta(bid).label }}
                </span>
                <p class="mt-2 text-xs leading-5 text-base-content/55">{{ statusMeta(bid).description }}</p>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row xl:w-48 xl:flex-col">
                <NuxtLink
                  v-if="bid.status === 'DRAFT' && bid.can_edit"
                  :to="responseLink(bid)"
                  class="btn btn-neutral btn-sm flex-1"
                >
                  <Icon name="lucide:file-pen-line" /> Continue response
                </NuxtLink>
                <template v-else-if="bid.status !== 'DRAFT'">
                  <NuxtLink :to="submittedResponseLink(bid)" class="btn btn-neutral btn-sm flex-1">
                    <Icon name="lucide:milestone" />
                    Track stages
                  </NuxtLink>
                  <button
                    v-if="bid.can_recall"
                    type="button"
                    class="btn btn-ghost btn-sm flex-1 text-warning"
                    @click="openRecall(bid)"
                  >
                    <Icon name="lucide:undo-2" /> Recall response
                  </button>
                </template>
              </div>
            </div>

            <div
              v-if="latestVersion(bid)?.receipt_hash"
              class="mt-4 flex flex-col gap-2 border-t border-base-200 pt-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 items-center gap-2 text-xs text-base-content/55">
                <Icon name="lucide:fingerprint" class="h-4 w-4 shrink-0" />
                <span>Submission receipt</span>
                <code class="truncate rounded bg-base-200 px-2 py-1 font-mono text-base-content/70">{{ compactReceipt(latestVersion(bid).receipt_hash) }}</code>
                <span v-if="latestVersion(bid)?.recalled_at" class="badge badge-warning badge-soft badge-xs">Recalled</span>
              </div>
              <button type="button" class="btn btn-ghost btn-xs self-start sm:self-auto" @click="copyReceipt(latestVersion(bid).receipt_hash)">
                <Icon name="lucide:copy" class="h-3.5 w-3.5" /> Copy receipt
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>

    <dialog id="recall_bid_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 shrink-0 place-items-center rounded-box bg-warning/15 text-warning">
            <Icon name="lucide:triangle-alert" class="h-6 w-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold">Recall submitted response?</h3>
            <p class="mt-1 text-sm text-base-content/60">{{ selectedBid?.reference }} · {{ selectedBid?.title }}</p>
          </div>
        </div>

        <div role="alert" class="alert alert-warning alert-soft mt-5 items-start">
          <Icon name="lucide:clock-alert" class="mt-1" />
          <div>
            <p class="font-bold">Your submitted response will be withdrawn immediately.</p>
            <p class="mt-1 text-sm">If the opportunity closes before you seal and resubmit, your response will not be considered.</p>
            <p class="mt-2 text-xs">Closing date: <strong>{{ formatDateTime(selectedBid?.closing_at) }}</strong></p>
          </div>
        </div>

        <div v-if="recallError" role="alert" class="alert alert-error alert-soft mt-4">
          <Icon name="lucide:circle-alert" />
          <span>{{ recallError }}</span>
        </div>

        <div class="modal-action flex-col-reverse sm:flex-row">
          <button class="btn w-full sm:w-auto" :disabled="recalling" @click="closeRecall">Keep submitted response</button>
          <button class="btn btn-warning w-full sm:w-auto" :disabled="recalling" @click="confirmRecall">
            <span v-if="recalling" class="loading loading-spinner loading-sm" />
            <Icon v-else name="lucide:undo-2" />
            Recall and edit response
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :disabled="recalling">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'My Bids' });

const { listBids, recallBid } = useBidResponse();
const eoiApi = useConsultancyEoi();
const toast = useToast();
const bids = ref([]);
const loading = ref(true);
const error = ref('');
const selectedBid = ref(null);
const recalling = ref(false);
const recallError = ref('');
const searchTerm = ref('');
const typeFilter = ref('ALL');
const statusFilter = ref('ALL');

const summary = computed(() => ({
  drafts: bids.value.filter(bid => bid.status === 'DRAFT' && bid.can_edit).length,
  submitted: bids.value.filter(bid => bid.status !== 'DRAFT').length,
  attention: bids.value.filter(bid => bid.status === 'DRAFT' && !bid.can_edit).length,
}));

const filteredBids = computed(() => {
  const query = searchTerm.value.toLowerCase();

  return bids.value.filter((bid) => {
    const matchesSearch = !query || [bid.title, bid.reference, bid.entity, bid.method]
      .some(value => String(value ?? '').toLowerCase().includes(query));
    const matchesType = typeFilter.value === 'ALL' || bid.response_type === typeFilter.value;
    const matchesStatus = statusFilter.value === 'ALL'
      || (statusFilter.value === 'DRAFT' && bid.status === 'DRAFT' && bid.can_edit)
      || (statusFilter.value === 'SUBMITTED' && bid.status !== 'DRAFT')
      || (statusFilter.value === 'ATTENTION' && bid.status === 'DRAFT' && !bid.can_edit);

    return matchesSearch && matchesType && matchesStatus;
  });
});

async function loadBids() {
  loading.value = true;
  const result = await listBids();
  bids.value = result.data ?? [];
  error.value = result.ok ? '' : result.error;
  loading.value = false;
}

onMounted(loadBids);

function latestVersion(bid) {
  return bid.versions?.at(-1) ?? null;
}

function statusMeta(bid) {
  if (bid.status === 'DRAFT' && !bid.can_edit) {
    return { label: 'Closed incomplete', description: 'The response was not submitted before closing.', icon: 'lucide:lock-keyhole', classes: 'badge-error badge-soft' };
  }
  if (bid.status === 'DRAFT') {
    return { label: 'In progress', description: 'Continue preparing this response before closing.', icon: 'lucide:file-pen-line', classes: 'badge-warning badge-soft' };
  }
  return { label: label(bid.status), description: 'Your signed response is sealed and awaiting the next stage.', icon: 'lucide:shield-check', classes: 'badge-success badge-soft' };
}

function closingContext(value) {
  if (!value) return 'Closing date unavailable';
  const difference = new Date(value).getTime() - Date.now();
  if (difference <= 0) return 'Closed';
  const days = Math.ceil(difference / 86_400_000);
  if (days === 1) return 'Closes within 24 hours';
  if (days <= 7) return `Closes in ${days} days`;
  return `${days} days remaining`;
}

function closingTone(value) {
  if (!value || new Date(value).getTime() <= Date.now()) return 'text-error';
  return new Date(value).getTime() - Date.now() <= 7 * 86_400_000 ? 'text-warning' : 'text-base-content/50';
}

function compactReceipt(value) {
  if (!value || value.length <= 28) return value || '—';
  return `${value.slice(0, 16)}…${value.slice(-10)}`;
}

async function copyReceipt(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success({ title: 'Receipt copied', message: 'The submission receipt is ready to paste.', position: 'topRight', layout: 2 });
  } catch {
    toast.error({ title: 'Could not copy receipt', message: 'Select and copy the receipt manually.', position: 'topRight', layout: 2 });
  }
}

function clearFilters() {
  searchTerm.value = '';
  typeFilter.value = 'ALL';
  statusFilter.value = 'ALL';
}

function openRecall(bid) {
  selectedBid.value = bid;
  recallError.value = '';
  document.getElementById('recall_bid_modal').showModal();
}

function closeRecall() {
  if (recalling.value) return;
  document.getElementById('recall_bid_modal').close();
  selectedBid.value = null;
  recallError.value = '';
}

async function confirmRecall() {
  if (!selectedBid.value || recalling.value) return;
  recalling.value = true;
  recallError.value = '';
  const bid = selectedBid.value;
  const result = bid.response_type === 'EOI' ? await eoiApi.recall(bid.eoi_uuid) : await recallBid(bid.uuid);
  recalling.value = false;

  if (!result.ok) {
    recallError.value = result.error;
    toast.error({ title: 'Could not recall response', message: result.error, position: 'topRight', layout: 2 });
    return;
  }

  document.getElementById('recall_bid_modal').close();
  toast.success({ title: 'Response recalled', message: 'Seal and submit the response again before the opportunity closes.', position: 'topRight', layout: 2 });
  await navigateTo(responseLink(bid));
}

const responseLink = bid => bid.response_type === 'EOI' ? `/expressions-of-interest/${bid.eoi_uuid}` : `/bids/${bid.tender_uuid}`;
const submittedResponseLink = bid => `/supplierbidopening/${bid.tender_uuid}`;

const label = value => value
  ?.replaceAll('_', ' ')
  .toLowerCase()
  .replace(/\b\w/g, character => character.toUpperCase()) ?? '—';

const formatDateTime = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';
</script>
