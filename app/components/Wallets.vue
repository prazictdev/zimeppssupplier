<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="group in groupedWallets"
      :key="group.bankaccounttype_id"
      class="rounded-xl border flex flex-col gap-0 overflow-hidden"
      :class="group.refundable ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'"
    >
      <!-- Card header -->
      <div
        class="flex items-center justify-between px-5 py-3 border-b"
        :class="group.refundable ? 'border-green-200 bg-green-100/60' : 'border-blue-200 bg-blue-100/60'"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg"
            :class="group.refundable ? 'bg-green-200 text-green-700' : 'bg-blue-200 text-blue-700'"
          >
            <Icon name="lucide:wallet" class="h-4 w-4" />
          </div>
          <div>
            <p class="text-sm font-semibold" :class="group.refundable ? 'text-green-800' : 'text-blue-800'">
              {{ group.bankaccounttype_name }}
            </p>
            <p class="text-xs" :class="group.refundable ? 'text-green-600/70' : 'text-blue-600/70'">
              Wallet
            </p>
          </div>
        </div>
        <span
          class="badge badge-sm font-medium"
          :class="group.refundable ? 'bg-green-200 text-green-700 border-green-300' : 'bg-blue-200 text-blue-700 border-blue-300'"
        >
          {{ group.balances.length }} {{ group.balances.length === 1 ? 'currency' : 'currencies' }}
        </span>
      </div>

      <!-- Currency balances -->
      <div class="divide-y" :class="group.refundable ? 'divide-green-200/60' : 'divide-blue-200/60'">
        <div
          v-for="b in group.balances"
          :key="b.currency_id"
          class="flex items-center justify-between px-5 py-3"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
              :class="group.refundable ? 'bg-green-200 text-green-700' : 'bg-blue-200 text-blue-700'"
            >
              {{ b.currency_symbol ?? b.currency_code?.charAt(0) }}
            </span>
            <span class="text-sm font-medium text-base-content/70">{{ b.currency_code }}</span>
          </div>
          <span class="text-base font-bold" :class="group.refundable ? 'text-green-700' : 'text-blue-700'">
            {{ formatAmount(b.currency_code, b.balance) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  wallets: {
    type: Array,
    required: true,
  },
})

const groupedWallets = computed(() => {
  const map = new Map()

  for (const w of props.wallets) {
    if (!map.has(w.bankaccounttype_id)) {
      map.set(w.bankaccounttype_id, {
        bankaccounttype_id: w.bankaccounttype_id,
        bankaccounttype_name: w.bankaccounttype_name,
        refundable: w.refundable,
        balances: [],
      })
    }
    map.get(w.bankaccounttype_id).balances.push({
      currency_id: w.currency_id,
      currency_code: w.currency_code,
      currency_symbol: w.currency_symbol,
      balance: w.balance,
    })
  }

  return [...map.values()]
})

function formatAmount(currencyCode, amount) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}
</script>
