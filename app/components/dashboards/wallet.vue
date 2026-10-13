<template>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="wallet in wallets"
          :key="`${wallet.bankaccounttype_id}_${wallet.currency_id}`"
          class="rounded-lg p-5 flex flex-col gap-3"
          :class="wallet.refundable ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'"
        >
          <div class="flex items-center justify-between">
            <span
              class="badge badge-sm font-medium"
              :class="wallet.refundable ? 'bg-green-100 text-green-700 border-green-300' : 'bg-blue-100 text-blue-700 border-blue-300'"
            >
              {{ wallet.refundable ? 'Refundable' : 'Non-Refundable' }}
            </span>
            <span class="text-xs font-bold uppercase tracking-widest" :class="wallet.refundable ? 'text-green-400' : 'text-blue-400'">
              {{ wallet.currency_code }}
            </span>
          </div>

          <div>
            <p class="text-xs text-base-content/50">Available Balance</p>
            <p class="text-2xl font-bold mt-0.5" :class="wallet.refundable ? 'text-green-700' : 'text-blue-700'">
              {{ formatAmount(wallet.currency_code, wallet.balance) }}
            </p>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-base-content/40">
            <Icon name="lucide:wallet" class="h-3.5 w-3.5" />
            {{ wallet.bankaccounttype_name }}
          </div>
        </div>
    </div>
</template>
<script setup>
const props = defineProps({

  wallets: {
    type: Object,
    required: true,
  },
})
</script>