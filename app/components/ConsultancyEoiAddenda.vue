<template>
  <section v-if="addenda.length" class="rounded-2xl border border-warning/40 bg-warning/5 p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <Icon name="lucide:file-warning" class="h-5 w-5 text-warning" />
          <h2 class="text-lg font-bold">Published EOI addenda</h2>
          <span class="badge badge-warning badge-sm">{{ addenda.length }}</span>
        </div>
        <p class="mt-1 text-sm text-base-content/60">These amendments form part of the EOI. Review every change before preparing or updating your response.</p>
      </div>
    </div>
    <ol class="mt-4 space-y-4">
      <li v-for="addendum in addenda" :key="addendum.uuid" class="overflow-hidden rounded-xl border border-warning/30 bg-base-100">
        <div class="border-b border-base-200 bg-warning/10 p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-xs font-semibold uppercase text-base-content/45">Addendum {{ addendum.number }}</p>
              <span class="badge badge-outline badge-sm">{{ addendumTypeLabel(addendum.addendum_type) }}</span>
            </div>
            <h3 class="mt-1 font-semibold">{{ addendum.title }}</h3>
          </div>
          <span class="text-xs text-base-content/50">{{ dateTime(addendum.published_at) }}</span>
        </div>
        <p class="mt-2 whitespace-pre-line text-sm text-base-content/70">{{ addendum.description }}</p>
        </div>

        <div class="space-y-4 p-4">
        <div v-if="addendum.new_closing_at" class="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <div class="flex items-center gap-2"><Icon name="lucide:calendar-clock" class="h-4 w-4 text-warning" /><strong>Revised EOI closing</strong></div>
          <p class="mt-1 font-semibold">{{ dateTime(addendum.new_closing_at) }}</p>
        </div>
        <div v-if="changedEligibility(addendum).length" class="mt-3 rounded-md border border-base-200 p-3">
          <p class="text-xs font-semibold uppercase text-base-content/50">Eligibility requirement changes</p>
          <ul class="mt-2 space-y-2">
            <li v-for="change in changedEligibility(addendum)" :key="change.uuid" class="rounded-lg border p-3 text-sm" :class="changeRecordClass(change.status)">
              <span class="badge badge-sm" :class="changeClass(change.status)">{{ change.status }}</span>
              <span class="ml-2 font-medium">{{ change.after?.title ?? change.before?.title }}</span>
              <p class="mt-2 text-base-content/70">{{ (change.after ?? change.before)?.description || 'No description provided.' }}</p>
              <div class="mt-2 flex flex-wrap gap-1 text-xs">
                <span class="badge badge-ghost badge-sm">{{ (change.after ?? change.before)?.evaluation_method === 'SCORED' ? `Scored: ${(change.after ?? change.before)?.max_score ?? 0}` : 'Pass / fail' }}</span>
                <span v-if="(change.after ?? change.before)?.mandatory" class="badge badge-error badge-sm">Mandatory</span>
                <span v-if="(change.after ?? change.before)?.minimum_years" class="badge badge-outline badge-sm">{{ (change.after ?? change.before).minimum_years }} years</span>
                <span v-if="(change.after ?? change.before)?.minimum_assignments" class="badge badge-outline badge-sm">{{ (change.after ?? change.before).minimum_assignments }} assignments</span>
              </div>
              <div v-if="(change.after ?? change.before)?.evaluation_method === 'SCORED'" class="mt-2 rounded-lg bg-info/10 p-2 text-xs"><p><strong>Minimum qualifying score:</strong> {{ (change.after ?? change.before)?.minimum_score }} / {{ (change.after ?? change.before)?.max_score }}</p><p class="mt-1 whitespace-pre-line"><strong>Scoring rubric:</strong> {{ (change.after ?? change.before)?.scoring_rubric }}</p></div>
              <div v-if="change.status === 'MODIFIED'" class="mt-3 rounded-md bg-base-200/50 p-2 text-xs"><strong>Previous:</strong> {{ change.before?.title }} — {{ change.before?.description || 'No description' }}</div>
            </li>
          </ul>
        </div>
        <div v-if="addendum.scope_changes?.length" class="mt-3 rounded-md border border-base-200 p-3">
          <p class="text-xs font-semibold uppercase text-base-content/50">{{ addendum.addendum_type === 'TERMS_OF_REFERENCE_CHANGE' ? 'Revised Terms of Reference' : 'Revised scope' }}</p>
          <div v-for="change in addendum.scope_changes" :key="change.item_id" class="mt-3 space-y-3 rounded-lg border p-3 text-sm" :class="changeRecordClass(change.status)">
            <div class="flex flex-wrap items-center gap-2"><p class="font-semibold">{{ change.item_description || 'Consultancy assignment' }}</p><span class="badge badge-warning badge-sm">{{ change.status }}</span></div>
            <div v-if="addendum.addendum_type === 'TERMS_OF_REFERENCE_CHANGE'" class="grid gap-3 md:grid-cols-2">
              <div class="rounded-md border p-3" :class="fieldClass(change, 'background')"><p class="text-xs font-semibold uppercase text-base-content/50">Background</p><p class="mt-1 whitespace-pre-line">{{ change.after?.background || '—' }}</p></div>
              <div class="rounded-md border p-3" :class="fieldClass(change, 'objective')"><p class="text-xs font-semibold uppercase text-base-content/50">Objective</p><p class="mt-1 whitespace-pre-line">{{ change.after?.objective || '—' }}</p></div>
            </div>
            <div class="rounded-md border p-3" :class="fieldClass(change, 'scope_of_services')"><p class="text-xs font-semibold uppercase text-base-content/50">Scope of services</p><p class="mt-1 whitespace-pre-line">{{ change.after?.scope_of_services || '—' }}</p><p v-if="fieldChanged(change, 'scope_of_services')" class="mt-2 border-t pt-2 text-xs text-base-content/55"><strong>Previous:</strong> {{ change.before?.scope_of_services || '—' }}</p></div>
            <div class="grid gap-3 lg:grid-cols-2">
              <div><p class="text-xs font-semibold uppercase text-base-content/50">Tasks</p><ol class="mt-2 list-decimal space-y-2 pl-5"><li v-for="task in change.after?.tasks ?? []" :key="task.sequence"><strong>{{ task.title }}</strong><p class="text-base-content/65">{{ task.description }}</p></li></ol></div>
              <div><p class="text-xs font-semibold uppercase text-base-content/50">Deliverables</p><ol class="mt-2 list-decimal space-y-2 pl-5"><li v-for="deliverable in change.after?.deliverables ?? []" :key="deliverable.sequence"><strong>{{ deliverable.title }}</strong><p class="text-base-content/65">{{ deliverable.description }}</p><p class="text-xs text-base-content/50">Due: {{ deliverable.due_point }} · Acceptance: {{ deliverable.acceptance_criteria }}</p></li></ol></div>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-base-200 pt-3">
          <p class="text-xs text-base-content/50">Issued {{ dateTime(addendum.published_at) }}</p>
        <button v-if="addendum.has_attachment" type="button" class="btn btn-warning btn-sm" :disabled="downloadingUuid === addendum.uuid" @click="download(addendum)">
          <span v-if="downloadingUuid === addendum.uuid" class="loading loading-spinner loading-xs" />
          <Icon v-else name="lucide:download" class="h-4 w-4" />
          Download addendum{{ addendum.original_filename ? `: ${addendum.original_filename}` : '' }}
        </button>
        <span v-else class="text-xs text-base-content/45">No separate attachment was issued.</span>
        </div>
        </div>
      </li>
    </ol>
    <div v-if="error" class="alert alert-error mt-3 py-2 text-sm text-black"><span>{{ error }}</span></div>
  </section>
</template>

<script setup>
const props = defineProps({
  eoiUuid: { type: String, required: true },
  addenda: { type: Array, default: () => [] },
})

const { getAddendumAttachmentUrl } = usePublicTenderHelper()
const downloadingUuid = ref('')
const error = ref('')
const dateTime = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const addendumTypeLabel = type => ({
  EOI_ADDENDUM: 'EOI addendum',
  TERMS_OF_REFERENCE_CHANGE: 'Change of Terms of Reference',
  SCOPE_CHANGE: 'Change of scope',
  DATE_CHANGE: 'Change of dates',
  ELIGIBILITY_REQUIREMENTS_CHANGE: 'Change of eligibility requirements',
}[type] ?? 'EOI addendum')
const changedEligibility = addendum => (addendum.eligibility_changes ?? []).filter(change => change.status !== 'UNCHANGED')
const changeClass = status => ({ ADDED: 'badge-success', MODIFIED: 'badge-warning', REMOVED: 'badge-error' }[status] ?? 'badge-ghost')
const changeRecordClass = status => ({ ADDED: 'border-success/40 bg-success/5', MODIFIED: 'border-warning/50 bg-warning/5', REMOVED: 'border-error/40 bg-error/5' }[status] ?? 'border-base-200')
const fieldChanged = (change, field) => change.changed_fields?.includes(field) ?? false
const fieldClass = (change, field) => fieldChanged(change, field) ? 'border-warning/50 bg-warning/10' : 'border-base-200'

async function download(addendum) {
  downloadingUuid.value = addendum.uuid
  error.value = ''
  const result = await getAddendumAttachmentUrl(props.eoiUuid, addendum.uuid)
  downloadingUuid.value = ''
  if (!result.ok) {
    error.value = result.error
    return
  }
  const url = result.data?.data?.url
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}
</script>
