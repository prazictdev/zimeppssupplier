<template>
  <div class="space-y-7">
    <header class="max-w-2xl">
      <p class="text-sm font-medium text-primary">Payment currency</p>
      <h2 class="mt-1 text-2xl font-bold tracking-tight text-base-content">How would you like to pay?</h2>
      <p class="mt-2 text-sm leading-6 text-base-content/60">Choose a currency to calculate the registration fee. You can review the amount before an invoice is created.</p>
    </header>

    <div role="alert" class="alert alert-soft">
      <Icon name="lucide:shield-check" class="h-5 w-5" />
      <span class="text-sm">No invoice is created until you confirm the fee and select <strong>Next</strong>.</span>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="n in 2" :key="n" class="h-28 animate-pulse rounded-box bg-base-200" />
    </div>

    <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
      <Icon name="lucide:alert-circle" class="h-4 w-4" />
      <span>Failed to load currencies. Please try again.</span>
    </div>

    <fieldset v-else>
      <legend class="mb-3 text-sm font-semibold text-base-content">Available currencies</legend>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="currency in currencies"
        :key="currency.id"
        type="button"
        class="flex min-h-28 items-center gap-4 rounded-box border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :class="selected?.id === currency.id
          ? 'border-primary bg-primary/10'
          : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200/60'"
        :aria-pressed="selected?.id === currency.id"
        @click="select(currency)"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-selector text-base font-bold"
          :class="selected?.id === currency.id ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'"
        >
          {{ currency.symbol ?? currency.code }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-base font-bold text-base-content">{{ currency.code }}</span>
          <span class="mt-0.5 block text-sm text-base-content/55">{{ currency.name }}</span>
        </span>
        <Icon
          v-if="selected?.id === currency.id"
          name="lucide:circle-check-big"
          class="h-5 w-5 shrink-0 text-primary"
        />
      </button>
      </div>
    </fieldset>

    <template v-if="selected">
      <div v-if="previewLoading" class="space-y-2">
        <div class="h-5 w-48 animate-pulse rounded bg-base-200" />
        <div class="h-44 animate-pulse rounded-box bg-base-200" />
      </div>

      <div v-else-if="previewError" role="alert" class="alert alert-error alert-soft sm:alert-horizontal">
        <Icon name="lucide:triangle-alert" class="h-5 w-5" />
        <div class="flex-1">
          <p class="font-semibold">We couldn’t calculate the fee</p>
          <p class="text-sm">{{ previewError }}</p>
        </div>
        <button type="button" class="btn btn-sm" @click="loadPreview(selected)">Try again</button>
      </div>

      <template v-else-if="preview">
        <div class="card card-border overflow-hidden bg-base-100">
          <div class="card-body gap-5 p-0">
            <div class="flex flex-col gap-4 border-b border-base-300 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-selector bg-base-200">
                  <Icon name="lucide:receipt-text" class="h-5 w-5 text-base-content/70" />
                </div>
                <div>
                  <h3 class="font-bold">Fee preview</h3>
                  <p class="text-sm text-base-content/55">{{ preview.items?.length ?? 0 }} {{ preview.items?.length === 1 ? 'category' : 'categories' }}</p>
                </div>
              </div>
              <div class="sm:text-right">
                <p class="text-xs text-base-content/55">Total due</p>
                <p class="text-2xl font-bold tabular-nums text-base-content">{{ selected.code }} {{ formatNum(preview.total) }}</p>
              </div>
            </div>

            <div v-if="!preview.is_primary" class="mx-5 flex items-center gap-2 rounded-selector bg-base-200 px-3 py-2.5 text-sm text-base-content/70">
              <Icon name="lucide:arrow-right-left" class="h-4 w-4 shrink-0" />
              <span>Rate used: <strong>1 {{ preview.primary_currency?.code }} = {{ preview.exchangerate }} {{ preview.selected_currency?.code }}</strong></span>
            </div>

            <div class="overflow-x-auto px-5">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Base Fee</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in preview.items" :key="item.registration_id">
                    <td class="font-medium">{{ item.suppliercategory?.name }}</td>
                    <td class="text-right text-base-content/60">
                      {{ preview.primary_currency?.code }} {{ formatNum(item.base_fee) }}
                    </td>
                    <td class="text-right font-semibold tabular-nums">
                      {{ selected.code }} {{ formatNum(item.amount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <label class="mx-5 mb-5 flex cursor-pointer items-start gap-3 rounded-selector border px-4 py-4 transition-colors" :class="confirmed ? 'border-primary bg-primary/10' : 'border-base-300 hover:bg-base-200/60'">
              <input
                v-model="confirmed"
                type="checkbox"
                class="checkbox checkbox-primary mt-0.5 shrink-0"
                @change="emit('confirm', confirmed)"
              />
              <span class="text-sm leading-6 text-base-content/70">
                I have reviewed the categories and confirm the registration fee of
                <strong class="text-base-content">{{ selected.code }} {{ formatNum(preview.total) }}</strong>.
              </span>
            </label>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  application: { type: Object, required: true },
})

const emit = defineEmits(['select', 'confirm'])

const { getActiveCurrencies } = useCurrencyHelper()
const { user } = useSanctumAuth()
const client = useSupplierClient()

const allCurrencies = ref([])
const loading = ref(true)
const error = ref(false)
const selected = ref(props.application.currency ?? null)

const previewLoading = ref(false)
const preview = ref(null)
const previewError = ref(null)
const confirmed = ref(props.application.invoiceConfirmed ?? false)

const isLocal = computed(() => (user.value?.data?.company?.locality ?? 'local') === 'local')

const currencies = computed(() => {
  if (isLocal.value) return allCurrencies.value
  return allCurrencies.value.filter(c => c.code === 'USD')
})

onMounted(async () => {
  const { ok, data } = await getActiveCurrencies()
  loading.value = false
  if (!ok) { error.value = true; return }
  allCurrencies.value = data?.data ?? []

  if (selected.value) {
    await loadPreview(selected.value)
  }
})

async function loadPreview(currency) {
  previewLoading.value = true
  preview.value = null
  previewError.value = null
  confirmed.value = false
  emit('confirm', false)
  try {
    const res = await client(`/api/supplier/v1/registrations/invoice-preview?currency_id=${currency.id}`, { method: 'GET' })
    preview.value = res?.data ?? null
    if (!preview.value) {
      previewError.value = 'The server did not return a fee preview. Please try again.'
    }
  } catch (error) {
    preview.value = null
    previewError.value = error?.data?.message
      ?? error?.response?._data?.message
      ?? 'Check your connection and try again.'
  } finally {
    previewLoading.value = false
  }
}

async function select(currency) {
  selected.value = currency
  emit('select', currency)
  await loadPreview(currency)
}

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0)
}
</script>
