<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <!-- Back -->
    <div>
      <NuxtLink to="/supplierinvoices" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Invoices
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col items-center gap-3 py-24">
      <span class="loading loading-spinner loading-lg text-base-content/30" />
      <p class="text-sm text-base-content/40">Loading verification report…</p>
    </div>

    <!-- Not found -->
    <div v-else-if="!findings" class="card border border-base-200 bg-base-100">
      <div class="card-body flex flex-col items-center gap-3 py-16 text-center text-base-content/40">
        <Icon name="lucide:file-x" class="h-10 w-10" />
        <p class="font-semibold">Payment not found</p>
        <p class="text-sm">We could not find a payment matching this link, or it belongs to another organisation.</p>
        <NuxtLink to="/supplierinvoices" class="btn btn-sm btn-ghost">Back to invoices</NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Headline status -->
      <div class="rounded-xl px-5 py-5 flex items-start gap-4" :class="banner.wrapper">
        <div class="rounded-xl p-3 shrink-0" :class="banner.iconWrapper">
          <Icon :name="banner.icon" class="h-6 w-6" :class="banner.iconColor" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold" :class="banner.titleColor">{{ banner.title }}</p>
          <p class="text-sm text-base-content/60 mt-0.5">{{ findings.summary }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-base-content/50">
            <span v-if="findings.invoice_number">
              Invoice <span class="font-mono text-base-content/70">{{ findings.invoice_number }}</span>
            </span>
            <span>{{ findings.attempts }} verification {{ findings.attempts === 1 ? 'attempt' : 'attempts' }}</span>
            <span v-if="findings.last_verification_at">Last checked {{ formatDateTime(findings.last_verification_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Findings -->
      <div v-if="findings.findings?.length" class="card border border-base-200 bg-base-100">
        <div class="card-body gap-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/50">What we found</h2>
          <div v-for="finding in findings.findings" :key="finding.code" class="flex items-start gap-3">
            <Icon
              :name="finding.correctable ? 'lucide:pencil-line' : 'lucide:life-buoy'"
              class="h-5 w-5 shrink-0 mt-0.5"
              :class="finding.correctable ? 'text-warning' : 'text-error'"
            />
            <div class="min-w-0">
              <p class="font-medium text-base-content">{{ finding.title }}</p>
              <p class="text-sm text-base-content/60 mt-0.5">{{ finding.detail }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- What we searched with -->
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body gap-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/50">Details we searched with</h2>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div v-for="item in submittedRows" :key="item.label" class="flex flex-col">
              <dt class="text-xs text-base-content/40">{{ item.label }}</dt>
              <dd class="text-sm font-mono text-base-content break-all">{{ item.value || '—' }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Bank transactions we looked at -->
      <div v-if="findings.candidates?.length" class="card border border-base-200 bg-base-100">
        <div class="card-body gap-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/50">Bank transactions we examined</h2>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="text-base-content/40">
                  <th>References</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Why it was not used</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="candidate in findings.candidates" :key="candidate.crm_bank_transaction_id">
                  <td class="font-mono text-xs break-all">{{ candidate.references?.join(', ') || '—' }}</td>
                  <td class="whitespace-nowrap">{{ candidate.currency }} {{ candidate.amount }}</td>
                  <td>
                    <span class="badge badge-sm" :class="candidate.status === 'PENDING' ? 'badge-success' : 'badge-error'">
                      {{ candidate.status }}
                    </span>
                  </td>
                  <td class="text-xs text-base-content/60">{{ candidate.reasons?.join(' ') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Needs PRAZ support -->
      <div v-if="findings.resolution === 'PRAZ_SUPPORT'" class="rounded-xl border border-error/40 bg-error/5 px-5 py-4">
        <p class="text-sm text-base-content/70">
          This cannot be fixed by resubmitting your payment details. Please contact PRAZ support
          quoting invoice <span class="font-mono">{{ findings.invoice_number }}</span> so the transaction can be released.
        </p>
      </div>

      <!-- Correction form -->
      <div v-if="findings.can_correct" class="card border border-base-200 bg-base-100">
        <div class="card-body gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/50">
                {{ findings.correction_recommended ? 'Correct your payment details' : 'Correct your details anyway' }}
              </h2>
              <p class="text-sm text-base-content/60 mt-1">
                {{ stillRetrying
                  ? 'Verification is still running. Anything you change here is used on the next attempt — you do not have to wait for it to fail.'
                  : 'Only change what differs from your bank confirmation. We will search for your bank transaction again.' }}
              </p>
            </div>
            <span class="badge badge-ghost badge-sm shrink-0">{{ findings.corrections_remaining }} left</span>
          </div>

          <!-- When nothing the supplier controls is wrong, keep the form collapsed -->
          <button
            v-if="!findings.correction_recommended && !showAllFields"
            type="button"
            class="btn btn-sm btn-ghost self-start"
            @click="showAllFields = true"
          >
            <Icon name="lucide:pencil-line" class="h-4 w-4" />
            Edit payment details
          </button>

          <form v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="submit">
            <label v-if="showsField('source_reference')" class="form-control w-full">
              <span class="label-text text-xs text-base-content/50 mb-1">Bank reference</span>
              <input v-model.trim="form.source_reference" type="text" maxlength="255" class="input input-bordered input-sm w-full font-mono" placeholder="As shown on your bank confirmation">
            </label>

            <label v-if="showsField('stan_code')" class="form-control w-full">
              <span class="label-text text-xs text-base-content/50 mb-1">STAN code</span>
              <input v-model.trim="form.stan_code" type="text" maxlength="20" class="input input-bordered input-sm w-full font-mono" placeholder="ZIPIT transfers only">
            </label>

            <label v-if="showsField('payment_date')" class="form-control w-full">
              <span class="label-text text-xs text-base-content/50 mb-1">Payment date</span>
              <input v-model="form.payment_date" type="date" :max="today" class="input input-bordered input-sm w-full">
            </label>

            <label v-if="showsField('amount_sent')" class="form-control w-full">
              <span class="label-text text-xs text-base-content/50 mb-1">Amount sent</span>
              <input v-model="form.amount_sent" type="number" step="0.01" min="0.01" class="input input-bordered input-sm w-full">
            </label>

            <label v-if="showsField('remittance_currency')" class="form-control w-full">
              <span class="label-text text-xs text-base-content/50 mb-1">Remittance currency</span>
              <input v-model.trim="form.remittance_currency" type="text" maxlength="3" class="input input-bordered input-sm w-full uppercase" placeholder="USD">
            </label>

            <label v-if="showsField('proof_key')" class="form-control w-full sm:col-span-2">
              <span class="label-text text-xs text-base-content/50 mb-1">Replace proof of payment</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" class="file-input file-input-bordered file-input-sm w-full" :disabled="uploading" @change="uploadProof">
              <span v-if="uploading" class="text-xs text-base-content/40 mt-1">Uploading…</span>
              <span v-else-if="form.proof_key" class="text-xs text-success mt-1">New proof attached.</span>
            </label>

            <label class="form-control w-full sm:col-span-2">
              <span class="label-text text-xs text-base-content/50 mb-1">Note for the reviewer (optional)</span>
              <textarea v-model.trim="form.note" rows="2" maxlength="500" class="textarea textarea-bordered textarea-sm w-full" placeholder="e.g. The bank confirmed the reference ends in 85." />
            </label>

            <div class="sm:col-span-2 flex items-center gap-3">
              <button type="submit" class="btn btn-primary btn-sm" :disabled="submitting || uploading">
                <span v-if="submitting" class="loading loading-spinner loading-xs" />
                Resubmit for verification
              </button>
              <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
            </div>
          </form>
        </div>
      </div>

      <!-- Exhausted allowance -->
      <div v-else-if="findings.status === 'MATCH_FAILED'" class="rounded-xl border border-base-200 bg-base-100 px-5 py-4">
        <p class="text-sm text-base-content/60">
          You have used all {{ findings.corrections_used }} correction attempts for this payment.
          Please contact PRAZ support for manual verification.
        </p>
      </div>

      <!-- Previous corrections -->
      <div v-if="findings.correction_history?.length" class="card border border-base-200 bg-base-100">
        <div class="card-body gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-base-content/50">Previous corrections</h2>
          <div v-for="(correction, index) in findings.correction_history" :key="index" class="text-sm">
            <p class="text-base-content/70">
              {{ formatDateTime(correction.corrected_at) }} — {{ correction.corrected_by_name || 'Unknown user' }}
              <span class="text-base-content/40">({{ correction.actor_type }})</span>
            </p>
            <ul class="mt-1 ml-4 list-disc text-xs text-base-content/50">
              <li v-for="(change, field) in correction.changes" :key="field">
                {{ humanise(field) }}: <span class="font-mono">{{ change.from || '—' }}</span> → <span class="font-mono">{{ change.to }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Payment Verification' })

const route = useRoute()
const toast = useToast()
const { getVerificationFindings, submitCorrection } = usePayment()
const { presignAndUpload } = useS3Upload()

const findings = ref(null)
const pending = ref(true)
const submitting = ref(false)
const uploading = ref(false)
const showAllFields = ref(false)
const errorMessage = ref('')

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  source_reference: '',
  stan_code: '',
  payment_date: '',
  amount_sent: '',
  remittance_currency: '',
  proof_key: '',
  note: '',
})

const stillRetrying = computed(() => findings.value?.status === 'PENDING')

const banner = computed(() => {
  const status = findings.value?.status
  if (status === 'VERIFIED') {
    return {
      title: 'Payment verified',
      wrapper: 'border border-success/40 bg-success/5',
      iconWrapper: 'bg-success/15',
      icon: 'lucide:circle-check',
      iconColor: 'text-success',
      titleColor: 'text-success',
    }
  }
  if (status === 'PENDING') {
    return {
      title: 'Verification in progress',
      wrapper: 'border border-warning/40 bg-warning/5',
      iconWrapper: 'bg-warning/15',
      icon: 'lucide:clock',
      iconColor: 'text-warning',
      titleColor: 'text-warning',
    }
  }
  return {
    title: 'We could not verify your payment',
    wrapper: 'border border-error/40 bg-error/5',
    iconWrapper: 'bg-error/15',
    icon: 'lucide:circle-alert',
    iconColor: 'text-error',
    titleColor: 'text-error',
  }
})

const submittedRows = computed(() => {
  const values = findings.value?.submitted_values ?? {}
  return [
    { label: 'Bank reference', value: values.bank_reference },
    { label: 'STAN code', value: values.stan_code },
    { label: 'Invoice payment reference', value: values.invoice_payment_reference },
    { label: 'Expected amount', value: values.expected_amount },
    { label: 'Expected currency', value: values.expected_currency },
    { label: 'Payment date', value: values.payment_date },
  ]
})

// When the API names the fields worth changing, show only those. Otherwise the
// supplier asked to edit anyway, so offer everything they are allowed to touch.
function showsField(field) {
  const recommended = findings.value?.correctable_fields ?? []
  return recommended.length ? recommended.includes(field) : true
}

function humanise(field) {
  return field.replaceAll('_', ' ')
}

function formatDateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function applyFindings(data) {
  findings.value = data
  const values = data?.submitted_values ?? {}
  form.source_reference = values.bank_reference ?? ''
  form.stan_code = values.stan_code ?? ''
  form.payment_date = values.payment_date ?? ''
  form.remittance_currency = values.expected_currency ?? ''
  form.amount_sent = ''
  form.proof_key = ''
  form.note = ''
}

async function load() {
  pending.value = true
  applyFindings(await getVerificationFindings(route.params.uuid))
  pending.value = false
}

async function uploadProof(event) {
  const file = event.target.files?.[0]
  if (!file) return

  uploading.value = true
  const result = await presignAndUpload(file, 'payment-proofs')
  uploading.value = false

  if (!result.ok) {
    errorMessage.value = result.error
    event.target.value = ''
    return
  }

  errorMessage.value = ''
  form.proof_key = result.data.file_key
}

async function submit() {
  if (submitting.value) return

  errorMessage.value = ''
  submitting.value = true

  const payload = {}
  for (const [field, value] of Object.entries(form)) {
    if (value !== '' && value !== null) payload[field] = value
  }

  const result = await submitCorrection(route.params.uuid, payload)
  submitting.value = false

  if (!result.status) {
    errorMessage.value = result.message
    return
  }

  applyFindings(result.data)
  showAllFields.value = false
  toast.success({
    title: 'Details resubmitted',
    message: result.message,
    position: 'topRight',
    layout: 2,
  })
}

onMounted(load)
</script>
