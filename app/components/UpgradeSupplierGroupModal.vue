<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box w-full max-w-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-warning/10 p-2.5">
            <Icon name="lucide:arrow-up-circle" class="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-base-content">Upgrade Supplier Group</h3>
            <p class="text-xs text-base-content/50">Select a higher tier to expand your procurement limits</p>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost btn-circle" @click="close">
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center gap-3 py-12">
        <span class="loading loading-spinner loading-lg text-warning" />
        <p class="text-sm text-base-content/50">Loading available groups…</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="rounded-xl border border-error/30 bg-error/5 px-5 py-4 text-sm text-error">
        <Icon name="lucide:alert-circle" class="inline h-4 w-4 mr-1.5" />
        Failed to load upgrade options. Please try again.
      </div>

      <template v-else-if="data">

        <!-- Step 1: Select group -->
        <template v-if="step === 1">
          <p class="text-sm text-base-content/60 mb-4">
            Your current group is <strong>{{ data.current_group?.name }}</strong>. Select a higher group to upgrade to.
          </p>

          <div v-if="!data.eligible_groups?.length" class="rounded-xl border border-base-200 py-10 text-center text-base-content/40 text-sm">
            No higher supplier groups are available for upgrade.
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="group in data.eligible_groups"
              :key="group.id"
              type="button"
              class="w-full flex items-start gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all"
              :class="selectedGroup?.id === group.id
                ? 'border-warning bg-warning/5'
                : 'border-base-200 bg-base-100 hover:border-warning/40'"
              @click="selectGroup(group)"
            >
              <div class="rounded-xl p-2 shrink-0 mt-0.5" :class="selectedGroup?.id === group.id ? 'bg-warning/10' : 'bg-base-200'">
                <Icon name="lucide:trending-up" class="h-5 w-5" :class="selectedGroup?.id === group.id ? 'text-warning' : 'text-base-content/40'" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-base-content">{{ group.name }}</p>
                <div v-if="group.thresholds?.length" class="mt-1.5 space-y-0.5">
                  <p v-for="t in group.thresholds" :key="t.id" class="text-xs text-base-content/50">
                    {{ t.procurementmethod?.name }} — up to
                    <span class="font-medium text-base-content/70">
                      {{ t.currency?.code }} {{ formatNum(t.upper_limit) }}
                    </span>
                  </p>
                </div>
              </div>
              <Icon v-if="selectedGroup?.id === group.id" name="lucide:check-circle-2" class="h-5 w-5 text-warning shrink-0 mt-1" />
            </button>
          </div>

          <div class="modal-action mt-6">
            <button class="btn btn-ghost" @click="close">Cancel</button>
            <button
              class="btn btn-warning gap-2"
              :disabled="!selectedGroup || previewLoading"
              @click="loadPreview"
            >
              <span v-if="previewLoading" class="loading loading-spinner loading-xs" />
              <template v-else>
                Next
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </template>
            </button>
          </div>
        </template>

        <!-- Step 2: Warning + cost preview -->
        <template v-else-if="step === 2 && preview">
          <div class="space-y-4">

            <!-- Cost breakdown -->
            <div class="rounded-xl border border-base-200 bg-base-50 overflow-hidden">
              <div class="px-5 py-3 border-b border-base-200 bg-base-100">
                <p class="text-sm font-semibold text-base-content">Upgrade Cost Breakdown</p>
              </div>
              <div class="p-5 space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-base-content/60">From group</span>
                  <span class="font-medium">{{ preview.current_group?.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">To group</span>
                  <span class="font-medium text-warning">{{ preview.new_group?.name }}</span>
                </div>
                <div class="divider my-1" />
                <div class="flex justify-between">
                  <span class="text-base-content/60">Current fee per registration</span>
                  <span>{{ preview.selected_currency?.code }} {{ formatNum(preview.current_base_fee * preview.exchangerate) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">New fee per registration</span>
                  <span>{{ preview.selected_currency?.code }} {{ formatNum(preview.new_base_fee * preview.exchangerate) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Difference per registration</span>
                  <span class="text-warning font-medium">{{ preview.selected_currency?.code }} {{ formatNum(preview.difference_per_reg) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-base-content/60">Existing billed registrations</span>
                  <span>{{ preview.billed_count }}</span>
                </div>
                <div class="divider my-1" />
                <div class="flex justify-between text-base font-bold">
                  <span>Upgrade invoice total</span>
                  <span class="text-warning">{{ preview.selected_currency?.code }} {{ formatNum(preview.total) }}</span>
                </div>
              </div>
            </div>

            <!-- Warning conditions -->
            <div class="rounded-xl border border-error/30 bg-error/5 p-4 space-y-2">
              <div class="flex items-center gap-2 text-error font-semibold text-sm">
                <Icon name="lucide:triangle-alert" class="h-4 w-4 shrink-0" />
                Important — Please read before proceeding
              </div>
              <ul class="text-sm text-error/80 space-y-1.5 ml-6 list-disc">
                <li>An upgrade invoice of <strong>{{ preview.selected_currency?.code }} {{ formatNum(preview.total) }}</strong> will be generated immediately.</li>
                <li>All <strong>{{ preview.billed_count }} existing registration(s)</strong> for {{ currentYear }} will be <strong>locked</strong> until the upgrade invoice is fully settled.</li>
                <li>Once confirmed, you <strong>cannot reverse or downgrade</strong> to a lower supplier group.</li>
              </ul>
            </div>

            <!-- Acceptance checkbox -->
            <label class="flex items-start gap-3 cursor-pointer">
              <input v-model="accepted" type="checkbox" class="checkbox checkbox-warning mt-0.5 shrink-0" />
              <span class="text-sm text-base-content/70">
                I understand that this action is irreversible, my registrations will be locked until the upgrade invoice is paid, and I accept these conditions.
              </span>
            </label>

            <!-- Currency selector -->
            <div class="form-control">
              <label class="label pb-1">
                <span class="label-text text-xs font-medium uppercase tracking-wide text-base-content/50">Payment Currency</span>
              </label>
              <select v-model="selectedCurrencyId" class="select select-bordered select-sm w-full max-w-xs">
                <option v-for="c in currencies" :key="c.id" :value="c.id">{{ c.code }} — {{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="modal-action mt-6">
            <button class="btn btn-ghost" :disabled="submitting" @click="step = 1">Back</button>
            <button
              class="btn btn-error gap-2"
              :disabled="!accepted || submitting"
              @click="confirm"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs" />
              <template v-else>
                <Icon name="lucide:lock" class="h-4 w-4" />
                Confirm Upgrade
              </template>
            </button>
          </div>
        </template>

      </template>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup>
const emit = defineEmits(['upgraded'])

const { getEligibleGroups, previewUpgrade, initiateUpgrade } = useUpgrade()
const { getActiveCurrencies } = useCurrencyHelper()
const toast = useToast()

const dialogRef = ref(null)
const step = ref(1)
const loading = ref(false)
const loadError = ref(false)
const previewLoading = ref(false)
const submitting = ref(false)
const accepted = ref(false)
const data = ref(null)
const preview = ref(null)
const selectedGroup = ref(null)
const selectedCurrencyId = ref(null)
const currencies = ref([])
const currentYear = new Date().getFullYear()

async function open() {
  accepted.value = false
  step.value = 1
  selectedGroup.value = null
  preview.value = null
  data.value = null
  loadError.value = false
  dialogRef.value?.showModal()
  loading.value = true

  const [groupsResult, currencyResult] = await Promise.all([
    getEligibleGroups(),
    getActiveCurrencies(),
  ])

  loading.value = false

  if (!groupsResult) {
    loadError.value = true
    return
  }

  data.value = groupsResult
  currencies.value = currencyResult?.data?.data ?? []
  if (currencies.value.length) selectedCurrencyId.value = currencies.value[0].id
}

function close() {
  dialogRef.value?.close()
}

function selectGroup(group) {
  selectedGroup.value = group
}

async function loadPreview() {
  if (!selectedGroup.value || !selectedCurrencyId.value) return
  previewLoading.value = true
  const result = await previewUpgrade(selectedGroup.value.id, selectedCurrencyId.value)
  previewLoading.value = false
  if (!result) {
    toast.error({
      title: 'Could not calculate upgrade cost',
      message: 'The supplier-group upgrade cost could not be calculated.',
      position: 'topRight',
      layout: 2,
    })
    return
  }
  preview.value = result
  step.value = 2
}

async function confirm() {
  if (!accepted.value || !selectedGroup.value || !selectedCurrencyId.value) return
  submitting.value = true
  const res = await initiateUpgrade(selectedGroup.value.id, selectedCurrencyId.value)
  submitting.value = false
  if (res?.status) {
    close()
    emit('upgraded', res.data)
    await navigateTo(`/invoice/upgrade/${res.data.uuid}`)
  } else {
    toast.error({
      title: 'Could not initiate upgrade',
      message: res?.message ?? 'The supplier-group upgrade could not be initiated.',
      position: 'topRight',
      layout: 2,
    })
  }
}

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0)
}

defineExpose({ open })
</script>
