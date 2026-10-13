<template>
  <div class="mt-5 rounded-xl border border-warning/30 bg-warning/5 p-5">
    <div class="flex flex-wrap items-center gap-2"><span class="badge badge-warning">Open EOI</span><span class="font-mono text-sm">{{ notice.reference_number }}</span><span class="text-sm">Closes {{ dateTime(notice.closing_at) }}</span></div>
    <h2 class="mt-3 text-2xl font-bold">{{ notice.title }}</h2><p class="mt-1 text-sm text-base-content/60">{{ notice.entity }}</p>
    <div class="mt-5 space-y-4"><div class="rounded-lg bg-base-100 p-4"><h3 class="font-semibold">Assignment summary</h3><p class="mt-2 whitespace-pre-line text-sm text-base-content/65">{{ notice.summary }}</p></div><div v-for="scope in notice.scope_snapshot ?? []" :key="scope.item_id" class="rounded-lg bg-base-100 p-4"><h3 class="font-semibold">{{ scope.item_description }}</h3><p v-if="scope.objective" class="mt-2 text-sm"><strong>Objective:</strong> {{ scope.objective }}</p><p class="mt-2 whitespace-pre-line text-sm text-base-content/65">{{ scope.scope_of_services }}</p></div></div>
    <div class="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Participation:</strong> {{ notice.participation_scope === 'DOMESTIC' ? 'Zimbabwean firms only' : 'International' }}</p><p><strong>Selection:</strong> {{ notice.selection_method }}</p><p><strong>Joint ventures:</strong> {{ notice.allow_joint_ventures ? 'Permitted' : 'Not permitted' }}</p><p><strong>Sub-consultants:</strong> {{ notice.allow_subconsultants ? 'Permitted' : 'Not permitted' }}</p><p v-if="notice.spoc_fee_required"><strong>SPOC/PRAZ fee:</strong> {{ notice.spoc_fee_currency }} {{ notice.spoc_fee_amount }}</p><p><strong>Submission:</strong> {{ notice.submission_channel }}</p></div>
  </div>
</template>

<script setup>
defineProps({ notice: { type: Object, required: true }, dateTime: { type: Function, required: true } })
</script>
