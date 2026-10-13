<template>
  <div class="space-y-5">
    <header class="rounded-2xl bg-gradient-to-r from-green-800 to-emerald-600 p-6 text-white shadow-sm">
      <div class="flex items-center gap-3"><Icon name="lucide:shield-check" class="h-8 w-8" /><div><h1 class="text-2xl font-bold">My bid bonds</h1><p class="text-sm text-green-100">Paid securities, maturity dates and refund progress.</p></div></div>
    </header>

    <div v-if="loading" class="grid place-items-center py-20"><span class="loading loading-spinner loading-lg text-success" /></div>
    <div v-else-if="error" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>
    <section v-else class="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <div v-if="!bonds.length" class="py-16 text-center text-base-content/50"><Icon name="lucide:shield" class="mx-auto h-10 w-10 opacity-30" /><p class="mt-2">No paid bid bonds were found.</p></div>
      <div v-else class="overflow-x-auto">
        <table class="table"><thead><tr><th>Tender</th><th>Amount</th><th>Paid</th><th>Maturity</th><th>Maturity status</th><th>Refund status</th></tr></thead>
          <tbody><tr v-for="bond in bonds" :key="bond.uuid"><td><NuxtLink :to="`/supplieropportunities/${bond.tender.uuid}`" class="font-semibold link link-success">{{ bond.tender.reference || bond.tender.title }}</NuxtLink><p class="max-w-sm truncate text-xs text-base-content/50">{{ bond.tender.title }} · {{ bond.tender.entity }}</p></td><td class="font-mono font-semibold">{{ bond.currency }} {{ money(bond.amount) }}</td><td>{{ date(bond.paid_at) }}</td><td><span class="font-medium">{{ date(bond.maturity_date) }}</span><p class="text-xs text-base-content/50">{{ maturityText(bond.days_to_maturity) }}</p></td><td><span class="badge" :class="maturityClass(bond.maturity_status)">{{ label(bond.maturity_status) }}</span></td><td><span class="badge badge-outline">{{ label(bond.refund_status) }}</span></td></tr></tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
const api = useBidBondManagement()
const bonds = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const result = await api.list()
  loading.value = false
  if (!result.ok) return void (error.value = result.error)
  bonds.value = result.data?.data?.data ?? []
})

const money = value => Number(value || 0).toLocaleString('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = value => value ? new Date(value).toLocaleDateString('en-ZW', { dateStyle: 'medium' }) : '—'
const label = value => String(value || '—').replaceAll('_', ' ').toLowerCase().replace(/^./, letter => letter.toUpperCase())
const maturityText = days => days < 0 ? `${Math.abs(days)} day(s) overdue` : `${days} day(s) remaining`
const maturityClass = status => status === 'MATURED' ? 'badge-error' : status === 'DUE_SOON' ? 'badge-warning' : 'badge-success'
useHead({ title: 'My Bid Bonds' })
</script>
