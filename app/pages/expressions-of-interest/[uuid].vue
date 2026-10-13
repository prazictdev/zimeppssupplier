<template>
  <div class="mx-auto max-w-6xl space-y-5">
    <NuxtLink :to="user ? '/supplieropportunities' : '/tenders'" class="btn btn-ghost btn-sm"><Icon name="lucide:arrow-left" /> All opportunities</NuxtLink>
    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error" class="alert alert-error text-black"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>

    <template v-else-if="notice">
      <div v-if="user && isEoiOpen" class="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm">
        <ul class="steps steps-vertical w-full sm:steps-horizontal"><li v-for="step in steps" :key="step.number" class="step text-xs sm:text-sm" :class="currentStep >= step.number ? 'step-success' : ''">{{ step.label }}</li></ul>
      </div>
      <div v-if="message" role="alert" class="alert text-black" :class="messageOk ? 'alert-success' : 'alert-error'"><Icon :name="messageOk ? 'lucide:circle-check' : 'lucide:circle-alert'" /><span>{{ message }}</span></div>

      <section v-if="user && !isEoiOpen" class="rounded-2xl border border-error/30 bg-error/5 p-6 shadow-sm"><div class="flex items-start gap-3"><Icon name="lucide:lock-keyhole" class="mt-0.5 h-6 w-6 text-error" /><div><h2 class="text-lg font-bold">EOI response window closed</h2><p class="mt-2 text-sm text-base-content/70">This EOI closed at {{ dateTime(notice.closing_at) }}. Draft responses are now locked, and submitted responses can no longer be recalled or edited.</p><NuxtLink to="/mysupplierbids" class="btn btn-outline btn-sm mt-4"><Icon name="lucide:briefcase-business" />Return to My Bids</NuxtLink></div></div></section>

      <section v-else-if="user && !existingResponse" class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm"><div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2"><Icon name="lucide:folder-plus" class="h-5 w-5 text-success" /><h2 class="text-lg font-bold">Add this EOI to My Bids</h2></div><p class="mt-2 text-sm text-base-content/60">Create a draft response workspace before completing, signing and sealing the EOI response.</p></div><button type="button" class="btn btn-success shrink-0" :disabled="workspaceBusy" @click="addToMyBids"><span v-if="workspaceBusy" class="loading loading-spinner loading-sm" /><Icon v-else name="lucide:folder-plus" />Add to My Bids</button></div></section>

      <section v-else-if="user && existingResponse.status !== 'DRAFT'" class="rounded-2xl border border-success/30 bg-success/5 p-6 shadow-sm"><div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2 text-success"><Icon name="lucide:shield-check" class="h-5 w-5" /><h2 class="text-lg font-bold">EOI response awaiting opening</h2></div><p class="mt-2 text-sm text-base-content/65">Your signed and sealed response is in My Bids and remains encrypted until this EOI closes.</p><p v-if="existingResponse.receipt_hash" class="mt-2 break-all font-mono text-xs">Receipt: {{ existingResponse.receipt_hash }}</p></div><button v-if="isSubmittedResponse && isEoiOpen" type="button" class="btn btn-warning shrink-0" :disabled="workspaceBusy" @click="recallResponse"><span v-if="workspaceBusy" class="loading loading-spinner loading-sm" /><Icon v-else name="lucide:undo-2" />Recall and edit response</button></div></section>

      <form v-else-if="user" class="rounded-2xl border border-base-200 bg-base-100 shadow-sm" @submit.prevent="submit">
        <section v-if="currentStep === 1" class="p-6">
          <StepHeading number="1" title="EOI details" description="Review the complete published notice and all addenda before deciding to participate." />
          <EoiDetails :notice="notice" :date-time="dateTime" />
          <div class="mt-5"><ConsultancyEoiAddenda :eoi-uuid="String(route.params.uuid)" :addenda="notice.addenda ?? []" /></div>
        </section>

        <section v-else-if="currentStep === 2" class="p-6">
          <StepHeading number="2" title="Participation arrangement" description="Tell us whether this response is being submitted as a joint venture." />
          <div v-if="!notice.allow_joint_ventures" class="alert alert-info mt-5 text-black"><Icon name="lucide:info" /><span>This EOI does not permit joint-venture responses. You will participate as a sole consultant.</span></div>
          <div v-else class="mt-5 grid gap-3 sm:grid-cols-2">
            <label class="flex cursor-pointer gap-3 rounded-xl border p-4" :class="!isJointVenture ? 'border-success bg-success/5' : 'border-base-300'"><input v-model="isJointVenture" type="radio" :value="false" class="radio radio-success" /><span><strong class="block">No, sole consultant</strong><span class="text-sm text-base-content/60">Submit using only your registered company.</span></span></label>
            <label class="flex cursor-pointer gap-3 rounded-xl border p-4" :class="isJointVenture ? 'border-success bg-success/5' : 'border-base-300'"><input v-model="isJointVenture" type="radio" :value="true" class="radio radio-success" /><span><strong class="block">Yes, joint venture</strong><span class="text-sm text-base-content/60">Add one or more active PRAZ-registered partners.</span></span></label>
          </div>

          <div v-if="isJointVenture" class="mt-6 space-y-5">
            <div class="rounded-xl border border-base-200 bg-base-200/30 p-4">
              <label class="fieldset"><span class="fieldset-legend font-semibold">Search for a PRAZ-registered company</span><div class="join w-full"><input v-model.trim="partnerSearch" class="input input-bordered join-item w-full" placeholder="Company name or registration number" @keyup.enter.prevent="searchPartners" /><button type="button" class="btn btn-success join-item" :disabled="partnerSearching || partnerSearch.length < 2" @click="searchPartners"><span v-if="partnerSearching" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:search" /> Search</button></div></label>
              <p class="mt-2 text-xs text-base-content/55">Only suppliers with an active, approved PRAZ registration are returned.</p>
              <div v-if="partnerResults.length" class="mt-4 divide-y divide-base-200 rounded-lg border border-base-200 bg-base-100"><div v-for="company in partnerResults" :key="company.company_uuid" class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-semibold">{{ company.name }}</p><p class="text-xs text-base-content/55">PRAZ registration: {{ company.registration_number || 'Registered' }}</p></div><button type="button" class="btn btn-outline btn-success btn-sm" @click="addPartner(company)"><Icon name="lucide:plus" /> Add partner</button></div></div>
              <p v-else-if="partnerSearched && !partnerSearching" class="mt-4 text-sm text-base-content/60">No active PRAZ-registered suppliers matched your search.</p>
            </div>
            <div><h3 class="font-semibold">Selected joint-venture partners</h3><div v-if="jointVenturePartners.length" class="mt-3 space-y-2"><div v-for="company in jointVenturePartners" :key="company.company_uuid" class="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-3"><div><p class="font-semibold">{{ company.name }}</p><p class="text-xs text-base-content/55">{{ company.registration_number || 'Active PRAZ registration' }}</p></div><button type="button" class="btn btn-ghost btn-sm text-error" @click="removePartner(company.company_uuid)"><Icon name="lucide:trash-2" /> Remove</button></div></div><p v-else class="mt-2 text-sm text-warning">Search and add at least one registered partner to continue.</p></div>
            <label class="fieldset"><span class="fieldset-legend">Joint-venture structure and each partner’s contribution</span><textarea v-model.trim="form.association_details" class="textarea textarea-bordered min-h-28 w-full" placeholder="Describe the lead partner, responsibilities and contribution of each member." required /></label>
          </div>
        </section>

        <section v-else-if="currentStep === 3" class="p-6">
          <StepHeading number="3" title="SPOC administration fee" description="The mandatory fee must be confirmed as paid before you can prepare and submit the response." />
          <div class="mt-5 rounded-xl border p-5" :class="feePaid ? 'border-success/40 bg-success/5' : 'border-warning/40 bg-warning/5'"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-2"><Icon name="lucide:receipt-text" class="h-5 w-5" /><h3 class="font-semibold">Mandatory SPOC fee</h3></div><p class="mt-2 text-2xl font-bold">{{ feeStatus?.currency ?? notice.spoc_fee_currency }} {{ feeStatus?.amount ?? notice.spoc_fee_amount }}</p><p v-if="feeStatus?.invoice" class="mt-1 text-sm text-base-content/60">Invoice {{ feeStatus.invoice.invoice_number }} · {{ feeStatus.invoice.status }}</p></div><div class="flex flex-wrap gap-2"><span v-if="feePaid" class="badge badge-success badge-lg gap-1"><Icon name="lucide:circle-check" /> Payment confirmed</span><NuxtLink v-else-if="feeStatus?.invoice?.uuid" :to="`/invoice/settle/${feeStatus.invoice.uuid}`" class="btn btn-warning"><Icon name="lucide:credit-card" /> Pay fee</NuxtLink><button v-else type="button" class="btn btn-warning" :disabled="feeLoading" @click="generateFee"><span v-if="feeLoading" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:file-plus-2" /> Generate invoice</button><button v-if="!feePaid" type="button" class="btn btn-outline" :disabled="feeLoading" @click="refreshFee"><Icon name="lucide:refresh-cw" /> Refresh payment status</button></div></div></div>
          <div v-if="!feePaid" class="alert alert-warning mt-4 text-black"><Icon name="lucide:lock-keyhole" /><span>The next step will unlock after PRAZ confirms payment.</span></div>
        </section>

        <section v-else-if="currentStep === 4" class="p-6">
          <StepHeading number="4" title="Response details" description="Provide the response contact and your overall technical expression of interest." />
          <div v-if="responseCheckLoading" class="alert alert-info mt-5 text-black"><span class="loading loading-spinner loading-sm" /><span>Checking for a previously saved EOI response…</span></div>
          <div v-else-if="localDraftRestored" class="alert alert-info mt-5 text-black"><Icon name="lucide:database" /><span>Your response details were restored from the draft saved in this browser.</span></div>
          <div v-else-if="existingResponse?.encrypted" class="alert alert-success mt-5 text-black"><Icon name="lucide:shield-check" /><span>A previously submitted encrypted EOI response was found. Its contents remain sealed for the procuring entity; locally saved details are used when available.</span></div>
          <div v-else-if="existingResponse" class="alert alert-success mt-5 text-black"><Icon name="lucide:circle-check" /><span>A previously saved EOI response was found and loaded. Changes will replace it with an encrypted response when you submit.</span></div>
          <div v-else-if="savedResponseChecked" class="alert alert-info mt-5 text-black"><Icon name="lucide:file-plus-2" /><span>No previously saved EOI response was found. You are preparing a new response.</span></div>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="fieldset"><span class="fieldset-legend">Contact person</span><input v-model.trim="form.contact_name" class="input input-bordered w-full" required /></label><label class="fieldset"><span class="fieldset-legend">Email</span><input v-model.trim="form.contact_email" type="email" class="input input-bordered w-full" required /></label><label class="fieldset"><span class="fieldset-legend">Telephone</span><input v-model.trim="form.contact_phone" class="input input-bordered w-full" required /></label><label class="fieldset"><span class="fieldset-legend">Website</span><input v-model.trim="form.website" type="url" class="input input-bordered w-full" /></label><label class="fieldset sm:col-span-2"><span class="fieldset-legend">Postal/physical address</span><textarea v-model.trim="form.contact_address" class="textarea textarea-bordered w-full" required /></label><div class="fieldset sm:col-span-2"><span class="fieldset-legend">Statement of interest</span><RichTextEditor v-model="form.statement_of_interest" placeholder="Explain your interest in and understanding of the assignment…" /></div><div class="fieldset sm:col-span-2"><span class="fieldset-legend">Overall similar experience</span><RichTextEditor v-model="form.similar_experience" placeholder="Describe comparable assignments and relevant experience…" /></div><div class="fieldset sm:col-span-2"><span class="fieldset-legend">Available professional skills</span><RichTextEditor v-model="form.key_experts_summary" placeholder="Summarise the professional skills and key experts available…" /></div></div>
        </section>

        <section v-else class="p-6">
          <StepHeading number="5" title="Eligibility requirements and evidence" description="Respond to every criterion and upload a document wherever evidence is required." />
          <div class="mt-5 space-y-4"><article v-for="(criterion, index) in notice.criteria" :key="criterion.uuid" class="rounded-xl border border-base-200 p-4"><div class="flex flex-wrap items-center gap-2"><span class="badge badge-ghost">{{ index + 1 }}</span><h3 class="font-semibold">{{ criterion.title }}</h3><span v-if="criterion.mandatory" class="badge badge-error badge-sm">Mandatory</span><span v-if="criterion.evidence_required" class="badge badge-warning badge-sm">Document required</span></div><p v-if="criterion.description" class="mt-2 text-sm text-base-content/60">{{ criterion.description }}</p><p v-if="criterion.minimum_years || criterion.minimum_assignments" class="mt-1 text-xs text-base-content/50"><span v-if="criterion.minimum_years">Minimum {{ criterion.minimum_years }} years.</span> <span v-if="criterion.minimum_assignments">Minimum {{ criterion.minimum_assignments }} assignments.</span></p><div v-if="criterion.evaluation_method === 'SCORED' && criterion.scoring_bands?.length" class="mt-3 rounded-lg bg-info/5 p-3 text-xs"><p class="font-semibold">Published scoring bands</p><ul class="mt-2 space-y-1"><li v-for="band in criterion.scoring_bands" :key="band.uuid" class="flex justify-between gap-3"><span>{{ band.label }}</span><strong>{{ band.score }} marks</strong></li></ul></div><label class="fieldset mt-3"><span class="fieldset-legend">Your response</span><textarea v-model.trim="criterionResponses[criterion.uuid].response" class="textarea textarea-bordered min-h-24 w-full" required /></label><div v-if="criterion.evidence_required" class="mt-4 rounded-lg border border-dashed border-base-300 p-4"><p class="text-sm font-semibold">Required evidence: {{ criterion.evidence_label || criterion.title }}</p><div class="mt-3 flex flex-wrap gap-2"><button type="button" class="btn btn-outline btn-success btn-sm" @click="openMediaPicker(criterion)"><Icon name="lucide:library" />Attach from Media Center</button><NuxtLink to="/media-center" class="btn btn-ghost btn-sm"><Icon name="lucide:external-link" /> Manage Media Center</NuxtLink></div><div v-if="criterionResponses[criterion.uuid].evidence_documents.length" class="mt-3 space-y-2"><div v-for="(evidence, evidenceIndex) in criterionResponses[criterion.uuid].evidence_documents" :key="evidence.media_document_uuid" class="flex items-center justify-between rounded-lg bg-success/5 p-3 text-sm text-success"><span class="flex items-center gap-2"><Icon name="lucide:file-check-2" />{{ evidence.title || evidence.file_name }}</span><button type="button" class="btn btn-ghost btn-xs text-error" @click="criterionResponses[criterion.uuid].evidence_documents.splice(evidenceIndex, 1)"><Icon name="lucide:x" /> Remove</button></div></div></div></article></div>
          <div class="mt-6 rounded-xl border border-base-200 bg-base-200/30 p-4 text-sm"><p><strong>Participation:</strong> {{ isJointVenture ? `Joint venture with ${jointVenturePartners.length} partner(s)` : 'Sole consultant' }}</p><p class="mt-1"><strong>SPOC payment:</strong> <span class="text-success">Confirmed</span></p></div>
          <div class="mt-6 rounded-xl border border-base-200 p-5">
            <div class="flex items-start gap-3"><Icon name="lucide:shield-check" class="mt-0.5 h-5 w-5 text-success" /><div><h3 class="font-semibold">Sign and seal response</h3><p class="text-sm text-base-content/60">The same Bid Vault and bidder submission key used for tender responses are required.</p></div></div>
            <div v-if="!vaultRecord" class="mt-4 space-y-3"><div class="alert alert-warning text-black"><Icon name="lucide:vault" /><span>Create your encrypted Bid Vault before submitting.</span></div><div class="grid gap-3 sm:grid-cols-2"><input v-model="vaultPassphrase" type="password" class="input input-bordered w-full" placeholder="New vault passphrase (12+ characters)" autocomplete="new-password" /><input v-model="vaultConfirmation" type="password" class="input input-bordered w-full" placeholder="Confirm passphrase" autocomplete="new-password" /></div><button type="button" class="btn btn-outline btn-success btn-sm" :disabled="securityBusy || vaultPassphrase.length < 12 || vaultPassphrase !== vaultConfirmation" @click="setupVault"><span v-if="securityBusy" class="loading loading-spinner loading-xs" />Create Bid Vault</button></div>
            <div v-else-if="!vaultUnlocked" class="mt-4 space-y-3"><div class="alert alert-warning text-black"><Icon name="lucide:lock-keyhole" /><span>Unlock your Bid Vault to access the signing key.</span></div><div class="flex flex-col gap-3 sm:flex-row"><input v-model="vaultPassphrase" type="password" class="input input-bordered flex-1" placeholder="Bid Vault passphrase" autocomplete="current-password" /><button type="button" class="btn btn-success" :disabled="securityBusy || !vaultPassphrase" @click="unlockVault"><span v-if="securityBusy" class="loading loading-spinner loading-xs" />Unlock Vault</button></div></div>
            <div v-else-if="!portalSigningKey" class="mt-4"><div class="alert alert-warning text-black"><Icon name="lucide:key-round" /><div><p class="font-semibold">A browser submission key is required</p><p class="text-xs">Set up an assigned bidder submission licence in this Bid Vault before signing.</p></div></div><div class="mt-3 flex flex-wrap gap-2"><button v-if="availableSigningKey" type="button" class="btn btn-outline btn-success btn-sm" :disabled="securityBusy" @click="setupSigningKey"><span v-if="securityBusy" class="loading loading-spinner loading-xs" />Set up {{ availableSigningKey.key_serial }}</button><NuxtLink to="/submission-keys" class="btn btn-ghost btn-sm"><Icon name="lucide:external-link" />Manage submission keys</NuxtLink></div></div>
            <div v-else class="alert alert-success mt-4 text-black"><Icon name="lucide:badge-check" /><span>Ready to encrypt and sign with submission key {{ portalSigningKey.key_serial }}.</span></div>
            <div v-if="recoveryCode" class="alert alert-warning mt-4 text-black"><Icon name="lucide:triangle-alert" /><div><p class="font-semibold">Save this Bid Vault recovery code now</p><code class="mt-1 block break-all text-xs">{{ recoveryCode }}</code></div></div>
          </div>
          <div v-if="receipt" class="mt-6 rounded-xl border border-success/30 bg-success/5 p-5 text-sm"><div class="flex items-center gap-2 font-semibold text-success"><Icon name="lucide:receipt-text" />Signed and sealed submission receipt</div><p class="mt-3"><strong>Receipt hash:</strong> <code class="break-all">{{ receipt.receipt_hash }}</code></p><p class="mt-1"><strong>Submitted:</strong> {{ dateTime(receipt.submitted_at) }}</p><p class="mt-1"><strong>Submission key:</strong> {{ receipt.submission_key_serial }}</p></div>
        </section>

        <footer class="flex flex-col-reverse gap-3 border-t border-base-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-3"><button v-if="currentStep > 1" type="button" class="btn btn-ghost" @click="previousStep"><Icon name="lucide:arrow-left" /> Previous</button><span v-if="localSavedAt" class="text-xs text-base-content/50"><Icon name="lucide:database" class="mr-1 inline h-3 w-3" />Saved in this browser {{ dateTime(localSavedAt) }}</span></div><button v-if="currentStep < steps.length" type="button" class="btn btn-success" :disabled="currentStep === 3 && !feePaid" @click="nextStep">Continue <Icon name="lucide:arrow-right" /></button><button v-else type="submit" class="btn btn-success" :disabled="saving || !feePaid || !submissionReady"><span v-if="saving" class="loading loading-spinner loading-sm" /><Icon v-else name="lucide:shield-check" />{{ existingResponse ? 'Sign, seal and update' : 'Sign, seal and submit' }}</button></footer>
      </form>

      <template v-else>
        <section class="rounded-2xl border border-base-200 bg-base-100 p-6 shadow-sm"><EoiDetails :notice="notice" :date-time="dateTime" /><div class="mt-5"><ConsultancyEoiAddenda :eoi-uuid="String(route.params.uuid)" :addenda="notice.addenda ?? []" /></div></section>
        <section class="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 class="font-semibold text-emerald-950">Interested in this opportunity?</h2><p class="mt-1 text-sm text-emerald-900/70">Sign in to complete the EOI response wizard.</p></div><NuxtLink :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`" class="btn btn-success shrink-0"><Icon name="lucide:log-in" /> Sign in to respond</NuxtLink></div></section>
      </template>
      <dialog ref="mediaDialog" class="modal"><div class="modal-box max-w-3xl"><div class="flex items-start justify-between gap-3"><div><h3 class="text-lg font-bold">Attach from Media Center</h3><p class="mt-1 text-sm text-base-content/60">Select evidence for {{ selectedCriterion?.title }}.</p></div><button type="button" class="btn btn-ghost btn-sm" @click="mediaDialog?.close()"><Icon name="lucide:x" /></button></div><label class="input input-bordered mt-4 flex items-center gap-2"><Icon name="lucide:search" /><input v-model.trim="mediaSearch" class="grow" placeholder="Search your documents" @input="loadMediaDocuments" /></label><div v-if="mediaLoading" class="py-12 text-center"><span class="loading loading-spinner text-success" /></div><div v-else-if="mediaDocuments.length" class="mt-4 max-h-96 divide-y divide-base-200 overflow-y-auto rounded-xl border border-base-200"><button v-for="document in mediaDocuments" :key="document.uuid" type="button" class="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-base-200/50 disabled:cursor-not-allowed disabled:opacity-50" :disabled="documentExpired(document)" @click="attachMediaDocument(document)"><span><strong class="block">{{ document.title }}</strong><span class="text-xs text-base-content/55">{{ document.original_filename }} · {{ document.category || 'General' }}</span><span v-if="documentExpired(document)" class="mt-1 block text-xs text-error">Expired {{ document.expires_at }}</span></span><Icon name="lucide:paperclip" class="shrink-0" /></button></div><div v-else class="py-12 text-center text-base-content/50"><Icon name="lucide:library" class="mx-auto mb-2 h-8 w-8" /><p>No Media Center documents found.</p><NuxtLink to="/media-center" class="btn btn-success btn-sm mt-3">Add a document</NuxtLink></div></div><form method="dialog" class="modal-backdrop"><button>close</button></form></dialog>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default', sanctum: { excluded: true } })
const route = useRoute()
const api = useConsultancyEoi()
const securityApi = useBidResponse()
const cryptoTools = useBidCrypto()
const vaultSession = useBidVaultSession()
const { setSubmissionKeyOnBrowser } = useBrowserSubmissionKey()
const mediaCenter = useMediaCenter()
const localDrafts = useEoiLocalDraft()
const { getPublicConsultancyEoi } = usePublicTenderHelper()
const { user } = useSanctumAuth()
const steps = [{ number: 1, label: 'EOI details' }, { number: 2, label: 'Participation' }, { number: 3, label: 'SPOC fee' }, { number: 4, label: 'Response' }, { number: 5, label: 'Requirements' }]
const currentStep = ref(1)
const loading = ref(true), saving = ref(false), feeLoading = ref(false), securityBusy = ref(false), workspaceBusy = ref(false), partnerSearching = ref(false), partnerSearched = ref(false), responseCheckLoading = ref(false), savedResponseChecked = ref(false), localDraftRestored = ref(false)
const partnerSearch = ref(''), partnerResults = ref([]), jointVenturePartners = ref([]), error = ref(''), message = ref(''), messageOk = ref(true), notice = ref(null), existingResponse = ref(null), feeStatus = ref(null)
const mediaDialog = ref(null), selectedCriterion = ref(null), mediaDocuments = ref([]), mediaSearch = ref(''), mediaLoading = ref(false), localSavedAt = ref(null), draftReady = ref(false), committedSnapshot = ref('')
const vaultRecord = ref(null), vaultUnlocked = ref(false), masterKey = shallowRef(null), vaultPassphrase = ref(''), vaultConfirmation = ref(''), recoveryCode = ref(''), submissionKeys = ref([]), receipt = ref(null)
const responseWindowClock = ref(Date.now())
const criterionResponses = reactive({})
const form = reactive({ statement_of_interest: '', similar_experience: '', key_experts_summary: '', association_type: 'SOLE', association_details: '', contact_name: '', contact_email: '', contact_phone: '', contact_address: '', website: '' })
const feePaid = computed(() => Boolean(feeStatus.value?.invoice?.paid))
const isEoiOpen = computed(() => Boolean(notice.value?.closing_at) && responseWindowClock.value < new Date(notice.value.closing_at).getTime())
const isSubmittedResponse = computed(() => ['SUBMITTED', 'AWAITING_OPENING'].includes(existingResponse.value?.status))
const authenticatedUser = computed(() => user.value?.data?.user ?? user.value?.data ?? user.value)
const currentUserId = computed(() => authenticatedUser.value?.id ?? null)
const mySubmissionKeys = computed(() => submissionKeys.value.filter(key => Number(key.user?.id) === Number(currentUserId.value)))
const portalSigningKey = computed(() => mySubmissionKeys.value.find(key => key.status === 'ACTIVE' && key.storage_mode === 'PORTAL_VAULT'))
const availableSigningKey = computed(() => mySubmissionKeys.value.find(key => key.status === 'PENDING_GENERATION') ?? mySubmissionKeys.value.find(key => key.status === 'ACTIVE'))
const submissionReady = computed(() => vaultUnlocked.value && Boolean(masterKey.value) && Boolean(portalSigningKey.value))
const draftKey = computed(() => `eoi-response:${route.params.uuid}:${user.value?.data?.user?.id ?? 'supplier'}`)
const isJointVenture = computed({ get: () => form.association_type === 'JOINT_VENTURE', set: selected => { form.association_type = selected ? 'JOINT_VENTURE' : 'SOLE'; if (!selected) { form.association_details = ''; jointVenturePartners.value = [] } } })
const dateTime = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

function hydrateResponse(response) {
  if (response && !response.encrypted) { for (const field of Object.keys(form)) { if (response[field] !== undefined && response[field] !== null) form[field] = response[field] } jointVenturePartners.value = response.joint_venture_partners ?? [] }
  for (const criterion of notice.value?.criteria ?? []) { const saved = response?.criterion_responses?.find(item => item.criterion_uuid === criterion.uuid); criterionResponses[criterion.uuid] = { response: saved?.response ?? '', evidence_documents: saved?.evidence_documents?.length ? saved.evidence_documents : (saved?.evidence ? [saved.evidence] : []) } }
}

onMounted(async () => {
  responseWindowTimer = window.setInterval(() => { responseWindowClock.value = Date.now() }, 1000)
  const publicResult = await getPublicConsultancyEoi(route.params.uuid)
  if (!publicResult.ok) { error.value = publicResult.error; loading.value = false; return }
  notice.value = publicResult.data?.data
  useHead({ title: notice.value?.title ?? 'Expression of Interest' })
  hydrateResponse(null)
  if (user.value) {
    const [result, feeResult, vaultResult, keysResult] = await Promise.all([api.show(route.params.uuid), api.fee(route.params.uuid), securityApi.getVault(), securityApi.getSubmissionKeys()])
    if (result.ok) { existingResponse.value = result.data?.data?.response; savedResponseChecked.value = true; hydrateResponse(existingResponse.value) }
    if (feeResult.ok) feeStatus.value = feeResult.data?.data
    if (vaultResult.ok) vaultRecord.value = vaultResult.data
    if (keysResult.ok) submissionKeys.value = keysResult.data?.keys ?? []
    if (vaultRecord.value) { const cached = vaultSession.restore(vaultRecord.value, currentUserId.value); if (cached) { masterKey.value = cached; vaultUnlocked.value = true } }
  }
  committedSnapshot.value = draftSnapshot()
  if (user.value) await restoreLocalDraft()
  draftReady.value = Boolean(user.value)
  loading.value = false
})

onBeforeUnmount(() => {
  if (responseWindowTimer) window.clearInterval(responseWindowTimer)
  masterKey.value?.fill(0)
})

let draftTimer
let responseWindowTimer
watch(() => draftSnapshot(), (snapshot) => {
  if (!draftReady.value) return
  clearTimeout(draftTimer)
  if (snapshot === committedSnapshot.value) {
    return
  }
  draftTimer = setTimeout(() => persistLocalDraft(), 500)
})

function showStepError(text) { messageOk.value = false; message.value = text; window.scrollTo({ top: 0, behavior: 'smooth' }) }
async function addToMyBids() { workspaceBusy.value = true; message.value = ''; const result = await api.addToMyBids(route.params.uuid); workspaceBusy.value = false; if (!result.ok) return showStepError(result.error); existingResponse.value = result.data?.data; messageOk.value = true; message.value = 'This EOI has been added to My Bids. You may now prepare the response.' }
async function recallResponse() { workspaceBusy.value = true; message.value = ''; const result = await api.recall(route.params.uuid); workspaceBusy.value = false; if (!result.ok) return showStepError(result.error); existingResponse.value = result.data?.data; receipt.value = null; messageOk.value = true; message.value = 'The EOI response has been recalled. Sign, seal and submit it again before closing.' }
async function nextStep() { message.value = ''; if (currentStep.value === 2 && isJointVenture.value && !jointVenturePartners.value.length) return showStepError('Add at least one active PRAZ-registered joint-venture partner.'); if (currentStep.value === 2 && isJointVenture.value && !form.association_details) return showStepError('Describe the joint-venture structure and each partner’s contribution.'); if (currentStep.value === 3 && !feePaid.value) return showStepError('Settle the mandatory SPOC fee before continuing.'); if (currentStep.value === 3 && !await checkForSavedResponse()) return; if (currentStep.value === 4 && !responseDetailsComplete()) return showStepError('Complete all required contact and response details before continuing.'); currentStep.value++; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function previousStep() { message.value = ''; currentStep.value--; window.scrollTo({ top: 0, behavior: 'smooth' }) }
function responseDetailsComplete() { return ['contact_name', 'contact_email', 'contact_phone', 'contact_address'].every(field => Boolean(form[field])) && ['statement_of_interest', 'similar_experience', 'key_experts_summary'].every(field => hasRichTextContent(form[field])) }
function hasRichTextContent(value) { return String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0 }
async function searchPartners() { if (partnerSearch.value.length < 2) return; partnerSearching.value = true; partnerSearched.value = true; const result = await api.searchJointVenturePartners(route.params.uuid, partnerSearch.value); partnerSearching.value = false; if (!result.ok) return showStepError(result.error); const selected = new Set(jointVenturePartners.value.map(company => company.company_uuid)); partnerResults.value = (result.data?.data ?? []).filter(company => !selected.has(company.company_uuid)) }
function addPartner(company) { if (!jointVenturePartners.value.some(item => item.company_uuid === company.company_uuid)) jointVenturePartners.value.push(company); partnerResults.value = partnerResults.value.filter(item => item.company_uuid !== company.company_uuid) }
function removePartner(companyUuid) { jointVenturePartners.value = jointVenturePartners.value.filter(company => company.company_uuid !== companyUuid) }
async function refreshFee() { feeLoading.value = true; message.value = ''; const result = await api.fee(route.params.uuid); feeLoading.value = false; if (!result.ok) return showStepError(result.error); feeStatus.value = result.data?.data; messageOk.value = feePaid.value; message.value = feePaid.value ? 'SPOC fee payment has been confirmed. You may continue.' : 'Payment has not yet been confirmed. Please complete payment or try again shortly.' }
async function generateFee() { feeLoading.value = true; message.value = ''; const result = await api.generateFeeInvoice(route.params.uuid); feeLoading.value = false; if (!result.ok) return showStepError(result.error); feeStatus.value = { required: true, amount: notice.value.spoc_fee_amount, currency: notice.value.spoc_fee_currency, invoice: result.data?.data?.invoice }; messageOk.value = true; message.value = 'SPOC fee invoice generated. Settle it before continuing.' }
async function setupVault() { securityBusy.value = true; try { const created = await cryptoTools.createVault(vaultPassphrase.value); const result = await securityApi.saveVault(created.record); if (!result.ok) throw new Error(result.error); vaultRecord.value = result.data; masterKey.value = created.masterKey; vaultSession.remember(vaultRecord.value, masterKey.value, currentUserId.value); recoveryCode.value = created.recoveryCode; vaultUnlocked.value = true; vaultPassphrase.value = ''; vaultConfirmation.value = '' } catch (exception) { showStepError(exception.message) } finally { securityBusy.value = false } }
async function unlockVault() { securityBusy.value = true; try { masterKey.value = await cryptoTools.unlockVault(vaultRecord.value, vaultPassphrase.value); vaultSession.remember(vaultRecord.value, masterKey.value, currentUserId.value); vaultUnlocked.value = true; vaultPassphrase.value = '' } catch (exception) { showStepError(exception.message) } finally { securityBusy.value = false } }
async function setupSigningKey() { securityBusy.value = true; try { await setSubmissionKeyOnBrowser(availableSigningKey.value, masterKey.value); const result = await securityApi.getSubmissionKeys(); if (!result.ok) throw new Error(result.error); submissionKeys.value = result.data?.keys ?? [] } catch (exception) { showStepError(exception.message) } finally { securityBusy.value = false } }
async function checkForSavedResponse() { responseCheckLoading.value = true; const result = await api.show(route.params.uuid); responseCheckLoading.value = false; if (!result.ok) { showStepError(`Could not check for a saved EOI response. ${result.error}`); return false } const savedResponse = result.data?.data?.response ?? null; existingResponse.value = savedResponse; savedResponseChecked.value = true; if (savedResponse && !localDraftRestored.value) { hydrateResponse(savedResponse); committedSnapshot.value = draftSnapshot() } return true }
async function openMediaPicker(criterion) { selectedCriterion.value = criterion; mediaSearch.value = ''; mediaDialog.value?.showModal(); await loadMediaDocuments() }
async function loadMediaDocuments() { mediaLoading.value = true; const result = await mediaCenter.list(mediaSearch.value); mediaLoading.value = false; if (!result.ok) return showStepError(result.error); const payload = result.data; mediaDocuments.value = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.items) ? payload.items : [])) }
function attachMediaDocument(document) { if (!selectedCriterion.value) return; const row = criterionResponses[selectedCriterion.value.uuid]; row.evidence_documents ??= []; if (row.evidence_documents.some(item => item.media_document_uuid === document.uuid)) return; row.evidence_documents.push({ media_document_uuid: document.uuid, title: document.title, file_name: document.original_filename, mime_type: document.mime_type, file_size: document.file_size }) }
function documentExpired(document) { return Boolean(document.expires_at && document.expires_at < new Date().toISOString().slice(0, 10)) }
function serialisableDraft() { return { form: { ...form }, joint_venture_partners: JSON.parse(JSON.stringify(jointVenturePartners.value)), criterion_responses: JSON.parse(JSON.stringify(criterionResponses)), current_step: currentStep.value } }
function draftSnapshot() { return JSON.stringify(serialisableDraft()) }
async function persistLocalDraft() { try { const saved = await localDrafts.saveDraft(draftKey.value, serialisableDraft()); localSavedAt.value = saved?.saved_at ?? new Date().toISOString() } catch { localSavedAt.value = null } }
async function restoreLocalDraft() { try { const draft = await localDrafts.loadDraft(draftKey.value); if (!draft) return; Object.assign(form, draft.form ?? {}); jointVenturePartners.value = draft.joint_venture_partners ?? []; for (const criterion of notice.value.criteria ?? []) { const saved = draft.criterion_responses?.[criterion.uuid]; if (saved) criterionResponses[criterion.uuid] = { ...saved, evidence_documents: saved.evidence_documents?.length ? saved.evidence_documents : (saved.evidence ? [saved.evidence] : []) } } currentStep.value = Math.min(steps.length, Math.max(1, Number(draft.current_step) || 1)); if (currentStep.value > 3 && !feePaid.value) currentStep.value = 3; localDraftRestored.value = true; localSavedAt.value = draft.saved_at; messageOk.value = true; message.value = 'Your locally saved EOI draft has been restored.' } catch { localSavedAt.value = null } }
function requirementsComplete() { for (const criterion of notice.value.criteria ?? []) { const response = criterionResponses[criterion.uuid]; if (!response?.response?.trim()) return `Respond to the criterion: ${criterion.title}.`; if (criterion.evidence_required && !response?.evidence_documents?.some(item => item.media_document_uuid)) return `Attach the required Media Center document for: ${criterion.title}.` } return '' }
async function submit() {
  const requirementError = requirementsComplete()
  if (requirementError) return showStepError(requirementError)
  if (!submissionReady.value) return showStepError('Unlock the Bid Vault and set up your assigned bidder submission key before submitting.')
  saving.value = true
  message.value = ''
  await persistLocalDraft()
  try {
    const [sealingResult, signingMaterialResult] = await Promise.all([api.getSealingKey(route.params.uuid), securityApi.getSigningMaterial(portalSigningKey.value.uuid)])
    if (!sealingResult.ok) throw new Error(sealingResult.error)
    if (!signingMaterialResult.ok) throw new Error(signingMaterialResult.error)
    const sealingKey = sealingResult.data?.data
    if (!sealingKey?.key_uuid || !sealingKey?.public_key) throw new Error('The procuring entity returned an invalid EOI sealing key. Please contact the procuring entity before submitting.')
    const responsePayload = {
      ...form,
      joint_venture_partners: isJointVenture.value ? jointVenturePartners.value.map(company => ({ company_uuid: company.company_uuid })) : [],
      criterion_responses: notice.value.criteria.map(criterion => ({ criterion_uuid: criterion.uuid, ...criterionResponses[criterion.uuid] })),
    }
    const documentReferences = responsePayload.criterion_responses.flatMap(criterion =>
      (criterion.evidence_documents ?? []).filter(evidence => evidence.media_document_uuid).map(evidence => ({ criterion_uuid: criterion.criterion_uuid.toLowerCase(), media_document_uuid: evidence.media_document_uuid.toLowerCase() })))
      .sort((left, right) => left.criterion_uuid.localeCompare(right.criterion_uuid))
    const envelope = await cryptoTools.encryptEnvelope(responsePayload)
    const ciphertextHash = await cryptoTools.sha256(envelope.ciphertext)
    const manifestHash = await cryptoTools.sha256(new TextEncoder().encode(JSON.stringify({
      schema_version: 1,
      eoi_uuid: route.params.uuid,
      ciphertext_sha256: ciphertextHash,
      document_references: documentReferences,
    })))
    const clientSubmissionId = await cryptoTools.randomUuid()
    const signingMessage = JSON.stringify({
      client_submission_id: clientSubmissionId,
      eoi_uuid: route.params.uuid,
      key_uuid: portalSigningKey.value.uuid,
      pe_key_uuid: sealingKey.key_uuid,
      schema_version: 1,
      document_references: documentReferences,
      manifest_sha256: manifestHash,
      ciphertext_sha256: ciphertextHash,
    })
    const privateKey = await cryptoTools.unlockSigningKey(signingMaterialResult.data.encrypted_private_key_envelope, masterKey.value)
    const signed = await cryptoTools.signMessage(signingMessage, privateKey)
    privateKey.fill(0)
    const result = await api.submit(route.params.uuid, {
      client_submission_id: clientSubmissionId,
      pe_key_uuid: sealingKey.key_uuid,
      key_uuid: portalSigningKey.value.uuid,
      schema_version: 1,
      algorithm: 'XCHACHA20-POLY1305',
      ciphertext: envelope.ciphertext,
      nonce: envelope.nonce,
      sealed_key: await cryptoTools.sealEnvelopeKey(envelope.key, sealingKey.public_key),
      ciphertext_sha256: ciphertextHash,
      manifest_sha256: manifestHash,
      signed_message: signed.signedMessage,
      signature: signed.signature,
      document_references: documentReferences,
    })
    if (!result.ok) throw new Error(result.error)
    existingResponse.value = result.data?.data?.response
    receipt.value = result.data?.data?.receipt
    localDraftRestored.value = true
    committedSnapshot.value = draftSnapshot()
    await persistLocalDraft()
    messageOk.value = true
    message.value = 'Your expression of interest was signed, sealed and submitted successfully.'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (exception) {
    messageOk.value = false
    message.value = exception?.message ?? 'The encrypted EOI response could not be submitted.'
  } finally {
    saving.value = false
  }
}
</script>
