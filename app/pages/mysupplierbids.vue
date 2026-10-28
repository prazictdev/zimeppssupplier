<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold">My Bids</h1>
      <p class="text-sm text-base-content/60">Start or continue tender and EOI responses and track signed, sealed submissions.</p>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>
    <div v-else-if="error" role="alert" class="alert alert-error text-black">
      <Icon name="lucide:circle-alert" />
      <span>{{ error }}</span>
    </div>
    <div v-else class="overflow-x-auto rounded-xl border border-base-200 bg-base-100">
      <table class="table">
        <thead>
          <tr>
            <th>Opportunity</th>
            <th>Entity / method</th>
            <th>Closing</th>
            <th>Status</th>
            <th>Latest receipt</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="bid in bids" :key="bid.uuid">
            <td>
              <p class="font-semibold">{{ bid.title }}</p>
              <p class="text-xs text-base-content/50">{{ bid.reference }} <span class="badge badge-ghost badge-xs ml-1">{{ bid.response_type === 'EOI' ? 'EOI' : 'Tender' }}</span></p>
            </td>
            <td>
              <p class="text-sm">{{ bid.entity || '—' }}</p>
              <p class="text-xs text-base-content/50">{{ bid.method || '—' }}</p>
            </td>
            <td class="text-sm">{{ formatDateTime(bid.closing_at) }}</td>
            <td>
              <span class="badge badge-sm" :class="bid.status === 'DRAFT' ? 'badge-warning' : 'badge-success'">
                {{ label(bid.status) }}
              </span>
            </td>
            <td class="max-w-xs text-xs">
              <p class="break-all font-mono">{{ latestVersion(bid)?.receipt_hash ?? '—' }}</p>
              <span v-if="latestVersion(bid)?.recalled_at" class="badge badge-warning badge-xs mt-1">Recalled</span>
            </td>
            <td class="text-right">
              <NuxtLink
                v-if="bid.status === 'DRAFT' && bid.can_edit"
                :to="responseLink(bid)"
                class="btn btn-success btn-sm"
              >
                <Icon name="lucide:file-pen-line" /> Start / continue response
              </NuxtLink>
              <div v-else-if="bid.status === 'DRAFT'" class="flex flex-col items-end gap-1">
                <span class="badge badge-error badge-sm"><Icon name="lucide:lock-keyhole" /> Closed</span>
                <span class="max-w-48 text-right text-xs text-base-content/55">Draft locked — it was not submitted before closing.</span>
              </div>
              <div v-else class="flex justify-end gap-2">
                <NuxtLink :to="submittedResponseLink(bid)" class="btn btn-primary btn-sm">
                  <Icon :name="bid.response_type === 'EOI' ? 'lucide:file-search' : 'lucide:milestone'" />
                  {{ bid.response_type === 'EOI' ? 'Review response' : 'Track stages' }}
                </NuxtLink>
                <button
                  v-if="bid.can_recall"
                  type="button"
                  class="btn btn-warning btn-sm"
                  @click="openRecall(bid)"
                >
                  <Icon name="lucide:undo-2" /> Recall response
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!bids.length">
            <td colspan="6" class="py-16 text-center text-base-content/50">
              No tenders or EOIs have been added.
              <NuxtLink to="/supplieropportunities" class="link link-success">Browse opportunities</NuxtLink>.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog id="recall_bid_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-start gap-3">
          <div class="rounded-xl bg-warning/15 p-3 text-warning">
            <Icon name="lucide:triangle-alert" class="h-6 w-6" />
          </div>
          <div>
            <h3 class="text-lg font-bold">Recall submitted response?</h3>
            <p class="mt-1 text-sm text-base-content/60">
              {{ selectedBid?.reference }} · {{ selectedBid?.title }}
            </p>
          </div>
        </div>

        <div role="alert" class="alert alert-warning mt-5 items-start text-black">
          <Icon name="lucide:clock-alert" class="mt-1" />
          <div>
            <p class="font-bold">Your submitted response will be withdrawn immediately.</p>
            <p class="mt-1 text-sm">
              If the tender closes before you seal and resubmit the response, your response will not be considered.
            </p>
            <p class="mt-2 text-xs">
              Tender closing: <strong>{{ formatDateTime(selectedBid?.closing_at) }}</strong>
            </p>
          </div>
        </div>

        <div v-if="recallError" role="alert" class="alert alert-error mt-4 text-black">
          <Icon name="lucide:circle-alert" />
          <span>{{ recallError }}</span>
        </div>

        <div class="modal-action">
          <button class="btn" :disabled="recalling" @click="closeRecall">Keep submitted response</button>
          <button class="btn btn-warning" :disabled="recalling" @click="confirmRecall">
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
    toast.error({
      title: 'Could not recall response',
      message: result.error,
      position: 'topRight',
      layout: 2,
    });
    return;
  }

  document.getElementById('recall_bid_modal').close();
  toast.success({
    title: 'Response recalled',
    message: 'Seal and submit the response again before the tender closes.',
    position: 'topRight',
    layout: 2,
  });
  await navigateTo(responseLink(bid));
}

const responseLink = bid => bid.response_type === 'EOI' ? `/expressions-of-interest/${bid.eoi_uuid}` : `/bids/${bid.tender_uuid}`;
const submittedResponseLink = bid => bid.response_type === 'EOI'
  ? `/expressions-of-interest/${bid.eoi_uuid}`
  : `/supplierbidopening/${bid.tender_uuid}`;

const label = (value) => value
  ?.replaceAll('_', ' ')
  .toLowerCase()
  .replace(/\b\w/g, character => character.toUpperCase()) ?? '—';

const formatDateTime = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';
</script>
