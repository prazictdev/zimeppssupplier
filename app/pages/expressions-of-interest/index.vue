<template>
  <div class="space-y-5">
    <div class="rounded-2xl bg-gradient-to-r from-amber-700 to-amber-500 p-6 text-white"><h1 class="text-2xl font-bold">Consultancy Expressions of Interest</h1><p class="mt-1 text-sm text-amber-50">Respond to public EOI notices to be considered for a consultancy RFP shortlist.</p></div>
    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>
    <div v-else class="space-y-3">
      <article v-for="row in notices" :key="row.notice.uuid" class="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div class="flex flex-wrap gap-2"><span class="badge badge-warning badge-sm">Open EOI</span><span v-if="row.response" class="badge badge-success badge-sm">Response submitted</span></div><h2 class="mt-2 text-lg font-bold">{{ row.notice.title }}</h2><p class="mt-1 text-sm text-base-content/65">{{ row.notice.summary }}</p><div class="mt-3 flex flex-wrap gap-5 text-sm"><span>Entity: <strong>{{ row.notice.procurement_request?.company?.name }}</strong></span><span>Closes: <strong>{{ dateTime(row.notice.closing_at) }}</strong></span></div></div><NuxtLink :to="`/expressions-of-interest/${row.notice.uuid}`" class="btn btn-warning btn-sm">{{ row.response ? 'Review response' : 'View and respond' }}</NuxtLink></div>
      </article>
      <div v-if="!notices.length" class="rounded-xl border border-dashed border-base-300 py-16 text-center text-base-content/50">There are no open consultancy EOI notices.</div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Consultancy Expressions of Interest' })
const api = useConsultancyEoi()
const loading = ref(true)
const error = ref('')
const notices = ref([])
const dateTime = value => value ? new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
onMounted(async () => { const result = await api.list(); if (result.ok) notices.value = result.data?.data ?? []; else error.value = result.error; loading.value = false })
</script>
