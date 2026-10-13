<template>
  <div class="mx-auto max-w-7xl space-y-5 px-4 py-5">
    <!-- ── Loading ─────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="space-y-4 py-8">
      <div class="skeleton h-8 w-44" />
      <div class="skeleton h-48 w-full" />
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="skeleton h-80 lg:col-span-2" />
        <div class="skeleton h-64" />
      </div>
    </div>

    <!-- ── Not found ───────────────────────────────────────────────────────── -->
    <div v-else-if="!tender" class="rounded-xl border border-base-200 bg-base-100 py-20 text-center">
      <Icon name="lucide:file-x" class="mx-auto h-12 w-12 text-base-content/30" />
      <h1 class="mt-4 text-2xl font-bold">Tender not available</h1>
      <p class="mt-2 text-base-content/60">
        {{ error ?? 'This tender is no longer published or the link is invalid.' }}
      </p>
      <NuxtLink to="/" class="btn btn-success btn-sm mt-5">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to all tenders
      </NuxtLink>
    </div>

    <!-- ── Consultancy EOI detail ─────────────────────────────────────────── -->
    <template v-else-if="isConsultancyEoi">
      <section class="overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-sm">
        <div class="p-6 lg:p-8">
          <NuxtLink to="/tenders" class="inline-flex items-center gap-1 text-sm text-amber-100 hover:text-white"><Icon name="lucide:arrow-left" class="h-4 w-4" />All opportunities</NuxtLink>
          <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-xs"><span class="badge border-0 bg-white/20 text-white">Expression of Interest</span><span class="font-mono text-amber-100">{{ tender.reference_number }}</span><span class="badge border-0 bg-white/15 text-white">{{ daysLeft(tender.closing_at) }}</span></div>
              <h1 class="mt-3 text-2xl font-extrabold leading-tight lg:text-3xl">{{ tender.title }}</h1>
              <p class="mt-3 flex items-center gap-2 text-sm text-amber-100"><Icon name="lucide:building-2" class="h-4 w-4" />{{ tender.entity ?? 'Procuring entity' }}</p>
            </div>
            <NuxtLink v-if="user" :to="`/expressions-of-interest/${uuid}`" class="btn btn-sm bg-white text-amber-800 hover:bg-amber-50"><Icon name="lucide:file-pen-line" class="h-4 w-4" />View and respond</NuxtLink>
            <NuxtLink v-else :to="`/login?redirect=${encodeURIComponent(`/expressions-of-interest/${uuid}`)}`" class="btn btn-sm bg-white text-amber-800 hover:bg-amber-50"><Icon name="lucide:log-in" class="h-4 w-4" />Sign in to respond</NuxtLink>
          </div>
          <div class="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-amber-100">Closing</p><p class="mt-1 font-semibold">{{ formatDateTime(tender.closing_at) }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-amber-100">Clarifications close</p><p class="mt-1 font-semibold">{{ formatDateTime(tender.clarification_deadline) || 'Not specified' }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-amber-100">Selection method</p><p class="mt-1 font-semibold">{{ tender.selection_method || 'Not specified' }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-amber-100">Participation</p><p class="mt-1 font-semibold">{{ tender.participation_scope === 'DOMESTIC' ? 'Zimbabwean firms only' : 'International' }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-amber-100">Published addenda</p><p class="mt-1 font-semibold">{{ tender.addenda?.length ?? 0 }}</p></div>
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-3">
        <main class="space-y-5 xl:col-span-2">
          <ConsultancyEoiAddenda :eoi-uuid="uuid" :addenda="tender.addenda ?? []" />
          <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm"><div class="flex items-center gap-2"><Icon name="lucide:align-left" class="h-5 w-5 text-amber-600" /><h2 class="text-lg font-bold">Assignment summary</h2></div><p class="mt-3 whitespace-pre-line text-sm leading-6 text-base-content/75">{{ tender.summary || 'No assignment summary was provided.' }}</p></section>
          <section v-if="tender.background" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm"><h2 class="text-lg font-bold">Background</h2><p class="mt-3 whitespace-pre-line text-sm leading-6 text-base-content/75">{{ tender.background }}</p></section>
          <section v-if="tender.scope_snapshot?.length" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <div class="flex items-center gap-2"><Icon name="lucide:list-checks" class="h-5 w-5 text-amber-600" /><h2 class="text-lg font-bold">Terms of Reference and scope of services</h2></div>
            <div class="mt-4 space-y-4">
              <article v-for="(scope, index) in tender.scope_snapshot" :key="scope.item_id || index" class="space-y-4 rounded-xl border border-base-200 p-4">
                <div class="flex items-center gap-2"><span class="badge badge-ghost">{{ index + 1 }}</span><h3 class="font-semibold">{{ scope.item_description || 'Consultancy assignment' }}</h3></div>
                <div v-if="scope.background" class="rounded-lg bg-base-200/40 p-3"><p class="text-xs font-semibold uppercase text-base-content/50">Background</p><p class="mt-1 whitespace-pre-line text-sm leading-6">{{ scope.background }}</p></div>
                <div v-if="scope.objective"><p class="text-xs font-semibold uppercase text-base-content/50">Objective</p><p class="mt-1 whitespace-pre-line text-sm leading-6">{{ scope.objective }}</p></div>
                <div><p class="text-xs font-semibold uppercase text-base-content/50">Scope of services</p><p class="mt-1 whitespace-pre-line text-sm leading-6 text-base-content/75">{{ scope.scope_of_services || 'No separate scope statement was provided.' }}</p></div>
                <div class="grid gap-4 lg:grid-cols-2">
                  <div v-if="scope.tasks?.length"><p class="text-xs font-semibold uppercase text-base-content/50">Required tasks</p><ol class="mt-2 space-y-2"><li v-for="(task, taskIndex) in scope.tasks" :key="task.sequence || taskIndex" class="rounded-lg border border-base-200 p-3 text-sm"><p class="font-semibold">{{ taskIndex + 1 }}. {{ task.title }}</p><p class="mt-1 text-base-content/65">{{ task.description }}</p><p v-if="task.required_response" class="mt-2 text-xs"><strong>Required response:</strong> {{ task.required_response }}</p></li></ol></div>
                  <div v-if="scope.deliverables?.length"><p class="text-xs font-semibold uppercase text-base-content/50">Expected deliverables</p><ol class="mt-2 space-y-2"><li v-for="(deliverable, deliverableIndex) in scope.deliverables" :key="deliverable.sequence || deliverableIndex" class="rounded-lg border border-base-200 p-3 text-sm"><p class="font-semibold">{{ deliverableIndex + 1 }}. {{ deliverable.title }}</p><p class="mt-1 text-base-content/65">{{ deliverable.description }}</p><dl class="mt-2 grid gap-1 text-xs"><div><dt class="inline font-semibold">Due:</dt> <dd class="inline">{{ deliverable.due_point || 'Not specified' }}</dd></div><div><dt class="inline font-semibold">Acceptance:</dt> <dd class="inline">{{ deliverable.acceptance_criteria || 'Not specified' }}</dd></div><div v-if="deliverable.reviewer"><dt class="inline font-semibold">Reviewer:</dt> <dd class="inline">{{ deliverable.reviewer }}</dd></div></dl></li></ol></div>
                </div>
              </article>
            </div>
          </section>
          <section v-if="tender.eligibility_requirements" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm"><h2 class="text-lg font-bold">Eligibility requirements</h2><p class="mt-3 whitespace-pre-line text-sm leading-6 text-base-content/75">{{ tender.eligibility_requirements }}</p></section>
          <section v-if="tender.criteria?.length" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <div class="flex items-center gap-2"><Icon name="lucide:clipboard-check" class="h-5 w-5 text-amber-600" /><h2 class="text-lg font-bold">Shortlisting criteria</h2></div>
            <ol class="mt-4 grid gap-3 lg:grid-cols-2"><li v-for="(criterion, index) in tender.criteria" :key="criterion.uuid || index" class="rounded-xl border border-base-200 p-4"><div class="flex flex-wrap items-center gap-2"><span class="badge badge-ghost">{{ index + 1 }}</span><h3 class="font-semibold">{{ criterion.title }}</h3><span v-if="criterion.mandatory" class="badge badge-error badge-sm">Mandatory</span></div><p v-if="criterion.description" class="mt-2 text-sm text-base-content/65">{{ criterion.description }}</p><div class="mt-3 flex flex-wrap gap-1"><span class="badge badge-outline badge-sm">{{ criterion.evaluation_method === 'SCORED' ? `Scored: ${criterion.max_score ?? 0} points` : 'Pass / fail' }}</span><span v-if="criterion.minimum_years" class="badge badge-outline badge-sm">Minimum {{ criterion.minimum_years }} years</span><span v-if="criterion.minimum_assignments" class="badge badge-outline badge-sm">Minimum {{ criterion.minimum_assignments }} assignments</span></div><div v-if="criterion.evaluation_method === 'SCORED'" class="mt-3 rounded-lg bg-info/10 p-3 text-sm"><ul v-if="criterion.scoring_bands?.length" class="space-y-1"><li v-for="band in criterion.scoring_bands" :key="band.uuid" class="flex justify-between gap-3"><span>{{ band.label }}</span><strong>{{ band.score }}</strong></li></ul><template v-else><p><strong>Minimum qualifying score:</strong> {{ criterion.minimum_score }} / {{ criterion.max_score }}</p><p class="mt-1 whitespace-pre-line"><strong>Scoring rubric:</strong> {{ criterion.scoring_rubric }}</p></template></div><div v-if="criterion.evidence_required" class="mt-3 rounded-lg bg-base-200/50 p-2 text-xs"><strong>Evidence required:</strong> {{ criterion.evidence_label || 'Supporting evidence must be attached.' }}</div></li></ol>
          </section>
        </main>

        <aside class="space-y-5">
          <div class="card border border-base-200 bg-base-100 shadow-sm"><div class="card-body gap-0 p-5"><h3 class="mb-3 text-sm font-bold uppercase tracking-wide text-base-content/60">Key details</h3><dl class="divide-y divide-base-200 text-sm"><DetailRow label="Published" :value="formatDateTime(tender.published_at)" /><DetailRow label="Clarification deadline" :value="formatDateTime(tender.clarification_deadline)" /><DetailRow label="Closing" :value="formatDateTime(tender.closing_at)" highlight /><DetailRow label="Selection method" :value="tender.selection_method" /><DetailRow label="Submission channel" :value="tender.submission_channel" /><DetailRow label="Joint ventures" :value="tender.allow_joint_ventures ? 'Permitted' : 'Not permitted'" /><DetailRow label="Sub-consultants" :value="tender.allow_subconsultants ? 'Permitted' : 'Not permitted'" /><DetailRow label="SPOC/PRAZ fee" :value="tender.spoc_fee_required ? `${tender.spoc_fee_currency || ''} ${tender.spoc_fee_amount ?? ''}`.trim() : 'Not required'" /><DetailRow label="Published addenda" :value="String(tender.addenda?.length ?? 0)" /></dl></div></div>
          <div v-if="tender.contact_person || tender.contact_email || tender.contact_phone || tender.contact_address || tender.contact_website" class="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm"><h3 class="font-bold">Contact information</h3><div class="mt-3 space-y-2 text-sm text-base-content/70"><p v-if="tender.contact_person" class="font-medium">{{ tender.contact_person }}</p><p v-if="tender.contact_address"><Icon name="lucide:map-pin" class="mr-2 inline h-4 w-4" />{{ tender.contact_address }}</p><p v-if="tender.contact_email"><Icon name="lucide:mail" class="mr-2 inline h-4 w-4" /><a :href="`mailto:${tender.contact_email}`" class="link link-hover">{{ tender.contact_email }}</a></p><p v-if="tender.contact_phone"><Icon name="lucide:phone" class="mr-2 inline h-4 w-4" />{{ tender.contact_phone }}</p><p v-if="tender.contact_website"><Icon name="lucide:globe" class="mr-2 inline h-4 w-4" /><a :href="tender.contact_website" target="_blank" rel="noopener noreferrer" class="link link-hover">{{ tender.contact_website }}</a></p></div></div>
          <div v-if="tender.legal_basis" class="rounded-xl border border-base-200 bg-base-100 p-5 text-sm shadow-sm"><h3 class="font-bold">Legal basis</h3><p class="mt-2 whitespace-pre-line text-base-content/65">{{ tender.legal_basis }}</p></div>
          <div class="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm"><p class="font-semibold text-amber-900">Want to respond to this EOI?</p><p class="mt-1 text-amber-800">Sign in to settle the required fee and submit your expression of interest.</p><NuxtLink v-if="user" :to="`/expressions-of-interest/${uuid}`" class="btn btn-warning btn-sm mt-3 w-full">View and respond</NuxtLink><NuxtLink v-else :to="`/login?redirect=${encodeURIComponent(`/expressions-of-interest/${uuid}`)}`" class="btn btn-warning btn-sm mt-3 w-full">Sign in to respond</NuxtLink></div>
        </aside>
      </div>
    </template>

    <!-- ── Tender detail ──────────────────────────────────────────────────── -->
    <template v-else>
      <section class="overflow-hidden rounded-2xl bg-gradient-to-r from-green-800 to-green-600 text-white shadow-sm">
        <div class="p-6 lg:p-8">
          <NuxtLink to="/" class="inline-flex items-center gap-1 text-sm text-green-100 hover:text-white">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            All tenders
          </NuxtLink>

          <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="badge border-0 bg-white/20 text-white">{{ daysLeft(tender.closing_at) }}</span>
                <span class="font-mono text-green-100">{{ tender.reference }}</span>
                <span v-if="tender.method" class="badge border-0 bg-white/15 text-white">{{ tender.method }}</span>
              </div>
              <h1 class="mt-3 text-2xl font-extrabold leading-tight lg:text-3xl">{{ tender.title }}</h1>
              <p class="mt-3 flex items-center gap-2 text-sm text-green-100"><Icon name="lucide:building-2" class="h-4 w-4" />{{ tender.entity ?? 'Procuring entity' }}</p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <button v-if="tender.sbd_available" class="btn btn-sm border-white/30 bg-white/10 text-white hover:bg-white/20" :disabled="downloadingSbd" @click="downloadSbd"><span v-if="downloadingSbd" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:file-down" class="h-4 w-4" /> Download document</button>
              <NuxtLink :to="`/login?redirect=${encodeURIComponent(`/supplieropportunities/${uuid}`)}`" class="btn btn-sm bg-white text-green-800 hover:bg-green-50"><Icon name="lucide:log-in" class="h-4 w-4" /> Sign in to bid</NuxtLink>
            </div>
          </div>

          <div class="mt-6 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-green-100">Closing</p><p class="mt-1 font-semibold">{{ formatDateTime(tender.closing_at) }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-green-100">Bid opening</p><p class="mt-1 font-semibold">{{ formatDateTime(tender.opening_at) }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-green-100">Lots</p><p class="mt-1 font-semibold">{{ tender.items?.length || 0 }}</p></div>
            <div class="rounded-xl bg-black/10 p-3"><p class="text-xs text-green-100">Time remaining</p><p class="mt-1 font-semibold">{{ daysLeft(tender.closing_at) }}</p></div>
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-3">
          <!-- Main column -->
          <main class="space-y-5 xl:col-span-2">
            <!-- Addenda / amendments -->
            <section v-if="tender.addenda?.length" class="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <div class="mb-3 flex items-center gap-2">
                <Icon name="lucide:megaphone" class="h-5 w-5 text-amber-600" />
                <h2 class="text-lg font-bold text-amber-900">Addenda &amp; Amendments ({{ tender.addenda.length }})</h2>
              </div>
              <p class="mb-4 text-sm text-amber-800/80">
                This tender has been amended. Review all addenda below before submitting your bid — they form part of the tender.
              </p>
              <ol class="space-y-3">
                <li
                  v-for="addendum in tender.addenda"
                  :key="addendum.uuid"
                  class="rounded-xl border border-amber-200 bg-base-100 p-4"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="badge badge-warning badge-sm font-semibold">Addendum #{{ addendum.number }}</span>
                      <span class="font-semibold">{{ addendum.title }}</span>
                    </div>
                    <span v-if="addendum.issued_at" class="text-xs text-base-content/50">
                      {{ formatDate(addendum.issued_at) }}
                    </span>
                  </div>
                  <p class="mt-2 whitespace-pre-line text-sm text-base-content/80">{{ addendum.description }}</p>

                  <div v-if="addendum.changes_dates || addendum.amended?.length" class="mt-2 flex flex-wrap gap-2 text-xs">
                    <span v-if="addendum.new_closing_at" class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                      <Icon name="lucide:calendar-clock" class="h-3.5 w-3.5" />
                      New closing: {{ formatDateTime(addendum.new_closing_at) }}
                    </span>
                    <span v-if="addendum.new_opening_at" class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                      <Icon name="lucide:calendar" class="h-3.5 w-3.5" />
                      New opening: {{ formatDateTime(addendum.new_opening_at) }}
                    </span>
                    <span
                      v-for="key in (addendum.amended ?? [])"
                      :key="key"
                      class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-amber-800"
                    >
                      <Icon name="lucide:file-pen-line" class="h-3.5 w-3.5" />
                      Revised {{ amendedLabel(key) }}
                    </span>
                  </div>

                  <div v-if="addendum.has_attachment" class="mt-3">
                    <button
                      class="btn btn-outline btn-xs"
                      :disabled="downloadingAddendum === addendum.uuid"
                      @click="downloadAddendum(addendum.uuid)"
                    >
                      <span v-if="downloadingAddendum === addendum.uuid" class="loading loading-spinner loading-xs" />
                      <Icon v-else name="lucide:paperclip" class="h-3.5 w-3.5" />
                      Download attachment
                    </button>
                  </div>
                </li>
              </ol>
            </section>

            <TenderClarificationsPanel :tender-uuid="uuid" />

            <!-- Description -->
            <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
              <div class="flex items-center gap-2"><Icon name="lucide:align-left" class="h-5 w-5 text-green-600" /><h2 class="text-lg font-bold">Tender overview</h2></div>
              <p class="mt-3 whitespace-pre-line text-sm leading-6 text-base-content/75">{{ tender.description || 'No tender description was provided.' }}</p>
            </section>

            <!-- Line items -->
            <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2"><Icon name="lucide:boxes" class="h-5 w-5 text-green-600" /><h2 class="text-lg font-bold">Lots, products and specifications</h2></div>
                <span class="badge badge-ghost">{{ tender.items?.length || 0 }} {{ tender.items?.length === 1 ? 'lot' : 'lots' }}</span>
              </div>
              <div v-if="tender.items?.length" class="mt-4 space-y-4">
                <article v-for="(lot, index) in tender.items" :key="lot.id || index" class="overflow-hidden rounded-xl border border-base-200">
                  <header class="flex flex-col gap-2 bg-base-200/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p class="text-xs font-semibold uppercase tracking-wide text-green-700">Lot {{ lot.lot_number || index + 1 }}</p><h3 class="font-semibold">{{ lot.description }}</h3></div>
                    <span class="badge badge-outline whitespace-nowrap">Quantity {{ formatQuantity(lot.quantity) }}</span>
                  </header>
                  <div v-if="lot.products?.length" class="divide-y divide-base-200">
                    <div v-for="(product, productIndex) in lot.products" :key="product.id || productIndex" class="p-4">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div class="flex min-w-0 items-start gap-2"><Icon name="lucide:package" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" /><div><h4 class="text-sm font-semibold">{{ product.description }}</h4><p class="mt-0.5 text-xs text-base-content/50">Product requirement</p></div></div>
                        <span class="text-sm font-medium">Qty {{ formatQuantity(product.quantity) }}</span>
                      </div>
                      <div v-if="product.specifications?.length" class="mt-3 overflow-x-auto rounded-lg border border-base-200">
                        <table class="table table-sm w-full"><thead><tr class="text-xs text-base-content/50"><th>Specification</th><th>Required value</th><th>Acceptance</th></tr></thead><tbody><tr v-for="(specification, specificationIndex) in product.specifications" :key="specification.uuid || specification.id || specificationIndex"><td class="font-medium">{{ specification.label }}</td><td class="whitespace-pre-line">{{ specification.value || '—' }}</td><td><span class="badge badge-ghost badge-sm">{{ acceptanceLabel(specification.acceptance_policy) }}</span></td></tr></tbody></table>
                      </div>
                      <p v-else class="mt-3 text-xs text-base-content/45">No separate specifications were published for this product.</p>
                    </div>
                  </div>
                  <p v-else class="p-4 text-sm text-base-content/50">This lot does not contain separate product lines.</p>
                </article>
              </div>
              <p v-else class="mt-4 rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50">No lots have been published.</p>
            </section>

            <!-- Eligible supplier categories -->
            <section v-if="tender.required_categories?.length">
              <h2 class="mb-3 text-lg font-bold">Eligible Supplier Categories</h2>
              <p class="mb-3 text-sm text-base-content/60">
                Only suppliers registered in the following categories are eligible to bid for this tender.
              </p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(cat, i) in tender.required_categories"
                  :key="i"
                  class="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm"
                >
                  <Icon name="lucide:badge-check" class="h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    <span class="font-medium text-green-800">{{ cat.name }}</span>
                    <span v-if="cat.code" class="ml-1 font-mono text-xs text-green-600/70">{{ cat.code }}</span>
                  </span>
                </span>
              </div>
            </section>

            <!-- Required documents -->
            <section v-if="tender.document_requirements?.length">
              <h2 class="mb-3 text-lg font-bold">Required Bid Documents</h2>
              <ul class="space-y-2">
                <li
                  v-for="(doc, i) in tender.document_requirements"
                  :key="i"
                  class="flex items-start gap-3 rounded-lg border border-base-200 bg-base-100 p-3"
                >
                  <Icon name="lucide:file-text" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p class="text-sm font-medium">{{ doc.name }}</p>
                    <p v-if="doc.description" class="text-xs text-base-content/60">{{ doc.description }}</p>
                  </div>
                </li>
              </ul>
            </section>

            <!-- Eligibility -->
            <section v-if="tender.eligibility_questions?.length">
              <h2 class="mb-3 text-lg font-bold">Eligibility Requirements</h2>
              <ul class="space-y-2">
                <li
                  v-for="(q, i) in tender.eligibility_questions"
                  :key="i"
                  class="flex items-start gap-3 rounded-lg border border-base-200 bg-base-100 p-3 text-sm"
                >
                  <Icon name="lucide:circle-check" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {{ q.question }}
                </li>
              </ul>
            </section>

            <!-- Technical eligibility -->
            <section v-if="tender.technical_eligibility_questions?.length">
              <h2 class="mb-3 text-lg font-bold">Technical Eligibility</h2>
              <ul class="space-y-2">
                <li
                  v-for="(q, i) in tender.technical_eligibility_questions"
                  :key="i"
                  class="flex items-start gap-3 rounded-lg border border-base-200 bg-base-100 p-3 text-sm"
                >
                  <Icon name="lucide:wrench" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <span v-if="q.lot_number" class="badge badge-primary badge-sm mb-1">
                      Lot {{ q.lot_number }}
                    </span>
                    <p>{{ q.question }}</p>
                  </div>
                </li>
              </ul>
            </section>
          </main>

          <!-- Sidebar: key details -->
          <aside class="space-y-5">
            <div class="card border border-base-200 bg-base-100 shadow-sm">
              <div class="card-body gap-0 p-5">
                <h3 class="mb-3 text-sm font-bold uppercase tracking-wide text-base-content/60">Key Details</h3>
                <dl class="divide-y divide-base-200 text-sm">
                  <DetailRow label="Procurement method" :value="tender.method" />
                  <DetailRow label="Procurement category" :value="tender.category" />
                  <DetailRow label="Participation" :value="tender.allowed_participants" />
                  <DetailRow label="Bid opening" :value="tender.bid_opening_type" />
                  <DetailRow label="Published" :value="formatDate(tender.publication_start_date)" />
                  <DetailRow label="Closing" :value="formatDateTime(tender.closing_at)" highlight />
                  <DetailRow label="Bid opening date" :value="formatDateTime(tender.opening_at)" />
                  <DetailRow
                    label="Bid bond required"
                    :value="tender.required_bid_bond ? 'Yes' : 'No'"
                  />
                  <DetailRow
                    v-if="tender.required_bid_bond && tender.bid_validity_period"
                    label="Bid validity"
                    :value="`${tender.bid_validity_period} days`"
                  />
                  <DetailRow
                    v-if="tender.require_prequalification"
                    label="Prequalification"
                    :value="formatDateTime(tender.prequalification_at) ?? 'Required'"
                  />
                  <DetailRow
                    v-if="tender.prequalification_venue"
                    label="Prequal. venue"
                    :value="tender.prequalification_venue"
                  />
                </dl>
              </div>
            </div>

            <div class="rounded-xl border border-green-200 bg-green-50 p-5 text-sm">
              <p class="font-semibold text-green-800">Want to respond to this tender?</p>
              <p class="mt-1 text-green-700">Register or sign in to download documents and submit a bid.</p>
              <NuxtLink to="/register" class="btn btn-sm btn-success mt-3 w-full">
                <Icon name="lucide:user-plus" class="h-4 w-4" />
                Register as Supplier
              </NuxtLink>
            </div>
          </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  sanctum: { excluded: true },
})

const route = useRoute()
const toast = useToast()
const { user } = useSanctumAuth()
const {
  getTenderDetail,
  getSbdDownloadUrl,
  getAddendumAttachmentUrl,
  getSupplierOpportunity,
  getSupplierOpportunitySbd,
  getSupplierOpportunityAddendum,
} = usePublicTenderHelper()

const uuid = computed(() => route.params.uuid)

const tender = ref(null)
const loading = ref(true)
const error = ref(null)
const downloadingSbd = ref(false)
const downloadingAddendum = ref(null)
const isConsultancyEoi = computed(() => tender.value?.opportunity_type === 'EXPRESSION_OF_INTEREST')

async function loadTender() {
  loading.value = true
  error.value = null
  let res = user.value
    ? await getSupplierOpportunity(uuid.value)
    : await getTenderDetail(uuid.value)
  if (!res.ok && user.value && res.notFound) res = await getTenderDetail(uuid.value)
  if (res.ok) {
    tender.value = res.data?.data ?? null
  } else {
    tender.value = null
    error.value = res.error
  }
  loading.value = false
}

async function downloadSbd() {
  if (downloadingSbd.value) return
  downloadingSbd.value = true
  const res = user.value
    ? await getSupplierOpportunitySbd(uuid.value)
    : await getSbdDownloadUrl(uuid.value)
  downloadingSbd.value = false

  const url = res.data?.data?.url
  if (res.ok && url) {
    window.open(url, '_blank', 'noopener')
  } else {
    toast.error({
      title: 'Could not download bidding document',
      message: res.error ?? 'The bidding document could not be retrieved.',
      position: 'topRight',
      layout: 2,
    })
  }
}

async function downloadAddendum(addendumUuid) {
  if (downloadingAddendum.value) return
  downloadingAddendum.value = addendumUuid
  const res = user.value
    ? await getSupplierOpportunityAddendum(uuid.value, addendumUuid)
    : await getAddendumAttachmentUrl(uuid.value, addendumUuid)
  downloadingAddendum.value = null

  const url = res.data?.data?.url
  if (res.ok && url) {
    window.open(url, '_blank', 'noopener')
  } else {
    toast.error({
      title: 'Could not download attachment',
      message: res.error ?? 'The attachment could not be retrieved.',
      position: 'topRight',
      layout: 2,
    })
  }
}

onMounted(loadTender)

useHead(() => ({
  title: tender.value ? `${tender.value.title} — Tender` : 'Tender Details',
}))

// ── Helpers ────────────────────────────────────────────────────────────────
function daysLeft(dateStr) {
  if (!dateStr) return 'Open'
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'Closed'
  if (diff === 0) return 'Closes today'
  if (diff === 1) return '1 day left'
  return `${diff} days left`
}

function isClosingSoon(dateStr) {
  if (!dateStr) return false
  const diff = new Date(dateStr).getTime() - Date.now()
  return diff > 0 && diff < 72 * 3600000
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatQuantity(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return new Intl.NumberFormat('en-US').format(num)
}

function acceptanceLabel(value) {
  if (!value) return 'As specified'
  return String(value).replaceAll('_', ' ').toLowerCase().replace(/^./, character => character.toUpperCase())
}

function amendedLabel(key) {
  const map = {
    document_requirements: 'document requirements',
    eligibility_questions: 'eligibility requirements',
    technical_eligibility_questions: 'technical eligibility',
    specifications: 'specifications',
    supplier_categories: 'eligible supplier categories',
  }
  return map[key] ?? key
}
</script>
