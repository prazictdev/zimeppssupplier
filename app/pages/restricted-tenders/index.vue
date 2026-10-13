<template>
  <div class="space-y-5" data-page="restricted-tenders">
    <div class="rounded-2xl bg-[#166534] p-6 text-white">
      <div class="flex items-start gap-3">
        <Icon name="lucide:mail-check" class="mt-1 h-7 w-7 shrink-0" />
        <div>
          <h1 class="text-2xl font-bold">Restricted tenders</h1>
          <p class="mt-1 text-sm text-green-100">View invitation-only procurements your supplier companies are allowed to respond to.</p>
        </div>
      </div>
    </div>

    <form class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm" @submit.prevent="applyFilters">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label class="form-control xl:col-span-2">
          <span class="label-text mb-1 text-xs font-semibold">Search</span>
          <input v-model="filters.search" class="input input-bordered w-full" placeholder="Reference, title or description">
        </label>
        <label class="form-control">
          <span class="label-text mb-1 text-xs font-semibold">Procurement method</span>
          <select v-model="filters.procurementmethod_id" class="select select-bordered w-full">
            <option value="">All methods</option>
            <option v-for="method in options.procurement_methods" :key="method.id" :value="method.id">{{ method.name }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text mb-1 text-xs font-semibold">Supplier category</span>
          <select v-model="filters.suppliercategory_id" class="select select-bordered w-full">
            <option value="">All categories</option>
            <option v-for="category in options.supplier_categories" :key="category.id" :value="category.id">
              {{ category.code }} · {{ category.name }}
            </option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text mb-1 text-xs font-semibold">Procurement entity</span>
          <select v-model="filters.company_id" class="select select-bordered w-full">
            <option value="">All entities</option>
            <option v-for="entity in options.procurement_entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text mb-1 text-xs font-semibold">Closing date</span>
          <input v-model="filters.closing_date" type="date" class="input input-bordered w-full">
        </label>
        <div class="flex items-end gap-2 md:col-span-2 xl:col-span-4">
          <button class="btn btn-success" :disabled="loading"><Icon name="lucide:sliders-horizontal" /> Apply filters</button>
          <button type="button" class="btn btn-ghost" @click="clearFilters">Clear</button>
        </div>
      </div>
    </form>

    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary" /></div>
    <div v-else-if="error" role="alert" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>
    <div v-else class="space-y-3">
      <article v-for="tender in tenders" :key="tender.uuid" class="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="badge badge-warning badge-sm gap-1"><Icon name="lucide:lock-keyhole" class="h-3 w-3" /> Invitation only</span>
              <span class="font-mono text-base-content/55">{{ tender.reference }}</span>
              <span class="badge badge-outline badge-sm">{{ tender.method || 'Method not specified' }}</span>
            </div>
            <h2 class="mt-2 text-lg font-bold">{{ tender.title }}</h2>
            <p class="mt-1 line-clamp-2 text-sm text-base-content/65">{{ tender.description }}</p>
            <div class="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
              <p><span class="text-base-content/50">Entity:</span> <span class="font-medium">{{ tender.entity }}</span></p>
              <p><span class="text-base-content/50">Closing:</span> <span class="font-medium">{{ formatDateTime(tender.closing_at) }}</span></p>
              <p class="sm:col-span-2 xl:col-span-1">
                <span class="text-base-content/50">Categories:</span>
                <span class="font-medium">{{ categoryLabel(tender) }}</span>
              </p>
            </div>
            <div v-if="rowErrors[tender.uuid]" role="alert" class="alert alert-error mt-3 py-2 text-sm">
              <Icon name="lucide:shield-x" />
              <span>{{ rowErrors[tender.uuid] }}</span>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            <NuxtLink :to="`/supplieropportunities/${tender.uuid}`" class="btn btn-ghost btn-sm">View details</NuxtLink>
            <NuxtLink v-if="addedUuids.has(tender.uuid)" to="/mysupplierbids" class="btn btn-outline btn-success btn-sm">
              <Icon name="lucide:check" /> In My Bids
            </NuxtLink>
            <button v-else class="btn btn-success btn-sm" :disabled="addingUuid === tender.uuid" @click="addTender(tender)">
              <span v-if="addingUuid === tender.uuid" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:folder-plus" />
              Add to My Bids
            </button>
          </div>
        </div>
      </article>

      <div v-if="!tenders.length" class="rounded-xl border border-dashed border-base-300 py-16 text-center text-base-content/50">
        You do not have any open restricted tender invitations matching the selected filters.
      </div>

      <div v-if="pagination.last_page > 1" class="flex items-center justify-between pt-2">
        <button class="btn btn-sm" :disabled="pagination.current_page <= 1" @click="changePage(pagination.current_page - 1)">Previous</button>
        <span class="text-sm text-base-content/60">Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
        <button class="btn btn-sm" :disabled="pagination.current_page >= pagination.last_page" @click="changePage(pagination.current_page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Restricted tenders' });

const publicTenders = usePublicTenderHelper();
const bidApi = useBidResponse();
const filters = reactive({ search: '', procurementmethod_id: '', suppliercategory_id: '', company_id: '', closing_date: '' });
const options = reactive({ procurement_methods: [], supplier_categories: [], procurement_entities: [] });
const tenders = ref([]);
const pagination = reactive({ current_page: 1, last_page: 1 });
const addedUuids = ref(new Set());
const rowErrors = reactive({});
const loading = ref(true);
const addingUuid = ref('');
const error = ref('');

onMounted(async () => {
  const [filterResult, bidsResult] = await Promise.all([publicTenders.getRestrictedTenderFilters(), bidApi.listBids()]);
  if (filterResult.ok) Object.assign(options, filterResult.data?.data ?? {});
  if (bidsResult.ok) addedUuids.value = new Set((bidsResult.data ?? []).map((bid) => bid.tender_uuid));
  await loadTenders();
});

async function loadTenders(page = 1) {
  loading.value = true;
  error.value = '';
  const result = await publicTenders.getRestrictedTenders({ ...filters, page, per_page: 25 });
  const pageData = result.data?.data;
  tenders.value = pageData?.data ?? [];
  pagination.current_page = pageData?.current_page ?? 1;
  pagination.last_page = pageData?.last_page ?? 1;
  if (!result.ok) error.value = result.error;
  loading.value = false;
}

const applyFilters = () => loadTenders(1);
const changePage = (page) => loadTenders(page);

function clearFilters() {
  Object.assign(filters, { search: '', procurementmethod_id: '', suppliercategory_id: '', company_id: '', closing_date: '' });
  loadTenders(1);
}

async function addTender(tender) {
  addingUuid.value = tender.uuid;
  delete rowErrors[tender.uuid];
  const result = await bidApi.addToMyBids(tender.uuid);
  if (result.ok) {
    addedUuids.value = new Set([...addedUuids.value, tender.uuid]);
  } else {
    rowErrors[tender.uuid] = result.error;
  }
  addingUuid.value = '';
}

const categoryLabel = (tender) => tender.required_categories?.length
  ? tender.required_categories.map((category) => category.code || category.name).join(', ')
  : 'Open to all registered categories';

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';
</script>
