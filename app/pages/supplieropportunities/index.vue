<template>
  <div class="space-y-6 pb-10" data-page="supplier-opportunities">
    <header class="flex flex-col gap-5 border-b border-base-300 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <div class="mb-2 flex items-center gap-2 text-sm font-medium text-base-content/55">
          <Icon name="lucide:search-check" class="h-4 w-4" aria-hidden="true" />
          Public procurement notices
        </div>
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Supplier opportunities</h1>
        <p class="mt-2 max-w-xl text-sm leading-6 text-base-content/65 sm:text-base">
          Find open tenders and expressions of interest, check the requirements and start your response.
        </p>
      </div>
      <NuxtLink to="/mysupplierbids" class="btn w-full sm:w-auto">
        <Icon name="lucide:briefcase-business" class="h-4 w-4" aria-hidden="true" />
        View My Bids
      </NuxtLink>
    </header>

    <form class="hidden rounded-box border border-base-300 bg-base-100 md:block" @submit.prevent="applyFilters">
      <div class="flex items-center justify-between gap-4 border-b border-base-300 px-5 py-4">
        <div>
          <h2 class="font-bold">Find the right opportunity</h2>
          <p class="mt-0.5 text-xs text-base-content/55">Search the notice register or narrow it using procurement details.</p>
        </div>
        <button v-if="activeFilterCount" type="button" class="btn btn-ghost btn-sm" @click="clearFilters">
          <Icon name="lucide:x" class="h-4 w-4" aria-hidden="true" />
          Clear {{ activeFilterCount }} {{ activeFilterCount === 1 ? 'filter' : 'filters' }}
        </button>
      </div>

      <div class="grid gap-3 p-5 lg:grid-cols-2 xl:grid-cols-[minmax(16rem,2fr)_repeat(4,minmax(9rem,1fr))_auto] xl:items-end">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Search notices</legend>
          <label class="input w-full">
            <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" aria-hidden="true" />
            <input v-model.trim="filters.search" type="search" class="grow" placeholder="Title, description or reference">
          </label>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Method</legend>
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
          <legend class="fieldset-legend">Procuring entity</legend>
          <select v-model="filters.company_id" class="select w-full">
            <option value="">All entities</option>
            <option v-for="entity in options.procurement_entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
          </select>
        </fieldset>
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Closing on</legend>
          <input v-model="filters.closing_date" type="date" class="input w-full">
        </fieldset>
        <button class="btn btn-primary min-w-28" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:search" class="h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </div>
    </form>

    <div class="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3 md:hidden">
      <div class="min-w-0 pl-1">
        <p class="font-semibold">Open opportunities</p>
        <p class="truncate text-xs text-base-content/55">{{ mobileFilterSummary }}</p>
      </div>
      <button type="button" class="btn btn-primary shrink-0" @click="openFilterDialog">
        <Icon name="lucide:sliders-horizontal" class="h-4 w-4" aria-hidden="true" />
        Filters
        <span v-if="activeFilterCount" class="badge badge-sm border-0 bg-primary-content text-primary">{{ activeFilterCount }}</span>
      </button>
    </div>

    <dialog ref="filterDialog" id="supplier-opportunity-filters" class="modal modal-bottom md:hidden" aria-labelledby="supplier-opportunity-filter-title">
      <div class="modal-box max-h-[92dvh] overflow-hidden p-0">
        <form class="flex max-h-[92dvh] flex-col" @submit.prevent="applyMobileFilters">
          <div class="flex items-center gap-3 border-b border-base-300 px-5 py-4">
            <div class="min-w-0 flex-1">
              <h2 id="supplier-opportunity-filter-title" class="font-bold">Filter opportunities</h2>
              <p class="text-xs text-base-content/55">Choose which procurement notices to show.</p>
            </div>
            <button type="button" class="btn btn-ghost btn-circle btn-sm" aria-label="Close filters" @click="closeFilterDialog">
              <Icon name="lucide:x" class="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div class="flex-1 space-y-2 overflow-y-auto px-5 py-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Search notices</legend>
              <label class="input w-full">
                <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" aria-hidden="true" />
                <input v-model.trim="mobileFilters.search" type="search" class="grow" placeholder="Title, description or reference">
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
              <legend class="fieldset-legend">Procuring entity</legend>
              <select v-model="mobileFilters.company_id" class="select w-full">
                <option value="">All entities</option>
                <option v-for="entity in options.procurement_entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
              </select>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Closing on</legend>
              <input v-model="mobileFilters.closing_date" type="date" class="input w-full">
            </fieldset>
          </div>

          <div class="grid grid-cols-2 gap-3 border-t border-base-300 bg-base-100 px-5 py-4">
            <button type="button" class="btn" @click="resetMobileFilters">Reset</button>
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-xs" />
              Show results
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button aria-label="Close filters">close</button></form>
    </dialog>

    <div v-if="loading" class="flex min-h-80 flex-col items-center justify-center gap-3">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p class="text-sm text-base-content/55">Searching published opportunities…</p>
    </div>

    <div v-else-if="error" role="alert" class="alert alert-error alert-soft sm:alert-horizontal">
      <Icon name="lucide:cloud-alert" class="h-5 w-5" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold">Opportunities could not be loaded</p>
        <p class="mt-0.5 text-sm">{{ error }}</p>
      </div>
      <button type="button" class="btn btn-sm" @click="loadTenders(pagination.current_page)">
        <Icon name="lucide:refresh-cw" class="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>

    <section v-else class="space-y-3" aria-labelledby="available-opportunities-heading">
      <div class="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="available-opportunities-heading" class="text-lg font-bold">Available opportunities</h2>
          <p class="text-sm text-base-content/55">{{ resultSummary }}</p>
        </div>
        <span class="badge badge-outline">{{ opportunities.length }} shown</span>
      </div>

      <div v-if="opportunities.length" class="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <article
          v-for="tender in opportunities"
          :key="`${tender.opportunity_type || 'TENDER'}-${tender.uuid}`"
          class="relative border-b border-base-300 p-4 last:border-b-0 sm:p-5"
        >
          <div class="absolute inset-y-0 left-0 w-1" :class="isEoi(tender) ? 'bg-info' : 'bg-success'" />
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(11rem,.55fr)_minmax(11rem,.55fr)_auto] xl:items-center">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-success badge-soft badge-sm"><span class="status status-success" /> Open</span>
                <span class="badge badge-sm" :class="isEoi(tender) ? 'badge-info badge-soft' : 'badge-ghost'">
                  {{ isEoi(tender) ? 'Expression of interest' : 'Tender' }}
                </span>
                <span class="text-xs font-medium text-base-content/50">{{ tender.reference || 'Reference pending' }}</span>
              </div>
              <h3 class="mt-2 text-lg font-bold leading-6">{{ tender.title }}</h3>
              <p v-if="tender.description" class="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-base-content/60">{{ tender.description }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="lucide:building-2" class="h-4 w-4" aria-hidden="true" />
                  {{ tender.entity || 'Entity not provided' }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <Icon name="lucide:workflow" class="h-4 w-4" aria-hidden="true" />
                  {{ tender.method || 'Method not specified' }}
                </span>
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-base-content/45">Required categories</p>
              <p class="mt-1 text-sm font-semibold leading-5">{{ categoryLabel(tender) }}</p>
            </div>

            <div>
              <p class="text-xs font-medium text-base-content/45">Closing date</p>
              <p class="mt-1 text-sm font-semibold tabular-nums">{{ formatDateTime(tender.closing_at) }}</p>
              <p class="mt-1 text-xs font-medium" :class="closingTone(tender.closing_at)">{{ closingContext(tender.closing_at) }}</p>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row xl:w-44 xl:flex-col">
              <NuxtLink :to="opportunityLink(tender)" class="btn btn-sm flex-1">
                <Icon name="lucide:eye" class="h-4 w-4" aria-hidden="true" />
                {{ isEoi(tender) ? 'View EOI' : 'View details' }}
              </NuxtLink>
              <NuxtLink v-if="addedUuids.has(tender.uuid)" to="/mysupplierbids" class="btn btn-outline btn-success btn-sm flex-1">
                <Icon name="lucide:check" class="h-4 w-4" aria-hidden="true" /> In My Bids
              </NuxtLink>
              <button
                v-else
                type="button"
                class="btn btn-neutral btn-sm flex-1"
                :disabled="addingUuid === tender.uuid"
                @click="addOpportunity(tender)"
              >
                <span v-if="addingUuid === tender.uuid" class="loading loading-spinner loading-xs" />
                <Icon v-else name="lucide:folder-plus" class="h-4 w-4" aria-hidden="true" />
                Add to My Bids
              </button>
            </div>
          </div>

          <div
            v-if="rowErrors[tender.uuid]"
            role="alert"
            class="alert alert-soft mt-4 items-start sm:alert-horizontal"
            :class="rowErrorMeta(rowErrors[tender.uuid]).alertClass"
          >
            <Icon :name="rowErrorMeta(rowErrors[tender.uuid]).icon" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{{ rowErrorMeta(rowErrors[tender.uuid]).title }}</p>
              <p class="mt-1 text-sm leading-5">{{ rowErrorMeta(rowErrors[tender.uuid]).message }}</p>
            </div>
            <NuxtLink
              v-if="rowErrorMeta(rowErrors[tender.uuid]).actionTo"
              :to="rowErrorMeta(rowErrors[tender.uuid]).actionTo"
              class="btn btn-sm bg-base-100"
            >
              {{ rowErrorMeta(rowErrors[tender.uuid]).actionLabel }}
            </NuxtLink>
            <button
              v-else-if="rowErrorMeta(rowErrors[tender.uuid]).retryable"
              type="button"
              class="btn btn-sm bg-base-100"
              @click="addOpportunity(tender)"
            >
              Try again
            </button>
          </div>
        </article>
      </div>

      <div v-else class="card card-border bg-base-100">
        <div class="card-body items-center px-5 py-14 text-center">
          <div class="grid h-12 w-12 place-items-center rounded-box bg-base-200 text-base-content/35">
            <Icon name="lucide:search-x" class="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 class="card-title mt-2 text-base">No matching opportunities</h3>
          <p class="max-w-md text-sm leading-6 text-base-content/55">Change or clear the filters to see more published tenders and expressions of interest.</p>
          <button v-if="activeFilterCount" type="button" class="btn btn-sm mt-2" @click="clearFilters">Clear filters</button>
        </div>
      </div>

      <nav v-if="pagination.last_page > 1" class="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row" aria-label="Opportunity pages">
        <p class="text-sm text-base-content/60">Page {{ pagination.current_page }} of {{ pagination.last_page }}</p>
        <div class="join">
          <button class="btn join-item btn-sm" :disabled="pagination.current_page <= 1" @click="changePage(pagination.current_page - 1)">
            <Icon name="lucide:chevron-left" class="h-4 w-4" aria-hidden="true" /> Previous
          </button>
          <button class="btn join-item btn-sm" :disabled="pagination.current_page >= pagination.last_page" @click="changePage(pagination.current_page + 1)">
            Next <Icon name="lucide:chevron-right" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </section>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Supplier Opportunities' });

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
const resultSummary = computed(() => activeFilterCount.value
  ? `Published notices matching ${activeFilterCount.value} ${activeFilterCount.value === 1 ? 'filter' : 'filters'}.`
  : 'Published notices currently open for supplier responses.');

onMounted(async () => {
  const [filterResult, bidsResult] = await Promise.all([publicTenders.getSupplierOpportunityFilters(), bidApi.listBids()]);
  if (filterResult.ok) Object.assign(options, filterResult.data?.data ?? {});
  if (bidsResult.ok) {
    addedUuids.value = new Set((bidsResult.data ?? [])
      .map(bid => bid.response_type === 'EOI' ? bid.eoi_uuid : bid.tender_uuid)
      .filter(Boolean));
  }
  await loadTenders();
});

async function loadTenders(page = 1) {
  loading.value = true;
  error.value = '';
  Object.keys(rowErrors).forEach(key => delete rowErrors[key]);
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
const changePage = page => loadTenders(page);

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

async function addOpportunity(opportunity) {
  if (isEoi(opportunity)) await addEoi(opportunity);
  else await addTender(opportunity);
}

async function addTender(tender) {
  addingUuid.value = tender.uuid;
  delete rowErrors[tender.uuid];
  const result = await bidApi.addToMyBids(tender.uuid);
  if (result.ok) addedUuids.value = new Set([...addedUuids.value, tender.uuid]);
  else rowErrors[tender.uuid] = result.error;
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

function rowErrorMeta(rawMessage) {
  const message = String(rawMessage || 'The request could not be completed.');
  const normalised = message.toLowerCase();

  if (normalised.includes('supplier categor')) {
    return {
      title: 'Category registration required',
      message: 'Your company does not currently hold an approved registration in any category required for this opportunity.',
      icon: 'lucide:shield-alert',
      alertClass: 'alert-warning',
      actionTo: '/supplierregistrations',
      actionLabel: 'Review registrations',
      retryable: false,
    };
  }
  if (normalised.includes('submission licence') || normalised.includes('submission license')) {
    return {
      title: 'Submission licence required',
      message: 'Activate a supplier submission licence before adding this opportunity to your response workspace.',
      icon: 'lucide:key-round',
      alertClass: 'alert-warning',
      actionTo: '/submission-keys',
      actionLabel: 'Manage licence',
      retryable: false,
    };
  }
  if (normalised.includes('not invited') || normalised.includes('invited to participate')) {
    return {
      title: 'Participation is by invitation',
      message: 'This is a restricted opportunity and your company is not on the procuring entity’s invitation list.',
      icon: 'lucide:mail-warning',
      alertClass: 'alert-info',
      actionTo: '',
      actionLabel: '',
      retryable: false,
    };
  }
  if (normalised.includes('threshold') || normalised.includes('supplier group')) {
    return {
      title: 'Supplier group restriction',
      message: 'This opportunity falls outside the permitted financial threshold for your company’s supplier group.',
      icon: 'lucide:scale',
      alertClass: 'alert-warning',
      actionTo: '/organisationprofile',
      actionLabel: 'Review company profile',
      retryable: false,
    };
  }
  if (normalised.includes('not linked') || normalised.includes('company profile')) {
    return {
      title: 'Company profile required',
      message: 'Link or complete your supplier company profile before adding an opportunity to My Bids.',
      icon: 'lucide:building-2',
      alertClass: 'alert-warning',
      actionTo: '/organisationprofile',
      actionLabel: 'Open company profile',
      retryable: false,
    };
  }

  return {
    title: 'This opportunity could not be added',
    message,
    icon: 'lucide:circle-alert',
    alertClass: 'alert-error',
    actionTo: '',
    actionLabel: '',
    retryable: true,
  };
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

const categoryLabel = tender => tender.required_categories?.length
  ? tender.required_categories.map(category => category.code || category.name).join(', ')
  : 'Open to all registered categories';

const isEoi = opportunity => opportunity.opportunity_type === 'EXPRESSION_OF_INTEREST';
const opportunityLink = opportunity => isEoi(opportunity)
  ? (opportunity.detail_path || `/tenders/${opportunity.uuid}`)
  : `/supplieropportunities/${opportunity.uuid}`;

const formatDateTime = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';
</script>
