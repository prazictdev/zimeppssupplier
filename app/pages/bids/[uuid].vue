<template>
  <div class="min-h-full w-full space-y-5 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <NuxtLink to="/supplieropportunities" class="text-sm text-base-content/60 hover:text-primary">← Opportunities</NuxtLink>
        <h1 class="mt-1 text-2xl font-bold">Online bid response</h1>
        <p v-if="tender" class="text-sm text-base-content/60">{{ tender.reference }} · {{ tender.title }}</p>
      </div>
      <div v-if="draft || localDraftSavedAt" class="text-right text-xs text-base-content/50">
        <template v-if="draft">
          <p class="font-medium text-success">Encrypted cloud draft</p>
          <p>Revision {{ draft.revision }} · {{ formatDateTime(draft.last_saved_at) }}</p>
        </template>
        <template v-if="localDraftSavedAt">
          <p class="font-medium text-info">Automatically cached in this browser</p>
          <p>{{ formatDateTime(localDraftSavedAt) }}</p>
        </template>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-24">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="error" role="alert" class="alert alert-error">
      <Icon name="lucide:circle-alert" />
      <span>{{ error }}</span>
    </div>

    <template v-else>
      <div
        v-if="!hasSubmittedBid"
        role="alert"
        class="alert sticky top-3 z-30 items-start border-2 shadow-lg"
        :class="draftWarningClass"
      >
        <Icon name="lucide:triangle-alert" class="mt-1 h-6 w-6 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-bold">Draft only — your bid has not been submitted</p>
          <p class="mt-1 text-sm">
            Changes are cached automatically in this browser. “Save encrypted draft” protects your work, but only
            “Seal &amp; submit” delivers the response to the procuring entity.
          </p>
          <p v-if="tenderClosingAt" class="mt-1 text-xs opacity-80">
            Tender closes {{ formatDateTime(tenderClosingAt) }}.
          </p>
        </div>
        <div class="shrink-0 rounded-xl border border-current/20 bg-base-100/80 px-4 py-2 text-center">
          <p class="text-[10px] font-bold uppercase tracking-wider opacity-70">
            {{ tenderClosed ? 'Submission closed' : 'Time remaining' }}
          </p>
          <p class="mt-0.5 whitespace-nowrap font-mono text-lg font-black">{{ closingCountdown }}</p>
        </div>
      </div>

      <div v-if="eligibility && !eligibility.participation_eligible" role="alert" class="alert alert-warning">
        <Icon name="lucide:shield-alert" />
        <div>
          <p class="font-semibold">You cannot respond to this tender yet.</p>
          <p v-for="reason in eligibility.reasons" :key="reason" class="text-sm">{{ reason }}</p>
        </div>
      </div>

      <section v-if="!vaultRecord" class="card border border-primary/30 bg-base-100 shadow-sm">
        <div class="card-body">
          <div class="flex items-start gap-3">
            <div class="rounded-xl bg-primary/10 p-3"><Icon name="lucide:vault" class="h-6 w-6 text-primary" /></div>
            <div>
              <h2 class="text-lg font-bold">Create your Bid Vault</h2>
              <p class="mt-1 text-sm text-base-content/60">
                Your passphrase encrypts a recovery key in this browser. EGP stores only ciphertext and cannot read your response.
              </p>
            </div>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="fieldset">
              <span class="fieldset-legend">Vault passphrase</span>
              <input v-model="vaultPassphrase" type="password" class="input input-bordered w-full" minlength="12" autocomplete="new-password">
            </label>
            <label class="fieldset">
              <span class="fieldset-legend">Confirm passphrase</span>
              <input v-model="vaultConfirmation" type="password" class="input input-bordered w-full" autocomplete="new-password">
            </label>
          </div>
          <div class="card-actions justify-end">
            <button class="btn btn-primary" :disabled="busy || vaultPassphrase.length < 12 || vaultPassphrase !== vaultConfirmation" @click="setupVault">
              <span v-if="busy" class="loading loading-spinner loading-sm" />
              Create encrypted vault
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="!vaultUnlocked" class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="flex items-center gap-2 text-lg font-bold"><Icon name="lucide:lock-keyhole" /> Unlock Bid Vault</h2>
          <p class="text-sm text-base-content/60">Unlock locally to retrieve or save your encrypted response.</p>
          <form class="mt-3 flex flex-col gap-3 sm:flex-row" @submit.prevent="unlockExistingVault">
            <input v-model="vaultPassphrase" type="password" class="input input-bordered flex-1" placeholder="Bid Vault passphrase" autocomplete="current-password">
            <button class="btn btn-primary" :disabled="busy || !vaultPassphrase">
              <span v-if="busy" class="loading loading-spinner loading-sm" />
              Unlock
            </button>
          </form>
          <details class="mt-2">
            <summary class="cursor-pointer text-sm text-primary">Use recovery code</summary>
            <form class="mt-3 flex flex-col gap-3 sm:flex-row" @submit.prevent="unlockWithRecovery">
              <input v-model="recoveryInput" class="input input-bordered flex-1 font-mono text-xs" placeholder="Paste recovery code">
              <button class="btn btn-outline" :disabled="busy || !recoveryInput">Recover</button>
            </form>
          </details>
        </div>
      </section>

      <template v-else-if="eligibility?.participation_eligible">
        <div v-if="recoveryCode" role="alert" class="alert alert-warning items-start">
          <Icon name="lucide:key-round" class="mt-1" />
          <div class="min-w-0 flex-1">
            <p class="font-bold">Save this one-time recovery code now</p>
            <p class="text-xs">It can restore this vault if the passphrase or device is lost. EGP cannot regenerate it.</p>
            <code class="mt-2 block break-all rounded bg-base-100 p-2 text-xs">{{ recoveryCode }}</code>
          </div>
          <button class="btn btn-sm btn-warning" @click="downloadRecoveryCode">Download</button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-base-200 bg-base-100 p-2">
          <div class="flex min-w-max gap-1">
            <button
              v-for="(step, index) in steps"
              :key="step.key"
              class="btn btn-sm"
              :class="currentStep === index ? 'btn-primary' : 'btn-ghost'"
              @click="goToStep(index)"
            >
              <span class="badge badge-sm">{{ index + 1 }}</span>{{ step.label }}
            </button>
          </div>
        </div>

        <section class="card border border-base-200 bg-base-100 shadow-sm">
          <div class="card-body">
            <template v-if="activeStep.key === 'lots'">
              <h2 class="card-title">Select lots</h2>
              <div role="alert" class="alert alert-info items-start">
                <Icon name="lucide:list-checks" class="mt-1" />
                <div>
                  <p class="font-semibold">{{ lotRuleSummary }}</p>
                  <p class="text-xs">
                    {{ tender.lot_rules.requires_all_lines
                      ? 'You must quote every line within each selected lot.'
                      : 'You may quote selected lines within each selected lot.' }}
                  </p>
                </div>
              </div>
              <div class="mt-4 space-y-3">
                <label
                  v-for="item in tender.items"
                  :key="item.id"
                  class="flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition"
                  :class="isLotSelected(item.id) ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-primary/40'"
                >
                  <input
                    :type="tender.lot_rules.allows_multiple_lots ? 'checkbox' : 'radio'"
                    name="selected-lot"
                    class="mt-1"
                    :class="tender.lot_rules.allows_multiple_lots ? 'checkbox checkbox-primary' : 'radio radio-primary'"
                    :checked="isLotSelected(item.id)"
                    @change="toggleLot(item.id)"
                  >
                  <span class="min-w-0 flex-1">
                    <span class="badge badge-primary badge-sm">Lot {{ item.lot_number }}</span>
                    <span class="mt-2 block font-semibold">{{ item.description }}</span>
                    <span class="mt-1 block text-xs text-base-content/55">{{ item.products?.length ?? 0 }} product line(s)</span>
                  </span>
                </label>
              </div>
              <p class="mt-3 text-sm font-medium">{{ response.selected_lot_ids.length }} lot(s) selected</p>
            </template>

            <template v-else-if="activeStep.key === 'eligibility'">
              <div class="space-y-6">
                <div><h2 class="card-title">Eligibility</h2><p class="text-sm text-base-content/60">Complete the required document actions and tender eligibility forms.</p></div>

                <section class="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
                  <div class="flex flex-col gap-3 border-b border-base-200 bg-base-200/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p class="text-xs font-bold uppercase tracking-widest text-primary">Card 1</p><h3 class="text-lg font-bold">Documents</h3><p class="text-xs text-base-content/60">Download the procuring entity’s files and attach every document requested from your organisation.</p></div><button type="button" class="btn btn-outline btn-secondary btn-sm" @click="openMediaPicker(null)"><Icon name="lucide:library" class="h-4 w-4" />Open Media Center</button></div>

                  <div v-if="providedDocuments.length" class="p-4">
                    <div class="mb-3 flex items-center justify-between"><div><h4 class="font-bold">Section (A) · Downloads</h4><p class="text-xs text-base-content/55">Files provided by the procuring entity for bidder download.</p></div><span class="badge badge-primary">{{ providedDocuments.length }}</span></div>
                    <div class="overflow-x-auto rounded-xl border border-base-200">
                      <table class="table table-sm">
                        <thead><tr><th>Document</th><th>File type</th><th>Size</th><th>Review status</th><th class="text-right">Action</th></tr></thead>
                        <tbody>
                          <tr v-for="document in providedDocuments" :key="document.uuid">
                            <td><p class="font-semibold">{{ document.name }}</p><p v-if="document.description" class="max-w-md text-xs text-base-content/55">{{ document.description }}</p></td>
                            <td>{{ providedDocumentType(document) }}</td><td>{{ formatFileSize(document.file_size) }}</td>
                            <td><label class="flex cursor-pointer items-center gap-2 whitespace-nowrap"><input v-model="response.documentAcknowledgements[document.uuid]" type="checkbox" class="checkbox checkbox-primary checkbox-sm"><span class="text-xs">{{ response.documentAcknowledgements[document.uuid] ? 'Reviewed' : 'Mark reviewed' }}</span></label></td>
                            <td class="text-right"><button type="button" class="btn btn-primary btn-xs" :disabled="!document.has_file || downloadingDocument === document.uuid" @click="downloadProvidedDocument(document)"><span v-if="downloadingDocument === document.uuid" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:download" class="h-3.5 w-3.5" />Download</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="border-t border-base-200 p-4">
                    <div class="mb-3 flex items-center justify-between"><div><h4 class="font-bold">Section (B) · Bidder uploads</h4><p class="text-xs text-base-content/55">Documents your organisation must submit with the tender response.</p></div><span class="badge badge-secondary">{{ uploadedRequestedCount }} / {{ requestedDocuments.length }}</span></div>
                    <div class="overflow-x-auto rounded-xl border border-base-200">
                      <table class="table table-sm">
                        <thead><tr><th>Requirement</th><th>Attached document</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
                        <tbody>
                          <tr v-for="document in requestedDocuments" :key="document.uuid">
                            <td><p class="font-semibold">{{ document.name }}</p><p v-if="document.description" class="max-w-md text-xs text-base-content/55">{{ document.description }}</p></td>
                            <td><div v-if="response.documents[document.uuid]?.name" class="flex items-center gap-2"><Icon name="lucide:file-check-2" class="h-4 w-4 text-success" /><span class="max-w-xs truncate text-sm">{{ response.documents[document.uuid].name }}</span></div><span v-else class="text-xs text-base-content/45">No document attached</span></td>
                            <td><span :class="['badge badge-sm', response.documents[document.uuid]?.media_uuid ? 'badge-success' : 'badge-warning']">{{ response.documents[document.uuid]?.media_uuid ? 'Attached' : 'Required' }}</span></td>
                            <td><div class="flex justify-end gap-2"><button type="button" class="btn btn-outline btn-secondary btn-xs" @click="openMediaPicker(document.uuid)"><Icon name="lucide:library" class="h-3.5 w-3.5" />Choose</button><button v-if="response.documents[document.uuid]?.media_uuid" type="button" class="btn btn-ghost btn-xs text-error" @click="delete response.documents[document.uuid]"><Icon name="lucide:x" class="h-3.5 w-3.5" /></button></div></td>
                          </tr>
                          <tr v-if="!requestedDocuments.length"><td colspan="4" class="py-8 text-center text-base-content/50">No bidder uploads are required.</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <section class="overflow-hidden rounded-2xl border border-primary/20 bg-base-100 shadow-sm">
                  <div class="border-b border-primary/15 bg-primary/5 p-4"><p class="text-xs font-bold uppercase tracking-widest text-primary">Card 2</p><h3 class="text-lg font-bold">Technical bid forms</h3><p class="text-xs text-base-content/60">Complete the grouped commercial and technical eligibility questions.</p></div>
                  <div class="space-y-4 p-4">
                    <section v-for="group in eligibilityQuestionGroups" :key="group.key" class="overflow-hidden rounded-xl border border-base-200"><div class="border-b border-base-200 bg-base-200/50 px-4 py-3"><h4 class="font-bold">{{ group.title }}</h4><p class="text-xs text-base-content/50">Form eligibility</p></div><div class="space-y-3 p-4"><div v-for="question in group.questions" :key="question.id" class="rounded-lg border border-base-200 p-4"><p class="font-medium">{{ question.question }}</p><ResponseField v-model="response.eligibility[question.id]" :type="question.response_type" class="mt-3" @file="captureAnswerFile('eligibility', question.id, $event)" /></div></div></section>

                    <section v-for="questionGroup in globalTechnicalQuestionGroups" :key="questionGroup.key" class="overflow-hidden rounded-xl border border-base-200"><div class="border-b border-base-200 bg-base-200/50 px-4 py-3"><h4 class="font-bold">{{ questionGroup.title }}</h4><p class="text-xs text-base-content/50">General technical eligibility</p></div><div class="space-y-3 p-4"><div v-for="question in questionGroup.questions" :key="question.id" class="rounded-lg border border-base-200 p-4"><p class="font-medium">{{ question.question }}</p><ResponseField v-model="response.technical[question.id]" :type="question.response_type" :media-only="question.response_type === 'UPLOAD'" class="mt-3" @choose-media="openTechnicalQuestionMediaPicker(question.id)" /></div></div></section>

                    <section v-for="productGroup in technicalProductGroups" :key="productGroup.product.id" class="overflow-hidden rounded-xl border border-primary/25">
                      <div class="flex items-start gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3"><span class="badge badge-primary">Lot {{ productGroup.lot.lot_number }}</span><div class="min-w-0 flex-1"><h4 class="font-bold">{{ productGroup.product.description }}</h4><p class="text-xs text-base-content/55">Product technical eligibility and specification compliance</p></div><label class="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" class="checkbox checkbox-primary checkbox-sm" :checked="productGroup.selected" :disabled="tender.lot_rules.requires_all_lines" @change="toggleProduct(productGroup.lot.id, productGroup.product.id)"><span>{{ tender.lot_rules.requires_all_lines ? 'Required' : (productGroup.selected ? 'Responding' : 'Select') }}</span></label></div>
                      <div v-if="productGroup.selected" class="space-y-3 p-4">
                        <div class="overflow-hidden rounded-lg border border-base-200">
                          <div class="border-b border-base-200 bg-base-200/50 px-3 py-2"><h5 class="font-semibold">1. Product specifications</h5><p class="text-xs text-base-content/55">Confirm compliance or provide full details of an equivalent alternative.</p></div>
                          <div v-if="productGroup.product.specifications?.length" class="overflow-x-auto">
                            <table class="table table-sm"><thead><tr><th>Specification</th><th>Requirement</th><th class="min-w-72">Bidder response</th></tr></thead><tbody>
                              <tr v-for="specification in productGroup.product.specifications" :key="specification.id" class="align-top">
                                <td class="font-medium">{{ specification.label }}</td>
                                <td><p>{{ specification.value || '—' }}</p><span :class="['badge badge-xs mt-1', specification.acceptance_policy === 'MANDATORY' ? 'badge-error' : specification.acceptance_policy === 'PREFERRED' ? 'badge-info' : 'badge-success']">{{ specificationPolicyLabel(specification.acceptance_policy) }}</span></td>
                                <td>
                                  <select v-model="response.specification_compliance[productGroup.lot.id][specification.id].status" class="select select-bordered select-sm w-full"><option value="">Select response</option><option value="COMPLIANT">Compliant</option><option v-if="specification.acceptance_policy !== 'MANDATORY'" value="ALTERNATIVE">Alternative offered</option><option value="NOT_COMPLIANT">Not compliant</option></select>
                                  <div v-if="response.specification_compliance[productGroup.lot.id][specification.id].status === 'ALTERNATIVE'" class="mt-2 space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                                    <input v-model.trim="response.specification_compliance[productGroup.lot.id][specification.id].offered_value" class="input input-bordered input-sm w-full" placeholder="Offered specification or value">
                                    <input v-model.trim="response.specification_compliance[productGroup.lot.id][specification.id].manufacturer_model" class="input input-bordered input-sm w-full" placeholder="Manufacturer / model (optional)">
                                    <RichTextEditor v-model="response.specification_compliance[productGroup.lot.id][specification.id].explanation" placeholder="Explain how the alternative is equivalent" />
                                    <div class="flex flex-wrap gap-2"><button type="button" class="btn btn-outline btn-warning btn-xs" @click="openSpecificationMediaPicker(productGroup.lot.id, specification.id)"><Icon name="lucide:library" class="h-3.5 w-3.5" />Choose datasheet</button><label class="btn btn-warning btn-xs"><Icon name="lucide:upload" class="h-3.5 w-3.5" />Upload datasheet<input type="file" class="hidden" @change="captureAlternativeDocument(productGroup.lot.id, specification.id, $event)"></label></div>
                                    <div v-if="response.specification_compliance[productGroup.lot.id][specification.id].supporting_document?.name" class="flex items-center gap-2 rounded bg-success/10 px-2 py-1 text-xs text-success"><Icon name="lucide:file-check-2" class="h-3.5 w-3.5" /><span class="truncate">{{ response.specification_compliance[productGroup.lot.id][specification.id].supporting_document.name }}</span></div>
                                  </div>
                                </td>
                              </tr>
                            </tbody></table>
                          </div>
                          <p v-else class="p-3 text-sm text-base-content/50">No specifications provided.</p>
                        </div>
                        <div v-for="(questionGroup, groupIndex) in productGroup.questionGroups" :key="questionGroup.key" class="overflow-hidden rounded-lg border border-base-200"><h5 class="border-b border-base-200 bg-base-200/50 px-3 py-2 font-semibold">{{ groupIndex + 2 }}. {{ questionGroup.title }}</h5><div class="space-y-3 p-3"><div v-for="question in questionGroup.questions" :key="question.id" class="rounded-lg border border-base-200 p-4"><p class="font-medium">{{ question.question }}</p><ResponseField v-model="response.technical[question.id]" :type="question.response_type" :media-only="question.response_type === 'UPLOAD'" class="mt-3" @choose-media="openTechnicalQuestionMediaPicker(question.id)" /></div></div></div>
                      </div>
                      <div v-else class="p-5 text-sm text-base-content/55">Select this product to complete its specifications and technical eligibility requirements.</div>
                    </section>

                    <div v-if="!eligibilityQuestionGroups.length && !globalTechnicalQuestionGroups.length && !technicalProductGroups.length" class="rounded-xl border border-dashed border-base-300 py-10 text-center text-base-content/50">No eligibility forms apply to this tender.</div>
                  </div>
                </section>
              </div>
            </template>

            <template v-else-if="activeStep.key === 'technical'">
              <h2 class="card-title">Technical eligibility</h2>
              <section v-for="questionGroup in globalTechnicalQuestionGroups" :key="questionGroup.key" class="overflow-hidden rounded-xl border border-base-200 bg-base-100">
                <div class="border-b border-base-200 bg-base-200/50 px-4 py-3"><h3 class="font-bold">{{ questionGroup.title }}</h3><p class="text-xs text-base-content/55">These questions apply to the complete bid response.</p></div>
                <div class="space-y-3 p-4"><div v-for="question in questionGroup.questions" :key="question.id" class="rounded-lg border border-base-200 p-4"><p class="font-medium">{{ question.question }}</p><ResponseField v-model="response.technical[question.id]" :type="question.response_type" :media-only="question.response_type === 'UPLOAD'" class="mt-3" @choose-media="openTechnicalQuestionMediaPicker(question.id)" /></div></div>
              </section>

              <section v-for="group in technicalProductGroups" :key="group.product.id" class="mt-4 overflow-hidden rounded-xl border border-primary/25 bg-base-100">
                <div class="flex items-start gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3">
                  <span class="badge badge-primary">Lot {{ group.lot.lot_number }}</span>
                  <div>
                    <h3 class="font-bold">{{ group.product.description }}</h3>
                    <p class="text-xs text-base-content/55">Product technical eligibility</p>
                  </div>
                </div>
                <div class="space-y-3 p-4">
                  <div class="overflow-hidden rounded-lg border border-base-200">
                    <h4 class="border-b border-base-200 bg-base-200/50 px-3 py-2 font-semibold">1. Product specifications</h4>
                    <div v-if="group.product.specifications?.length" class="overflow-x-auto"><table class="table table-sm"><tbody><tr v-for="specification in group.product.specifications" :key="specification.id"><td class="font-medium">{{ specification.label }}</td><td>{{ specification.value || '—' }}</td></tr></tbody></table></div>
                    <p v-else class="p-3 text-sm text-base-content/50">No specifications provided.</p>
                  </div>
                  <div v-for="(questionGroup, groupIndex) in group.questionGroups" :key="questionGroup.key" class="overflow-hidden rounded-lg border border-base-200">
                    <h4 class="border-b border-base-200 bg-base-200/50 px-3 py-2 font-semibold">{{ groupIndex + 2 }}. {{ questionGroup.title }}</h4>
                    <div class="space-y-3 p-3"><div v-for="question in questionGroup.questions" :key="question.id" class="rounded-lg border border-base-200 p-4"><p class="font-medium">{{ question.question }}</p><ResponseField v-model="response.technical[question.id]" :type="question.response_type" :media-only="question.response_type === 'UPLOAD'" class="mt-3" @choose-media="openTechnicalQuestionMediaPicker(question.id)" /></div></div>
                  </div>
                </div>
              </section>

              <div v-if="!globalTechnicalQuestions.length && !technicalProductGroups.length" class="rounded-xl border border-dashed border-base-300 py-10 text-center text-base-content/50">
                No technical eligibility questions apply to the selected lots.
              </div>
            </template>

            <template v-else-if="activeStep.key === 'documents'">
              <div class="overflow-hidden rounded-2xl border border-base-200 bg-base-100">
                <div class="bg-gradient-to-r from-primary/10 via-base-100 to-secondary/10 p-5 sm:p-6">
                  <div class="flex items-start gap-4">
                    <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-base-100 text-primary shadow-sm"><Icon name="lucide:files" class="h-6 w-6" /></span>
                    <div><h2 class="text-xl font-bold">Bid documents</h2><p class="mt-1 max-w-2xl text-sm text-base-content/65">This step has two separate actions. First download and review files from the procuring entity, then upload the documents required with your bid.</p></div>
                  </div>
                </div>
                <div class="grid border-t border-base-200 sm:grid-cols-2 sm:divide-x sm:divide-base-200">
                  <div class="flex items-center gap-3 p-4">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon name="lucide:download" class="h-5 w-5" /></span>
                    <div class="min-w-0 flex-1"><p class="text-xs font-bold uppercase tracking-wider text-primary">Download from entity</p><p class="text-sm font-semibold">{{ reviewedProvidedCount }} of {{ providedDocuments.length }} reviewed</p></div>
                    <span class="badge badge-primary badge-lg">{{ providedDocuments.length }}</span>
                  </div>
                  <div class="flex items-center gap-3 border-t border-base-200 p-4 sm:border-t-0">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon name="lucide:upload" class="h-5 w-5" /></span>
                    <div class="min-w-0 flex-1"><p class="text-xs font-bold uppercase tracking-wider text-secondary">Upload with your bid</p><p class="text-sm font-semibold">{{ uploadedRequestedCount }} of {{ requestedDocuments.length }} attached</p></div>
                    <span class="badge badge-secondary badge-lg">{{ requestedDocuments.length }}</span>
                  </div>
                </div>
              </div>

              <section class="overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary/[0.025]">
                <div class="flex flex-col gap-3 border-b border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content"><Icon name="lucide:folder-down" class="h-5 w-5" /></span>
                    <div><p class="text-xs font-bold uppercase tracking-widest text-primary">Section A · Download</p><h3 class="text-lg font-bold">Files from the procuring entity</h3><p class="text-xs text-base-content/60">Download each available file and confirm that you reviewed it.</p></div>
                  </div>
                  <span class="badge badge-outline badge-primary">No upload required here</span>
                </div>

                <div v-if="providedDocuments.length" class="grid gap-3 p-4 xl:grid-cols-2">
                  <article
                    v-for="document in providedDocuments"
                    :key="document.uuid"
                    class="overflow-hidden rounded-xl border border-primary/20 bg-base-100 shadow-sm"
                  >
                    <div class="flex items-start gap-3 p-4">
                      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon :name="providedDocumentIcon(document)" class="h-5 w-5" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <h4 class="font-semibold">{{ document.name }}</h4>
                          <span :class="['badge badge-sm', document.has_file ? 'badge-success' : 'badge-warning']">
                            {{ document.has_file ? 'Available' : 'File missing' }}
                          </span>
                        </div>
                        <p v-if="document.description" class="mt-1 text-sm text-base-content/60">{{ document.description }}</p>
                        <div v-if="document.has_file" class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/55">
                          <span class="inline-flex min-w-0 items-center gap-1"><Icon name="lucide:file" class="h-3.5 w-3.5" /><span class="truncate">{{ document.file_name || document.name }}</span></span>
                          <span v-if="document.mime_type">{{ providedDocumentType(document) }}</span>
                          <span v-if="document.file_size">{{ formatDocumentSize(document.file_size) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="border-t border-primary/15 bg-base-100/70 p-3">
                      <div v-if="document.has_file" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          class="btn btn-primary btn-sm"
                          :disabled="downloadingDocument === document.uuid"
                          @click="downloadProvidedDocument(document)"
                        >
                          <span v-if="downloadingDocument === document.uuid" class="loading loading-spinner loading-xs" />
                          <Icon v-else name="lucide:download" class="h-4 w-4" />
                          {{ downloadingDocument === document.uuid ? 'Preparing download…' : 'Download file' }}
                        </button>
                        <label class="flex cursor-pointer items-center gap-2 text-sm">
                          <input v-model="response.documentAcknowledgements[document.uuid]" type="checkbox" class="checkbox checkbox-primary checkbox-sm">
                          <span>I have reviewed this document</span>
                        </label>
                      </div>
                      <div v-else class="flex items-center gap-2 text-sm text-warning"><Icon name="lucide:triangle-alert" class="h-4 w-4" /><span>Contact the procuring entity—the attachment is not yet available.</span></div>
                    </div>
                  </article>
                </div>
                <div v-else class="p-8 text-center text-sm text-base-content/50"><Icon name="lucide:folder-check" class="mx-auto mb-2 h-8 w-8" /><p>No documents have been provided for download.</p></div>
              </section>

              <section class="overflow-hidden rounded-2xl border-2 border-secondary/20 bg-secondary/[0.025]">
                <div class="flex flex-col gap-3 border-b border-secondary/15 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-content"><Icon name="lucide:folder-up" class="h-5 w-5" /></span>
                    <div><p class="text-xs font-bold uppercase tracking-widest text-secondary">Section B · Attach</p><h3 class="text-lg font-bold">Files required from your organisation</h3><p class="text-xs text-base-content/60">Reference a reusable Media Center document. The file is stored only once.</p></div>
                  </div>
                  <button type="button" class="btn btn-outline btn-secondary btn-sm" @click="openMediaPicker(null)"><Icon name="lucide:library" class="h-4 w-4" />Open Media Center</button>
                </div>
                <div v-if="requestedDocuments.length" class="grid gap-3 p-4 xl:grid-cols-2">
                  <article v-for="(document, index) in requestedDocuments" :key="document.uuid" class="rounded-xl border border-secondary/20 bg-base-100 p-4 shadow-sm">
                    <div class="flex items-start gap-3">
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-sm font-bold text-secondary">{{ index + 1 }}</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2"><h4 class="font-semibold">{{ document.name }}</h4><span :class="['badge badge-sm', response.documents[document.uuid]?.name ? 'badge-success' : 'badge-warning']">{{ response.documents[document.uuid]?.name ? 'Attached' : 'Required' }}</span></div>
                        <p v-if="document.description" class="mt-1 text-xs text-base-content/60">{{ document.description }}</p>
                      </div>
                    </div>
                    <div class="mt-4">
                      <button type="button" class="btn btn-outline btn-secondary btn-sm w-full" @click="openMediaPicker(document.uuid)"><Icon name="lucide:library" class="h-4 w-4" />Choose from Media Center</button>
                    </div>
                    <div v-if="response.documents[document.uuid]?.name" class="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success"><Icon name="lucide:link" class="h-4 w-4 shrink-0" /><span class="min-w-0 truncate font-medium">{{ response.documents[document.uuid].name }}</span><span class="ml-auto shrink-0">Referenced</span><button type="button" class="btn btn-ghost btn-xs text-error" @click="delete response.documents[document.uuid]">Remove</button></div>
                  </article>
                </div>
                <div v-else class="p-8 text-center text-sm text-base-content/50"><Icon name="lucide:circle-check-big" class="mx-auto mb-2 h-8 w-8" /><p>No bidder documents are required for this tender.</p></div>
              </section>
            </template>

            <template v-else-if="activeStep.key === 'pricing'">
              <div>
                <div class="flex flex-wrap items-center gap-2"><h2 class="card-title">Pricing</h2><span v-if="tender.currency_code" class="badge badge-primary">Currency: {{ tender.currency_code }}</span></div>
                <p class="text-sm text-base-content/60">{{ hasMilestonePricing ? 'Enter a currency amount for every milestone. Your total firm lump sum is calculated automatically.' : (tender.lot_rules.requires_all_lines ? 'Enter a unit price for every product or service in each selected lot.' : 'Select the products or services you are responding to, then enter their unit prices.') }}</p>
              </div>
              <div class="space-y-4">
                <div v-for="item in selectedLotItems" :key="item.id" class="overflow-hidden rounded-xl border border-base-200">
                  <div class="border-b border-base-200 bg-base-200/40 px-4 py-3">
                    <span class="badge badge-ghost">Lot {{ item.lot_number }}</span>
                    <p class="mt-1 font-semibold">{{ item.description }}</p>
                  </div>
                  <div v-if="item.pricing_mode === 'MILESTONE' && item.pricing_milestones?.length" class="overflow-x-auto">
                    <table class="table">
                      <thead><tr><th>Milestone / deliverable</th><th class="w-40 text-right">Payment allocation</th><th class="w-56">Your quotation</th></tr></thead>
                      <tbody>
                        <tr v-for="milestone in item.pricing_milestones" :key="milestone.key">
                          <td><p class="font-medium">{{ milestone.title }}</p><p v-if="milestone.due_point" class="text-xs text-base-content/50">Due: {{ milestone.due_point }}</p></td>
                          <td class="text-right font-mono">{{ formatQuantity(milestone.payment_percentage) }}%</td>
                          <td><div class="join w-full"><span v-if="tender.currency_code" class="btn btn-disabled btn-sm join-item">{{ tender.currency_code }}</span><input v-model.number="response.pricing[item.id].milestones[milestone.key].quoted_amount" type="number" min="0" step="0.01" class="input input-bordered input-sm join-item w-full" placeholder="0.00"></div></td>
                        </tr>
                      </tbody>
                      <tfoot><tr><th colspan="2" class="text-right">Total firm lump sum</th><th class="font-mono text-right">{{ formatMoney(lotSubtotal(item)) }}</th></tr></tfoot>
                    </table>
                  </div>
                  <div v-else-if="item.products?.length" class="overflow-x-auto">
                    <table class="table">
                      <thead>
                        <tr><th>Product / service</th><th class="w-28 text-right">Quantity</th><th class="w-48">Unit price</th><th class="w-36 text-right">Line total</th></tr>
                      </thead>
                      <tbody>
                        <tr v-for="product in item.products" :key="product.id" :class="isProductSelected(product.id) ? '' : 'opacity-55'">
                          <td class="min-w-64"><label class="flex cursor-pointer items-center gap-3 font-medium"><input type="checkbox" class="checkbox checkbox-primary checkbox-sm" :checked="isProductSelected(product.id)" :disabled="tender.lot_rules.requires_all_lines" @change="toggleProduct(item.id, product.id)"><span>{{ product.description }}</span></label></td>
                          <td class="text-right font-mono">{{ formatQuantity(product.quantity) }}</td>
                          <td>
                            <input v-model.number="response.pricing[item.id].products[product.id].unit_price" type="number" min="0" step="0.01" class="input input-bordered input-sm w-full" placeholder="0.00" :disabled="!isProductSelected(product.id)">
                          </td>
                          <td class="text-right font-mono font-semibold">{{ formatMoney(productLineTotal(item.id, product)) }}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr><th colspan="3" class="text-right">Lot subtotal</th><th class="text-right font-mono">{{ formatMoney(lotSubtotal(item)) }}</th></tr>
                      </tfoot>
                    </table>
                  </div>
                  <p v-else class="p-4 text-sm text-warning">This lot has no products or services available for pricing.</p>
                </div>
              </div>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="response.charges_vat" type="checkbox" class="checkbox checkbox-primary">
                <span>Prices attract VAT</span>
                <input v-if="response.charges_vat" v-model.number="response.vat_percentage" type="number" min="0" max="100" step="0.01" class="input input-bordered input-sm w-28" placeholder="VAT %">
              </label>
              <div v-if="response.charges_vat" class="ml-auto w-full max-w-md overflow-hidden rounded-xl border border-primary/25 bg-primary/5">
                <div class="flex items-center justify-between border-b border-primary/15 px-4 py-3 text-sm">
                  <span>Products subtotal</span>
                  <span class="font-mono font-semibold">{{ formatMoney(pricingSubtotal) }}</span>
                </div>
                <div class="flex items-center justify-between border-b border-primary/15 px-4 py-3 text-sm">
                  <span>VAT ({{ formatQuantity(response.vat_percentage) }}%)</span>
                  <span class="font-mono font-semibold">{{ formatMoney(pricingVatAmount) }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-4">
                  <span class="font-bold">Total including VAT</span>
                  <span class="font-mono text-xl font-bold text-primary">{{ formatMoney(pricingGrandTotal) }}</span>
                </div>
              </div>
            </template>

            <template v-else-if="activeStep.key === 'fees'">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="card-title">Tender fees</h2>
                  <p class="text-sm text-base-content/60">Every applicable fee must be settled before this bid can be submitted.</p>
                </div>
                <button class="btn btn-outline btn-sm" :disabled="feesLoading || busy" @click="loadTenderFees">
                  <span v-if="feesLoading" class="loading loading-spinner loading-xs" />
                  <Icon v-else name="lucide:refresh-cw" />
                  Refresh status
                </button>
              </div>

              <div v-if="tender.fees?.bid_security" class="mt-4 rounded-xl border border-base-200 p-4">
                <p class="font-semibold">Bid-security method</p>
                <p class="mb-3 text-xs text-base-content/55">Choose how the required bid security will be provided.</p>
                <select v-model="response.bid_security.method" class="select select-bordered w-full max-w-md">
                  <option value="PRAZ">Settle through PRAZ</option>
                  <option value="GUARANTEE">External bank guarantee</option>
                </select>
                <label v-if="response.bid_security.method === 'GUARANTEE'" class="mt-3 block">
                  <span class="label-text">Encrypted guarantee document</span>
                  <input type="file" class="file-input file-input-bordered mt-1 w-full" @change="captureGuarantee">
                  <span v-if="response.bid_security.guarantee?.name" class="mt-1 block text-xs text-success">
                    {{ response.bid_security.guarantee.name }} will be encrypted with the response.
                  </span>
                </label>
              </div>

              <label v-if="feeOptions?.can_choose_currency && requiredTenderFees.length" class="fieldset mt-4 max-w-xs">
                <span class="fieldset-legend">Invoice currency</span>
                <select v-model.number="selectedFeeCurrencyId" class="select select-bordered">
                  <option v-for="currency in feeOptions.currencies" :key="currency.id" :value="currency.id">{{ currency.code }}</option>
                </select>
              </label>

              <div v-if="feesLoading && !feeInvoices.length" class="mt-4 space-y-2">
                <div v-for="index in 3" :key="index" class="h-20 animate-pulse rounded-xl bg-base-200" />
              </div>
              <div v-else class="mt-4 space-y-3">
                <div
                  v-for="fee in requiredTenderFees"
                  :key="fee.key"
                  class="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  :class="fee.invoice?.paid ? 'border-success/30 bg-success/5' : 'border-warning/40 bg-warning/5'"
                >
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="font-semibold">{{ fee.label }}</p>
                      <span class="badge badge-sm" :class="feeStatusClass(fee)">{{ feeStatusLabel(fee) }}</span>
                    </div>
                    <p class="mt-1 text-xs text-base-content/55">{{ fee.description }}</p>
                    <p class="mt-2 font-mono text-sm font-bold">{{ fee.currency }} {{ formatMoney(fee.amount) }}</p>
                    <p v-if="fee.invoice" class="mt-1 text-xs text-base-content/55">
                      Invoice {{ fee.invoice.invoice_number }} · Ref {{ fee.invoice.payment_reference }}
                    </p>
                  </div>
                  <NuxtLink
                    v-if="fee.invoice?.status === 'PENDING' && fee.invoice?.uuid"
                    :to="`/invoice/settle/${fee.invoice.uuid}`"
                    class="btn btn-primary btn-sm"
                  >
                    <Icon name="lucide:credit-card" /> Settle
                  </NuxtLink>
                </div>

                <div v-if="!requiredTenderFees.length" class="alert alert-success">
                  <Icon name="lucide:badge-check" />
                  <span>No tender fees require settlement for the selected security method.</span>
                </div>
              </div>

              <div v-if="feesError" role="alert" class="alert alert-error mt-4">
                <Icon name="lucide:circle-alert" /><span>{{ feesError }}</span>
              </div>

              <div v-if="feesToGenerate.length" class="mt-4 flex flex-wrap gap-2">
                <button
                  v-if="feesToGenerate.some((fee) => ['bid_bond', 'establishment'].includes(fee.key))"
                  class="btn btn-warning btn-sm"
                  :disabled="feesLoading || busy"
                  @click="generateBidSecurityFees"
                >
                  Generate bid-security invoices
                </button>
                <button
                  v-if="feesToGenerate.some((fee) => fee.key === 'administration')"
                  class="btn btn-warning btn-sm"
                  :disabled="feesLoading || busy"
                  @click="generateAdministrationFee"
                >
                  Generate administration-fee invoice
                </button>
              </div>
            </template>

            <template v-else-if="activeStep.key === 'review'">
              <h2 class="card-title">Review, seal and submit</h2>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div class="stat rounded-xl border border-base-200"><div class="stat-title">Envelope</div><div class="stat-value text-xl">{{ envelopeMode }}</div></div>
                <div class="stat rounded-xl border border-base-200"><div class="stat-title">Selected lots</div><div class="stat-value text-xl">{{ response.selected_lot_ids.length }}</div></div>
                <div class="stat rounded-xl border border-base-200"><div class="stat-title">Draft revision</div><div class="stat-value text-xl">{{ draft?.revision ?? 0 }}</div></div>
                <div class="stat rounded-xl border border-base-200"><div class="stat-title">Closing</div><div class="stat-value text-base">{{ formatDateTime(tender.closing_at) }}</div></div>
              </div>

              <div v-if="!portalSigningKey" role="alert" class="alert alert-warning mt-4">
                <Icon name="lucide:key-round" />
                <div class="flex-1">
                  <p class="font-semibold">Portal signing key required</p>
                  <p class="text-xs">Set up your assigned licence in this encrypted Bid Vault before submitting.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button class="btn btn-sm btn-outline" :disabled="busy" @click="refreshSubmissionKeys">
                    <Icon name="lucide:refresh-cw" /> Refresh keys
                  </button>
                  <button class="btn btn-sm btn-warning" :disabled="busy || !availableSigningKey" @click="setupPortalSigningKey">
                    Set up portal key
                  </button>
                </div>
              </div>

              <div v-else role="alert" class="alert alert-success mt-4">
                <Icon name="lucide:badge-check" />
                <span>Ready to sign with {{ portalSigningKey.key_serial }}.</span>
              </div>

              <label class="label mt-4 cursor-pointer justify-start gap-3">
                <input v-model="declarationAccepted" type="checkbox" class="checkbox checkbox-primary">
                <span>I confirm that this response is complete and I am authorised to submit it.</span>
              </label>
            </template>

            <div v-if="saveError" role="alert" class="alert alert-error mt-4"><Icon name="lucide:circle-alert" /><span>{{ saveError }}</span></div>

            <div class="mt-6 flex items-center justify-between border-t border-base-200 pt-4">
              <button class="btn btn-ghost" :disabled="currentStep === 0 || busy" @click="previousStep">Back</button>
              <div class="flex gap-2">
                <button class="btn btn-outline" :disabled="busy" @click="saveEncryptedDraft">
                  <span v-if="saving" class="loading loading-spinner loading-sm" /> Save encrypted draft
                </button>
                <button v-if="activeStep.key !== 'review'" class="btn btn-primary" :disabled="busy || (activeStep.key === 'fees' && !tenderFeesComplete)" @click="saveAndContinue">Save &amp; continue</button>
                <button v-else class="btn btn-success" :disabled="busy || !portalSigningKey || !declarationAccepted" @click="sealAndSubmit">
                  <span v-if="submitting" class="loading loading-spinner loading-sm" />
                  Seal &amp; submit
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>

      <dialog ref="mediaPickerDialog" class="modal">
        <div class="modal-box flex h-screen w-screen max-w-none flex-col rounded-none p-0">
          <header class="flex flex-col gap-4 border-b border-base-200 bg-base-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p class="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Organisation library</p><h3 class="text-2xl font-bold">{{ hasActiveMediaTarget ? 'Select from Media Center' : 'Media Center' }}</h3><p class="text-sm text-base-content/55">{{ hasActiveMediaTarget ? 'Select a reusable supporting document.' : 'Browse documents stored once for reuse across tender responses.' }}</p></div>
            <div class="flex items-center gap-2">
              <label class="btn btn-secondary btn-sm" :class="mediaUploading ? 'pointer-events-none btn-disabled' : ''">
                <Icon name="lucide:upload" class="h-4 w-4" />
                Upload document
                <input type="file" class="hidden" multiple :disabled="mediaUploading" @change="beginMediaUpload">
              </label>
              <button class="btn btn-circle btn-ghost" aria-label="Close Media Center" :disabled="mediaUploading" @click="closeMediaPicker"><Icon name="lucide:x" class="h-5 w-5" /></button>
            </div>
          </header>
          <section v-if="mediaUploadOpen" class="border-b border-secondary/25 bg-secondary/5 p-4 sm:p-5">
            <div class="mx-auto max-w-4xl rounded-2xl border border-secondary/25 bg-base-100 p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div><p class="text-xs font-bold uppercase tracking-wider text-secondary">New upload</p><h4 class="font-bold">Save reusable documents</h4><p class="text-xs text-base-content/55">Each distinct file is stored once for reuse across tender responses.</p></div>
                <button type="button" class="btn btn-circle btn-ghost btn-sm" :disabled="mediaUploading" @click="cancelMediaUpload"><Icon name="lucide:x" class="h-4 w-4" /></button>
              </div>
              <div v-if="mediaUploadError" class="alert alert-error mt-3 py-2 text-sm"><Icon name="lucide:triangle-alert" class="h-4 w-4" /><span>{{ mediaUploadError }}</span></div>
              <div class="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div class="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-base-200 bg-base-200/30 p-3">
                  <div v-for="file in pendingMediaFiles" :key="`${file.name}-${file.size}-${file.lastModified}`" class="flex items-center gap-3 rounded-lg bg-base-100 px-3 py-2"><Icon name="lucide:file-up" class="h-5 w-5 shrink-0 text-secondary" /><div class="min-w-0"><p class="truncate text-sm font-semibold">{{ file.name }}</p><p class="text-xs text-base-content/50">{{ formatFileSize(file.size) }}</p></div></div>
                </div>
                <div class="space-y-2">
                  <label v-if="pendingMediaFiles.length === 1" class="fieldset"><span class="fieldset-legend">Display name</span><input v-model.trim="mediaUploadForm.title" class="input input-bordered input-sm w-full" :disabled="mediaUploading"></label>
                  <p v-else class="rounded-lg bg-info/10 px-3 py-2 text-xs text-info">Each document will use its filename as its display name.</p>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <label class="fieldset"><span class="fieldset-legend">Category</span><input v-model.trim="mediaUploadForm.category" class="input input-bordered input-sm w-full" placeholder="e.g. Statutory" :disabled="mediaUploading"></label>
                    <label class="fieldset"><span class="fieldset-legend">Expiry <span class="font-normal text-base-content/40">(optional)</span></span><input v-model="mediaUploadForm.expires_at" type="date" class="input input-bordered input-sm w-full" :disabled="mediaUploading"></label>
                  </div>
                </div>
              </div>
              <div class="mt-4 flex justify-end gap-2">
                <button type="button" class="btn btn-sm" :disabled="mediaUploading" @click="cancelMediaUpload">Cancel</button>
                <button type="button" class="btn btn-secondary btn-sm" :disabled="mediaUploading || !pendingMediaFiles.length || (pendingMediaFiles.length === 1 && !mediaUploadForm.title)" @click="saveMediaUpload"><span v-if="mediaUploading" class="loading loading-spinner loading-sm" /><Icon v-else name="lucide:cloud-upload" class="h-4 w-4" />{{ mediaUploading ? `Uploading ${mediaUploadProgress} of ${pendingMediaFiles.length}…` : `Save ${pendingMediaFiles.length} document${pendingMediaFiles.length === 1 ? '' : 's'}` }}</button>
              </div>
            </div>
          </section>
          <div class="border-b border-base-200 bg-base-200/30 p-4"><label class="input input-bordered mx-auto flex max-w-3xl items-center gap-2 bg-base-100"><Icon name="lucide:search" class="h-4 w-4" /><input v-model="mediaSearch" class="grow" placeholder="Search reusable documents" @input="loadMediaDocuments"></label></div>
          <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <div v-if="mediaLoading" class="p-16 text-center"><span class="loading loading-spinner loading-lg text-secondary" /></div>
            <div v-else-if="mediaLoadError" class="mx-auto max-w-3xl py-8"><div class="alert alert-error"><Icon name="lucide:triangle-alert" class="h-5 w-5" /><div class="flex-1"><p class="font-semibold">Could not load Media Center documents</p><p class="text-sm">{{ mediaLoadError }}</p></div><button type="button" class="btn btn-sm" @click="loadMediaDocuments"><Icon name="lucide:refresh-cw" class="h-4 w-4" />Retry</button></div></div>
            <div v-else-if="mediaDocuments.length" class="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <article v-for="document in mediaDocuments" :key="document.uuid" class="flex flex-col rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm transition hover:border-secondary/50 hover:shadow-md">
                <div class="flex items-start gap-3"><span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon name="lucide:file-text" class="h-6 w-6" /></span><div class="min-w-0 flex-1"><h4 class="truncate font-bold">{{ document.title }}</h4><p class="truncate text-xs text-base-content/50">{{ document.original_filename }}</p><div class="mt-2 flex flex-wrap gap-2"><span class="badge badge-ghost badge-sm">{{ document.category || 'General' }}</span><span class="badge badge-ghost badge-sm">{{ formatFileSize(document.file_size) }}</span></div></div></div>
                <p v-if="document.expires_at" class="mt-4 text-xs" :class="isMediaExpired(document) ? 'font-medium text-error' : 'text-base-content/55'">{{ isMediaExpired(document) ? 'Expired' : 'Expires' }} {{ formatMediaExpiry(document.expires_at) }}</p>
                <button type="button" class="btn btn-secondary btn-sm mt-4 w-full" :disabled="hasActiveMediaTarget && isMediaExpired(document)" @click="useMediaDocument(document)"><Icon :name="hasActiveMediaTarget ? 'lucide:link' : 'lucide:download'" class="h-4 w-4" />{{ hasActiveMediaTarget ? (isMediaExpired(document) ? 'Expired document' : 'Attach document') : 'Download document' }}</button>
              </article>
            </div>
            <div v-else class="p-16 text-center text-base-content/50"><Icon name="lucide:library" class="mx-auto mb-3 h-12 w-12" /><p class="font-semibold">No matching documents</p><p class="text-sm">Upload a document here to store it once and reuse it across tender responses.</p></div>
          </div>
        </div>
      </dialog>

      <dialog :open="Boolean(receipt)" class="modal">
        <div v-if="receipt" class="modal-box">
          <div class="text-center"><Icon name="lucide:shield-check" class="mx-auto h-12 w-12 text-success" /><h3 class="mt-2 text-xl font-bold">Bid submitted securely</h3></div>
          <dl class="mt-5 space-y-2 rounded-xl bg-base-200 p-4 text-sm">
            <div><dt class="text-base-content/50">Receipt hash</dt><dd class="break-all font-mono text-xs">{{ receipt.receipt_hash }}</dd></div>
            <div><dt class="text-base-content/50">Submitted</dt><dd>{{ formatDateTime(receipt.submitted_at) }}</dd></div>
            <div><dt class="text-base-content/50">Signing key</dt><dd>{{ receipt.key_serial }}</dd></div>
          </dl>
          <div class="modal-action"><NuxtLink to="/mysupplierbids" class="btn btn-success">View My Bids</NuxtLink></div>
        </div>
      </dialog>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Online Bid Response' });

const route = useRoute();
const toast = useToast();
const { user } = useSanctumAuth();
const publicTenders = usePublicTenderHelper();
const api = useBidResponse();
const cryptoTools = useBidCrypto();
const vaultSession = useBidVaultSession();
const localDrafts = useBidLocalDraft();
const mediaCenter = useMediaCenter();
const s3Uploader = useS3Upload();
const { setSubmissionKeyOnBrowser } = useBrowserSubmissionKey();

const loading = ref(true);
const busy = ref(false);
const saving = ref(false);
const submitting = ref(false);
const error = ref('');
const saveError = ref('');
const tender = ref(null);
const bidRecord = ref(null);
const eligibility = ref(null);
const vaultRecord = ref(null);
const vaultUnlocked = ref(false);
const masterKey = shallowRef(null);
const vaultPassphrase = ref('');
const vaultConfirmation = ref('');
const recoveryCode = ref('');
const recoveryInput = ref('');
const draft = ref(null);
const currentStep = ref(0);
const submissionKeys = ref([]);
const receipt = ref(null);
const declarationAccepted = ref(false);
const feeInvoices = ref([]);
const feeOptions = ref(null);
const selectedFeeCurrencyId = ref(null);
const feesLoading = ref(false);
const feesError = ref('');
const downloadingDocument = ref(null);
const mediaPickerDialog = ref(null);
const mediaUploadOpen = ref(false);
const mediaDocuments = ref([]);
const mediaLoading = ref(false);
const mediaLoadError = ref('');
const mediaSearch = ref('');
const mediaUploading = ref(false);
const mediaUploadError = ref('');
const pendingMediaFiles = ref([]);
const mediaUploadProgress = ref(0);
const mediaUploadForm = reactive({ title: '', category: '', expires_at: '' });
const activeDocumentRequirementUuid = ref(null);
const activeSpecificationTarget = ref(null);
const activeTechnicalQuestionId = ref(null);
const hasActiveMediaTarget = computed(() => Boolean(activeDocumentRequirementUuid.value || activeSpecificationTarget.value || activeTechnicalQuestionId.value));
const countdownNow = ref(Date.now());
const localDraftSavedAt = ref(null);
const localDraftRestored = ref(false);
const localDraftReady = ref(false);
let countdownTimer;
let localDraftTimer;
let localDraftOperation = Promise.resolve();

const response = reactive({
  selected_lot_ids: [],
  selected_product_ids: [],
  eligibility: {},
  technical: {},
  specification_compliance: {},
  documents: {},
  documentAcknowledgements: {},
  pricing: {},
  charges_vat: false,
  vat_percentage: null,
  bid_security: { method: '', guarantee: null },
});

const envelopeMode = computed(() => tender.value?.envelope_mode ?? 'SINGLE');
const steps = computed(() => [
  ...(tender.value?.items?.length ? [{ key: 'lots', label: 'Select lots' }] : []),
  ...((tender.value?.eligibility_questions?.length || tender.value?.technical_eligibility_questions?.length || tender.value?.document_requirements?.length || tender.value?.items?.some(item => item.products?.some(product => product.specifications?.length))) ? [{ key: 'eligibility', label: 'Eligibility' }] : []),
  ...(tender.value?.items?.length && envelopeMode.value !== 'TECHNICAL_ONLY' ? [{ key: 'pricing', label: 'Pricing' }] : []),
  ...(hasTenderFees.value ? [{ key: 'fees', label: 'Tender fees' }] : []),
  { key: 'review', label: 'Review & submit' },
]);
const activeStep = computed(() => steps.value[currentStep.value] ?? steps.value[0]);
const providedDocuments = computed(() => (tender.value?.document_requirements ?? []).filter(document => document.type === 'PROVIDE'));
const requestedDocuments = computed(() => (tender.value?.document_requirements ?? []).filter(document => document.type === 'REQUEST'));
const reviewedProvidedCount = computed(() => providedDocuments.value.filter(document => response.documentAcknowledgements[document.uuid]).length);
const uploadedRequestedCount = computed(() => requestedDocuments.value.filter(document => response.documents[document.uuid]?.name).length);
const authenticatedUser = computed(() => user.value?.data?.user ?? user.value?.data ?? user.value);
const currentUserId = computed(() => authenticatedUser.value?.id ?? null);
const localDraftKey = computed(() => currentUserId.value ? `${currentUserId.value}:${route.params.uuid}` : null);
const myKeys = computed(() => submissionKeys.value.filter((key) => Number(key.user?.id) === Number(currentUserId.value)));
const portalSigningKey = computed(() => myKeys.value.find((key) => key.status === 'ACTIVE' && key.storage_mode === 'PORTAL_VAULT'));
const availableSigningKey = computed(() =>
  myKeys.value.find((key) => key.status === 'PENDING_GENERATION')
  ?? myKeys.value.find((key) => key.status === 'ACTIVE'),
);
const selectedLotIds = computed(() => new Set((response.selected_lot_ids ?? []).map(Number)));
const selectedProductIds = computed(() => new Set((response.selected_product_ids ?? []).map(Number)));
const eligibilityQuestionGroups = computed(() => {
  const grouped = new Map();
  for (const question of tender.value?.eligibility_questions ?? []) {
    const title = question.group_title || 'General eligibility';
    const order = Number(question.group_sort_order ?? 0);
    const key = `${order}:${title}`;
    if (!grouped.has(key)) grouped.set(key, { key, title, order, questions: [] });
    grouped.get(key).questions.push(question);
  }
  return [...grouped.values()].sort((left, right) => left.order - right.order);
});
const selectedLotItems = computed(() => (tender.value?.items ?? []).filter((item) => selectedLotIds.value.has(Number(item.id))));
const hasMilestonePricing = computed(() => selectedLotItems.value.some(item => item.pricing_mode === 'MILESTONE' && item.pricing_milestones?.length));
const pricingSubtotal = computed(() => selectedLotItems.value.reduce((total, item) => total + lotSubtotal(item), 0));
const pricingVatAmount = computed(() => {
  const percentage = Number(response.vat_percentage);
  return response.charges_vat && Number.isFinite(percentage) ? pricingSubtotal.value * (percentage / 100) : 0;
});
const pricingGrandTotal = computed(() => pricingSubtotal.value + pricingVatAmount.value);
const selectedTechnicalQuestions = computed(() => (tender.value?.technical_eligibility_questions ?? []).filter(
  (question) => (!question.procurementrequestitem_id || selectedLotIds.value.has(Number(question.procurementrequestitem_id)))
    && (!question.procurementrequestitem_product_id || selectedProductIds.value.has(Number(question.procurementrequestitem_product_id))),
));
const globalTechnicalQuestions = computed(() => selectedTechnicalQuestions.value.filter(
  (question) => !question.procurementrequestitem_product_id,
));
const globalTechnicalQuestionGroups = computed(() => {
  const grouped = new Map();
  for (const question of globalTechnicalQuestions.value) {
    const title = question.group_title || 'General technical requirements';
    const order = Number(question.group_sort_order ?? 0);
    const key = `${order}:${title}`;
    if (!grouped.has(key)) grouped.set(key, { key, title, order, questions: [] });
    grouped.get(key).questions.push(question);
  }
  return [...grouped.values()].sort((left, right) => left.order - right.order);
});
const technicalProductGroups = computed(() => selectedLotItems.value.flatMap((lot) => (lot.products ?? []).map((product) => {
  const questions = selectedTechnicalQuestions.value.filter(
    question => Number(question.procurementrequestitem_product_id) === Number(product.id),
  );
  const grouped = new Map();
  for (const question of questions) {
    const title = question.group_title || 'General technical eligibility';
    const order = Number(question.group_sort_order ?? 1);
    const key = `${order}:${title}`;
    if (!grouped.has(key)) grouped.set(key, { key, title, order, questions: [] });
    grouped.get(key).questions.push(question);
  }
  return {
    lot,
    product,
    selected: selectedProductIds.value.has(Number(product.id)),
    questionGroups: [...grouped.values()].sort((left, right) => left.order - right.order),
  };
}))); 
const lotRuleSummary = computed(() => tender.value?.lot_rules?.allows_multiple_lots
  ? 'This tender allows you to participate in one or more lots.'
  : 'This tender allows you to participate in one lot only.');
const hasTenderFees = computed(() => Boolean(
  tender.value?.fees?.bid_security || tender.value?.fees?.administration_fee,
));
const invoicePriority = { PAID: 3, AWAITING: 2, PENDING: 1 };
const findFeeInvoice = (type, subType = null) => [...feeInvoices.value]
  .filter((invoice) => invoice.type === type && (subType === null || invoice.bid_security_type === subType))
  .sort((left, right) => (invoicePriority[right.status] ?? 0) - (invoicePriority[left.status] ?? 0))[0] ?? null;
const requiredTenderFees = computed(() => {
  const fees = tender.value?.fees ?? {};
  const currency = fees.currency ?? feeOptions.value?.default_currency?.code ?? '—';
  const rows = [];
  if (fees.bid_security && response.bid_security.method !== 'GUARANTEE') {
    const bondInvoice = findFeeInvoice('BID_SECURITY', 'BID_BOND');
    rows.push({
      key: 'bid_bond',
      label: 'Bid bond deposit',
      description: 'Required bid-security amount held for this tender.',
      amount: bondInvoice?.total ?? fees.bid_security.amount,
      currency: bondInvoice?.currency ?? currency,
      invoice: bondInvoice,
    });
    if (Number(fees.bid_security.establishment_fee) > 0) {
      const establishmentInvoice = findFeeInvoice('BID_SECURITY', 'ESTABLISHMENT_FEE');
      rows.push({
        key: 'establishment',
        label: 'Bid-security establishment fee',
        description: 'Fee charged for establishing the PRAZ bid security.',
        amount: establishmentInvoice?.total ?? fees.bid_security.establishment_fee,
        currency: establishmentInvoice?.currency ?? currency,
        invoice: establishmentInvoice,
      });
    }
  }
  if (fees.administration_fee) {
    const administrationInvoice = findFeeInvoice('TENDER_ADMIN_FEE');
    rows.push({
      key: 'administration',
      label: 'Tender administration fee',
      description: 'Administration fee applicable to this procurement.',
      amount: administrationInvoice?.total ?? fees.administration_fee.amount,
      currency: administrationInvoice?.currency ?? fees.administration_fee.currency ?? currency,
      invoice: administrationInvoice,
    });
  }
  return rows;
});
const feesToGenerate = computed(() => requiredTenderFees.value.filter((fee) => !fee.invoice));
const tenderFeesComplete = computed(() => {
  if (tender.value?.fees?.bid_security && response.bid_security.method === 'GUARANTEE') {
    if (!response.bid_security.guarantee) return false;
  }
  return requiredTenderFees.value.every((fee) => fee.invoice?.paid === true);
});
const hasSubmittedBid = computed(() => Boolean(
  receipt.value
  || (bidRecord.value?.status && bidRecord.value.status !== 'DRAFT'),
));
const tenderClosingAt = computed(() => tender.value?.closing_at ?? eligibility.value?.closing_at ?? null);
const closingMilliseconds = computed(() => {
  const timestamp = Date.parse(tenderClosingAt.value ?? '');
  return Number.isFinite(timestamp) ? timestamp - countdownNow.value : null;
});
const tenderClosed = computed(() => closingMilliseconds.value !== null && closingMilliseconds.value <= 0);
const closingCountdown = computed(() => {
  if (closingMilliseconds.value === null) return 'Closing time unavailable';
  if (closingMilliseconds.value <= 0) return 'Tender closed';

  const totalSeconds = Math.floor(closingMilliseconds.value / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return days > 0
    ? `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});
const draftWarningClass = computed(() => {
  if (tenderClosed.value || (closingMilliseconds.value !== null && closingMilliseconds.value <= 24 * 60 * 60 * 1000)) {
    return 'alert-error';
  }
  return 'alert-warning';
});

onMounted(() => {
  countdownNow.value = Date.now();
  countdownTimer = window.setInterval(() => {
    countdownNow.value = Date.now();
  }, 1000);
  window.addEventListener('focus', refreshSubmissionKeys);
  loadPage();
});

onBeforeUnmount(() => {
  if (countdownTimer) window.clearInterval(countdownTimer);
  if (localDraftTimer) {
    window.clearTimeout(localDraftTimer);
    void persistLocalResponseDraft();
  }
  window.removeEventListener('focus', refreshSubmissionKeys);
  masterKey.value?.fill(0);
});

watch(response, () => {
  if (!localDraftReady.value || !localDraftKey.value || hasSubmittedBid.value) return;
  if (localDraftTimer) window.clearTimeout(localDraftTimer);
  localDraftTimer = window.setTimeout(() => {
    localDraftTimer = null;
    void persistLocalResponseDraft();
  }, 350);
}, { deep: true });

async function loadPage() {
  loading.value = true;
  const uuid = route.params.uuid;
  const [tenderResult, eligibilityResult, vaultResult, keysResult, bidsResult] = await Promise.all([
    publicTenders.getSupplierOpportunity(uuid),
    api.getEligibility(uuid),
    api.getVault(),
    api.getSubmissionKeys(),
    api.listBids(),
  ]);

  tender.value = tenderResult.data?.data ?? null;
  eligibility.value = eligibilityResult.data;
  bidRecord.value = (bidsResult.data ?? []).find((bid) => bid.tender_uuid === uuid) ?? null;
  if (vaultResult.ok) vaultRecord.value = vaultResult.data;
  submissionKeys.value = keysResult.data?.keys ?? [];
  if (tender.value?.fees?.bid_security && !response.bid_security.method) response.bid_security.method = 'PRAZ';

  if (!tender.value) error.value = tenderResult.error ?? 'Tender not found.';
  initialisePricing();
  if (tender.value) await loadTenderFees();
  if (vaultRecord.value) {
    const cachedMasterKey = vaultSession.restore(vaultRecord.value, currentUserId.value);
    if (cachedMasterKey) {
      masterKey.value = cachedMasterKey;
      vaultUnlocked.value = true;
      try {
        await loadEncryptedDraft();
      } catch {
        cachedMasterKey.fill(0);
        masterKey.value = null;
        vaultUnlocked.value = false;
        vaultSession.clear();
      }
    }
  }
  if (hasSubmittedBid.value) await clearLocalResponseDraft();
  else await restoreLocalResponseDraft();
  localDraftReady.value = true;
  loading.value = false;
}

function initialisePricing() {
  for (const item of tender.value?.items ?? []) {
    response.pricing ??= {};
    response.pricing[item.id] ??= {};
    const legacyUnitPrice = response.pricing[item.id].unit_price;
    const legacyCompliance = response.pricing[item.id].compliance ?? {};
    response.pricing[item.id].products ??= {};
    response.pricing[item.id].milestones ??= {};
    for (const milestone of item.pricing_milestones ?? []) {
      response.pricing[item.id].milestones[milestone.key] ??= {
        title: milestone.title,
        payment_percentage: milestone.payment_percentage,
        quoted_amount: null,
      };
    }
    response.specification_compliance ??= {};
    response.specification_compliance[item.id] ??= {};
    for (const product of item.products ?? []) {
      response.pricing[item.id].products[product.id] ??= {
        unit_price: (item.products?.length === 1 && legacyUnitPrice !== undefined) ? legacyUnitPrice : null,
      };
      for (const specification of product.specifications ?? []) {
        const existing = response.specification_compliance[item.id][specification.id] ?? legacyCompliance[specification.id];
        response.specification_compliance[item.id][specification.id] = typeof existing === 'string'
          ? { status: existing, offered_value: '', manufacturer_model: '', explanation: '', supporting_document: null }
          : { status: '', offered_value: '', manufacturer_model: '', explanation: '', supporting_document: null, ...(existing ?? {}) };
      }
    }
    delete response.pricing[item.id].unit_price;
    delete response.pricing[item.id].compliance;
  }
  syncProductSelectionForLots();
}

async function setupVault() {
  busy.value = true;
  saveError.value = '';
  try {
    const created = await cryptoTools.createVault(vaultPassphrase.value);
    const result = await api.saveVault(created.record);
    if (!result.ok) throw new Error(result.error);
    vaultRecord.value = result.data;
    masterKey.value = created.masterKey;
    vaultSession.remember(vaultRecord.value, masterKey.value, currentUserId.value);
    recoveryCode.value = created.recoveryCode;
    vaultUnlocked.value = true;
    await loadEncryptedDraft();
  } catch (exception) {
    saveError.value = exception.message;
  } finally {
    busy.value = false;
  }
}

async function unlockExistingVault() {
  busy.value = true;
  try {
    masterKey.value = await cryptoTools.unlockVault(vaultRecord.value, vaultPassphrase.value);
    vaultSession.remember(vaultRecord.value, masterKey.value, currentUserId.value);
    vaultUnlocked.value = true;
    vaultPassphrase.value = '';
    await loadEncryptedDraft();
  } catch (exception) {
    toast.error({
      title: 'Could not unlock Bid Vault',
      message: exception.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    busy.value = false;
  }
}

async function unlockWithRecovery() {
  busy.value = true;
  try {
    masterKey.value = await cryptoTools.unlockVaultWithRecovery(vaultRecord.value, recoveryInput.value);
    vaultSession.remember(vaultRecord.value, masterKey.value, currentUserId.value);
    vaultUnlocked.value = true;
    recoveryInput.value = '';
    await loadEncryptedDraft();
  } catch (exception) {
    toast.error({
      title: 'Could not recover Bid Vault',
      message: exception.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    busy.value = false;
  }
}

async function loadEncryptedDraft() {
  const result = await api.getDraft(route.params.uuid);
  if (!result.ok) {
    if (result.status !== 404) saveError.value = result.error;
    return;
  }

  draft.value = result.data;
  const decrypted = await cryptoTools.decryptDraft(draft.value, masterKey.value);
  Object.assign(response, decrypted.payload);
  response.selected_lot_ids ??= [];
  response.selected_product_ids ??= [];
  response.bid_security ??= { method: '', guarantee: null };
  if (tender.value?.fees?.bid_security && !response.bid_security.method) response.bid_security.method = 'PRAZ';
  initialisePricing();
}

function serialisableResponse() {
  return JSON.parse(JSON.stringify(response));
}

async function persistLocalResponseDraft() {
  if (!localDraftReady.value || !localDraftKey.value || hasSubmittedBid.value) return;
  const key = localDraftKey.value;
  const payload = {
    tender_uuid: String(route.params.uuid),
    user_id: Number(currentUserId.value),
    current_step: currentStep.value,
    response: serialisableResponse(),
  };
  const operation = localDraftOperation.then(() => localDrafts.saveDraft(key, payload));
  localDraftOperation = operation.catch(() => null);
  try {
    await operation;
    localDraftSavedAt.value = new Date().toISOString();
  } catch {
    localDraftSavedAt.value = null;
  }
}

async function restoreLocalResponseDraft() {
  if (!localDraftKey.value) return;
  try {
    const cached = await localDrafts.loadDraft(localDraftKey.value);
    if (!cached?.response) return;
    Object.assign(response, cached.response);
    response.selected_lot_ids ??= [];
    response.selected_product_ids ??= [];
    response.bid_security ??= { method: '', guarantee: null };
    initialisePricing();
    currentStep.value = Math.min(
      Math.max(Number(cached.current_step) || 0, 0),
      Math.max(steps.value.length - 1, 0),
    );
    localDraftRestored.value = true;
    localDraftSavedAt.value = cached.saved_at ?? null;
    toast.success({
      title: 'Local response restored',
      message: 'Your unsaved tender response was restored from this browser.',
      position: 'topRight',
      layout: 2,
    });
  } catch {
    localDraftSavedAt.value = null;
  }
}

async function clearLocalResponseDraft() {
  if (localDraftTimer) {
    window.clearTimeout(localDraftTimer);
    localDraftTimer = null;
  }
  if (!localDraftKey.value) return;
  try {
    await localDraftOperation;
    await localDrafts.deleteDraft(localDraftKey.value);
  } catch {
    // A successful encrypted save must not be reported as failed if browser storage is unavailable.
  }
  localDraftRestored.value = false;
  localDraftSavedAt.value = null;
}

async function saveEncryptedDraft() {
  saving.value = true;
  saveError.value = '';
  try {
    const encrypted = await cryptoTools.encryptDraft(serialisableResponse(), masterKey.value, draft.value);
    const snapshotHash = await cryptoTools.sha256(new TextEncoder().encode(JSON.stringify(tender.value)));
    const result = await api.saveDraft(route.params.uuid, {
      envelope_mode: envelopeMode.value,
      schema_version: 1,
      revision: draft.value?.revision ?? 0,
      encrypted_payload: encrypted.encrypted_payload,
      payload_nonce: encrypted.payload_nonce,
      wrapped_bid_key: encrypted.wrapped_bid_key,
      wrap_nonce: encrypted.wrap_nonce,
      tender_snapshot_hash: snapshotHash,
    });
    if (!result.ok) throw new Error(result.error);
    draft.value = result.data;
    await clearLocalResponseDraft();
    toast.success({
      title: 'Draft saved',
      message: 'Your encrypted bid response has been saved securely.',
      position: 'topRight',
      layout: 2,
    });
    return true;
  } catch (exception) {
    saveError.value = exception.message;
    return false;
  } finally {
    saving.value = false;
  }
}

async function saveAndContinue() {
  if (activeStep.value.key === 'lots' && !validateLotSelection()) return;
  if (activeStep.value.key === 'eligibility' && !validateSpecificationCompliance()) return;
  if (activeStep.value.key === 'pricing' && !validateProductPricing()) return;
  if (activeStep.value.key === 'fees' && !tenderFeesComplete.value) {
    saveError.value = 'Settle every required tender fee before continuing.';
    return;
  }
  if (await saveEncryptedDraft()) currentStep.value = Math.min(currentStep.value + 1, steps.value.length - 1);
}

function previousStep() {
  currentStep.value = Math.max(0, currentStep.value - 1);
}

function goToStep(index) {
  if (index > 0 && !validateLotSelection()) return;
  currentStep.value = index;
  if (steps.value[index]?.key === 'fees') loadTenderFees();
  if (steps.value[index]?.key === 'review') refreshSubmissionKeys();
}

async function refreshSubmissionKeys() {
  const result = await api.getSubmissionKeys();
  if (result.ok) submissionKeys.value = result.data?.keys ?? [];
}

function isLotSelected(id) {
  return selectedLotIds.value.has(Number(id));
}

function toggleLot(id) {
  const numericId = Number(id);
  if (!tender.value?.lot_rules?.allows_multiple_lots) {
    response.selected_lot_ids = [numericId];
  } else if (isLotSelected(numericId)) {
    response.selected_lot_ids = response.selected_lot_ids.filter((selected) => Number(selected) !== numericId);
  } else {
    response.selected_lot_ids = [...response.selected_lot_ids, numericId];
  }
  response.selected_lot_ids.sort((left, right) => Number(left) - Number(right));
  syncProductSelectionForLots();
  saveError.value = '';
}

function syncProductSelectionForLots() {
  response.selected_product_ids ??= [];
  const availableProductIds = selectedLotItems.value.flatMap(item => (item.products ?? []).map(product => Number(product.id)));
  const available = new Set(availableProductIds);

  if (tender.value?.lot_rules?.requires_all_lines) {
    response.selected_product_ids = [...availableProductIds].sort((left, right) => left - right);
    return;
  }

  response.selected_product_ids = response.selected_product_ids
    .map(Number)
    .filter(productId => available.has(productId))
    .filter((productId, index, values) => values.indexOf(productId) === index)
    .sort((left, right) => left - right);
}

function isProductSelected(id) {
  return selectedProductIds.value.has(Number(id));
}

function toggleProduct(itemId, productId) {
  if (tender.value?.lot_rules?.requires_all_lines || !isLotSelected(itemId)) return;
  const numericId = Number(productId);
  response.selected_product_ids = isProductSelected(numericId)
    ? response.selected_product_ids.filter(selected => Number(selected) !== numericId)
    : [...response.selected_product_ids, numericId];
  response.selected_product_ids.sort((left, right) => Number(left) - Number(right));
  saveError.value = '';
}

function validateLotSelection() {
  if (!response.selected_lot_ids?.length) {
    saveError.value = 'Select at least one lot before continuing.';
    return false;
  }
  if (!tender.value?.lot_rules?.allows_multiple_lots && response.selected_lot_ids.length !== 1) {
    saveError.value = 'This tender permits participation in one lot only.';
    return false;
  }
  return true;
}

async function captureFile(file) {
  if (!file) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error('Response documents are currently limited to 2 MB each.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return { name: file.name, type: file.type, size: file.size, data: btoa(binary) };
}

async function captureAnswerFile(section, id, event) {
  try {
    response[section][id] = { ...(response[section][id] ?? {}), file: await captureFile(event.target.files?.[0]) };
  } catch (exception) {
    toast.error({
      title: 'File not accepted',
      message: exception.message,
      position: 'topRight',
      layout: 2,
    });
  }
}

function beginMediaUpload(event) {
  const files = Array.from(event.target.files ?? []);
  event.target.value = '';
  if (!files.length) return;

  pendingMediaFiles.value = files;
  const file = files[0];
  mediaUploadForm.title = file.name.replace(/\.[^.]+$/, '');
  mediaUploadForm.category = activeSpecificationTarget.value
    ? 'Technical datasheet'
    : ((activeDocumentRequirementUuid.value || activeTechnicalQuestionId.value) ? 'Tender response' : 'General');
  mediaUploadForm.expires_at = '';
  mediaUploadError.value = '';
  mediaUploadOpen.value = true;
}

function cancelMediaUpload() {
  if (mediaUploading.value) return;
  pendingMediaFiles.value = [];
  mediaUploadProgress.value = 0;
  mediaUploadError.value = '';
  mediaUploadOpen.value = false;
}

async function saveMediaUpload() {
  const files = [...pendingMediaFiles.value];
  if (!files.length || (files.length === 1 && !mediaUploadForm.title.trim())) return;

  try {
    mediaUploading.value = true;
    mediaUploadError.value = '';
    const createdDocuments = [];
    for (const [index, file] of files.entries()) {
      mediaUploadProgress.value = index + 1;
      const upload = await s3Uploader.presignAndUpload(file, 'supplier-media-center');
      if (!upload.ok) throw new Error(`${file.name}: ${upload.error}`);
      const result = await mediaCenter.create({
        ...upload.data,
        title: files.length === 1 ? mediaUploadForm.title.trim() : file.name.replace(/\.[^.]+$/, ''),
        category: mediaUploadForm.category.trim() || 'General',
        expires_at: mediaUploadForm.expires_at || null,
      });
      if (!result.ok) throw new Error(`${file.name}: ${result.error}`);
      createdDocuments.push(result.data);
    }
    pendingMediaFiles.value = [];
    mediaUploadOpen.value = false;
    await loadMediaDocuments();
    for (const createdDocument of createdDocuments.reverse()) {
      if (createdDocument?.uuid && !mediaDocuments.value.some(document => document.uuid === createdDocument.uuid)) {
        mediaDocuments.value.unshift(createdDocument);
      }
    }
    toast.success({
      title: files.length === 1 ? 'Document uploaded' : 'Documents uploaded',
      message: `${files.length} document${files.length === 1 ? ' is' : 's are'} now available to choose from the Media Center.`,
      position: 'topRight',
      layout: 2,
    });
  } catch (exception) {
    mediaUploadError.value = exception.message;
  } finally {
    mediaUploading.value = false;
    mediaUploadProgress.value = 0;
  }
}

function validateSpecificationCompliance() {
  if (!validateProductSelection()) return false;
  for (const item of selectedLotItems.value) {
    for (const product of selectedProductsForItem(item)) {
      for (const specification of product.specifications ?? []) {
        const answer = response.specification_compliance?.[item.id]?.[specification.id];
        if (!answer?.status) {
          saveError.value = `Select a compliance response for “${specification.label}”.`;
          return false;
        }
        if (specification.acceptance_policy === 'MANDATORY' && answer.status === 'ALTERNATIVE') {
          saveError.value = `“${specification.label}” requires an exact match and cannot be submitted as an alternative.`;
          return false;
        }
        if (answer.status === 'ALTERNATIVE' && (!answer.offered_value?.trim() || !hasRichTextContent(answer.explanation) || !answer.supporting_document?.media_uuid)) {
          saveError.value = `Complete the offered value, explanation and supporting datasheet for “${specification.label}”.`;
          return false;
        }
      }
    }
  }
  return true;
}

function hasRichTextContent(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;
}

function validateProductSelection() {
  syncProductSelectionForLots();
  for (const item of selectedLotItems.value) {
    const products = item.products ?? [];
    if (!products.length) {
      saveError.value = `Lot ${item.lot_number} has no products or services available for response.`;
      return false;
    }
    if (!products.some(product => isProductSelected(product.id))) {
      saveError.value = `Select at least one product or service in Lot ${item.lot_number}.`;
      return false;
    }
  }
  return true;
}

function validateProductPricing() {
  if (!validateProductSelection()) return false;
  for (const item of selectedLotItems.value) {
    if (item.pricing_mode === 'MILESTONE' && item.pricing_milestones?.length) {
      for (const milestone of item.pricing_milestones) {
        const amount = response.pricing?.[item.id]?.milestones?.[milestone.key]?.quoted_amount;
        if (amount === null || amount === '' || amount === undefined || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
          saveError.value = `Enter a valid quotation for “${milestone.title}”.`;
          return false;
        }
      }
      continue;
    }
    if (!(item.products?.length)) {
      saveError.value = `Lot ${item.lot_number} has no products or services available for pricing.`;
      return false;
    }
    for (const product of selectedProductsForItem(item)) {
      const unitPrice = response.pricing?.[item.id]?.products?.[product.id]?.unit_price;
      if (unitPrice === null || unitPrice === '' || unitPrice === undefined || !Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0) {
        saveError.value = `Enter a valid unit price for “${product.description}”.`;
        return false;
      }
    }
  }

  const vatPercentage = Number(response.vat_percentage);
  if (response.charges_vat && (response.vat_percentage === null || response.vat_percentage === '' || !Number.isFinite(vatPercentage) || vatPercentage < 0 || vatPercentage > 100)) {
    saveError.value = 'Enter a valid VAT percentage between 0 and 100.';
    return false;
  }

  return true;
}

function productLineTotal(itemId, product) {
  if (!isProductSelected(product.id)) return 0;
  const unitPrice = Number(response.pricing?.[itemId]?.products?.[product.id]?.unit_price);
  const quantity = Number(product.quantity);
  return Number.isFinite(unitPrice) && Number.isFinite(quantity) ? unitPrice * quantity : 0;
}

function lotSubtotal(item) {
  if (item.pricing_mode === 'MILESTONE' && item.pricing_milestones?.length) {
    return item.pricing_milestones.reduce((total, milestone) => {
      const amount = Number(response.pricing?.[item.id]?.milestones?.[milestone.key]?.quoted_amount);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }
  return selectedProductsForItem(item).reduce((total, product) => total + productLineTotal(item.id, product), 0);
}

function selectedProductsForItem(item) {
  return (item.products ?? []).filter(product => isProductSelected(product.id));
}

function mediaReference(document) {
  return {
    source: 'MEDIA_CENTER',
    media_uuid: document.uuid,
    name: document.original_filename,
    title: document.title,
    type: document.mime_type,
    size: document.file_size,
    sha256: document.sha256,
  };
}

async function openMediaPicker(requirementUuid) {
  activeDocumentRequirementUuid.value = requirementUuid;
  activeSpecificationTarget.value = null;
  activeTechnicalQuestionId.value = null;
  mediaSearch.value = '';
  cancelMediaUpload();
  mediaPickerDialog.value?.showModal();
  await loadMediaDocuments();
}

async function openSpecificationMediaPicker(lotId, specificationId) {
  activeDocumentRequirementUuid.value = null;
  activeSpecificationTarget.value = { lotId, specificationId };
  activeTechnicalQuestionId.value = null;
  mediaSearch.value = '';
  cancelMediaUpload();
  mediaPickerDialog.value?.showModal();
  await loadMediaDocuments();
}

async function openTechnicalQuestionMediaPicker(questionId) {
  activeDocumentRequirementUuid.value = null;
  activeSpecificationTarget.value = null;
  activeTechnicalQuestionId.value = Number(questionId);
  mediaSearch.value = '';
  cancelMediaUpload();
  mediaPickerDialog.value?.showModal();
  await loadMediaDocuments();
}

function closeMediaPicker() {
  if (mediaUploading.value) return;
  cancelMediaUpload();
  activeDocumentRequirementUuid.value = null;
  activeSpecificationTarget.value = null;
  activeTechnicalQuestionId.value = null;
  mediaPickerDialog.value?.close();
}

async function loadMediaDocuments() {
  mediaLoading.value = true;
  mediaLoadError.value = '';
  const result = await mediaCenter.list(mediaSearch.value);
  mediaLoading.value = false;
  if (result.ok) {
    const payload = result.data;
    const documents = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload?.items) ? payload.items : []));
    mediaDocuments.value = documents;
  }
  else {
    mediaLoadError.value = result.error;
  }
}

function isMediaExpired(document) {
  if (!document?.expires_at) return false;
  const expiry = new Date(document.expires_at);
  if (Number.isNaN(expiry.getTime())) return false;
  expiry.setHours(23, 59, 59, 999);
  return expiry.getTime() < Date.now();
}

function formatMediaExpiry(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function attachMediaDocument(document) {
  if (!activeDocumentRequirementUuid.value) return;
  response.documents[activeDocumentRequirementUuid.value] = mediaReference(document);
  mediaPickerDialog.value?.close();
}

async function useMediaDocument(document) {
  if (activeDocumentRequirementUuid.value) {
    attachMediaDocument(document);
    return;
  }
  if (activeSpecificationTarget.value) {
    const { lotId, specificationId } = activeSpecificationTarget.value;
    response.specification_compliance[lotId][specificationId].supporting_document = mediaReference(document);
    activeSpecificationTarget.value = null;
    mediaPickerDialog.value?.close();
    return;
  }
  if (activeTechnicalQuestionId.value) {
    const questionId = activeTechnicalQuestionId.value;
    response.technical[questionId] = {
      ...(response.technical[questionId] ?? {}),
      file: mediaReference(document),
    };
    activeTechnicalQuestionId.value = null;
    mediaPickerDialog.value?.close();
    return;
  }

  const result = await mediaCenter.download(document.uuid);
  if (result.ok && result.data?.url) {
    window.open(result.data.url, '_blank', 'noopener');
    return;
  }
  toast.error({
    title: 'Download unavailable',
    message: result.error ?? 'The document could not be downloaded.',
    position: 'topRight',
    layout: 2,
  });
}

async function captureAlternativeDocument(lotId, specificationId, event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    busy.value = true;
    const upload = await s3Uploader.presignAndUpload(file, 'supplier-media-center');
    if (!upload.ok) throw new Error(upload.error);
    const result = await mediaCenter.create({
      ...upload.data,
      title: file.name.replace(/\.[^.]+$/, ''),
      category: 'Technical datasheet',
      expires_at: null,
    });
    if (!result.ok) throw new Error(result.error);
    response.specification_compliance[lotId][specificationId].supporting_document = mediaReference(result.data);
  } catch (exception) {
    toast.error({ title: 'Datasheet not accepted', message: exception.message, position: 'topRight', layout: 2 });
  } finally {
    busy.value = false;
  }
}

function specificationPolicyLabel(policy) {
  return ({ MANDATORY: 'Mandatory — exact match', EQUIVALENT_ALLOWED: 'Equivalent allowed', PREFERRED: 'Preferred' })[policy] ?? 'Equivalent allowed';
}

function formatFileSize(size) {
  if (!size) return 'Unknown size';
  return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}

async function downloadProvidedDocument(document) {
  if (!document?.uuid || downloadingDocument.value) return;

  downloadingDocument.value = document.uuid;
  const result = await publicTenders.getSupplierOpportunityDocument(route.params.uuid, document.uuid);
  downloadingDocument.value = null;

  const url = result.data?.data?.url;
  if (result.ok && url) {
    window.open(url, '_blank', 'noopener');
    return;
  }

  toast.error({
    title: 'Could not download document',
    message: result.error ?? 'The tender document could not be retrieved.',
    position: 'topRight',
    layout: 2,
  });
}

async function captureGuarantee(event) {
  try {
    response.bid_security.guarantee = await captureFile(event.target.files?.[0]);
  } catch (exception) {
    toast.error({
      title: 'Guarantee not accepted',
      message: exception.message,
      position: 'topRight',
      layout: 2,
    });
  }
}

async function loadTenderFees() {
  if (!route.params.uuid || !hasTenderFees.value) return;
  feesLoading.value = true;
  feesError.value = '';
  const [invoicesResult, optionsResult] = await Promise.all([
    api.getTenderFeeInvoices(route.params.uuid),
    api.getTenderFeeOptions(route.params.uuid),
  ]);
  if (invoicesResult.ok) feeInvoices.value = invoicesResult.data?.invoices ?? [];
  else feesError.value = invoicesResult.error;
  if (optionsResult.ok) {
    feeOptions.value = optionsResult.data;
    selectedFeeCurrencyId.value ??= optionsResult.data?.default_currency?.id ?? null;
  } else if (!feesError.value) {
    feesError.value = optionsResult.error;
  }
  feesLoading.value = false;
}

async function generateBidSecurityFees() {
  feesLoading.value = true;
  feesError.value = '';
  const result = await api.generateBidSecurityInvoices(route.params.uuid, selectedFeeCurrencyId.value);
  feesLoading.value = false;
  if (!result.ok) {
    feesError.value = result.error;
    return;
  }
  toast.success({
    title: 'Tender-fee invoices generated',
    message: 'The required bid-security invoices are ready for settlement.',
    position: 'topRight',
    layout: 2,
  });
  await loadTenderFees();
}

async function generateAdministrationFee() {
  feesLoading.value = true;
  feesError.value = '';
  const result = await api.generateAdministrationFeeInvoice(route.params.uuid, selectedFeeCurrencyId.value);
  feesLoading.value = false;
  if (!result.ok) {
    feesError.value = result.error;
    return;
  }
  toast.success({
    title: 'Administration-fee invoice generated',
    message: 'The tender administration fee is ready for settlement.',
    position: 'topRight',
    layout: 2,
  });
  await loadTenderFees();
}

async function setupPortalSigningKey() {
  busy.value = true;
  try {
    await setSubmissionKeyOnBrowser(availableSigningKey.value, masterKey.value);
    const refreshed = await api.getSubmissionKeys();
    submissionKeys.value = refreshed.data?.keys ?? [];
    toast.success({
      title: 'Portal signing key ready',
      message: 'Your signing key is secured in the Bid Vault and is ready to sign this response.',
      position: 'topRight',
      layout: 2,
    });
  } catch (exception) {
    toast.error({
      title: 'Could not prepare signing key',
      message: exception.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    busy.value = false;
  }
}

async function sealAndSubmit() {
  submitting.value = true;
  saveError.value = '';
  try {
    if (!validateLotSelection()) return;
    if (!validateSpecificationCompliance()) return;
    if (envelopeMode.value !== 'TECHNICAL_ONLY' && !validateProductPricing()) return;
    if (!await saveEncryptedDraft()) return;
    const [sealingResult, materialResult] = await Promise.all([
      api.getSealingKey(route.params.uuid),
      api.getSigningMaterial(portalSigningKey.value.uuid),
    ]);
    if (!sealingResult.ok) throw new Error(sealingResult.error);
    if (!materialResult.ok) throw new Error(materialResult.error);

    const publicKey = sealingResult.data;
    const complete = serialisableResponse();
    const selectedIds = [...complete.selected_lot_ids].map(Number).sort((left, right) => left - right);
    const selectedProductIdList = [...complete.selected_product_ids].map(Number).sort((left, right) => left - right);
    const requirementDocumentReferences = Object.entries(complete.documents ?? {})
      .filter(([, document]) => document?.media_uuid)
      .map(([requirementUuid, document]) => ({ requirement_uuid: requirementUuid.toLowerCase(), media_uuid: document.media_uuid.toLowerCase() }));
    const alternativeDocumentReferences = selectedLotItems.value.flatMap(item => selectedProductsForItem(item).flatMap(product => (product.specifications ?? [])
      .map(specification => ({ specification, response: complete.specification_compliance?.[item.id]?.[specification.id] }))
      .filter(({ specification, response }) => specification.uuid && response?.supporting_document?.media_uuid)
      .map(({ specification, response }) => ({ requirement_uuid: specification.uuid.toLowerCase(), media_uuid: response.supporting_document.media_uuid.toLowerCase() }))));
    const technicalQuestionDocumentReferences = selectedTechnicalQuestions.value
      .filter(question => question.response_type === 'UPLOAD' && question.uuid && complete.technical?.[question.id]?.file?.media_uuid)
      .map(question => ({
        requirement_uuid: question.uuid.toLowerCase(),
        media_uuid: complete.technical[question.id].file.media_uuid.toLowerCase(),
      }));
    const documentReferences = [...requirementDocumentReferences, ...alternativeDocumentReferences, ...technicalQuestionDocumentReferences]
      .sort((left, right) => left.requirement_uuid.localeCompare(right.requirement_uuid));
    complete.selected_lot_ids = selectedIds;
    complete.selected_product_ids = selectedProductIdList;
    complete.technical = Object.fromEntries(
      selectedTechnicalQuestions.value.map((question) => [question.id, complete.technical[question.id]]),
    );
    complete.pricing = envelopeMode.value === 'TECHNICAL_ONLY'
      ? {}
      : Object.fromEntries(
          selectedLotItems.value.map((item) => [item.id, {
            ...complete.pricing[item.id],
            products: Object.fromEntries(selectedProductsForItem(item).map(product => [product.id, complete.pricing[item.id].products[product.id]])),
          }]),
        );
    complete.specification_compliance = Object.fromEntries(selectedLotItems.value.map(item => [
      item.id,
      Object.fromEntries(selectedProductsForItem(item).flatMap(product => (product.specifications ?? []).map(specification => [
        specification.id,
        complete.specification_compliance?.[item.id]?.[specification.id],
      ]))),
    ]));
    const technicalPayload = envelopeMode.value !== 'SINGLE'
      ? { selected_lot_ids: selectedIds, selected_product_ids: selectedProductIdList, eligibility: complete.eligibility, technical: complete.technical, specification_compliance: complete.specification_compliance, documents: complete.documents, documentAcknowledgements: complete.documentAcknowledgements, bid_security: complete.bid_security }
      : complete;
    const financialPayload = envelopeMode.value === 'TWO'
      ? { selected_lot_ids: selectedIds, selected_product_ids: selectedProductIdList, pricing: complete.pricing, charges_vat: complete.charges_vat, vat_percentage: complete.vat_percentage }
      : null;

    const technical = await cryptoTools.encryptEnvelope(technicalPayload);
    const financial = financialPayload ? await cryptoTools.encryptEnvelope(financialPayload) : null;
    const technicalHash = await cryptoTools.sha256(technical.ciphertext);
    const financialHash = financial ? await cryptoTools.sha256(financial.ciphertext) : null;
    const manifestHash = await cryptoTools.sha256(new TextEncoder().encode(JSON.stringify({
      schema_version: 1,
      tender_uuid: route.params.uuid,
      technical_sha256: technicalHash,
      financial_sha256: financialHash,
      selected_lot_ids: selectedIds,
      selected_product_ids: selectedProductIdList,
      document_references: documentReferences,
      artifacts: [],
    })));
    const clientSubmissionId = await cryptoTools.randomUuid();
    const signingMessage = JSON.stringify({
      client_submission_id: clientSubmissionId,
      tender_uuid: route.params.uuid,
      key_uuid: portalSigningKey.value.uuid,
      pe_key_uuid: publicKey.key_uuid,
      envelope_mode: envelopeMode.value,
      selected_lot_ids: selectedIds,
      selected_product_ids: selectedProductIdList,
      document_references: documentReferences,
      manifest_sha256: manifestHash,
      technical_sha256: technicalHash,
      financial_sha256: financialHash,
      bid_security_method: response.bid_security.method || null,
    });
    const privateKey = await cryptoTools.unlockSigningKey(materialResult.data.encrypted_private_key_envelope, masterKey.value);
    const signed = await cryptoTools.signMessage(signingMessage, privateKey);

    const result = await api.submitBid(route.params.uuid, {
      client_submission_id: clientSubmissionId,
      tender_uuid: route.params.uuid,
      key_uuid: portalSigningKey.value.uuid,
      pe_key_uuid: publicKey.key_uuid,
      envelope_mode: envelopeMode.value,
      selected_lot_ids: selectedIds,
      selected_product_ids: selectedProductIdList,
      document_references: documentReferences,
      technical_ciphertext: technical.ciphertext,
      technical_nonce: technical.nonce,
      technical_sealed_key: await cryptoTools.sealEnvelopeKey(technical.key, publicKey.public_key),
      financial_ciphertext: financial?.ciphertext ?? null,
      financial_nonce: financial?.nonce ?? null,
      financial_sealed_key: financial ? await cryptoTools.sealEnvelopeKey(financial.key, publicKey.public_key) : null,
      manifest_sha256: manifestHash,
      signed_message: signed.signedMessage,
      signature: signed.signature,
    });
    if (!result.ok) throw new Error(result.error);
    receipt.value = result.data;
    bidRecord.value = {
      ...(bidRecord.value ?? {}),
      status: 'SUBMITTED',
      submitted_at: result.data?.submitted_at ?? new Date().toISOString(),
      versions: [
        ...(bidRecord.value?.versions ?? []),
        { uuid: result.data?.version_uuid, submitted_at: result.data?.submitted_at },
      ],
    };
  } catch (exception) {
    saveError.value = exception.message;
  } finally {
    submitting.value = false;
  }
}

function downloadRecoveryCode() {
  const blob = new Blob([`EGP Bid Vault recovery code\n\n${recoveryCode.value}\n`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'egp-bid-vault-recovery.txt';
  link.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(value) {
  return value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatQuantity(value) {
  return new Intl.NumberFormat('en-ZW', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatDocumentSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function providedDocumentIcon(document) {
  const type = String(document?.mime_type ?? '').toLowerCase();
  const name = String(document?.file_name ?? document?.name ?? '').toLowerCase();
  if (type.includes('spreadsheet') || type.includes('excel') || /\.(xlsx?|csv)$/.test(name)) return 'lucide:file-spreadsheet';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'lucide:file-text';
  if (type.includes('word') || /\.docx?$/.test(name)) return 'lucide:file-type-2';
  if (type.startsWith('image/')) return 'lucide:file-image';
  return 'lucide:file-down';
}

function providedDocumentType(document) {
  const type = String(document?.mime_type ?? '').toLowerCase();
  const name = String(document?.file_name ?? '').toLowerCase();
  if (type.includes('spreadsheetml') || name.endsWith('.xlsx')) return 'Excel workbook';
  if (type.includes('ms-excel') || name.endsWith('.xls')) return 'Excel workbook';
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (type.includes('word') || /\.docx?$/.test(name)) return 'Word document';
  if (type.startsWith('image/')) return 'Image';
  return 'Document';
}

function feeStatusLabel(fee) {
  if (!fee.invoice) return 'Invoice required';
  return ({ PAID: 'Settled', AWAITING: 'Awaiting verification', PENDING: 'Payment required' })[fee.invoice.status] ?? fee.invoice.status;
}

function feeStatusClass(fee) {
  return ({
    PAID: 'badge-success',
    AWAITING: 'badge-info',
    PENDING: 'badge-warning',
  })[fee.invoice?.status] ?? 'badge-ghost';
}
</script>
