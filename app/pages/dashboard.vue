<template>
  <div class="space-y-6">
    <div v-if="pendingUpgradeInvoice && canViewRegistrations" role="alert" class="alert alert-error alert-soft sm:alert-horizontal">
      <Icon name="lucide:triangle-alert" class="h-5 w-5 shrink-0" />
      <div class="min-w-0 flex-1">
        <h3 class="font-bold">Upgrade payment is holding your registrations</h3>
        <p class="mt-0.5 text-sm opacity-80">
          Pay invoice {{ pendingUpgradeInvoice.invoice_number }} for {{ pendingUpgradeInvoice.upgradesuppliergroup?.name }} to unlock existing and new registrations.
        </p>
      </div>
      <NuxtLink :to="`/invoice/upgrade/${pendingUpgradeInvoice.uuid}`" class="btn btn-error btn-sm">Review invoice</NuxtLink>
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

    <div v-else class="card card-border bg-base-100">
      <div class="card-body items-center py-12 text-center">
        <Icon name="lucide:building-2" class="h-9 w-9 text-base-content/25" />
        <h2 class="card-title mt-2 text-base">No organisation workspace yet</h2>
        <p class="max-w-md text-sm text-base-content/55">Complete your organisation setup or ask an administrator to link this account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import DashboardsBidder from '~/components/dashboards/bidder.vue'

definePageMeta({ layout: 'default' })
useHead({ title: 'Supplier workspace' })

const { user } = useSanctumAuth()
const { can, canAny } = useAbility()
const company = computed(() => user.value?.data?.company ?? null)
const pendingUpgradeInvoice = computed(() => user.value?.data?.pending_upgrade_invoice ?? null)
const walletStore = useWalletStore()
const wallets = computed(() => walletStore.wallets)
const { getWalletBalances } = useWallet()
const canViewRegistrations = computed(() => can('can.access.myregistrations'))
const canViewAutorenewals = computed(() => can('can.access.supplierautorenewals'))
const canViewFinances = computed(() => canAny([
  'can.acccess.supplierinvoices', 'can.access.supplierstatement',
  'can.access.supplierbankpayments', 'can.access.onlinepayments',
]))
onMounted(() => {
  if (canViewFinances.value) getWalletBalances()
})
</script>
