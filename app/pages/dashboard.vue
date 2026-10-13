<template>
  <div class="space-y-4">

    <!-- Pending upgrade invoice alert -->
    <div v-if="pendingUpgradeInvoice && canViewRegistrations" class="rounded-xl border border-error/50 bg-error/8 px-5 py-4">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div class="rounded-lg bg-error/15 p-2 shrink-0 mt-0.5">
            <Icon name="lucide:triangle-alert" class="h-4 w-4 text-error" />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-error text-sm">
              Action Required — Upgrade Invoice Awaiting Payment
            </p>
            <p class="text-sm text-base-content/70 mt-0.5">
              Invoice <span class="font-mono font-medium text-base-content">{{ pendingUpgradeInvoice.invoice_number }}</span>
              for upgrading to <strong>{{ pendingUpgradeInvoice.upgradesuppliergroup?.name }}</strong> —
              <span class="text-error font-semibold">{{ pendingUpgradeInvoice.currency?.code }} {{ formatAmount(pendingUpgradeInvoice.total) }}</span> outstanding.
              All your existing registrations are <strong>locked</strong> and new registrations are blocked until this invoice is fully settled.
            </p>
          </div>
        </div>
        <NuxtLink
          :to="`/invoice/upgrade/${pendingUpgradeInvoice.uuid}`"
          class="btn btn-error btn-sm gap-1.5 shrink-0 self-start sm:self-center"
        >
          <Icon name="lucide:receipt" class="h-4 w-4" />
          View Invoice
        </NuxtLink>
      </div>
    </div>

    <SupplierVerificationActions v-if="canViewRegistrations" />

    <DashboardsBidder
      v-if="company"
      :company="company"
      :wallets="wallets"
      :show-wallets="canViewFinances"
      :show-registrations="canViewRegistrations"
      :show-autorenewals="canViewAutorenewals"
    />

    <!-- No account type assigned -->
    <div v-else class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="card-body flex flex-col items-center gap-3 py-12 text-center text-base-content/40">
        <Icon name="lucide:layout-dashboard" class="h-10 w-10" />
        <p class="font-semibold">No dashboard available</p>
        <p class="text-sm">Your account has no roles linked to a dashboard type. Contact your administrator.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import DashboardsBidder from '~/components/dashboards/bidder.vue'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Dashboard',
})

const { user } = useSanctumAuth()
const { can, canAny } = useAbility()

const accountTypes = computed(() => user.value?.data?.account_types ?? [])
const accountTypeNames = computed(() => accountTypes.value.map(at => at.name.toLowerCase()))
const company = computed(() => user.value?.data?.company ?? null)
const pendingUpgradeInvoice = computed(() => user.value?.data?.pending_upgrade_invoice ?? null)
const walletStore = useWalletStore()
const wallets = computed(() => walletStore.wallets)
const { getWalletBalances } = useWallet()
const canViewRegistrations = computed(() => can('can.access.myregistrations'))
const canViewAutorenewals = computed(() => can('can.access.supplierautorenewals'))
const canViewFinances = computed(() => canAny([
  'can.acccess.supplierinvoices',
  'can.access.supplierstatement',
  'can.access.supplierbankpayments',
  'can.access.onlinepayments',
]))

function formatAmount(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0)
}
onMounted(() => {
  if (canViewFinances.value) getWalletBalances()
})

const TAB_DEFINITIONS = [
  {
    key: 'bidder',
    label: 'Supplier Dashboard',
    icon: 'lucide:briefcase',
    keywords: ['bidder', 'supplier', 'vendor', 'contractor'],
    component: DashboardsBidder,
  },
]

const visibleTabs = computed(() => {
  if (accountTypeNames.value.length === 0) return []
  return TAB_DEFINITIONS.filter(tab =>
    accountTypeNames.value.some(name =>
      tab.keywords.some(kw => name.includes(kw))
    )
  )
})

const activeTab = ref(null)

watch(visibleTabs, (tabs) => {
  if (tabs.length && !tabs.find(t => t.key === activeTab.value)) {
    activeTab.value = tabs[0].key
  }
}, { immediate: true })
</script>
