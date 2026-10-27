<template>
  <div v-if="walletBalances.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <NuxtLink
      v-for="wallet in walletBalances"
      :key="`${wallet.bankaccounttype_id}-${wallet.currency_id}`"
      to="/supplierstatement"
      class="card card-border bg-base-100"
    >
      <div class="card-body gap-3 p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-2xl font-bold tabular-nums">{{ formatAmount(wallet.balance) }}</p>
            <p class="mt-1 text-sm font-medium text-base-content/65">{{ wallet.currency_code }} balance</p>
          </div>
          <span class="flex h-9 w-9 items-center justify-center rounded-field bg-base-200 font-bold text-primary">
            {{ wallet.currency_symbol ?? wallet.currency_code?.charAt(0) }}
          </span>
        </div>
        <div class="flex items-center justify-between border-t border-base-300 pt-3 text-xs">
          <span class="min-w-0 truncate text-base-content/55">{{ wallet.bankaccounttype_name }}</span>
          <span class="badge badge-ghost badge-sm shrink-0">{{ wallet.refundable ? 'Refundable' : 'Operating' }}</span>
        </div>
      </div>
    </NuxtLink>
  </div>

  <div v-else class="card card-border bg-base-100">
    <div class="card-body items-center py-9 text-center">
      <Icon name="lucide:wallet-cards" class="h-7 w-7 text-base-content/25" />
      <p class="text-sm font-medium">No wallet balances available</p>
      <p class="text-xs text-base-content/50">Balances will appear after your accounts are created.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ wallets: { type: Array, required: true } })
const walletBalances = computed(() => props.wallets ?? [])

function formatAmount(amount) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount ?? 0)
}
</script>
