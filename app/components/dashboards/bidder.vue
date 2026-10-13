<template>
  <div class="space-y-6">


    <div v-if="showWallets">


      <!-- Loading skeleton -->
      <div v-if="walletStore.pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="rounded-lg p-5 border border-base-200 bg-base-200 animate-pulse h-28" />
      </div>

      <Wallets v-else :wallets="wallets" />
    </div>

    <!-- Registration Summary -->
    <RegistrationSummary
      v-if="showRegistrations"
      :allow-autorenewal="showAutorenewals"
    />

    <div
      v-if="!showWallets && !showRegistrations"
      class="rounded-2xl border border-base-200 bg-base-100 px-6 py-12 text-center shadow-sm"
    >
      <Icon name="lucide:layout-dashboard" class="mx-auto h-10 w-10 text-base-content/25" />
      <h2 class="mt-3 font-semibold text-base-content/70">Dashboard ready</h2>
      <p class="mt-1 text-sm text-base-content/45">Additional dashboard information will appear when related permissions are assigned.</p>
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

onMounted(() => {
  if (props.showRegistrations) registrationStore.fetchRegistrations()
  if (props.showRegistrations && props.showAutorenewals) autorenewalStore.fetch()
})
</script>
