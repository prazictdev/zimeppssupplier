<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-base-content">Select Payment Currency</h2>
      <p class="text-sm text-base-content/50 mt-1">Choose the currency you will use to pay the registration fee.</p>
    </div>

    <!-- Step instructions -->
    <div class="flex gap-3 rounded-lg border border-blue-300 bg-blue-600 px-4 py-3 text-sm text-white">
      <Icon name="lucide:info" class="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Select the currency you will use for payment. An invoice preview will appear showing the registration fee per category and the total amount due.
        Review the invoice carefully, then tick the confirmation checkbox to acknowledge the charges.
        Once confirmed, click <strong>Next</strong> to generate your invoice and proceed to payment.
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="n in 2" :key="n" class="h-24 rounded-xl bg-base-200 animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error alert-soft">
      <Icon name="lucide:alert-circle" class="h-4 w-4" />
      <span>Failed to load currencies. Please try again.</span>
    </div>

    <!-- Currency cards -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="currency in currencies"
        :key="currency.id"
        type="button"
        class="flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all"
        :class="selected?.id === currency.id
          ? 'border-green-500 bg-green-50'
          : 'border-base-200 bg-base-100 hover:border-green-300 hover:bg-green-50/50'"
        @click="select(currency)"
      >
        <span
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
          :class="selected?.id === currency.id ? 'bg-green-500 text-white' : 'bg-base-200 text-base-content/60'"
        >
          {{ currency.symbol ?? currency.code }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-base-content">{{ currency.code }}</p>
          <p class="text-sm text-base-content/50">{{ currency.name }}</p>
        </div>
        <Icon
          v-if="selected?.id === currency.id"
          name="lucide:circle-check"
          class="h-5 w-5 shrink-0 text-green-500"
        />
      </button>
    </div>

    <!-- Invoice preview -->
    <template v-if="selected">
      <!-- Loading preview -->
      <div v-if="previewLoading" class="space-y-2">
        <div class="h-5 w-48 rounded bg-base-200 animate-pulse" />
        <div class="h-32 rounded-xl bg-base-200 animate-pulse" />
      </div>

      <template v-else-if="preview">
        <!-- Exchange rate notice -->
        <div v-if="!preview.is_primary" class="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-500 px-4 py-2.5 text-sm text-white">
          <Icon name="lucide:arrow-right-left" class="h-4 w-4 shrink-0" />
          <span>
            Exchange rate: <strong>1 {{ preview.primary_currency?.code }} = {{ preview.exchangerate }} {{ preview.selected_currency?.code }}</strong>
          </span>
        </div>

        <!-- Invoice breakdown card -->
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body gap-4 p-4">
            <div class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon name="lucide:file-text" class="h-4 w-4 text-primary" />
              </div>
              <p class="font-semibold text-sm">Invoice Preview</p>
            </div>

            <div class="overflow-x-auto rounded-lg border border-base-200">
              <table class="table table-sm w-full">
                <thead>
                  <tr class="bg-base-200/60 text-xs uppercase tracking-wide text-base-content/60">
                    <th>#</th>
                    <th>Category</th>
                    <th class="text-right">Base Fee</th>
                    <th class="text-right">Amount ({{ selected.code }})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in preview.items" :key="item.registration_id" class="hover">
                    <td class="font-mono text-xs text-base-content/50">{{ idx + 1 }}</td>
                    <td class="text-sm font-medium">{{ item.suppliercategory?.name }}</td>
                    <td class="text-right text-sm text-base-content/60">
                      {{ preview.primary_currency?.code }} {{ formatNum(item.base_fee) }}
                    </td>
                    <td class="text-right font-semibold text-sm">
                      {{ selected.code }} {{ formatNum(item.amount) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-base-200/40 font-bold">
                    <td colspan="3" class="text-right text-sm">Total</td>
                    <td class="text-right text-base text-primary">
                      {{ selected.code }} {{ formatNum(preview.total) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Confirmation checkbox -->
            <label class="flex items-start gap-3 cursor-pointer rounded-lg border border-base-200 bg-base-50 px-4 py-3 hover:bg-base-100 transition-colors">
              <input
                v-model="confirmed"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm mt-0.5 shrink-0"
                @change="emit('confirm', confirmed)"
              />
              <span class="text-sm text-base-content/70 leading-snug">
                I confirm that the invoice details above are correct and I authorise the registration fee payment of
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
  confirmed.value = false
  emit('confirm', false)
  try {
    const res = await client(`/api/supplier/v1/registrations/invoice-preview?currency_id=${currency.id}`, { method: 'GET' })
    preview.value = res?.data ?? null
  } catch {
    preview.value = null
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
