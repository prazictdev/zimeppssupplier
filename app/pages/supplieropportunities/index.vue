<template>
  <div class="space-y-5" data-page="supplier-opportunities">
    <div class="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-green-800 to-green-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex items-start gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
          <Icon name="lucide:search-check" class="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-bold">Supplier Opportunities</h1>
          <p class="mt-1 max-w-2xl text-sm leading-6 text-green-100">Find published tenders and expressions of interest available to suppliers.</p>
        </div>
      </div>
    </div>

    <form class="hidden overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-sm md:block" @submit.prevent="applyFilters">
      <div class="flex items-center justify-between border-b border-base-200 px-5 py-4">
        <div class="flex items-center gap-3">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 class="font-bold">Refine opportunities</h2>
            <p class="text-xs text-base-content/55">Narrow results by method, category, entity or closing date.</p>
          </div>
        </div>
        <span v-if="activeFilterCount" class="badge badge-primary badge-soft">{{ activeFilterCount }} active</span>
      </div>

      <div class="grid gap-x-4 gap-y-3 p-5 lg:grid-cols-2 xl:grid-cols-6">
        <fieldset class="fieldset lg:col-span-2 xl:col-span-2">
          <legend class="fieldset-legend">Search opportunities</legend>
          <label class="input w-full">
            <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" aria-hidden="true" />
            <input v-model.trim="filters.search" type="search" class="grow" placeholder="Reference, title or description">
          </label>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Procurement method</legend>
          <select v-model="filters.procurementmethod_id" class="select w-full">
            <option value="">All methods</option>
            <option v-for="method in options.procurement_methods" :key="method.id" :value="method.id">{{ method.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Supplier category</legend>
          <select v-model="filters.suppliercategory_id" class="select w-full">
            <option value="">All categories</option>
            <option v-for="category in options.supplier_categories" :key="category.id" :value="category.id">{{ category.code }} · {{ category.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Procurement entity</legend>
          <select v-model="filters.company_id" class="select w-full">
            <option value="">All entities</option>
            <option v-for="entity in options.procurement_entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Closing date</legend>
          <input v-model="filters.closing_date" type="date" class="input w-full">
        </fieldset>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-base-200 bg-base-200/40 px-5 py-3">
        <button v-if="activeFilterCount" type="button" class="btn btn-ghost btn-sm" @click="clearFilters">Clear filters</button>
        <button class="btn btn-primary btn-sm min-w-32" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:search" class="h-4 w-4" aria-hidden="true" />
          Show results
        </button>
      </div>
    </form>

    <div class="flex items-center justify-between gap-3 rounded-xl border border-base-200 bg-base-100 p-3 shadow-sm md:hidden">
      <div class="min-w-0 pl-1">
        <p class="font-semibold">Open opportunities</p>
        <p class="truncate text-xs text-base-content/55">{{ mobileFilterSummary }}</p>
      </div>
      <button type="button" class="btn btn-primary shrink-0 gap-2" @click="openFilterDialog">
        <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" />
        Filters
        <span v-if="activeFilterCount" class="badge badge-sm border-0 bg-primary-content text-primary">{{ activeFilterCount }}</span>
      </button>
    </div>

    <dialog ref="filterDialog" id="supplier-opportunity-filters" class="modal modal-bottom md:hidden" aria-labelledby="supplier-opportunity-filter-title">
      <div class="modal-box max-h-[92dvh] overflow-hidden p-0">
        <form class="flex max-h-[92dvh] flex-col" @submit.prevent="applyMobileFilters">
          <div class="flex items-center gap-3 border-b border-base-200 px-5 py-4">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon name="lucide:sliders-horizontal" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 id="supplier-opportunity-filter-title" class="font-bold">Filter opportunities</h2>
              <p class="text-xs text-base-content/55">Choose the opportunities you want to see.</p>
            </div>
            <button type="button" class="btn btn-ghost btn-circle btn-sm" aria-label="Close filters" @click="closeFilterDialog">
              <Icon name="lucide:x" class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div class="flex-1 space-y-2 overflow-y-auto px-5 py-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Search opportunities</legend>
              <label class="input w-full">
                <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" aria-hidden="true" />
                <input v-model.trim="mobileFilters.search" type="search" class="grow" placeholder="Reference, title or description">
              </label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Procurement method</legend>
              <select v-model="mobileFilters.procurementmethod_id" class="select w-full">
                <option value="">All methods</option>
                <option v-for="method in options.procurement_methods" :key="method.id" :value="method.id">{{ method.name }}</option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Supplier category</legend>
              <select v-model="mobileFilters.suppliercategory_id" class="select w-full">
                <option value="">All categories</option>
                <option v-for="category in options.supplier_categories" :key="category.id" :value="category.id">{{ category.code }} · {{ category.name }}</option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Procurement entity</legend>
              <select v-model="mobileFilters.company_id" class="select w-full">
                <option value="">All entities</option>
                <option v-for="entity in options.procurement_entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Closing date</legend>
              <input v-model="mobileFilters.closing_date" type="date" class="input w-full">
            </fieldset>
          </div>

          <div class="grid grid-cols-2 gap-3 border-t border-base-200 bg-base-100 px-5 py-4">
            <button type="button" class="btn btn-ghost" @click="resetMobileFilters">Reset</button>
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-xs" />
              Show results
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button aria-label="Close filters">close</button></form>
    </dialog>

    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary" /></div>
    <div v-else-if="error" role="alert" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>
    <div v-else class="space-y-3">
      <div class="flex items-center justify-between gap-3 px-1">
        <div>
          <h2 class="font-bold">Available opportunities</h2>
          <p class="text-xs text-base-content/55">Published opportunities matching your current filters.</p>
        </div>
        <span class="badge badge-outline">{{ opportunities.length }} shown</span>
      </div>

      <article v-for="tender in opportunities" :key="`${tender.opportunity_type || 'TENDER'}-${tender.uuid}`" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="badge badge-success badge-sm">Open</span>
              <span v-if="isEoi(tender)" class="badge badge-warning badge-sm">Expression of Interest</span>
              <span v-else class="badge badge-outline badge-sm">Tender</span>
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
          <div class="grid w-full shrink-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap lg:justify-end">
            <NuxtLink :to="opportunityLink(tender)" class="btn btn-ghost btn-sm w-full sm:w-auto">{{ isEoi(tender) ? 'View EOI details' : 'View details' }}</NuxtLink>
            <NuxtLink v-if="isEoi(tender) && addedUuids.has(tender.uuid)" to="/mysupplierbids" class="btn btn-outline btn-success btn-sm w-full sm:w-auto">
              <Icon name="lucide:check" /> In My Bids
            </NuxtLink>
            <button v-else-if="isEoi(tender)" class="btn btn-success btn-sm w-full sm:w-auto" :disabled="addingUuid === tender.uuid" @click="addEoi(tender)">
              <span v-if="addingUuid === tender.uuid" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:folder-plus" /> Add to My Bids
            </button>
            <NuxtLink v-else-if="addedUuids.has(tender.uuid)" to="/mysupplierbids" class="btn btn-outline btn-success btn-sm w-full sm:w-auto">
              <Icon name="lucide:check" /> In My Bids
            </NuxtLink>
            <button v-else class="btn btn-success btn-sm w-full sm:w-auto" :disabled="addingUuid === tender.uuid" @click="addTender(tender)">
              <span v-if="addingUuid === tender.uuid" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:folder-plus" />
              Add to My Bids
            </button>
          </div>
        </div>
      </article>

      <div v-if="!opportunities.length" class="flex flex-col items-center rounded-xl border border-dashed border-base-300 px-5 py-14 text-center">
        <span class="grid h-12 w-12 place-items-center rounded-full bg-base-200 text-base-content/40">
          <Icon name="lucide:search-x" class="h-6 w-6" aria-hidden="true" />
        </span>
        <p class="mt-3 font-semibold">No matching opportunities</p>
        <p class="mt-1 max-w-md text-sm leading-6 text-base-content/55">Try changing or clearing your filters to see more published tenders and expressions of interest.</p>
        <button v-if="activeFilterCount" type="button" class="btn btn-ghost btn-sm mt-3" @click="clearFilters">Clear filters</button>
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
useHead({ title: 'Tender Opportunities' });

const publicTenders = usePublicTenderHelper();
const bidApi = useBidResponse();
const eoiApi = useConsultancyEoi();
const filters = reactive({ search: '', procurementmethod_id: '', suppliercategory_id: '', company_id: '', closing_date: '' });
const mobileFilters = reactive({ search: '', procurementmethod_id: '', suppliercategory_id: '', company_id: '', closing_date: '' });
const options = reactive({ procurement_methods: [], supplier_categories: [], procurement_entities: [] });
const tenders = ref([]);
const eois = ref([]);
const pagination = reactive({ current_page: 1, last_page: 1 });
const addedUuids = ref(new Set());
const rowErrors = reactive({});
const loading = ref(true);
const addingUuid = ref('');
const error = ref('');
const opportunities = computed(() => [...eois.value, ...tenders.value]);
const filterDialog = ref(null);
const activeFilterCount = computed(() => Object.values(filters).filter(value => String(value ?? '').trim()).length);
const mobileFilterSummary = computed(() => activeFilterCount.value
  ? `${activeFilterCount.value} ${activeFilterCount.value === 1 ? 'filter' : 'filters'} applied`
  : 'Showing all published tenders and EOIs');

onMounted(async () => {
  const [filterResult, bidsResult] = await Promise.all([publicTenders.getSupplierOpportunityFilters(), bidApi.listBids()]);
  if (filterResult.ok) Object.assign(options, filterResult.data?.data ?? {});
  if (bidsResult.ok) addedUuids.value = new Set((bidsResult.data ?? []).map(bid => bid.response_type === 'EOI' ? bid.eoi_uuid : bid.tender_uuid).filter(Boolean));
  await loadTenders();
});

async function loadTenders(page = 1) {
  loading.value = true;
  error.value = '';
  const params = { ...filters, page, per_page: 25 };
  const [result, eoiResult] = await Promise.all([
    publicTenders.getSupplierOpportunities(params),
    page === 1
      ? publicTenders.getPublicConsultancyEois({ ...filters, status: 'ACTIVE' })
      : Promise.resolve({ ok: true, data: { data: [] } }),
  ]);
  const pageData = result.data?.data;
  tenders.value = pageData?.data ?? [];
  eois.value = eoiResult.ok ? eoiResult.data?.data ?? [] : [];
  pagination.current_page = pageData?.current_page ?? 1;
  pagination.last_page = pageData?.last_page ?? 1;
  if (!result.ok && !eois.value.length) error.value = result.error;
  loading.value = false;
}

const applyFilters = () => loadTenders(1);
const changePage = (page) => loadTenders(page);

function resetFilters(target = filters) {
  Object.assign(target, { search: '', procurementmethod_id: '', suppliercategory_id: '', company_id: '', closing_date: '' });
}

function clearFilters() {
  resetFilters();
  loadTenders(1);
}

function openFilterDialog() {
  Object.assign(mobileFilters, filters);
  filterDialog.value?.showModal();
}

function closeFilterDialog() {
  filterDialog.value?.close();
}

function resetMobileFilters() {
  resetFilters(mobileFilters);
}

function applyMobileFilters() {
  Object.assign(filters, mobileFilters);
  closeFilterDialog();
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

async function addEoi(eoi) {
  addingUuid.value = eoi.uuid;
  delete rowErrors[eoi.uuid];
  const result = await eoiApi.addToMyBids(eoi.uuid);
  if (result.ok) addedUuids.value = new Set([...addedUuids.value, eoi.uuid]);
  else rowErrors[eoi.uuid] = result.error;
  addingUuid.value = '';
}

const categoryLabel = (tender) => tender.required_categories?.length
  ? tender.required_categories.map((category) => category.code || category.name).join(', ')
  : 'Open to all registered categories';

const isEoi = opportunity => opportunity.opportunity_type === 'EXPRESSION_OF_INTEREST';
const opportunityLink = opportunity => isEoi(opportunity)
  ? (opportunity.detail_path || `/tenders/${opportunity.uuid}`)
  : `/supplieropportunities/${opportunity.uuid}`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';
</script>
