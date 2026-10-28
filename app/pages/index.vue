<template>
  <div class="min-h-screen overflow-hidden bg-[#f7f9f7] text-slate-900">
    <main>
      <section class="relative overflow-hidden border-b border-sky-900/10 bg-[#eaf7fb]">
        <div class="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full border-[64px] border-white/55" />
        <div class="pointer-events-none absolute -left-20 bottom-24 h-56 w-56 rounded-full border-[44px] border-sky-200/35" />

        <div class="app-shell relative px-5 pb-8 pt-14 sm:px-8 sm:pt-20 lg:pb-10 lg:pt-24">
          <div class="grid gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:items-center">
            <div>
              <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-900/10 bg-white/75 px-3 py-1.5 text-xs font-bold text-[#163369] shadow-sm">
                <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span class="relative h-2 w-2 rounded-full bg-emerald-600" /></span>
                {{ formatNumber(activeTenderCount) }} public opportunities open now
              </div>

              <p class="mb-3 text-sm font-bold tracking-wide text-emerald-700">ZimEpps · Zimbabwe's public procurement platform</p>
              <h1 class="max-w-xl text-3xl font-extrabold leading-[1.12] tracking-[-0.025em] text-[#101d3f] sm:text-4xl lg:text-[2.65rem]">
                Find opportunities. Submit confidently. Win contracts.
              </h1>
              <p class="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Find government tenders that fit your business, prepare a compliant response and track your bid through to contract.
              </p>

              <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" class="btn h-12 border-[#182b67] bg-[#182b67] px-6 text-sm text-white hover:border-[#101d3f] hover:bg-[#101d3f]" @click="scrollToTenders">
                  Browse opportunities <Icon name="lucide:arrow-right" class="h-4 w-4" />
                </button>
                <NuxtLink to="/register" class="btn btn-outline h-12 border-[#182b67]/35 bg-white/60 px-6 text-sm text-[#182b67] hover:border-[#182b67] hover:bg-white">
                  Create supplier account
                </NuxtLink>
              </div>

              <button type="button" class="group mt-7 hidden items-center gap-3 text-sm font-bold text-[#182b67] md:inline-flex" @click="scrollToHowItWorks">
                <span class="flex h-10 w-10 items-center justify-center rounded-full border border-[#182b67]/25 bg-white transition group-hover:border-[#182b67] group-hover:shadow-md"><Icon name="lucide:play" class="ml-0.5 h-4 w-4" /></span>
                See how ZimEpps works
              </button>
            </div>

            <div id="how-it-works" class="card card-border relative hidden scroll-mt-24 border-[#182b67]/20 bg-white/80 shadow-2xl shadow-sky-900/10 md:block">
              <div class="card-body gap-0 p-6 sm:p-8 lg:p-9">
              <div class="mb-9">
                <div>
                  <p class="text-sm font-semibold text-emerald-700">From opportunity to contract</p>
                  <h2 class="mt-1 text-2xl font-black tracking-tight text-[#101d3f] sm:text-3xl">Your tender response journey</h2>
                  <p class="mt-2 max-w-xl text-sm leading-6 text-slate-500">A clear path for suppliers responding to a public tender on ZimEpps.</p>
                </div>
              </div>

              <div class="relative grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-5 sm:gap-3">
                <div class="absolute left-[10%] right-[10%] top-10 hidden border-t-2 border-dashed border-[#182b67]/25 sm:block" />
                <div v-for="(stage, index) in procurementJourney" :key="stage.title" class="relative flex min-w-0 flex-col items-center text-center last:col-span-2 sm:last:col-span-1">
                  <span class="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-[6px] bg-white shadow-lg shadow-sky-900/10" :class="index % 2 === 0 ? 'border-[#182b67] text-[#182b67]' : 'border-emerald-600 text-emerald-700'">
                    <Icon :name="stage.icon" class="h-7 w-7" />
                    <span class="absolute -right-1 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-xs font-black shadow ring-1 ring-slate-200">{{ index + 1 }}</span>
                  </span>
                  <p class="mt-4 text-sm font-black leading-5 text-[#101d3f]">{{ stage.title }}</p>
                  <p class="mt-1 max-w-28 text-[11px] leading-4 text-slate-500">{{ stage.description }}</p>
                </div>
              </div>

              <div class="mt-9 flex items-center justify-center gap-3 rounded-xl bg-[#eef8f4] px-4 py-3 text-center text-xs font-semibold text-slate-600">
                <Icon name="lucide:shield-check" class="h-4 w-4 shrink-0 text-emerald-700" />
                Your response stays secure and traceable at every stage
              </div>
              </div>
            </div>
          </div>

          <div class="stats mt-14 hidden w-full overflow-hidden border border-[#182b67]/20 bg-white shadow-xl shadow-sky-900/10 md:grid md:grid-cols-2 lg:grid-cols-5">
            <div v-for="metric in heroMetrics" :key="metric.label" class="stat min-w-0 border-b border-slate-200 px-5 py-5 last:border-b-0 sm:border-b sm:border-r sm:[&:nth-child(even)]:border-r-0 lg:border-b-0 lg:border-r lg:[&:nth-child(even)]:border-r lg:last:border-r-0">
              <div class="stat-figure ml-2">
                <span class="flex h-10 w-10 items-center justify-center rounded-xl" :class="metric.surface"><Icon :name="metric.icon" class="h-5 w-5" /></span>
              </div>
              <div class="stat-value text-2xl font-black text-[#101d3f]">{{ formatNumber(metric.value) }}</div>
              <div class="stat-desc mt-1 whitespace-normal text-xs font-medium text-slate-500">{{ metric.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="current-tenders" class="scroll-mt-24 py-16 sm:py-20">
        <div class="app-shell px-5 sm:px-8">
          <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-3xl font-black tracking-tight sm:text-4xl">Live Opportunities</h2>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Current public procurement opportunities published by registered procuring entities.</p>
            </div>
            <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <Icon name="lucide:search" class="ml-2 h-4 w-4 text-slate-400" />
              <input v-model="searchQuery" type="search" class="w-full min-w-0 bg-transparent px-1 text-sm outline-none sm:w-64" placeholder="Search opportunities" @keyup.enter="handleSearch">
              <button class="btn btn-primary btn-sm" @click="handleSearch">Search</button>
            </div>
          </div>

          <div v-if="tenderFilters.length > 1" class="mt-7 flex gap-2 overflow-x-auto pb-2">
            <button v-for="filter in tenderFilters" :key="filter.value" type="button" class="btn btn-sm shrink-0 rounded-full border" :class="activeTenderFilter === filter.value ? 'btn-primary border-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'" @click="selectMethodFilter(filter.value)">
              {{ filter.label }} <span class="ml-1 opacity-60">{{ filter.count }}</span>
            </button>
          </div>

          <div v-if="loadingTenders" class="mt-8">
            <div class="grid gap-4 md:hidden">
              <div v-for="index in 3" :key="`mobile-${index}`" class="card card-border border-slate-200 bg-white shadow-sm">
                <div class="card-body gap-3 p-5">
                  <div class="flex items-center justify-between gap-3"><div class="skeleton h-4 w-24" /><div class="skeleton h-5 w-20 rounded-full" /></div>
                  <div class="skeleton h-5 w-full" />
                  <div class="skeleton h-5 w-3/4" />
                  <div class="skeleton mt-2 h-4 w-44" />
                  <div class="skeleton h-11 w-full rounded-lg" />
                </div>
              </div>
            </div>
            <div class="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table class="table min-w-[960px]">
                <thead class="bg-slate-50 text-xs text-slate-500">
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
            <button v-if="searchQuery || activeTenderFilter !== 'all'" class="btn btn-ghost btn-sm mt-4" @click="clearSearch">Clear search</button>
          </div>

          <div v-else class="mt-8">
            <div class="grid gap-4 md:hidden">
              <article v-for="tender in filteredTenders" :key="`mobile-${tender.uuid}`" class="card card-border border-slate-200 bg-white shadow-sm">
                <div class="card-body gap-0 p-5">
                  <div class="flex items-start justify-between gap-3">
                    <span class="font-mono text-[11px] font-semibold uppercase tracking-wide text-slate-500">{{ tender.reference || 'Pending' }}</span>
                    <span class="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold" :class="isClosingSoon(tender.closing_at) ? 'text-red-600' : 'text-slate-600'">
                      <Icon name="lucide:clock-3" class="h-3.5 w-3.5" />{{ daysLeft(tender.closing_at) }}
                    </span>
                  </div>

                  <NuxtLink :to="opportunityLink(tender)" class="mt-3 text-base font-black leading-6 text-[#101d3f]">
                    {{ tender.title }}
                  </NuxtLink>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span v-if="isEoi(tender)" class="badge border-0 bg-amber-100 text-[10px] font-bold text-amber-900">Expression of Interest</span>
                    <span class="badge border-0 bg-emerald-50 text-[10px] font-semibold text-emerald-800">{{ tender.category || 'Public procurement' }}</span>
                  </div>

                  <div class="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
                    <p class="flex items-start gap-2 text-slate-600"><Icon name="lucide:landmark" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span>{{ tender.entity || 'Procuring entity' }}</span></p>
                    <p class="flex items-start gap-2 text-slate-600"><Icon name="lucide:gavel" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><span><strong class="font-semibold text-slate-700">{{ tender.method || 'Tender' }}</strong><span class="block text-xs text-slate-400">{{ tender.required_bid_bond ? 'Bid bond required' : tender.allowed_participants || 'Open participation' }}</span></span></p>
                  </div>

                  <div class="card-actions mt-5">
                    <NuxtLink :to="opportunityLink(tender)" class="btn btn-primary w-full">View opportunity <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink>
                  </div>
                </div>
              </article>
            </div>

            <div class="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table class="table min-w-[960px]">
                <thead class="bg-slate-50 text-xs text-slate-500">
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
                      <NuxtLink :to="opportunityLink(tender)" class="btn btn-outline btn-primary btn-sm whitespace-nowrap">View details <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink>
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

      <section id="system-modules" class="border-t border-slate-200 bg-[#f4f8f7] py-16 sm:py-24">
        <div class="app-shell px-5 sm:px-8">
          <div class="max-w-3xl">
            <p class="text-sm font-semibold text-emerald-700">Everything suppliers need in one place</p>
            <h2 class="mt-2 text-3xl font-black tracking-tight text-[#101d3f] sm:text-4xl">Your supplier portal</h2>
            <p class="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Manage your organisation, maintain registration, find opportunities and follow every bid from preparation through to contract.</p>
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article v-for="module in supplierModules" :key="module.title" class="card card-border bg-white shadow-sm transition-shadow hover:shadow-md">
              <div class="card-body gap-0 p-6">
                <div class="flex items-start justify-between gap-4">
                  <span class="flex h-12 w-12 items-center justify-center rounded-xl" :class="module.surface"><Icon :name="module.icon" class="h-6 w-6" /></span>
                  <span class="badge badge-ghost badge-sm whitespace-nowrap">{{ module.audience }}</span>
                </div>
                <h3 class="card-title mt-6 text-lg font-black text-[#101d3f]">{{ module.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">{{ module.description }}</p>
                <div class="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                  <span class="inline-flex items-center gap-2"><Icon name="lucide:circle-check" class="h-4 w-4 text-emerald-700" />{{ module.capability }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div class="app-shell grid gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
        <div><div class="flex items-center gap-3"><img src="/img/prazlogo.jpg" alt="Procurement Regulatory Authority of Zimbabwe logo" class="h-16 w-16 rounded-xl border border-slate-200 object-contain"><div><p class="text-sm font-black">ZimEpps</p><p class="text-xs text-slate-400">Zimbabwe Electronic Public Procurement System</p></div></div><p class="mt-4 max-w-sm text-sm leading-6 text-slate-500">Developed and maintained by the Procurement Regulatory Authority of Zimbabwe, which promotes transparent, fair, competitive and accountable public procurement.</p></div>
        <div><h3 class="text-sm font-bold">Suppliers</h3><ul class="mt-4 space-y-2 text-sm text-slate-500"><li><NuxtLink to="/register" class="hover:text-emerald-700">Register</NuxtLink></li><li><NuxtLink to="/login" class="hover:text-emerald-700">Sign in</NuxtLink></li><li><button class="hover:text-emerald-700" @click="scrollToTenders">Browse tenders</button></li></ul></div>
        <div><h3 class="text-sm font-bold">Platform</h3><ul class="mt-4 space-y-2 text-sm text-slate-500"><li><button class="hover:text-emerald-700" @click="scrollToSystemModules">Supplier modules</button></li><li><button class="hover:text-emerald-700" @click="scrollToHowItWorks">How it works</button></li><li><a href="https://www.praz.org.zw" class="hover:text-emerald-700">About PRAZ</a></li></ul></div>
        <div>
          <h3 class="text-sm font-bold">Contact</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-500">
            <li class="flex items-start gap-2"><Icon name="lucide:map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><address class="not-italic">9th Floor, Pearl House<br>61 Samora Machel Avenue<br>Harare, Zimbabwe</address></li>
            <li class="flex items-start gap-2"><Icon name="lucide:phone" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div class="space-y-1"><a href="tel:+263242790080" class="block hover:text-emerald-700">+263 242 790 080</a><span class="block">VOIP: <a href="tel:+2638688003491" class="hover:text-emerald-700">+263 868 800 3491</a> / <a href="tel:+2638688003492" class="hover:text-emerald-700">2</a></span><a href="tel:+263712899505" class="block hover:text-emerald-700">Cell: +263 71 289 9505</a></div></li>
            <li class="flex items-start gap-2"><Icon name="lucide:mail" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><div class="space-y-1"><a href="mailto:egpsupport@praz.org.zw" class="block break-all hover:text-emerald-700">egpsupport@praz.org.zw</a><a href="mailto:feedback@praz.org.zw" class="block break-all hover:text-emerald-700">feedback@praz.org.zw</a></div></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-100"><div class="app-shell flex flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>&copy; {{ new Date().getFullYear() }} Procurement Regulatory Authority of Zimbabwe.</p><p>ZimEpps is developed and maintained by PRAZ.</p></div></div>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({
  title: 'Supplier Opportunities',
  meta: [{ name: 'description', content: 'Find public tenders, register your supplier business and submit bids through Zimbabwe’s official electronic procurement platform.' }],
})

const { getPublishedTenders, getPublicConsultancyEois, getTenderStats } = usePublicTenderHelper()
const searchQuery = ref('')
const activeTenderFilter = ref('all')
const tenders = ref([])
const eoiCount = ref(0)
const loadingTenders = ref(true)
const tendersError = ref(null)
const loadingStats = ref(true)
const stats = ref({ active_tenders: 0, closing_soon: 0, entities: 0, categories: [], methods: [] })

const procurementJourney = [
  { title: 'Find a tender', description: 'Search and shortlist suitable opportunities', icon: 'lucide:search' },
  { title: 'Review', description: 'Confirm requirements and your eligibility', icon: 'lucide:clipboard-check' },
  { title: 'Prepare bid', description: 'Complete and check your response', icon: 'lucide:clipboard-pen-line' },
  { title: 'Encrypt & submit', description: 'Secure the bid, submit on time and track progress', icon: 'lucide:file-lock-2' },
  { title: 'Award & contract', description: 'Proceed to contracting when successful', icon: 'lucide:file-signature' },
]
const supplierModules = [
  { title: 'Organisation and team', audience: 'My organisation', icon: 'lucide:building-2', surface: 'bg-emerald-50 text-emerald-700', description: 'Maintain business details, contact information, industry categories and authorised portal users.', capability: 'Profile, documents and user access' },
  { title: 'Registrations and renewals', audience: 'My registrations', icon: 'lucide:badge-check', surface: 'bg-blue-50 text-blue-700', description: 'Apply for supplier categories, upload compliance documents and renew registrations before expiry.', capability: 'Applications, certificates and renewals' },
  { title: 'Tender opportunities', audience: 'My opportunities', icon: 'lucide:search', surface: 'bg-amber-50 text-amber-700', description: 'Search published tenders, review requirements and follow clarifications, addenda and closing dates.', capability: 'Tender discovery and tracking' },
  { title: 'Secure bid submissions', audience: 'My bids', icon: 'lucide:file-lock-2', surface: 'bg-violet-50 text-violet-700', description: 'Prepare bid responses, encrypt final submissions and submit securely before the deadline.', capability: 'Encrypted bid preparation and submission' },
  { title: 'Payments and bid security', audience: 'My finance', icon: 'lucide:wallet-cards', surface: 'bg-rose-50 text-rose-700', description: 'Manage wallet balances, settle invoices, review statements and monitor bid bond requirements.', capability: 'Wallet, invoices, payments and bid bonds' },
  { title: 'Awards and contracts', audience: 'My outcomes', icon: 'lucide:file-signature', surface: 'bg-cyan-50 text-cyan-700', description: 'View award notifications, follow successful bids and access resulting supplier contracts.', capability: 'Award results and contract visibility' },
]
const activeTenderCount = computed(() => (stats.value.active_tenders ?? 0) + eoiCount.value)
const closingSoonCount = computed(() => stats.value.closing_soon ?? 0)
const heroMetrics = computed(() => [
  { label: 'Open opportunities', value: activeTenderCount.value, icon: 'lucide:briefcase-business', surface: 'bg-blue-50 text-blue-700' },
  { label: 'Closing within 72 hours', value: closingSoonCount.value, icon: 'lucide:alarm-clock', surface: 'bg-amber-50 text-amber-700' },
  { label: 'Procuring entities', value: stats.value.entities ?? 0, icon: 'lucide:landmark', surface: 'bg-violet-50 text-violet-700' },
  { label: 'Active categories', value: categories.value.length, icon: 'lucide:layout-grid', surface: 'bg-cyan-50 text-cyan-700' },
  { label: 'Expressions of interest', value: eoiCount.value, icon: 'lucide:messages-square', surface: 'bg-rose-50 text-rose-700' },
])
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
async function clearSearch() {
  searchQuery.value = ''
  activeTenderFilter.value = 'all'
  await loadTenders()
  scrollToTenders()
}

function scrollTo(sectionId) {
  if (import.meta.client) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
}
const scrollToTenders = () => scrollTo('current-tenders')
const scrollToSystemModules = () => scrollTo('system-modules')
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
