<template>
  <div class="min-h-screen bg-base-200" data-page="published-plan-detail">
    <section class="border-b border-base-300 bg-base-100">
      <div class="app-shell px-5 py-8 sm:px-8 sm:py-10">
        <NuxtLink to="/published-plans" class="link link-hover inline-flex items-center gap-2 text-sm text-base-content/55">
          <Icon name="lucide:arrow-left" class="h-4 w-4" /> Published plans
        </NuxtLink>

        <div v-if="plan" class="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-success badge-soft">Published APP</span>
              <span class="text-sm font-semibold text-base-content/55">{{ plan.year }}</span>
            </div>
            <h1 class="mt-3 text-2xl font-black tracking-tight sm:text-4xl">{{ plan.entity?.name }}</h1>
            <p class="mt-3 text-sm text-base-content/55">
              {{ plan.procurement_class || 'Annual procurement plan' }}<template v-if="plan.entity?.location"> · {{ plan.entity.location }}</template>
            </p>
          </div>
          <div class="grid grid-cols-2 gap-px overflow-hidden rounded-box border border-base-300 bg-base-300 sm:grid-cols-3 lg:min-w-[34rem]">
            <div class="bg-base-100 p-4">
              <p class="text-xs text-base-content/50">Plan year</p>
              <p class="mt-1 text-xl font-black">{{ plan.year }}</p>
            </div>
            <div class="bg-base-100 p-4">
              <p class="text-xs text-base-content/50">APP lines</p>
              <p class="mt-1 text-xl font-black">{{ plan.items_count.toLocaleString() }}</p>
            </div>
            <div class="col-span-2 bg-base-100 p-4 sm:col-span-1">
              <p class="text-xs text-base-content/50">Planned value</p>
              <p class="mt-1 text-xl font-black">{{ money(plan.total_value) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <main class="app-shell space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <div v-if="loading && !plan" class="space-y-4" aria-label="Loading published plan">
        <div class="skeleton h-32 w-full" />
        <div class="skeleton h-80 w-full" />
      </div>

      <div v-else-if="error && !plan" role="alert" class="alert alert-error alert-soft">
        <Icon name="lucide:circle-alert" class="h-5 w-5" />
        <span class="flex-1">{{ error }}</span>
        <NuxtLink v-if="notFound" to="/published-plans" class="btn btn-sm">Browse published plans</NuxtLink>
        <button v-else type="button" class="btn btn-sm" @click="loadPlan">Try again</button>
      </div>

      <template v-else-if="plan">
        <form class="card card-border bg-base-100 shadow-sm" @submit.prevent="applyFilters">
          <div class="card-body gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
            <label class="grid flex-1 gap-1.5">
              <span class="text-sm font-semibold">Search this APP</span>
              <span class="input flex w-full items-center gap-2">
                <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" />
                <input v-model="filters.search" type="search" class="grow" placeholder="Reference, description or UNSPSC">
              </span>
            </label>
            <label class="grid gap-1.5 sm:w-44">
              <span class="text-sm font-semibold">Delivery quarter</span>
              <select v-model="filters.quarter" class="select w-full">
                <option value="">All quarters</option>
                <option v-for="quarter in ['Q1', 'Q2', 'Q3', 'Q4']" :key="quarter" :value="quarter">{{ quarter }}</option>
              </select>
            </label>
            <div class="flex gap-2">
              <button class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="loading loading-spinner loading-xs" />
                <Icon v-else name="lucide:search" class="h-4 w-4" /> Search
              </button>
              <button type="button" class="btn btn-ghost" :disabled="!hasFilters" @click="clearFilters">Clear</button>
            </div>
          </div>
        </form>

        <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-black">Procurement schedule</h2>
            <p class="mt-1 text-sm text-base-content/55">{{ resultSummary }}</p>
          </div>
          <span v-if="pagination.total" class="badge badge-lg bg-base-100 shadow-sm">{{ pagination.total.toLocaleString() }} APP lines</span>
        </div>

        <div v-if="error" role="alert" class="alert alert-error alert-soft">
          <Icon name="lucide:circle-alert" class="h-5 w-5" />
          <span class="flex-1">{{ error }}</span>
          <button type="button" class="btn btn-sm" @click="loadPlan">Try again</button>
        </div>

        <div v-else-if="loading" class="space-y-3">
          <div v-for="index in 6" :key="index" class="skeleton h-24 w-full" />
        </div>

        <div v-else-if="!items.length" class="card card-dash bg-base-100">
          <div class="card-body items-center py-14 text-center">
            <Icon name="lucide:file-search" class="h-8 w-8 text-base-content/30" />
            <h3 class="card-title mt-2 text-base">No APP lines match these filters</h3>
            <p class="text-sm text-base-content/55">Search with a different term or view all delivery quarters.</p>
            <button v-if="hasFilters" type="button" class="btn btn-sm mt-2" @click="clearFilters">Clear filters</button>
          </div>
        </div>

        <div v-else>
          <div class="grid gap-4 md:hidden">
            <article v-for="item in items" :key="`mobile-${item.uuid}`" class="card card-border bg-base-100 shadow-sm">
              <div class="card-body gap-0 p-5">
                <div class="flex items-start justify-between gap-3">
                  <span class="font-mono text-xs text-base-content/50">{{ item.reference || 'No reference' }}</span>
                  <span v-if="item.quarter" class="badge badge-outline badge-sm">{{ item.quarter }}</span>
                </div>
                <h3 class="mt-3 font-bold leading-6">{{ item.description }}</h3>
                <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-base-200 pt-4 text-sm">
                  <div><dt class="text-xs text-base-content/45">Method</dt><dd class="mt-1 font-medium">{{ item.procurement_method || 'Not specified' }}</dd></div>
                  <div><dt class="text-xs text-base-content/45">Group</dt><dd class="mt-1 font-medium">{{ item.procurement_group || 'Not specified' }}</dd></div>
                  <div><dt class="text-xs text-base-content/45">Bid notice</dt><dd class="mt-1 font-medium">{{ date(item.bid_notice_publication_date) }}</dd></div>
                  <div><dt class="text-xs text-base-content/45">Bid closing</dt><dd class="mt-1 font-medium">{{ date(item.bid_closing_date) }}</dd></div>
                </dl>
                <div class="mt-4 flex items-end justify-between gap-3 border-t border-base-200 pt-4">
                  <span class="text-xs text-base-content/45">Planned value</span>
                  <strong>{{ money(item.total_cost) }}</strong>
                </div>
              </div>
            </article>
          </div>

          <div class="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-sm md:block">
            <table class="table min-w-[1180px]">
              <thead class="bg-base-200 text-xs text-base-content/60">
                <tr>
                  <th>Reference</th>
                  <th class="min-w-72">Planned procurement</th>
                  <th>Method / group</th>
                  <th>Quarter</th>
                  <th>Expected market dates</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Planned value</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.uuid" class="align-top hover:bg-base-200/50">
                  <td class="py-4 font-mono text-xs text-base-content/55">{{ item.reference || '—' }}</td>
                  <td class="max-w-md whitespace-normal py-4">
                    <p class="font-bold leading-5">{{ item.description }}</p>
                    <p v-if="item.unspsc" class="mt-2 text-xs text-base-content/50">UNSPSC {{ item.unspsc.code }} · {{ item.unspsc.name }}</p>
                    <p v-if="item.source_of_funds" class="mt-1 text-xs text-base-content/50">Funding: {{ item.source_of_funds }}</p>
                  </td>
                  <td class="max-w-52 whitespace-normal py-4 text-sm">
                    <p class="font-medium">{{ item.procurement_method || 'Not specified' }}</p>
                    <p class="mt-1 text-xs text-base-content/50">{{ item.procurement_group || 'Group not specified' }}</p>
                  </td>
                  <td class="py-4"><span v-if="item.quarter" class="badge badge-outline badge-sm">{{ item.quarter }}</span><span v-else>—</span></td>
                  <td class="py-4 text-sm">
                    <p><span class="text-base-content/45">Notice:</span> {{ date(item.bid_notice_publication_date) }}</p>
                    <p class="mt-1"><span class="text-base-content/45">Closing:</span> {{ date(item.bid_closing_date) }}</p>
                  </td>
                  <td class="py-4 text-right text-sm">{{ number(item.quantity) }}<span v-if="item.unit_of_measure" class="ml-1 text-xs text-base-content/45">{{ item.unit_of_measure }}</span></td>
                  <td class="py-4 text-right font-bold">{{ money(item.total_cost) }}</td>
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
      </template>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })

const route = useRoute()
const router = useRouter()
const { getPublishedPlan } = usePublicTenderHelper()
const queryValue = value => Array.isArray(value) ? (value[0] || '') : (value || '')

const plan = ref(null)
const items = ref([])
const filters = reactive({
  search: String(queryValue(route.query.search)),
  quarter: String(queryValue(route.query.quarter)),
})
const pagination = reactive({ current_page: 1, last_page: 1, total: 0, from: null, to: null })
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

useHead(() => ({
  title: plan.value ? `${plan.value.entity?.name} ${plan.value.year} APP — ZimEpps` : 'Published Procurement Plan — ZimEpps',
  meta: [{ name: 'description', content: plan.value ? `View the ${plan.value.year} annual procurement plan for ${plan.value.entity?.name}.` : 'View a published annual procurement plan.' }],
}))

const hasFilters = computed(() => Object.values(filters).some(Boolean))
const resultSummary = computed(() => pagination.total
  ? `Showing ${pagination.from ?? 1}–${pagination.to ?? items.value.length} of ${pagination.total} matching APP ${pagination.total === 1 ? 'line' : 'lines'}.`
  : 'Review the approved goods, works and services planned for this financial year.')

watch(() => route.fullPath, () => {
  Object.assign(filters, {
    search: String(queryValue(route.query.search)),
    quarter: String(queryValue(route.query.quarter)),
  })
  loadPlan()
}, { immediate: true })

async function loadPlan() {
  loading.value = true
  error.value = ''
  notFound.value = false
  const result = await getPublishedPlan(String(route.params.uuid), {
    ...filters,
    page: Number(queryValue(route.query.page)) || 1,
    per_page: 25,
  })

  if (!result.ok) {
    error.value = result.error
    notFound.value = result.notFound
    if (result.notFound) {
      plan.value = null
      items.value = []
    }
    loading.value = false
    return
  }

  const payload = result.data?.data ?? {}
  plan.value = payload.plan ?? null
  const page = payload.items ?? {}
  items.value = page.data ?? []
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

const applyFilters = () => router.push({ path: route.path, query: compactQuery(1) })
const changePage = page => router.push({ path: route.path, query: compactQuery(page) })

function clearFilters() {
  Object.keys(filters).forEach(key => { filters[key] = '' })
  router.push(route.path)
}

function money(value) {
  const code = plan.value?.currency?.code || 'USD'
  try {
    return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(Number(value || 0))
  } catch {
    return `${code} ${number(value)}`
  }
}

const number = value => Number(value || 0).toLocaleString('en-ZW', { maximumFractionDigits: 2 })
const date = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : 'Not specified'
</script>
