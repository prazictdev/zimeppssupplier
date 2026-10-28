<template>
  <div class="min-h-screen bg-base-200" data-page="live-opportunities">
    <section class="border-b border-primary/20 bg-primary text-primary-content">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <div class="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-content/70">
              <span class="status status-success animate-pulse" /> Open for responses
            </div>
            <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Live opportunities</h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-primary-content/75 sm:text-base">
              Active public tenders that are currently accepting supplier responses. Filter by closing window to focus on the most urgent opportunities.
            </p>
          </div>
          <NuxtLink to="/tenders" class="btn border-primary-content/25 bg-primary-content/10 text-primary-content hover:bg-primary-content/20">
            View full tender catalogue
            <Icon name="lucide:library-big" class="h-4 w-4" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <main class="app-shell space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <form class="card card-border bg-base-100 shadow-sm" @submit.prevent="applyFilters">
        <div class="card-body gap-5 p-5 sm:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="card-title text-lg">Filter live tenders</h2>
              <p class="mt-1 text-sm text-base-content/55">All results remain active and open for responses.</p>
            </div>
            <span class="badge badge-success badge-soft hidden sm:inline-flex">Active only</span>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label class="grid gap-1.5 xl:col-span-2">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Search opportunities</span>
              <span class="input flex w-full items-center gap-2">
                <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" />
                <input v-model="filters.search" type="search" class="grow" placeholder="Title, reference or description">
              </span>
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Closing window</span>
              <select v-model="filters.closing_within_days" class="select w-full">
                <option value="">Any closing date</option>
                <option value="3">Closing within 3 days</option>
                <option value="7">Closing within 7 days</option>
                <option value="14">Closing within 14 days</option>
                <option value="30">Closing within 30 days</option>
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Procuring entity</span>
              <select v-model="filters.company_id" class="select w-full">
                <option value="">All entities</option>
                <option v-for="entity in options.procurement_entities" :key="entity.id" :value="String(entity.id)">{{ entity.name }}</option>
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Procurement method</span>
              <select v-model="filters.procurementmethod_id" class="select w-full">
                <option value="">All methods</option>
                <option v-for="method in options.procurement_methods" :key="method.id" :value="String(method.id)">{{ optionLabel(method) }}</option>
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Supplier category</span>
              <select v-model="filters.suppliercategory_id" class="select w-full">
                <option value="">All supplier categories</option>
                <option v-for="category in options.supplier_categories" :key="category.id" :value="String(category.id)">{{ optionLabel(category) }}</option>
              </select>
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wide text-base-content/55">Procurement group</span>
              <select v-model="filters.procurementgroup_id" class="select w-full">
                <option value="">All procurement groups</option>
                <option v-for="group in options.procurement_groups" :key="group.id" :value="String(group.id)">{{ optionLabel(group) }}</option>
              </select>
            </label>
          </div>

          <div class="card-actions border-t border-base-200 pt-4">
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:sliders-horizontal" class="h-4 w-4" />
              Apply filters
            </button>
            <button type="button" class="btn btn-ghost" :disabled="!hasFilters" @click="clearFilters">Clear filters</button>
          </div>
        </div>
      </form>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black">Open tenders</h2>
          <p class="mt-1 text-sm text-base-content/55">{{ resultSummary }}</p>
        </div>
        <span v-if="pagination.total" class="badge badge-lg bg-base-100 text-base-content shadow-sm">{{ pagination.total.toLocaleString() }} results</span>
      </div>

      <div v-if="loading" class="space-y-3" aria-label="Loading live opportunities">
        <div v-for="index in 5" :key="index" class="skeleton h-28 w-full" />
      </div>

      <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
        <Icon name="lucide:circle-alert" class="h-5 w-5" />
        <span class="flex-1">{{ error }}</span>
        <button type="button" class="btn btn-sm" @click="loadOpportunities">Try again</button>
      </div>

      <div v-else-if="!opportunities.length" class="card card-dash bg-base-100">
        <div class="card-body items-center py-14 text-center">
          <span class="grid h-14 w-14 place-items-center rounded-full bg-base-200 text-base-content/40"><Icon name="lucide:file-search" class="h-6 w-6" /></span>
          <h3 class="card-title mt-3 text-base">No live tenders match these filters</h3>
          <p class="max-w-md text-sm text-base-content/55">Broaden the closing window or clear some filters to see more active opportunities.</p>
          <button v-if="hasFilters" type="button" class="btn btn-ghost btn-sm mt-2" @click="clearFilters">Clear filters</button>
        </div>
      </div>

      <div v-else>
        <div class="grid gap-4 md:hidden">
          <article v-for="tender in opportunities" :key="`mobile-${tender.uuid}`" class="card card-border bg-base-100 shadow-sm">
            <div class="card-body gap-0 p-5">
              <div class="flex items-start justify-between gap-3">
                <span class="font-mono text-[11px] font-semibold uppercase tracking-wide text-base-content/50">{{ tender.reference || 'Reference pending' }}</span>
                <span class="badge badge-sm shrink-0" :class="closingBadge(tender.closing_at)">{{ closingLabel(tender.closing_at) }}</span>
              </div>
              <NuxtLink :to="`/tenders/${tender.uuid}`" class="mt-3 text-base font-black leading-6 text-base-content">{{ tender.title }}</NuxtLink>
              <p class="mt-2 line-clamp-2 text-sm leading-5 text-base-content/55">{{ tender.description || 'No description supplied.' }}</p>
              <div class="mt-4 space-y-2 border-t border-base-200 pt-4 text-sm">
                <p class="flex items-start gap-2"><Icon name="lucide:landmark" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ tender.entity || 'Procuring entity not specified' }}</span></p>
                <p class="flex items-start gap-2"><Icon name="lucide:gavel" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ tender.method || 'Method not specified' }}</span></p>
                <p class="flex items-start gap-2"><Icon name="lucide:calendar-clock" class="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{{ formatDateTime(tender.closing_at) }}</span></p>
              </div>
              <div class="card-actions mt-5">
                <NuxtLink :to="`/tenders/${tender.uuid}`" class="btn btn-primary btn-block">View opportunity <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink>
              </div>
            </div>
          </article>
        </div>

        <div class="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm md:block">
          <table class="table min-w-[960px]">
            <thead class="bg-base-200 text-xs text-base-content/60">
              <tr><th>Reference</th><th>Opportunity</th><th>Procuring entity</th><th>Method</th><th>Closing</th><th><span class="sr-only">Action</span></th></tr>
            </thead>
            <tbody>
              <tr v-for="tender in opportunities" :key="tender.uuid" class="group align-top hover:bg-base-200/50">
                <td class="py-4 font-mono text-xs text-base-content/50">{{ tender.reference || 'Pending' }}</td>
                <td class="max-w-md whitespace-normal py-4">
                  <NuxtLink :to="`/tenders/${tender.uuid}`" class="font-bold leading-5 group-hover:text-primary">{{ tender.title }}</NuxtLink>
                  <p class="mt-1 line-clamp-2 text-xs leading-5 text-base-content/50">{{ tender.description || 'No description supplied.' }}</p>
                  <p class="mt-2 text-[11px] text-base-content/40">{{ categoryLabel(tender) }}</p>
                </td>
                <td class="max-w-52 whitespace-normal py-4 text-sm font-medium">{{ tender.entity || 'Not specified' }}</td>
                <td class="max-w-44 whitespace-normal py-4 text-sm">{{ tender.method || 'Not specified' }}</td>
                <td class="py-4">
                  <span class="badge badge-sm" :class="closingBadge(tender.closing_at)">{{ closingLabel(tender.closing_at) }}</span>
                  <p class="mt-2 whitespace-nowrap text-xs text-base-content/50">{{ formatDateTime(tender.closing_at) }}</p>
                </td>
                <td class="py-4 text-right"><NuxtLink :to="`/tenders/${tender.uuid}`" class="btn btn-outline btn-primary btn-sm whitespace-nowrap">View details <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!loading && !error && pagination.last_page > 1" class="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-3 shadow-sm">
        <button type="button" class="btn btn-sm" :disabled="pagination.current_page <= 1" @click="changePage(pagination.current_page - 1)"><Icon name="lucide:chevron-left" class="h-4 w-4" /> Previous</button>
        <span class="text-sm text-base-content/55">Page <strong class="text-base-content">{{ pagination.current_page }}</strong> of {{ pagination.last_page }}</span>
        <button type="button" class="btn btn-sm" :disabled="pagination.current_page >= pagination.last_page" @click="changePage(pagination.current_page + 1)">Next <Icon name="lucide:chevron-right" class="h-4 w-4" /></button>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({
  title: 'Live Opportunities — ZimEpps',
  meta: [{ name: 'description', content: 'Search active public tenders and filter opportunities by the number of days remaining before closing.' }],
})

const route = useRoute()
const router = useRouter()
const { getPublishedTenders, getTenderFilters } = usePublicTenderHelper()
const queryValue = value => Array.isArray(value) ? (value[0] || '') : (value || '')

const filters = reactive({
  search: String(queryValue(route.query.search)),
  company_id: String(queryValue(route.query.company_id)),
  procurementmethod_id: String(queryValue(route.query.procurementmethod_id)),
  suppliercategory_id: String(queryValue(route.query.suppliercategory_id)),
  procurementgroup_id: String(queryValue(route.query.procurementgroup_id)),
  closing_within_days: String(queryValue(route.query.closing_within_days)),
})
const options = reactive({ procurement_entities: [], procurement_methods: [], supplier_categories: [], procurement_groups: [] })
const opportunities = ref([])
const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: null, to: null })
const loading = ref(true)
const error = ref('')

const hasFilters = computed(() => Object.values(filters).some(Boolean))
const resultSummary = computed(() => pagination.total
  ? `Showing ${pagination.from ?? 1}–${pagination.to ?? opportunities.value.length} of ${pagination.total} active ${pagination.total === 1 ? 'tender' : 'tenders'}.`
  : 'Browse active public tenders currently open for supplier responses.')

onMounted(async () => {
  const result = await getTenderFilters()
  if (result.ok) Object.assign(options, result.data?.data ?? {})
})

watch(() => route.fullPath, () => {
  Object.assign(filters, {
    search: String(queryValue(route.query.search)),
    company_id: String(queryValue(route.query.company_id)),
    procurementmethod_id: String(queryValue(route.query.procurementmethod_id)),
    suppliercategory_id: String(queryValue(route.query.suppliercategory_id)),
    procurementgroup_id: String(queryValue(route.query.procurementgroup_id)),
    closing_within_days: String(queryValue(route.query.closing_within_days)),
  })
  loadOpportunities()
}, { immediate: true })

async function loadOpportunities() {
  loading.value = true
  error.value = ''
  const result = await getPublishedTenders({
    ...filters,
    page: Number(queryValue(route.query.page)) || 1,
    per_page: 12,
  })

  if (!result.ok) {
    opportunities.value = []
    error.value = result.error
    loading.value = false
    return
  }

  const page = result.data?.data ?? {}
  opportunities.value = page.data ?? []
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
  return Object.fromEntries(Object.entries({ ...filters, page: page > 1 ? page : '' }).filter(([, value]) => value !== ''))
}

const applyFilters = () => router.push({ path: '/live-opportunities', query: compactQuery(1) })
const changePage = page => router.push({ path: '/live-opportunities', query: compactQuery(page) })

function clearFilters() {
  Object.keys(filters).forEach(key => { filters[key] = '' })
  router.push('/live-opportunities')
}

const optionLabel = option => option.code ? `${option.code} · ${option.name}` : option.name
const categoryLabel = tender => tender.required_categories?.length
  ? `Supplier categories: ${tender.required_categories.map(category => category.code || category.name).join(', ')}`
  : 'Open to all registered categories'

function daysRemaining(value) {
  if (!value) return null
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86400000))
}

function closingLabel(value) {
  const days = daysRemaining(value)
  if (days === null) return 'Closing date not set'
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

function closingBadge(value) {
  const days = daysRemaining(value)
  if (days !== null && days <= 3) return 'badge-error badge-soft'
  if (days !== null && days <= 7) return 'badge-warning badge-soft'
  return 'badge-success badge-soft'
}

const formatDateTime = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Not specified'
</script>
