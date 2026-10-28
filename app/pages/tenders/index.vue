<template>
  <div class="min-h-screen bg-slate-50 text-slate-900" data-page="tender-catalogue">
    <section class="border-b border-emerald-950/10 bg-[#123c2f] text-white">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Public procurement opportunities</p>
        <div class="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Tender catalogue</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Search current and historical tenders published by registered procurement entities.
            </p>
          </div>
          <NuxtLink to="/" class="btn border-white/20 bg-white/10 text-white hover:bg-white/20">
            <Icon name="lucide:arrow-left" /> Supplier home
          </NuxtLink>
        </div>
      </div>
    </section>

    <main class="app-shell space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <nav class="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-4" aria-label="Tender status">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          class="flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition"
          :class="activeStatus === tab.value ? tab.activeClass : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
          :aria-current="activeStatus === tab.value ? 'page' : undefined"
          @click="selectStatus(tab.value)"
        >
          <Icon :name="tab.icon" class="h-4 w-4" /> {{ tab.label }}
        </button>
      </nav>

      <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="applyFilters">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label class="form-control xl:col-span-2">
            <span class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Search tenders</span>
            <span class="input input-bordered flex w-full items-center gap-2 bg-white">
              <Icon name="lucide:search" class="h-4 w-4 text-slate-400" />
              <input v-model="filters.search" type="search" class="grow" placeholder="Title, tender number, description or entity">
            </span>
          </label>

          <label class="form-control">
            <span class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Procurement entity</span>
            <select v-model="filters.company_id" class="select select-bordered w-full bg-white">
              <option value="">All entities</option>
              <option v-for="entity in options.procurement_entities" :key="entity.id" :value="String(entity.id)">{{ entity.name }}</option>
            </select>
          </label>

          <label class="form-control">
            <span class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Procurement method</span>
            <select v-model="filters.procurementmethod_id" class="select select-bordered w-full bg-white">
              <option value="">All methods</option>
              <option v-for="method in options.procurement_methods" :key="method.id" :value="String(method.id)">{{ optionLabel(method) }}</option>
            </select>
          </label>

          <label class="form-control">
            <span class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Supplier category</span>
            <select v-model="filters.suppliercategory_id" class="select select-bordered w-full bg-white">
              <option value="">All supplier categories</option>
              <option v-for="category in options.supplier_categories" :key="category.id" :value="String(category.id)">{{ optionLabel(category) }}</option>
            </select>
          </label>

          <label class="form-control">
            <span class="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Procurement group</span>
            <select v-model="filters.procurementgroup_id" class="select select-bordered w-full bg-white">
              <option value="">All procurement groups</option>
              <option v-for="group in options.procurement_groups" :key="group.id" :value="String(group.id)">{{ optionLabel(group) }}</option>
            </select>
          </label>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button class="btn btn-success" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="lucide:sliders-horizontal" /> Apply filters
          </button>
          <button type="button" class="btn btn-ghost" :disabled="!hasFilters" @click="clearFilters">Clear filters</button>
        </div>
      </form>

      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-black">{{ activeTab.label }} tenders</h2>
          <p class="mt-1 text-sm text-slate-500">{{ resultSummary }}</p>
        </div>
        <span v-if="resultTotal" class="mt-2 w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 sm:mt-0">
          {{ resultTotal.toLocaleString() }} results
        </span>
      </div>

      <div v-if="loading" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Loading tenders">
        <div class="overflow-x-auto">
          <table class="table table-sm min-w-[960px]">
            <thead class="bg-slate-100 text-xs text-slate-600">
              <tr><th>Status / reference</th><th>Tender</th><th>Procurement entity</th><th>Method / group</th><th>Closing date</th><th><span class="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              <tr v-for="index in 6" :key="index">
                <td><div class="skeleton h-5 w-20" /><div class="skeleton mt-2 h-3 w-28" /></td>
                <td><div class="skeleton h-4 w-64" /><div class="skeleton mt-2 h-3 w-48" /></td>
                <td><div class="skeleton h-4 w-40" /></td>
                <td><div class="skeleton h-4 w-36" /><div class="skeleton mt-2 h-3 w-24" /></td>
                <td><div class="skeleton h-4 w-28" /></td>
                <td><div class="skeleton ml-auto h-8 w-24" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="error" role="alert" class="alert alert-error">
        <Icon name="lucide:circle-alert" /><span>{{ error }}</span>
        <button type="button" class="btn btn-sm" @click="loadTenders">Try again</button>
      </div>

      <div v-else-if="!opportunities.length" class="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="lucide:file-search" class="h-7 w-7" /></span>
        <h3 class="mt-4 font-bold">No {{ activeTab.label.toLowerCase() }} tenders found</h3>
        <p class="mt-1 max-w-md text-sm text-slate-500">Try another status or broaden the selected search filters.</p>
        <button v-if="hasFilters" type="button" class="btn btn-ghost btn-sm mt-4" @click="clearFilters">Clear filters</button>
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="table table-sm min-w-[960px]">
            <thead class="bg-slate-100 text-xs text-slate-600">
              <tr>
                <th class="w-40">Status / reference</th>
                <th class="min-w-72">Tender</th>
                <th class="min-w-48">Procurement entity</th>
                <th class="min-w-48">Method / group</th>
                <th class="w-44">Closing date</th>
                <th class="w-32"><span class="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tender in opportunities" :key="`${tender.opportunity_type || 'TENDER'}-${tender.uuid}`" class="group border-slate-100 align-top transition-colors hover:bg-emerald-50/40">
                <td class="py-4">
                  <div class="flex flex-wrap gap-1.5">
                    <span class="badge badge-sm font-semibold" :class="statusBadge(tender.status_bucket)">{{ statusLabel(tender.status_bucket) }}</span>
                    <span v-if="isEoi(tender)" class="badge badge-warning badge-sm font-semibold">EOI</span>
                  </div>
                  <p class="mt-2 font-mono text-[11px] uppercase tracking-wide text-slate-500">{{ tender.reference || 'Reference pending' }}</p>
                </td>
                <td class="max-w-md whitespace-normal py-4">
                  <NuxtLink :to="opportunityLink(tender)" class="font-bold leading-5 text-slate-900 transition-colors group-hover:text-emerald-800">
                    {{ tender.title }}
                  </NuxtLink>
                  <p class="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{{ tender.description || 'No description supplied.' }}</p>
                  <p class="mt-2 text-[11px] text-slate-400">Supplier categories: {{ categoryLabel(tender) }}</p>
                </td>
                <td class="whitespace-normal py-4">
                  <span class="flex items-start gap-2 text-sm font-semibold text-slate-700">
                    <Icon name="lucide:landmark" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    {{ tender.entity || 'Not specified' }}
                  </span>
                </td>
                <td class="whitespace-normal py-4">
                  <p class="text-sm font-semibold text-slate-700">{{ tender.method || 'Not specified' }}</p>
                  <p class="mt-1 text-xs text-slate-500">{{ tender.category || 'Group not specified' }}</p>
                </td>
                <td class="py-4">
                  <p class="text-xs font-medium text-slate-500">{{ deadlineLabel(tender) }}</p>
                  <p class="mt-1 whitespace-nowrap text-sm font-semibold text-slate-700">{{ formatDateTime(tender.closing_at) }}</p>
                </td>
                <td class="py-4 text-right">
                  <NuxtLink v-if="tender.status_bucket === 'ACTIVE'" :to="opportunityLink(tender)" class="btn btn-outline btn-success btn-sm whitespace-nowrap">
                    {{ isEoi(tender) ? 'View EOI' : 'View tender' }} <Icon name="lucide:arrow-up-right" />
                  </NuxtLink>
                  <span v-else class="inline-block max-w-32 text-xs leading-5 text-slate-500">{{ historicalMessage(tender.status_bucket) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!loading && !error && pagination.last_page > 1" class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <button type="button" class="btn btn-sm" :disabled="pagination.current_page <= 1" @click="changePage(pagination.current_page - 1)"><Icon name="lucide:chevron-left" /> Previous</button>
        <span class="text-sm text-slate-500">Page <strong class="text-slate-800">{{ pagination.current_page }}</strong> of {{ pagination.last_page }}</span>
        <button type="button" class="btn btn-sm" :disabled="pagination.current_page >= pagination.last_page" @click="changePage(pagination.current_page + 1)">Next <Icon name="lucide:chevron-right" /></button>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({
  title: 'Tender Catalogue — Zimbabwe Electronic Procurement Platform',
  meta: [{ name: 'description', content: 'Search active, closed, awarded and cancelled public tenders.' }],
})

const route = useRoute()
const router = useRouter()
const { getTenderCatalogue, getTenderCatalogueFilters, getPublicConsultancyEois } = usePublicTenderHelper()

const statuses = ['ACTIVE', 'CLOSED', 'AWARDED', 'CANCELLED']
const statusTabs = [
  { value: 'ACTIVE', label: 'Active', icon: 'lucide:radio', activeClass: 'bg-emerald-700 text-white shadow-sm' },
  { value: 'CLOSED', label: 'Closed', icon: 'lucide:lock-keyhole', activeClass: 'bg-slate-700 text-white shadow-sm' },
  { value: 'AWARDED', label: 'Awarded', icon: 'lucide:trophy', activeClass: 'bg-amber-500 text-amber-950 shadow-sm' },
  { value: 'CANCELLED', label: 'Cancelled', icon: 'lucide:circle-x', activeClass: 'bg-red-700 text-white shadow-sm' },
]

const normalizeStatus = value => statuses.includes(String(value || '').toUpperCase()) ? String(value).toUpperCase() : 'ACTIVE'
const queryValue = value => Array.isArray(value) ? (value[0] || '') : (value || '')
const activeStatus = ref(normalizeStatus(route.query.status))
const filters = reactive({
  search: String(queryValue(route.query.search)),
  company_id: String(queryValue(route.query.company_id)),
  procurementmethod_id: String(queryValue(route.query.procurementmethod_id)),
  suppliercategory_id: String(queryValue(route.query.suppliercategory_id)),
  procurementgroup_id: String(queryValue(route.query.procurementgroup_id)),
})
const options = reactive({ procurement_entities: [], procurement_methods: [], supplier_categories: [], procurement_groups: [] })
const tenders = ref([])
const eois = ref([])
const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: null, to: null })
const loading = ref(true)
const error = ref('')

const activeTab = computed(() => statusTabs.find(tab => tab.value === activeStatus.value) || statusTabs[0])
const hasFilters = computed(() => Object.values(filters).some(Boolean))
const opportunities = computed(() => [...eois.value, ...tenders.value])
const resultTotal = computed(() => pagination.total + eois.value.length)
const resultSummary = computed(() => eois.value.length
  ? `Showing ${eois.value.length} ${eois.value.length === 1 ? 'expression' : 'expressions'} of interest and ${pagination.total} matching ${pagination.total === 1 ? 'tender' : 'tenders'}.`
  : pagination.total
  ? `Showing ${pagination.from ?? 1}–${pagination.to ?? tenders.value.length} of ${pagination.total} matching tenders.`
  : `Browse ${activeTab.value.label.toLowerCase()} public tenders.`)

onMounted(async () => {
  const optionResult = await getTenderCatalogueFilters()
  if (optionResult.ok) Object.assign(options, optionResult.data?.data ?? {})
})

watch(() => route.fullPath, () => {
  activeStatus.value = normalizeStatus(route.query.status)
  Object.assign(filters, {
    search: String(queryValue(route.query.search)),
    company_id: String(queryValue(route.query.company_id)),
    procurementmethod_id: String(queryValue(route.query.procurementmethod_id)),
    suppliercategory_id: String(queryValue(route.query.suppliercategory_id)),
    procurementgroup_id: String(queryValue(route.query.procurementgroup_id)),
  })
  loadTenders()
}, { immediate: true })

async function loadTenders() {
  loading.value = true
  error.value = ''
  const pageNumber = Number(queryValue(route.query.page)) || 1
  const params = {
    status: activeStatus.value,
    ...filters,
    page: pageNumber,
    per_page: 12,
  }
  const [result, eoiResult] = await Promise.all([
    getTenderCatalogue(params),
    pageNumber === 1 ? getPublicConsultancyEois(params) : Promise.resolve({ ok: true, data: { data: [] }, error: null }),
  ])
  eois.value = eoiResult.ok ? eoiResult.data?.data ?? [] : []
  if (!result.ok) {
    tenders.value = []
    if (!eois.value.length) error.value = result.error
    loading.value = false
    return
  }

  const page = result.data?.data ?? {}
  tenders.value = page.data ?? []
  Object.assign(pagination, {
    current_page: page.current_page ?? 1,
    last_page: page.last_page ?? 1,
    total: page.total ?? 0,
    from: page.from ?? null,
    to: page.to ?? null,
  })
  loading.value = false
}

function compactQuery(page = 1) {
  return Object.fromEntries(Object.entries({ status: activeStatus.value.toLowerCase(), ...filters, page: page > 1 ? page : '' }).filter(([, value]) => value !== ''))
}

const applyFilters = () => router.push({ path: '/tenders', query: compactQuery(1) })
const changePage = page => router.push({ path: '/tenders', query: compactQuery(page) })

function selectStatus(status) {
  activeStatus.value = status
  router.push({ path: '/tenders', query: compactQuery(1) })
}

function clearFilters() {
  Object.keys(filters).forEach(key => { filters[key] = '' })
  router.push({ path: '/tenders', query: { status: activeStatus.value.toLowerCase() } })
}

const optionLabel = option => option.code ? `${option.code} · ${option.name}` : option.name
const isEoi = opportunity => opportunity.opportunity_type === 'EXPRESSION_OF_INTEREST'
const opportunityLink = opportunity => opportunity.detail_path || `/tenders/${opportunity.uuid}`
const statusLabel = status => statusTabs.find(tab => tab.value === status)?.label || 'Closed'
const statusBadge = status => ({ ACTIVE: 'badge-success', CLOSED: 'badge-neutral', AWARDED: 'badge-warning', CANCELLED: 'badge-error text-white' }[status] || 'badge-neutral')
const categoryLabel = tender => tender.required_categories?.length
  ? tender.required_categories.map(category => category.code || category.name).join(', ')
  : 'Open to all registered categories'
const deadlineLabel = tender => tender.status_bucket === 'ACTIVE' ? 'Closes' : 'Closing date'
const historicalMessage = status => ({ CLOSED: 'Submissions are closed', AWARDED: 'Tender award completed', CANCELLED: 'Tender was cancelled' }[status] || 'Tender is no longer active')
const formatDateTime = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not specified'
</script>
