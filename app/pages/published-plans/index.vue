<template>
  <div class="min-h-screen bg-base-200" data-page="published-plans">
    <section class="border-b border-primary/20 bg-primary text-primary-content">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <div class="flex max-w-4xl items-start gap-5">
          <span class="hidden h-14 w-14 shrink-0 place-items-center rounded-box bg-primary-content/12 sm:grid">
            <Icon name="lucide:book-open-check" class="h-7 w-7" />
          </span>
          <div>
            <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Published annual procurement plans</h1>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-primary-content/75 sm:text-base">
              See what public entities intend to procure, when they expect to approach the market, and the approved value of each APP line.
            </p>
          </div>
        </div>
      </div>
    </section>

    <main class="app-shell space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <form class="card card-border bg-base-100 shadow-sm" @submit.prevent="applyFilters">
        <div class="card-body gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <label class="grid flex-1 gap-1.5">
            <span class="text-sm font-semibold">Find a procuring entity</span>
            <span class="input flex w-full items-center gap-2">
              <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" />
              <input v-model="filters.search" type="search" class="grow" placeholder="Search by entity or location">
            </span>
          </label>
          <label class="grid gap-1.5 sm:w-48">
            <span class="text-sm font-semibold">Plan year</span>
            <select v-model="filters.year" class="select w-full">
              <option value="">All years</option>
              <option v-for="year in years" :key="year" :value="String(year)">{{ year }}</option>
            </select>
          </label>
          <div class="flex gap-2">
            <button class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:search" class="h-4 w-4" />
              Search
            </button>
            <button type="button" class="btn btn-ghost" :disabled="!hasFilters" @click="clearFilters">Clear</button>
          </div>
        </div>
      </form>

      <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 class="text-xl font-black">Entities with published plans</h2>
          <p class="mt-1 text-sm text-base-content/55">{{ resultSummary }}</p>
        </div>
        <span v-if="pagination.total" class="badge badge-lg bg-base-100 shadow-sm">{{ pagination.total.toLocaleString() }} entities</span>
      </div>

      <div v-if="loading" class="space-y-3" aria-label="Loading published plans">
        <div v-for="index in 5" :key="index" class="skeleton h-40 w-full" />
      </div>

      <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
        <Icon name="lucide:circle-alert" class="h-5 w-5" />
        <span class="flex-1">{{ error }}</span>
        <button type="button" class="btn btn-sm" @click="loadEntities">Try again</button>
      </div>

      <div v-else-if="!entities.length" class="card card-dash bg-base-100">
        <div class="card-body items-center py-14 text-center">
          <span class="grid h-14 w-14 place-items-center rounded-full bg-base-200 text-base-content/40"><Icon name="lucide:files" class="h-6 w-6" /></span>
          <h3 class="card-title mt-3 text-base">No published plans match this search</h3>
          <p class="max-w-md text-sm text-base-content/55">Try another entity name, choose a different year, or clear the filters.</p>
          <button v-if="hasFilters" type="button" class="btn btn-sm mt-2" @click="clearFilters">Clear filters</button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <article v-for="entity in entities" :key="entity.id" class="card card-border bg-base-100 shadow-sm">
          <div class="card-body gap-5 p-5 sm:p-6">
            <div class="flex items-start gap-4">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-box bg-primary/10 text-primary"><Icon name="lucide:landmark" class="h-5 w-5" /></span>
              <div class="min-w-0">
                <h3 class="text-lg font-black leading-6">{{ entity.name }}</h3>
                <p v-if="entity.location" class="mt-1 flex items-center gap-1.5 text-sm text-base-content/50"><Icon name="lucide:map-pin" class="h-3.5 w-3.5" />{{ entity.location }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <div v-for="plan in entity.plans" :key="plan.uuid" class="rounded-box border border-base-300 bg-base-200/55 p-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="badge badge-success badge-soft">Published</span>
                      <strong>{{ plan.year }} APP</strong>
                      <span v-if="plan.procurement_class" class="text-sm text-base-content/55">{{ plan.procurement_class }}</span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-base-content/60">
                      <span><strong class="text-base-content">{{ plan.items_count.toLocaleString() }}</strong> planned {{ plan.items_count === 1 ? 'item' : 'items' }}</span>
                      <span>Published {{ formatDate(plan.published_at) }}</span>
                    </div>
                  </div>
                  <NuxtLink :to="`/published-plans/${plan.uuid}`" class="btn btn-primary btn-sm shrink-0">
                    View plan <Icon name="lucide:arrow-up-right" class="h-4 w-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </article>
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
  title: 'Published Procurement Plans — ZimEpps',
  meta: [{ name: 'description', content: 'Browse annual procurement plans published by Zimbabwean procuring entities.' }],
})

const route = useRoute()
const router = useRouter()
const { getPublishedPlans, getPublishedPlanFilters } = usePublicTenderHelper()
const queryValue = value => Array.isArray(value) ? (value[0] || '') : (value || '')

const filters = reactive({
  search: String(queryValue(route.query.search)),
  year: String(queryValue(route.query.year)),
})
const years = ref([])
const entities = ref([])
const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: null, to: null })
const loading = ref(true)
const error = ref('')

const hasFilters = computed(() => Object.values(filters).some(Boolean))
const resultSummary = computed(() => pagination.total
  ? `Showing ${pagination.from ?? 1}–${pagination.to ?? entities.value.length} of ${pagination.total} procuring ${pagination.total === 1 ? 'entity' : 'entities'}.`
  : 'Browse public entities whose approved APPs are available for public review.')

onMounted(async () => {
  const result = await getPublishedPlanFilters()
  if (result.ok) years.value = result.data?.data?.years ?? []
})

watch(() => route.fullPath, () => {
  Object.assign(filters, {
    search: String(queryValue(route.query.search)),
    year: String(queryValue(route.query.year)),
  })
  loadEntities()
}, { immediate: true })

async function loadEntities() {
  loading.value = true
  error.value = ''
  const result = await getPublishedPlans({
    ...filters,
    page: Number(queryValue(route.query.page)) || 1,
    per_page: 12,
  })

  if (!result.ok) {
    entities.value = []
    error.value = result.error
    loading.value = false
    return
  }

  const page = result.data?.data ?? {}
  entities.value = page.data ?? []
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

const applyFilters = () => router.push({ path: '/published-plans', query: compactQuery(1) })
const changePage = page => router.push({ path: '/published-plans', query: compactQuery(page) })

function clearFilters() {
  Object.keys(filters).forEach(key => { filters[key] = '' })
  router.push('/published-plans')
}

const formatDate = value => value
  ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value))
  : 'date not recorded'
</script>
