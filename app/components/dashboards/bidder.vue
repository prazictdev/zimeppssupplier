<template>
  <div class="space-y-6">
    <section v-if="showWallets" aria-label="Available balances">
      <div class="mb-3 flex justify-end">
        <NuxtLink to="/supplierstatement" class="btn btn-ghost btn-sm">View statement</NuxtLink>
      </div>
      <!-- Loading skeleton -->
      <div v-if="walletStore.pending" class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="skeleton h-28" />
      </div>

      <Wallets v-else :wallets="wallets" />
    </section>

    <section v-if="workspaceTabs.length" aria-label="Procurement workspace" class="space-y-4">
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

      <div class="md:hidden">
        <div class="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 class="font-bold">Your procurement activity</h2>
            <p class="text-xs text-base-content/55">Tap a card to see the latest details.</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="tab in workspaceTabs"
            :key="`mobile-action-${tab.key}`"
            class="card card-sm relative border-2 shadow-sm"
            :class="[tab.cardClasses, isEmptyCategoriesCard(tab.key) ? 'col-span-2 min-h-0' : 'min-h-36']"
          >
            <NuxtLink
              v-if="tab.key === 'registrations'"
              to="/suppliernewapplication"
              class="btn btn-primary btn-xs absolute right-3 top-3 z-10 gap-1"
              aria-label="Start a new supplier category registration"
            >
              <Icon name="lucide:plus" class="h-3.5 w-3.5" aria-hidden="true" />
              New
            </NuxtLink>

            <button
              type="button"
              class="h-full w-full text-left transition active:scale-[0.98]"
              :aria-label="isEmptyCategoriesCard(tab.key) ? 'No active supplier category found. Get started' : `Show ${tab.mobileLabel || tab.label} details`"
              @click="openMobileTab(tab.key)"
            >
              <span v-if="isEmptyCategoriesCard(tab.key)" class="flex w-full items-center gap-4 p-4 pr-20">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-box bg-primary/15 text-primary">
                  <Icon name="lucide:folder-plus" class="h-6 w-6" aria-hidden="true" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-bold">My categories</span>
                  <span class="mt-0.5 block text-sm leading-5 text-base-content/65">No active supplier category found</span>
                  <span class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Tap to get started
                    <Icon name="lucide:arrow-right" class="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </span>

              <span v-else class="card-body w-full justify-between gap-4 p-4">
                <span class="flex items-start justify-between gap-2">
                  <span class="grid h-11 w-11 place-items-center rounded-box" :class="tab.iconClasses">
                    <Icon :name="tab.icon" class="h-5 w-5" aria-hidden="true" />
                  </span>
                  <Icon v-if="tab.key !== 'registrations'" name="lucide:arrow-up-right" class="h-4 w-4 text-base-content/35" aria-hidden="true" />
                </span>
                <span>
                  <span v-if="tabLoading(tab.key)" class="skeleton mb-1 block h-8 w-12" />
                  <span v-else class="block text-3xl font-black tabular-nums leading-none">{{ tabCount(tab.key) ?? 0 }}</span>
                  <span class="mt-2 block text-sm font-semibold leading-5">{{ tab.mobileLabel || tab.label }}</span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <dialog ref="mobileActivityDialog" class="modal modal-bottom sm:modal-middle" @close="activeMobileTab = ''">
          <div v-if="activeMobileTabDefinition" class="modal-box max-h-[92dvh] w-full max-w-3xl overflow-hidden p-0">
            <div class="flex items-center gap-3 border-b border-base-200 px-4 py-4">
              <div class="grid h-11 w-11 shrink-0 place-items-center rounded-box" :class="activeMobileTabDefinition.iconClasses">
                <Icon :name="activeMobileTabDefinition.icon" class="h-5 w-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-bold">{{ activeMobileTabDefinition.mobilePanelTitle || activeMobileTabDefinition.panelTitle }}</h3>
                <p class="line-clamp-2 text-xs leading-4 text-base-content/55">{{ activeMobileTabDefinition.description || 'Review your current supplier activity.' }}</p>
              </div>
              <form method="dialog">
                <button class="btn btn-ghost btn-circle btn-sm" aria-label="Close dialog">
                  <Icon name="lucide:x" class="h-5 w-5" aria-hidden="true" />
                </button>
              </form>
            </div>

            <div class="max-h-[calc(92dvh-8rem)] overflow-y-auto p-4">
              <RegistrationSummary
                v-if="activeMobileTab === 'registrations'"
                :allow-autorenewal="showAutorenewals"
              />

              <div v-else-if="activeMobileState.loading" class="space-y-3" :aria-label="`Loading ${activeMobileTabDefinition.label}`">
                <div v-for="item in 3" :key="item" class="skeleton h-24 w-full rounded-box" />
              </div>

              <div v-else-if="activeMobileState.error" role="alert" class="alert alert-error alert-soft alert-vertical items-stretch">
                <div class="flex items-center gap-2">
                  <Icon name="lucide:circle-alert" class="h-5 w-5 shrink-0" />
                  <span class="min-w-0 flex-1 text-sm">{{ activeMobileState.error }}</span>
                </div>
                <button type="button" class="btn btn-error btn-sm" @click="loadTab(activeMobileTab, true)">Retry</button>
              </div>

              <div v-else-if="activeMobileTab === 'contracts'" class="flex flex-col items-center py-10 text-center">
                <div class="rounded-full bg-success/10 p-4 text-success">
                  <Icon name="lucide:file-signature" class="h-8 w-8" aria-hidden="true" />
                </div>
                <h4 class="mt-4 font-semibold">Contract management is being prepared</h4>
                <p class="mt-1 max-w-md text-sm leading-6 text-base-content/55">Awarded contracts and delivery milestones will appear here when the service is enabled.</p>
              </div>

              <div v-else-if="!activeMobileState.items.length" class="flex flex-col items-center py-10 text-center">
                <div class="rounded-full bg-base-200 p-4 text-base-content/35">
                  <Icon :name="activeMobileTabDefinition.emptyIcon" class="h-8 w-8" aria-hidden="true" />
                </div>
                <h4 class="mt-4 font-semibold">{{ activeMobileTabDefinition.emptyTitle }}</h4>
                <p class="mt-1 max-w-md text-sm leading-6 text-base-content/55">{{ activeMobileTabDefinition.emptyDescription }}</p>
              </div>

              <div v-else-if="activeMobileTab === 'tenders'" class="space-y-3">
                <NuxtLink
                  v-for="bid in activeMobileState.items.slice(0, 5)"
                  :key="bid.uuid"
                  :to="bidLink(bid)"
                  class="card card-sm card-border bg-base-100"
                >
                  <span class="card-body gap-2 p-4">
                    <span class="flex items-start justify-between gap-2">
                      <span class="min-w-0 flex-1 text-sm font-semibold leading-5">{{ bid.title }}</span>
                      <span class="badge badge-sm shrink-0" :class="bid.status === 'DRAFT' ? 'badge-warning badge-soft' : 'badge-success badge-soft'">{{ pretty(bid.status) }}</span>
                    </span>
                    <span class="flex items-end justify-between gap-3 text-xs text-base-content/55">
                      <span><span class="block font-mono">{{ bid.reference || '—' }}</span><span>Closes {{ formatDate(bid.closing_at) }}</span></span>
                      <Icon name="lucide:chevron-right" class="h-4 w-4 shrink-0" aria-hidden="true" />
                    </span>
                  </span>
                </NuxtLink>
              </div>

              <div v-else-if="activeMobileTab === 'awards'" class="space-y-3">
                <div v-for="award in activeMobileState.items.slice(0, 5)" :key="award.uuid" class="card card-sm card-border bg-base-100">
                  <div class="card-body gap-2 p-4">
                    <div class="flex items-start justify-between gap-2">
                      <p class="min-w-0 flex-1 text-sm font-semibold leading-5">{{ award.tender?.title || 'Award notice' }}</p>
                      <span class="badge badge-sm shrink-0" :class="award.status === 'FINALIZED' ? 'badge-success badge-soft' : 'badge-warning badge-soft'">{{ pretty(award.status) }}</span>
                    </div>
                    <div class="flex items-end justify-between gap-3 text-xs">
                      <p class="min-w-0 truncate text-base-content/55">{{ award.supplier?.name || 'Supplier not specified' }}</p>
                      <p class="shrink-0 font-semibold">{{ formatMoney(award.amount, award.currency_code) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="activeMobileTab === 'bonds'" class="space-y-3">
                <div v-for="bond in activeMobileState.items.slice(0, 5)" :key="bond.uuid" class="card card-sm card-border bg-base-100">
                  <div class="card-body gap-2 p-4">
                    <div class="flex items-start justify-between gap-2">
                      <p class="min-w-0 flex-1 text-sm font-semibold leading-5">{{ bond.tender?.reference || bond.tender?.title || 'Bid bond' }}</p>
                      <span class="badge badge-sm shrink-0" :class="maturityClass(bond.maturity_status)">{{ pretty(bond.maturity_status) }}</span>
                    </div>
                    <div class="flex items-end justify-between gap-3 text-xs">
                      <p class="text-base-content/55">Paid {{ formatDate(bond.paid_at) }}</p>
                      <p class="shrink-0 font-semibold">{{ bond.currency || '' }} {{ formatAmount(bond.amount) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-action mt-4">
                <NuxtLink :to="activeMobileTabDefinition.to" class="btn btn-primary btn-block">
                  Open full {{ (activeMobileTabDefinition.mobileLabel || activeMobileTabDefinition.label).toLowerCase() }} page
                  <Icon name="lucide:arrow-up-right" class="h-4 w-4" aria-hidden="true" />
                </NuxtLink>
              </div>
            </div>
          </div>
          <form method="dialog" class="modal-backdrop"><button>Close</button></form>
        </dialog>
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
const mobileActivityDialog = ref(null)
const activeMobileTab = ref('')

const workspaceTabs = computed(() => [
  { key: 'registrations', label: 'Registrations', mobileLabel: 'My categories', to: '/supplierregistrations', icon: 'lucide:clipboard-list', permission: 'can.access.myregistrations', activeClasses: 'tab-active border-primary bg-primary text-primary-content shadow-sm', cardClasses: 'border-primary/35 bg-primary/5 hover:border-primary/60', iconClasses: 'bg-primary/15 text-primary', panelTitle: 'Supplier registrations', mobilePanelTitle: 'My supplier categories', description: 'Review registration and certificate status.' },
  { key: 'tenders', label: 'My tenders', to: '/mysupplierbids', icon: 'lucide:file-lock-2', permission: 'can.access.mysupplierbids', activeClasses: 'tab-active border-info bg-info text-info-content shadow-sm', cardClasses: 'border-info/35 bg-info/5 hover:border-info/60', iconClasses: 'bg-info/15 text-info', panelTitle: 'My tenders and EOIs', description: 'Continue drafts and track sealed submissions.', emptyIcon: 'lucide:file-search', emptyTitle: 'No tenders added yet', emptyDescription: 'Browse opportunities and add a tender or EOI when you are ready to respond.' },
  { key: 'awards', label: 'Awards', to: '/mysupplierawards', icon: 'lucide:award', permission: 'can.access.mysupplierwards', activeClasses: 'tab-active border-warning bg-warning text-warning-content shadow-sm', cardClasses: 'border-warning/40 bg-warning/10 hover:border-warning/70', iconClasses: 'bg-warning/20 text-warning-content', panelTitle: 'Award notices', description: 'Review outcomes and applicable standstill periods.', emptyIcon: 'lucide:trophy', emptyTitle: 'No award notices yet', emptyDescription: 'Published outcomes for opportunities in which you participated will appear here.' },
  { key: 'contracts', label: 'Contracts', to: '/suppliercontracts', icon: 'lucide:file-signature', permission: 'can.access.suppliercontracts', activeClasses: 'tab-active border-success bg-success text-success-content shadow-sm', cardClasses: 'border-success/35 bg-success/5 hover:border-success/60', iconClasses: 'bg-success/15 text-success', panelTitle: 'Supplier contracts', description: 'Manage awarded contracts and delivery obligations.', emptyIcon: 'lucide:file-signature', emptyTitle: 'No contracts yet', emptyDescription: 'Awarded contracts will appear here.' },
  { key: 'bonds', label: 'Bid bonds', to: '/bid-bonds', icon: 'lucide:shield-check', permission: 'can.access.mytendering', activeClasses: 'tab-active border-accent bg-accent text-accent-content shadow-sm', cardClasses: 'border-accent/35 bg-accent/5 hover:border-accent/60', iconClasses: 'bg-accent/15 text-accent', panelTitle: 'Bid bonds', description: 'Track paid securities, maturity and refund progress.', emptyIcon: 'lucide:shield', emptyTitle: 'No paid bid bonds found', emptyDescription: 'Paid tender securities will appear here with their maturity and refund status.' },
].filter(tab => can(tab.permission)))

const activeTab = ref('')
const tabStates = reactive({
  tenders: { items: [], count: null, loading: false, loaded: false, error: '' },
  awards: { items: [], count: null, loading: false, loaded: false, error: '' },
  contracts: { items: [], count: 0, loading: false, loaded: true, error: '' },
  bonds: { items: [], count: null, loading: false, loaded: false, error: '' },
})

const activeTabDefinition = computed(() => workspaceTabs.value.find(tab => tab.key === activeTab.value))
const activeState = computed(() => tabStates[activeTab.value] ?? { items: [], loading: false, loaded: true, error: '' })
const mobileActivityTabs = computed(() => workspaceTabs.value.filter(tab => tab.key !== 'registrations'))
const activeMobileTabDefinition = computed(() => workspaceTabs.value.find(tab => tab.key === activeMobileTab.value))
const activeMobileState = computed(() => tabStates[activeMobileTab.value] ?? { items: [], loading: false, loaded: true, error: '' })
const registrationCount = computed(() => ['pending', 'awaiting', 'approved', 'rejected', 'expired']
  .reduce((total, key) => total + (registrationStore.registrations[key]?.length ?? 0), 0))

function tabCount(key) {
  if (key === 'registrations') return registrationCount.value
  if (key === 'contracts') return 0
  return tabStates[key]?.loaded ? (tabStates[key].count ?? tabStates[key].items.length) : null
}

function tabLoading(key) {
  if (key === 'registrations') return registrationStore.pending
  return tabStates[key]?.loading ?? false
}

function isEmptyCategoriesCard(key) {
  return key === 'registrations' && !registrationStore.pending && registrationCount.value === 0
}

async function openMobileTab(key) {
  activeMobileTab.value = key
  await nextTick()
  mobileActivityDialog.value?.showModal()
  loadTab(key)
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
      state.count = state.items.length
    } else if (key === 'awards') {
      const response = await listAwards(1)
      state.items = response?.data?.data ?? []
      state.count = response?.data?.total ?? state.items.length
    } else if (key === 'bonds') {
      const result = await bidBondApi.list(1)
      if (!result.ok) throw new Error(result.error)
      state.items = result.data?.data?.data ?? []
      state.count = result.data?.data?.total ?? state.items.length
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
  : (bid.response_type === 'EOI' ? `/expressions-of-interest/${bid.eoi_uuid}` : `/supplierbidopening/${bid.tender_uuid}`)
const maturityClass = status => status === 'MATURED' ? 'badge-error badge-soft' : status === 'DUE_SOON' ? 'badge-warning badge-soft' : 'badge-success badge-soft'

onMounted(() => {
  activeTab.value = workspaceTabs.value[0]?.key ?? ''
  if (props.showRegistrations) registrationStore.fetchRegistrations()
  if (props.showRegistrations && props.showAutorenewals) autorenewalStore.fetch()
  mobileActivityTabs.value.forEach(tab => loadTab(tab.key))
})
</script>
