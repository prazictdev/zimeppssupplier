<template>
  <div class="space-y-6">
    <section v-if="showWallets" aria-labelledby="balances-heading">
      <div class="mb-3 flex items-end justify-between gap-4">
        <div>
          <p class="section-kicker">Funds</p>
          <h2 id="balances-heading" class="mt-1 text-lg font-bold">Available balances</h2>
        </div>
        <NuxtLink to="/supplierstatement" class="btn btn-ghost btn-sm">View statement</NuxtLink>
      </div>
      <!-- Loading skeleton -->
      <div v-if="walletStore.pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="skeleton h-28" />
      </div>

      <Wallets v-else :wallets="wallets" />
    </section>

    <section v-if="workspaceTabs.length" aria-labelledby="activity-heading" class="space-y-4">
      <div>
        <p class="section-kicker">Your activity</p>
        <h2 id="activity-heading" class="mt-1 text-lg font-bold">Procurement workspace</h2>
      </div>

      <div class="hidden overflow-x-auto rounded-box border border-base-200 bg-base-100 p-2 shadow-sm md:block">
        <div role="tablist" aria-label="Supplier activity" class="tabs tabs-box grid w-full min-w-[42rem] grid-flow-col auto-cols-fr gap-3 bg-base-200/60 p-2">
          <button
            v-for="tab in workspaceTabs"
            :id="`dashboard-tab-${tab.key}`"
            :key="tab.key"
            type="button"
            role="tab"
            class="tab h-12 w-full min-w-0 gap-2 rounded-field border px-4 font-semibold transition-colors"
            :class="activeTab === tab.key ? tab.activeClasses : 'border-base-300 bg-base-100 text-base-content/60 hover:border-base-content/30 hover:text-base-content'"
            :aria-selected="activeTab === tab.key"
            :aria-controls="`dashboard-panel-${tab.key}`"
            @click="selectTab(tab.key)"
          >
            <span class="grid h-7 w-7 place-items-center rounded-lg" :class="tab.iconClasses">
              <Icon :name="tab.icon" class="h-4 w-4" />
            </span>
            {{ tab.label }}
            <span v-if="tabCount(tab.key) !== null" class="badge badge-sm border-0 bg-base-100/80 text-base-content">
              {{ tabCount(tab.key) }}
            </span>
          </button>
        </div>
      </div>

      <div
        v-if="activeTab === 'registrations'"
        id="dashboard-panel-registrations"
        role="tabpanel"
        aria-labelledby="dashboard-tab-registrations"
        class="hidden md:block"
      >
        <RegistrationSummary :allow-autorenewal="showAutorenewals" />
      </div>

      <div
        v-else-if="activeTabDefinition"
        :id="`dashboard-panel-${activeTab}`"
        role="tabpanel"
        :aria-labelledby="`dashboard-tab-${activeTab}`"
        class="card card-border hidden bg-base-100 md:block"
      >
        <div class="flex flex-col gap-3 border-b border-base-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <div class="rounded-lg p-2" :class="activeTabDefinition.iconClasses">
              <Icon :name="activeTabDefinition.icon" class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-semibold">{{ activeTabDefinition.panelTitle }}</h3>
              <p class="text-xs text-base-content/50">{{ activeTabDefinition.description }}</p>
            </div>
          </div>
          <NuxtLink :to="activeTabDefinition.to" class="btn btn-ghost btn-sm gap-2">
            Open full page
            <Icon name="lucide:arrow-up-right" class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div class="card-body p-4 sm:p-5">
          <div v-if="activeState.loading" class="space-y-3" aria-label="Loading activity">
            <div v-for="item in 4" :key="item" class="skeleton h-12 w-full" />
          </div>

          <div v-else-if="activeState.error" role="alert" class="alert alert-error alert-soft">
            <Icon name="lucide:circle-alert" class="h-5 w-5" />
            <span class="flex-1">{{ activeState.error }}</span>
            <button type="button" class="btn btn-error btn-sm" @click="loadTab(activeTab, true)">Retry</button>
          </div>

          <div v-else-if="activeTab === 'contracts'" class="flex flex-col items-center py-10 text-center">
            <div class="rounded-full bg-success/10 p-4 text-success">
              <Icon name="lucide:file-signature" class="h-8 w-8" />
            </div>
            <h3 class="mt-4 font-semibold">Contract management is being prepared</h3>
            <p class="mt-1 max-w-lg text-sm text-base-content/55">Awarded contracts, digital signing, milestones and delivery tracking will appear here when the contract service is enabled.</p>
          </div>

          <div v-else-if="!activeState.items.length" class="flex flex-col items-center py-10 text-center">
            <div class="rounded-full bg-base-200 p-4 text-base-content/30">
              <Icon :name="activeTabDefinition.emptyIcon" class="h-8 w-8" />
            </div>
            <h3 class="mt-4 font-semibold">{{ activeTabDefinition.emptyTitle }}</h3>
            <p class="mt-1 max-w-lg text-sm text-base-content/50">{{ activeTabDefinition.emptyDescription }}</p>
          </div>

          <div v-else-if="activeTab === 'tenders'" class="overflow-x-auto">
            <table class="table table-sm">
              <thead><tr><th>Opportunity</th><th>Entity</th><th>Closing</th><th>Status</th><th></th></tr></thead>
              <tbody>
                <tr v-for="bid in activeState.items.slice(0, 5)" :key="bid.uuid" class="hover">
                  <td><p class="font-semibold">{{ bid.title }}</p><p class="text-xs text-base-content/50">{{ bid.reference || '—' }}</p></td>
                  <td>{{ bid.entity || '—' }}</td>
                  <td>{{ formatDateTime(bid.closing_at) }}</td>
                  <td><span class="badge badge-sm" :class="bid.status === 'DRAFT' ? 'badge-warning badge-soft' : 'badge-success badge-soft'">{{ pretty(bid.status) }}</span></td>
                  <td class="text-right"><NuxtLink :to="bidLink(bid)" class="btn btn-ghost btn-xs">View</NuxtLink></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="activeTab === 'awards'" class="overflow-x-auto">
            <table class="table table-sm">
              <thead><tr><th>Opportunity</th><th>Recommended supplier</th><th>Amount</th><th>Status</th><th>Published</th></tr></thead>
              <tbody>
                <tr v-for="award in activeState.items.slice(0, 5)" :key="award.uuid" class="hover">
                  <td><p class="font-semibold">{{ award.tender?.title || '—' }}</p><p class="text-xs text-base-content/50">{{ award.tender?.entity?.name || 'Procuring entity' }}</p></td>
                  <td>{{ award.supplier?.name || '—' }}</td>
                  <td class="font-mono">{{ formatMoney(award.amount, award.currency_code) }}</td>
                  <td><span class="badge badge-sm" :class="award.status === 'FINALIZED' ? 'badge-success badge-soft' : 'badge-warning badge-soft'">{{ pretty(award.status) }}</span></td>
                  <td>{{ formatDateTime(award.published_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else-if="activeTab === 'bonds'" class="overflow-x-auto">
            <table class="table table-sm">
              <thead><tr><th>Tender</th><th>Amount</th><th>Paid</th><th>Maturity</th><th>Refund</th></tr></thead>
              <tbody>
                <tr v-for="bond in activeState.items.slice(0, 5)" :key="bond.uuid" class="hover">
                  <td><p class="font-semibold">{{ bond.tender?.reference || bond.tender?.title || '—' }}</p><p class="max-w-sm truncate text-xs text-base-content/50">{{ bond.tender?.title || '—' }}</p></td>
                  <td class="font-mono font-semibold">{{ bond.currency || '' }} {{ formatAmount(bond.amount) }}</td>
                  <td>{{ formatDate(bond.paid_at) }}</td>
                  <td><span class="badge badge-sm" :class="maturityClass(bond.maturity_status)">{{ pretty(bond.maturity_status) }}</span></td>
                  <td><span class="badge badge-sm badge-outline">{{ pretty(bond.refund_status) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-4 md:hidden">
        <RegistrationSummary
          v-if="hasRegistrationTab"
          :allow-autorenewal="showAutorenewals"
        />

        <article
          v-for="tab in mobileActivityTabs"
          :key="`mobile-${tab.key}`"
          class="card card-border overflow-hidden bg-base-100"
        >
          <div class="flex items-center justify-between gap-3 border-b border-base-200 px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <div class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" :class="tab.iconClasses">
                <Icon :name="tab.icon" class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <h3 class="truncate font-semibold">{{ tab.panelTitle }}</h3>
                <p class="truncate text-xs text-base-content/50">{{ tab.description }}</p>
              </div>
            </div>
            <NuxtLink :to="tab.to" class="btn btn-ghost btn-square btn-sm" :aria-label="`Open ${tab.label}`">
              <Icon name="lucide:arrow-up-right" class="h-4 w-4" />
            </NuxtLink>
          </div>

          <div class="card-body p-0">
            <div v-if="tabStates[tab.key].loading" class="space-y-2 p-4" :aria-label="`Loading ${tab.label}`">
              <div v-for="item in 3" :key="item" class="skeleton h-14 w-full" />
            </div>

            <div v-else-if="tabStates[tab.key].error" role="alert" class="alert alert-error alert-soft m-4 w-auto">
              <Icon name="lucide:circle-alert" class="h-5 w-5" />
              <span class="min-w-0 flex-1 text-sm">{{ tabStates[tab.key].error }}</span>
              <button type="button" class="btn btn-error btn-xs" @click="loadTab(tab.key, true)">Retry</button>
            </div>

            <div v-else-if="tab.key === 'contracts'" class="px-5 py-8 text-center">
              <Icon name="lucide:file-signature" class="mx-auto h-8 w-8 text-success" />
              <h4 class="mt-3 font-semibold">Contract management is being prepared</h4>
              <p class="mt-1 text-sm text-base-content/55">Awarded contracts and delivery milestones will appear here when the service is enabled.</p>
            </div>

            <div v-else-if="!tabStates[tab.key].items.length" class="px-5 py-8 text-center">
              <Icon :name="tab.emptyIcon" class="mx-auto h-8 w-8 text-base-content/25" />
              <h4 class="mt-3 font-semibold">{{ tab.emptyTitle }}</h4>
              <p class="mt-1 text-sm text-base-content/50">{{ tab.emptyDescription }}</p>
            </div>

            <ul v-else-if="tab.key === 'tenders'" class="list">
              <li v-for="bid in tabStates.tenders.items.slice(0, 3)" :key="bid.uuid" class="list-row items-center border-b border-base-200 last:border-b-0">
                <div class="list-col-grow min-w-0">
                  <p class="truncate text-sm font-semibold">{{ bid.title }}</p>
                  <p class="truncate text-xs text-base-content/50">{{ bid.reference || '—' }} · Closes {{ formatDate(bid.closing_at) }}</p>
                </div>
                <span class="badge badge-sm" :class="bid.status === 'DRAFT' ? 'badge-warning badge-soft' : 'badge-success badge-soft'">{{ pretty(bid.status) }}</span>
                <NuxtLink :to="bidLink(bid)" class="btn btn-ghost btn-square btn-sm" :aria-label="`View ${bid.title}`"><Icon name="lucide:chevron-right" /></NuxtLink>
              </li>
            </ul>

            <ul v-else-if="tab.key === 'awards'" class="list">
              <li v-for="award in tabStates.awards.items.slice(0, 3)" :key="award.uuid" class="list-row items-center border-b border-base-200 last:border-b-0">
                <div class="list-col-grow min-w-0">
                  <p class="truncate text-sm font-semibold">{{ award.tender?.title || 'Award notice' }}</p>
                  <p class="truncate text-xs text-base-content/50">{{ award.supplier?.name || '—' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold">{{ formatMoney(award.amount, award.currency_code) }}</p>
                  <span class="badge badge-xs" :class="award.status === 'FINALIZED' ? 'badge-success badge-soft' : 'badge-warning badge-soft'">{{ pretty(award.status) }}</span>
                </div>
              </li>
            </ul>

            <ul v-else-if="tab.key === 'bonds'" class="list">
              <li v-for="bond in tabStates.bonds.items.slice(0, 3)" :key="bond.uuid" class="list-row items-center border-b border-base-200 last:border-b-0">
                <div class="list-col-grow min-w-0">
                  <p class="truncate text-sm font-semibold">{{ bond.tender?.reference || bond.tender?.title || 'Bid bond' }}</p>
                  <p class="truncate text-xs text-base-content/50">Paid {{ formatDate(bond.paid_at) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold">{{ bond.currency || '' }} {{ formatAmount(bond.amount) }}</p>
                  <span class="badge badge-xs" :class="maturityClass(bond.maturity_status)">{{ pretty(bond.maturity_status) }}</span>
                </div>
              </li>
            </ul>

            <div v-if="tabStates[tab.key].items.length > 3" class="border-t border-base-200 px-4 py-3 text-center">
              <NuxtLink :to="tab.to" class="btn btn-ghost btn-sm">View all {{ tab.label.toLowerCase() }}</NuxtLink>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="!showWallets && !showRegistrations"
      class="card card-border bg-base-100"
    >
      <div class="card-body items-center py-12 text-center">
        <Icon name="lucide:layout-dashboard" class="h-10 w-10 text-base-content/25" />
        <h2 class="card-title mt-2 text-base">Workspace ready</h2>
        <p class="text-sm text-base-content/50">More information will appear when the related permissions are assigned.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  company: { type: Object, required: true },
  wallets: { type: Array, required: true },
  showWallets: { type: Boolean, default: false },
  showRegistrations: { type: Boolean, default: false },
  showAutorenewals: { type: Boolean, default: false },
})

const walletStore = useWalletStore()
const registrationStore = useRegistrationStore()
const autorenewalStore = useAutorenewalStore()
const { can } = useAbility()
const { listBids } = useBidResponse()
const { listAwards } = useSupplierAwards()
const bidBondApi = useBidBondManagement()

const workspaceTabs = computed(() => [
  { key: 'registrations', label: 'Registrations', to: '/supplierregistrations', icon: 'lucide:clipboard-list', permission: 'can.access.myregistrations', activeClasses: 'tab-active border-primary bg-primary text-primary-content shadow-sm', iconClasses: 'bg-primary/10 text-primary', panelTitle: 'Supplier registrations' },
  { key: 'tenders', label: 'My Tenders', to: '/mysupplierbids', icon: 'lucide:file-lock-2', permission: 'can.access.mysupplierbids', activeClasses: 'tab-active border-info bg-info text-info-content shadow-sm', iconClasses: 'bg-info/15 text-info', panelTitle: 'My tenders and EOIs', description: 'Continue drafts and track sealed submissions.', emptyIcon: 'lucide:file-search', emptyTitle: 'No tenders added yet', emptyDescription: 'Browse opportunities and add a tender or EOI when you are ready to respond.' },
  { key: 'awards', label: 'Awards', to: '/mysupplierawards', icon: 'lucide:award', permission: 'can.access.mysupplierwards', activeClasses: 'tab-active border-warning bg-warning text-warning-content shadow-sm', iconClasses: 'bg-warning/15 text-warning', panelTitle: 'Award notices', description: 'Review outcomes and applicable standstill periods.', emptyIcon: 'lucide:trophy', emptyTitle: 'No award notices yet', emptyDescription: 'Published outcomes for opportunities in which you participated will appear here.' },
  { key: 'contracts', label: 'Contracts', to: '/suppliercontracts', icon: 'lucide:file-signature', permission: 'can.access.suppliercontracts', activeClasses: 'tab-active border-success bg-success text-success-content shadow-sm', iconClasses: 'bg-success/15 text-success', panelTitle: 'Supplier contracts', description: 'Manage awarded contracts and delivery obligations.', emptyIcon: 'lucide:file-signature', emptyTitle: 'No contracts yet', emptyDescription: 'Awarded contracts will appear here.' },
  { key: 'bonds', label: 'Bid bonds', to: '/bid-bonds', icon: 'lucide:shield-check', permission: 'can.access.mytendering', activeClasses: 'tab-active border-accent bg-accent text-accent-content shadow-sm', iconClasses: 'bg-accent/15 text-accent', panelTitle: 'Bid bonds', description: 'Track paid securities, maturity and refund progress.', emptyIcon: 'lucide:shield', emptyTitle: 'No paid bid bonds found', emptyDescription: 'Paid tender securities will appear here with their maturity and refund status.' },
].filter(tab => can(tab.permission)))

const activeTab = ref('')
const tabStates = reactive({
  tenders: { items: [], loading: false, loaded: false, error: '' },
  awards: { items: [], loading: false, loaded: false, error: '' },
  contracts: { items: [], loading: false, loaded: true, error: '' },
  bonds: { items: [], loading: false, loaded: false, error: '' },
})

const activeTabDefinition = computed(() => workspaceTabs.value.find(tab => tab.key === activeTab.value))
const activeState = computed(() => tabStates[activeTab.value] ?? { items: [], loading: false, loaded: true, error: '' })
const hasRegistrationTab = computed(() => workspaceTabs.value.some(tab => tab.key === 'registrations'))
const mobileActivityTabs = computed(() => workspaceTabs.value.filter(tab => tab.key !== 'registrations'))
const registrationCount = computed(() => ['pending', 'awaiting', 'approved', 'rejected', 'expired']
  .reduce((total, key) => total + (registrationStore.registrations[key]?.length ?? 0), 0))

function tabCount(key) {
  if (key === 'registrations') return registrationCount.value
  if (key === 'contracts') return null
  return tabStates[key]?.loaded ? tabStates[key].items.length : null
}

async function selectTab(key) {
  activeTab.value = key
  await loadTab(key)
}

async function loadTab(key, force = false) {
  const state = tabStates[key]
  if (!state || state.loading || (state.loaded && !force)) return

  state.loading = true
  state.error = ''
  try {
    if (key === 'tenders') {
      const result = await listBids()
      if (!result.ok) throw new Error(result.error)
      state.items = result.data ?? []
    } else if (key === 'awards') {
      const response = await listAwards(1)
      state.items = response?.data?.data ?? []
    } else if (key === 'bonds') {
      const result = await bidBondApi.list(1)
      if (!result.ok) throw new Error(result.error)
      state.items = result.data?.data?.data ?? []
    }
    state.loaded = true
  } catch (error) {
    state.error = error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? 'This activity could not be loaded.'
  } finally {
    state.loading = false
  }
}

const pretty = value => String(value || '—').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, character => character.toUpperCase())
const formatDate = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value)) : '—'
const formatDateTime = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const formatAmount = value => Number(value || 0).toLocaleString('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatMoney = (value, currency) => `${currency || 'USD'} ${formatAmount(value)}`
const bidLink = bid => bid.status === 'DRAFT' && bid.can_edit
  ? (bid.response_type === 'EOI' ? `/expressions-of-interest/${bid.eoi_uuid}` : `/bids/${bid.tender_uuid}`)
  : (bid.response_type === 'EOI' ? `/expressions-of-interest/${bid.eoi_uuid}` : `/supplieropportunities/${bid.tender_uuid}`)
const maturityClass = status => status === 'MATURED' ? 'badge-error badge-soft' : status === 'DUE_SOON' ? 'badge-warning badge-soft' : 'badge-success badge-soft'

onMounted(() => {
  activeTab.value = workspaceTabs.value[0]?.key ?? ''
  if (props.showRegistrations) registrationStore.fetchRegistrations()
  if (props.showRegistrations && props.showAutorenewals) autorenewalStore.fetch()
  mobileActivityTabs.value.forEach(tab => loadTab(tab.key))
})
</script>
