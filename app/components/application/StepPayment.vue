<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-base-content">Payment</h2>
        <p class="mt-1 text-sm text-base-content/55">Choose how you want to settle your registration invoice.</p>
      </div>
      <span class="badge badge-primary badge-outline w-fit gap-1.5"><Icon name="lucide:mouse-pointer-click" class="h-3.5 w-3.5" /> Select one option</span>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label
        v-for="option in supplierRegistrationPaymentOptions"
        :key="option.id"
        class="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 px-4 py-5 text-left transition-all sm:px-5"
        :class="[option.cardClass, selectedOption === option.id ? option.selectedClass : '']"
      >
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl" :class="option.iconClass">
          <Icon :name="option.icon" class="h-6 w-6" />
        </span>
        <span class="min-w-0 flex-1 pr-7">
          <span class="flex flex-wrap items-center gap-2">
            <span class="block font-bold">{{ option.name }}</span>
            <span v-if="selectedOption === option.id" class="badge badge-sm" :class="option.badgeClass">Selected</span>
          </span>
          <span class="mt-1 block text-xs leading-5 text-base-content/60">{{ option.description }}</span>
        </span>
        <input
          :checked="selectedOption === option.id"
          type="radio"
          name="registration-payment-method"
          class="radio radio-sm absolute right-4 top-5"
          :class="option.radioClass"
          :aria-label="option.name"
          @change="selectOption(option.id)"
        >
      </label>
    </div>

    <div v-if="selectedOption === 'online'" class="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 text-sm text-primary">
      <Icon name="lucide:external-link" class="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Continue to initiate <strong>{{ currencyCode }} {{ formatNum(invoice?.total) }}</strong> through PRAZ CRM.
        You will be redirected only when PRAZ CRM returns a successful response containing a redirect URL.
      </span>
    </div>

    <template v-if="selectedOption === 'bank'">
      <div>
        <div class="mb-3 flex items-center justify-between gap-3">
          <p class="text-sm font-semibold">Select bank payment type</p>
          <span class="text-xs text-base-content/50">Required</span>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            v-for="type in supplierRegistrationBankTypes"
            :key="type.id"
            class="relative flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all"
            :class="[type.cardClass, selectedBankType === type.id ? type.selectedClass : '']"
          >
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg" :class="type.iconClass"><Icon :name="type.icon" class="h-5 w-5" /></span>
            <span class="min-w-0 flex-1 pr-7">
              <span class="block text-sm font-semibold">{{ type.name }}</span>
              <span class="mt-0.5 block text-xs leading-4 text-base-content/55">{{ type.description }}</span>
            </span>
            <input
              :checked="selectedBankType === type.id"
              type="radio"
              name="registration-bank-payment-type"
              class="radio radio-sm absolute right-4 top-1/2 -translate-y-1/2"
              :class="type.radioClass"
              :aria-label="type.name"
              @change="selectBankType(type.id)"
            >
          </label>
        </div>
      </div>

      <div v-if="selectedBankType" class="overflow-hidden rounded-xl border border-base-200 bg-base-100">
        <div class="border-b border-base-200 px-5 py-4">
          <p class="font-semibold">{{ selectedBankTypeLabel }} details</p>
          <p class="mt-1 text-xs text-base-content/50">
            Supply the exact information shown by your bank so EGP can automatically find and claim the transaction through PRAZ CRM.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div v-if="isForeign" class="form-control">
            <label class="label pb-1"><span class="label-text">Bank country</span></label>
            <input v-model="form.bankCountry" class="input input-bordered w-full" placeholder="e.g. South Africa" />
          </div>

          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text">{{ selectedBankType === 'foreign_deposit' ? 'Deposit bank' : 'Source bank' }}</span>
            </label>
            <select v-if="!isForeign" v-model="form.sourceBank" class="select select-bordered w-full">
              <option value="" disabled>Select bank</option>
              <option v-for="bank in zimBanks" :key="bank" :value="bank">{{ bank }}</option>
            </select>
            <input v-else v-model="form.sourceBank" class="input input-bordered w-full" placeholder="Bank name" />
          </div>

          <div v-if="selectedBankType === 'foreign_deposit'" class="form-control">
            <label class="label pb-1"><span class="label-text">Deposit branch</span></label>
            <input v-model="form.depositBranch" class="input input-bordered w-full" placeholder="Branch where deposit was made" />
          </div>

          <div v-if="selectedBankType === 'foreign_transfer'" class="form-control">
            <label class="label pb-1"><span class="label-text">SWIFT / BIC code</span></label>
            <input v-model.trim="form.swiftCode" class="input input-bordered w-full font-mono uppercase" maxlength="11" placeholder="ABCDZAJJ" />
          </div>

          <div class="form-control">
            <label class="label pb-1">
              <span class="label-text">{{ selectedBankType === 'foreign_deposit' ? 'Depositor name' : 'Payer account name' }}</span>
            </label>
            <input v-model="form.accountName" class="input input-bordered w-full" placeholder="Name used for the payment" />
          </div>

          <div v-if="selectedBankType !== 'foreign_deposit'" class="form-control">
            <label class="label pb-1"><span class="label-text">Payer account number</span></label>
            <input v-model="form.accountNumber" class="input input-bordered w-full font-mono" placeholder="Sending account number" />
          </div>

          <div class="form-control">
            <label class="label pb-1"><span class="label-text">Payment date</span></label>
            <input v-model="form.paymentDate" type="date" :max="today" class="input input-bordered w-full" />
          </div>

          <div class="form-control" :class="{ 'sm:col-span-2': selectedBankType === 'rtgs' }">
            <label class="label pb-1">
              <span class="label-text">{{ selectedBankType === 'foreign_deposit' ? 'Deposit slip / transaction reference' : 'Bank transaction reference' }}</span>
            </label>
            <input v-model="form.sourceReference" class="input input-bordered w-full font-mono" placeholder="Exact transaction reference" />
          </div>

          <template v-if="isForeign">
            <div class="form-control">
              <label class="label pb-1"><span class="label-text">Currency paid</span></label>
              <input v-model.trim="form.remittanceCurrency" class="input input-bordered w-full uppercase" maxlength="3" placeholder="USD" />
            </div>
            <div class="form-control">
              <label class="label pb-1"><span class="label-text">Amount paid</span></label>
              <input v-model="form.amountSent" type="number" min="0.01" step="0.01" class="input input-bordered w-full" />
            </div>
          </template>

          <div v-if="selectedBankType === 'foreign_transfer'" class="form-control sm:col-span-2">
            <label class="label pb-1"><span class="label-text">Correspondent / intermediary reference <span class="text-base-content/40">(optional)</span></span></label>
            <input v-model="form.correspondentReference" class="input input-bordered w-full font-mono" placeholder="Additional international transfer reference" />
          </div>

          <template v-if="selectedBankType === 'zipit'">
            <div class="form-control">
              <label class="label pb-1"><span class="label-text">STAN code</span></label>
              <input v-model="form.stanCode" class="input input-bordered w-full font-mono" maxlength="20" placeholder="System Trace Audit Number" />
            </div>
            <div class="form-control">
              <label class="label pb-1"><span class="label-text">Mobile number <span class="text-base-content/40">(optional)</span></span></label>
              <input v-model="form.mobileNumber" class="input input-bordered w-full" placeholder="+263..." />
            </div>
          </template>

          <div class="sm:col-span-2">
            <label class="label pb-1"><span class="label-text">Proof of payment</span></label>
            <label class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center" :class="proofUploadError ? 'border-error/40 bg-error/5' : 'border-base-300 hover:border-primary/40'">
              <span v-if="proofUploading" class="loading loading-spinner loading-md text-primary" />
              <Icon v-else :name="proofKey ? 'lucide:file-check' : 'lucide:upload-cloud'" class="h-7 w-7" :class="proofKey ? 'text-success' : 'text-base-content/40'" />
              <span class="text-sm font-medium">{{ proofUploading ? 'Uploading to S3…' : proofFile?.name || 'Choose a PDF, JPG or PNG file' }}</span>
              <span v-if="proofUploadError" class="text-xs text-error">{{ proofUploadError }}</span>
              <input ref="inputRef" type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" :disabled="proofUploading" @change="onFileChange" />
            </label>
            <button v-if="proofKey" type="button" class="btn btn-ghost btn-xs mt-2 text-error" @click="removeFile">Remove proof</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  supplierRegistrationBankTypes,
  supplierRegistrationPaymentOptions,
} from '~/config/supplierRegistrationPayments'

const props = defineProps({
  application: { type: Object, required: true },
})

const emit = defineEmits(['payment'])
const invoice = computed(() => props.application.invoice ?? null)
const currencyCode = computed(() => invoice.value?.currency?.code ?? props.application.currency?.code ?? '—')
const today = new Date().toISOString().split('T')[0]
const selectedOption = ref(null)
const selectedBankType = ref(null)

const selectedBankTypeLabel = computed(() =>
  supplierRegistrationBankTypes.find(type => type.id === selectedBankType.value)?.name ?? '',
)
const isForeign = computed(() => ['foreign_deposit', 'foreign_transfer'].includes(selectedBankType.value))

const emptyForm = () => ({
  sourceBank: '',
  accountName: '',
  accountNumber: '',
  paymentDate: '',
  sourceReference: '',
  stanCode: '',
  mobileNumber: '',
  bankCountry: '',
  swiftCode: '',
  remittanceCurrency: '',
  amountSent: '',
  depositBranch: '',
  correspondentReference: '',
})
const form = reactive(emptyForm())

function selectOption(option) {
  selectedOption.value = option
  selectedBankType.value = null
  resetForm()
  emitPayment()
}

function selectBankType(type) {
  selectedBankType.value = type
  resetForm()
  emitPayment()
}

function resetForm() {
  Object.assign(form, emptyForm())
  removeFile()
}

const zimBanks = [
  'AFC Commercial Bank', 'BancABC', 'CBZ Bank', 'Ecobank Zimbabwe', 'FBC Bank',
  'MetBank', 'Nedbank Zimbabwe', 'NMB Bank', 'POSB', 'Stanbic Bank Zimbabwe',
  'Standard Chartered Zimbabwe', 'Steward Bank', 'ZB Bank',
]

const proofFile = ref(null)
const proofKey = ref(null)
const proofUploading = ref(false)
const proofUploadError = ref(null)
const inputRef = ref(null)
const { presignAndUpload } = useS3Upload()

async function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  proofFile.value = file
  proofKey.value = null
  proofUploadError.value = null
  proofUploading.value = true
  const result = await presignAndUpload(file, 'payment-proofs')
  proofUploading.value = false

  if (result.ok) {
    proofKey.value = result.data.file_key
  } else {
    proofFile.value = null
    proofUploadError.value = result.error
  }
  emitPayment()
}

function removeFile() {
  proofFile.value = null
  proofKey.value = null
  proofUploadError.value = null
  if (inputRef.value) inputRef.value.value = ''
}

watch([selectedOption, selectedBankType, form, proofKey], emitPayment, { deep: true })

function emitPayment() {
  if (selectedOption.value === 'online') {
    return emit('payment', { channel: 'online' })
  }
  if (selectedOption.value !== 'bank' || !selectedBankType.value) {
    return emit('payment', null)
  }

  emit('payment', {
    channel: 'bank',
    transferType: selectedBankType.value,
    ...form,
    proofKey: proofKey.value,
  })
}

function formatNum(value) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value ?? 0)
}
</script>
