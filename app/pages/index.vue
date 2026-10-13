<template>
  <div class="min-h-screen overflow-hidden bg-[#f7f9f7] text-slate-900">
    <main>
      <section class="relative border-b border-emerald-950/10 bg-[#eef4ef]">
        <div class="pointer-events-none absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full border-[90px] border-emerald-800/[0.04]" />
        <div class="pointer-events-none absolute bottom-0 left-[46%] h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

        <div class="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-24">
          <div>
            <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm backdrop-blur">
              <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span class="relative h-2 w-2 rounded-full bg-emerald-600" /></span>
              {{ formatNumber(activeTenderCount) }} public opportunities open now
            </div>

            <p class="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Zimbabwe electronic procurement</p>
            <h1 class="max-w-3xl text-4xl font-black leading-[1.07] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
              Find the right public contract for your business.
            </h1>
            <p class="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Discover verified government opportunities, prepare compliant bids and manage submissions from one secure supplier workspace.
            </p>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <NuxtLink to="/register" class="btn btn-success h-12 px-6 text-sm shadow-lg shadow-emerald-900/10">
                Create supplier account <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <button type="button" class="btn btn-outline h-12 border-slate-300 bg-white/60 px-6 text-sm" @click="scrollToTenders">
                Browse opportunities
              </button>
            </div>

            <div class="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-300/70 pt-6">
              <div v-for="item in trustPoints" :key="item.label">
                <Icon :name="item.icon" class="mb-2 h-4 w-4 text-emerald-700" />
                <p class="text-xs font-semibold text-slate-700">{{ item.label }}</p>
              </div>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -inset-5 -rotate-2 rounded-[2rem] bg-emerald-900/5" />
            <div class="relative overflow-hidden rounded-[2rem] border border-white/50 bg-[#123c2f] p-6 text-white shadow-2xl shadow-emerald-950/20 sm:p-8">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Opportunity finder</p>
                  <h2 class="mt-2 text-2xl font-bold">What are you looking for?</h2>
                </div>
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Icon name="lucide:search" class="h-5 w-5 text-emerald-200" /></span>
              </div>

              <form class="mt-7 space-y-4" @submit.prevent="handleSearch">
                <label class="block">
                  <span class="mb-2 block text-xs font-medium text-emerald-100/70">Keyword, tender number or procuring entity</span>
                  <span class="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 transition focus-within:border-emerald-300/60 focus-within:bg-white/15">
                    <Icon name="lucide:search" class="h-4 w-4 text-emerald-200/70" />
                    <input v-model="searchQuery" type="search" class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" placeholder="e.g. medical supplies">
                  </span>
                </label>

                <label class="block">
                  <span class="mb-2 block text-xs font-medium text-emerald-100/70">Procurement category</span>
                  <select v-model="searchCategory" class="select h-12 w-full border-white/10 bg-white/10 text-sm text-white focus:border-emerald-300/60 focus:outline-none">
                    <option class="text-slate-900" value="">All categories</option>
                    <option v-for="category in categories" :key="category.id" class="text-slate-900" :value="String(category.id)">{{ category.name }}</option>
                  </select>
                </label>

                <button type="submit" class="btn btn-success h-12 w-full">Search open tenders <Icon name="lucide:arrow-down" class="h-4 w-4" /></button>
              </form>

              <div class="mt-7 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-5 text-center">
                <div><p class="text-xl font-bold">{{ formatNumber(stats.entities) }}</p><p class="mt-1 text-[11px] text-emerald-100/55">Entities</p></div>
                <div><p class="text-xl font-bold">{{ formatNumber(categories.length) }}</p><p class="mt-1 text-[11px] text-emerald-100/55">Categories</p></div>
                <div><p class="text-xl font-bold">{{ formatNumber(closingSoonCount) }}</p><p class="mt-1 text-[11px] text-emerald-100/55">Closing soon</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="current-tenders" class="scroll-mt-24 py-16 sm:py-20">
        <div class="mx-auto max-w-7xl px-5 sm:px-8">
          <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Live opportunities</p>
              <h2 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Open for business</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Current public procurement opportunities published by registered procuring entities.</p>
            </div>
            <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <Icon name="lucide:search" class="ml-2 h-4 w-4 text-slate-400" />
              <input v-model="searchQuery" type="search" class="w-full min-w-0 bg-transparent px-1 text-sm outline-none sm:w-64" placeholder="Search opportunities" @keyup.enter="handleSearch">
              <button class="btn btn-success btn-sm" @click="handleSearch">Search</button>
            </div>
          </div>

          <div v-if="tenderFilters.length > 1" class="mt-7 flex gap-2 overflow-x-auto pb-2">
            <button v-for="filter in tenderFilters" :key="filter.value" type="button" class="btn btn-sm shrink-0 rounded-full border" :class="activeTenderFilter === filter.value ? 'btn-success border-success' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'" @click="selectMethodFilter(filter.value)">
              {{ filter.label }} <span class="ml-1 opacity-60">{{ filter.count }}</span>
            </button>
          </div>

          <div v-if="loadingTenders" class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="table min-w-[960px]">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th>Reference</th><th>Opportunity</th><th>Procuring entity</th><th>Method</th><th>Closing</th><th><span class="sr-only">Action</span></th></tr>
                </thead>
                <tbody>
                  <tr v-for="index in 6" :key="index" class="border-slate-100">
                    <td><div class="skeleton h-4 w-24" /></td>
                    <td><div class="skeleton h-4 w-72" /><div class="skeleton mt-2 h-4 w-32" /></td>
                    <td><div class="skeleton h-4 w-40" /></td>
                    <td><div class="skeleton h-4 w-28" /></td>
                    <td><div class="skeleton h-4 w-20" /></td>
                    <td><div class="skeleton ml-auto h-9 w-24" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="!filteredTenders.length" class="mt-8 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <span class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="lucide:file-search" class="h-7 w-7" /></span>
            <h3 class="mt-4 font-bold">No matching opportunities</h3>
            <p class="mt-1 max-w-md text-sm text-slate-500">{{ tendersError || 'Try a different keyword or category, or check again when new tenders are published.' }}</p>
            <button v-if="searchQuery || searchCategory || activeTenderFilter !== 'all'" class="btn btn-ghost btn-sm mt-4" @click="clearSearch">Clear search</button>
          </div>

          <div v-else class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="table min-w-[960px]">
                <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th>Reference</th>
                    <th>Opportunity</th>
                    <th>Procuring entity</th>
                    <th>Method</th>
                    <th>Closing</th>
                    <th><span class="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tender in filteredTenders" :key="tender.uuid" class="group border-slate-100 transition hover:bg-emerald-50/40">
                    <td class="font-mono text-xs uppercase tracking-wide text-slate-500">{{ tender.reference || 'Pending' }}</td>
                    <td class="max-w-sm whitespace-normal py-4">
                      <NuxtLink :to="opportunityLink(tender)" class="font-bold leading-5 text-slate-900 transition group-hover:text-emerald-800">{{ tender.title }}</NuxtLink>
                      <div class="mt-2 flex flex-wrap items-center gap-2">
                        <span v-if="isEoi(tender)" class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">Expression of Interest</span>
                        <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">{{ tender.category || 'Public procurement' }}</span>
                      </div>
                    </td>
                    <td class="max-w-52 whitespace-normal text-sm text-slate-600">
                      <span class="flex items-start gap-2"><Icon name="lucide:landmark" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />{{ tender.entity || 'Procuring entity' }}</span>
                    </td>
                    <td>
                      <p class="text-sm font-semibold text-slate-700">{{ tender.method || 'Tender' }}</p>
                      <p class="mt-1 text-xs text-slate-400">{{ tender.required_bid_bond ? 'Bid bond required' : tender.allowed_participants || 'Open participation' }}</p>
                    </td>
                    <td>
                      <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold" :class="isClosingSoon(tender.closing_at) ? 'text-red-600' : 'text-slate-600'"><Icon name="lucide:clock-3" class="h-3.5 w-3.5" />{{ daysLeft(tender.closing_at) }}</span>
                    </td>
                    <td class="text-right">
                      <NuxtLink :to="opportunityLink(tender)" class="btn btn-outline btn-success btn-sm whitespace-nowrap border-emerald-200">View details <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="closingSoonCount" class="mt-8 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Icon name="lucide:alarm-clock" class="h-5 w-5" /></span>
            <div><p class="text-sm font-bold text-amber-900">{{ closingSoonCount }} {{ closingSoonCount === 1 ? 'opportunity closes' : 'opportunities close' }} within 72 hours</p><p class="mt-0.5 text-xs text-amber-800/70">Allow enough time to complete, seal and submit your bid before the deadline.</p></div>
          </div>
        </div>
      </section>

      <section id="categories" class="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div class="mx-auto max-w-7xl px-5 sm:px-8">
          <div class="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Browse the market</p>
              <h2 class="mt-2 text-3xl font-black tracking-tight">Find your sector</h2>
              <p class="mt-3 max-w-md text-sm leading-6 text-slate-500">Explore live opportunities by procurement category and focus on contracts aligned with your capabilities.</p>
              <button class="btn btn-ghost btn-sm mt-5 px-0 text-emerald-800" @click="clearSearch">View all opportunities <Icon name="lucide:arrow-right" class="h-4 w-4" /></button>
            </div>

            <div v-if="categories.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button v-for="category in categories.slice(0, 9)" :key="category.id" type="button" class="group flex min-h-32 flex-col items-start justify-between rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md" :class="String(searchCategory) === String(category.id) ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-[#fafcfb]'" @click="selectCategory(category.id)">
                <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-100"><Icon :name="category.icon" class="h-4 w-4" /></span>
                <span><span class="line-clamp-2 text-sm font-bold text-slate-800">{{ category.name }}</span><span class="mt-1 block text-xs text-slate-400">{{ category.count }} open</span></span>
              </button>
            </div>
            <div v-else-if="!loadingStats" class="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No active categories are available.</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="py-16 sm:py-24">
        <div class="mx-auto max-w-7xl px-5 sm:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">From registration to award</p>
            <h2 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">A simpler path to public procurement</h2>
          </div>

          <div class="relative mt-12 grid gap-4 md:grid-cols-4">
            <div class="absolute left-[12%] right-[12%] top-8 hidden border-t border-dashed border-emerald-300 md:block" />
            <div v-for="(step, index) in howItWorks" :key="step.title" class="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span class="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#123c2f] text-white shadow-lg shadow-emerald-950/10"><Icon :name="step.icon" class="h-6 w-6" /><span class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-[11px] font-black text-amber-950">{{ index + 1 }}</span></span>
              <h3 class="mt-6 font-bold">{{ step.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-500">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="px-5 pb-16 sm:px-8 sm:pb-24">
        <div class="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#123c2f] px-6 py-12 text-white shadow-2xl shadow-emerald-950/15 sm:px-12 lg:flex lg:items-center lg:justify-between lg:py-14">
          <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[50px] border-white/5" />
          <div class="relative max-w-2xl"><p class="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Ready to compete?</p><h2 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Build your supplier profile and start bidding.</h2><p class="mt-3 text-sm leading-6 text-emerald-100/65">Register your organisation, maintain compliance documents and respond to opportunities through the secure supplier portal.</p></div>
          <div class="relative mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:pl-10"><NuxtLink to="/register" class="btn btn-success h-12 px-6">Register your business</NuxtLink><NuxtLink to="/login" class="btn h-12 border-white/20 bg-white/10 px-6 text-white hover:bg-white/15">Sign in</NuxtLink></div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <div><div class="flex items-center gap-3"><img src="/img/prazlogo.jpg" alt="PRAZ" class="h-11 w-11 rounded-xl border border-slate-200 object-contain"><div><p class="text-sm font-black">PRAZ eProcurement</p><p class="text-xs text-slate-400">Official public procurement platform</p></div></div><p class="mt-4 max-w-sm text-sm leading-6 text-slate-500">Supporting transparent, fair and competitive public procurement across Zimbabwe.</p></div>
        <div><h3 class="text-sm font-bold">Suppliers</h3><ul class="mt-4 space-y-2 text-sm text-slate-500"><li><NuxtLink to="/register" class="hover:text-emerald-700">Register</NuxtLink></li><li><NuxtLink to="/login" class="hover:text-emerald-700">Sign in</NuxtLink></li><li><button class="hover:text-emerald-700" @click="scrollToTenders">Browse tenders</button></li></ul></div>
        <div><h3 class="text-sm font-bold">Platform</h3><ul class="mt-4 space-y-2 text-sm text-slate-500"><li><button class="hover:text-emerald-700" @click="scrollToCategories">Categories</button></li><li><button class="hover:text-emerald-700" @click="scrollToHowItWorks">How it works</button></li><li><a href="https://www.praz.org.zw" class="hover:text-emerald-700">About PRAZ</a></li></ul></div>
        <div><h3 class="text-sm font-bold">Contact</h3><ul class="mt-4 space-y-3 text-sm text-slate-500"><li class="flex gap-2"><Icon name="lucide:map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />160 Rhodesville Avenue, Harare</li><li class="flex gap-2"><Icon name="lucide:phone" class="h-4 w-4 text-emerald-700" />+263 242 795 991</li><li class="flex gap-2"><Icon name="lucide:mail" class="h-4 w-4 text-emerald-700" />info@praz.org.zw</li></ul></div>
      </div>
      <div class="border-t border-slate-100"><div class="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>&copy; {{ new Date().getFullYear() }} Procurement Regulatory Authority of Zimbabwe.</p><p>Transparency · Fairness · Value for money</p></div></div>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({
  title: 'Supplier Opportunities — Zimbabwe Electronic Procurement Platform',
  meta: [{ name: 'description', content: 'Find public tenders, register your supplier business and submit bids through Zimbabwe’s official electronic procurement platform.' }],
})

const { getPublishedTenders, getPublicConsultancyEois, getTenderStats } = usePublicTenderHelper()
const searchQuery = ref('')
const searchCategory = ref('')
const activeTenderFilter = ref('all')
const tenders = ref([])
const eoiCount = ref(0)
const loadingTenders = ref(true)
const tendersError = ref(null)
const loadingStats = ref(true)
const stats = ref({ active_tenders: 0, closing_soon: 0, entities: 0, categories: [], methods: [] })

const trustPoints = [
  { label: 'Verified opportunities', icon: 'lucide:badge-check' },
  { label: 'Secure bid submission', icon: 'lucide:shield-check' },
  { label: 'Transparent process', icon: 'lucide:scan-eye' },
]
const howItWorks = [
  { icon: 'lucide:building-2', title: 'Register your organisation', description: 'Create an account, complete the business profile and provide the required compliance information.' },
  { icon: 'lucide:search', title: 'Discover opportunities', description: 'Search live public tenders and focus on opportunities matching your products and services.' },
  { icon: 'lucide:file-lock-2', title: 'Prepare and submit', description: 'Build your response, secure the bid and submit it before the published closing deadline.' },
  { icon: 'lucide:chart-no-axes-column-increasing', title: 'Track the outcome', description: 'Monitor submission progress and follow procurement decisions from your supplier workspace.' },
]

const activeTenderCount = computed(() => (stats.value.active_tenders ?? 0) + eoiCount.value)
const closingSoonCount = computed(() => stats.value.closing_soon ?? 0)
const tenderFilters = computed(() => [
  { label: 'All methods', value: 'all', count: (stats.value.active_tenders ?? 0) + eoiCount.value },
  ...(stats.value.methods ?? []).map(method => ({ label: method.name, value: String(method.id), count: method.count })),
])
const categories = computed(() => (stats.value.categories ?? []).map(category => ({ ...category, icon: categoryIcon(category.name) })))
const filteredTenders = computed(() => tenders.value)

async function loadStats() {
  loadingStats.value = true
  const response = await getTenderStats()
  if (response.ok) stats.value = response.data?.data ?? stats.value
  loadingStats.value = false
}

async function loadTenders() {
  loadingTenders.value = true
  tendersError.value = null
  const params = {
    search: searchQuery.value.trim() || undefined,
    procurementgroup_id: searchCategory.value || undefined,
    procurementmethod_id: activeTenderFilter.value !== 'all' ? activeTenderFilter.value : undefined,
    per_page: 9,
  }
  const [tenderResponse, eoiResponse] = await Promise.all([
    getPublishedTenders(params),
    getPublicConsultancyEois({ ...params, status: 'ACTIVE' }),
  ])
  const eois = eoiResponse.ok ? eoiResponse.data?.data ?? [] : []
  const publishedTenders = tenderResponse.ok ? tenderResponse.data?.data?.data ?? [] : []
  eoiCount.value = eois.length
  tenders.value = [...eois, ...publishedTenders]
  if (!tenderResponse.ok && !eoiResponse.ok) tendersError.value = tenderResponse.error || eoiResponse.error
  loadingTenders.value = false
}

async function handleSearch() {
  activeTenderFilter.value = 'all'
  await loadTenders()
  scrollToTenders()
}
async function selectMethodFilter(value) {
  activeTenderFilter.value = value
  await loadTenders()
}
async function selectCategory(id) {
  searchCategory.value = String(id)
  activeTenderFilter.value = 'all'
  await loadTenders()
  scrollToTenders()
}
async function clearSearch() {
  searchQuery.value = ''
  searchCategory.value = ''
  activeTenderFilter.value = 'all'
  await loadTenders()
  scrollToTenders()
}

function scrollTo(sectionId) {
  if (import.meta.client) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
}
const scrollToTenders = () => scrollTo('current-tenders')
const scrollToCategories = () => scrollTo('categories')
const scrollToHowItWorks = () => scrollTo('how-it-works')

function formatNumber(value) {
  return new Intl.NumberFormat('en-ZW').format(Number(value ?? 0))
}
function daysLeft(dateValue) {
  if (!dateValue) return 'Open'
  const days = Math.ceil((new Date(dateValue).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}
function isClosingSoon(dateValue) {
  if (!dateValue) return false
  const difference = new Date(dateValue).getTime() - Date.now()
  return difference > 0 && difference < 72 * 3600000
}
function categoryIcon(name) {
  const value = String(name ?? '').toLowerCase()
  const matches = [
    [['construction', 'works', 'road'], 'lucide:hard-hat'],
    [['ict', 'technology', 'software'], 'lucide:monitor-cog'],
    [['medical', 'health', 'pharma'], 'lucide:heart-pulse'],
    [['consult', 'advisory'], 'lucide:briefcase-business'],
    [['transport', 'vehicle', 'fleet'], 'lucide:truck'],
    [['security'], 'lucide:shield-check'],
    [['agri', 'farm'], 'lucide:wheat'],
    [['energy', 'power', 'electric'], 'lucide:zap'],
    [['education', 'school', 'training'], 'lucide:graduation-cap'],
    [['water', 'sanitation'], 'lucide:droplets'],
  ]
  return matches.find(([terms]) => terms.some(term => value.includes(term)))?.[1] ?? 'lucide:package'
}

const isEoi = opportunity => opportunity.opportunity_type === 'EXPRESSION_OF_INTEREST'
const opportunityLink = opportunity => opportunity.detail_path || `/tenders/${opportunity.uuid}`

onMounted(() => Promise.all([loadStats(), loadTenders()]))
</script>
