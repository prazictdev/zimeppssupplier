<template>
  <div class="space-y-6">
    <header class="border-b border-base-300 pb-5"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-box bg-primary text-primary-content"><Icon name="lucide:messages-square" class="h-5 w-5" /></span><div><h1 class="text-2xl font-bold">Help improve ZimEpps</h1><p class="mt-1 text-sm text-base-content/60">Complete the testing sessions assigned to your supplier account.</p></div></div></header>
    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error" role="alert" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span><button class="btn btn-sm" @click="load">Try again</button></div>
    <div v-else-if="!sessions.length" class="card card-border bg-base-100"><div class="card-body items-center py-16 text-center"><Icon name="lucide:clipboard-check" class="h-11 w-11 text-base-content/25" /><h2 class="card-title mt-2">You’re up to date</h2><p class="max-w-lg text-base-content/55">There are no active feedback sessions for your account. New testing rounds will appear here when they are published.</p></div></div>
    <div v-else class="grid gap-4 lg:grid-cols-2">
      <article v-for="session in sessions" :key="session.uuid" class="card card-border bg-base-100"><div class="card-body">
        <div class="flex items-start justify-between gap-3"><span class="badge" :class="submission(session)?.status === 'SUBMITTED' ? 'badge-success' : 'badge-warning badge-soft'">{{ submission(session)?.status === 'SUBMITTED' ? 'Completed' : submission(session) ? 'Draft saved' : 'To do' }}</span><span v-if="session.closes_at" class="text-xs text-base-content/45">Closes {{ date(session.closes_at) }}</span></div>
        <h2 class="card-title mt-2">{{ session.title }}</h2><p class="line-clamp-3 text-sm leading-6 text-base-content/60">{{ session.description || 'Open the session to see your testing tasks and questions.' }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs"><span class="badge badge-ghost">{{ session.scenarios_count }} scenarios</span><span class="badge badge-ghost">{{ session.questions_count }} questions</span><span v-if="session.anonymous" class="badge badge-outline">Anonymous report</span></div>
        <div class="card-actions mt-3 justify-end"><NuxtLink :to="`/feedback/${session.uuid}`" class="btn" :class="submission(session)?.status === 'SUBMITTED' ? 'btn-ghost' : 'btn-primary'">{{ submission(session)?.status === 'SUBMITTED' ? 'View submission' : submission(session) ? 'Continue feedback' : 'Start testing' }}<Icon name="lucide:arrow-right" /></NuxtLink></div>
      </div></article>
    </div>
  </div>
</template>
<script setup>
definePageMeta({ middleware: ['sanctum:auth'] }); useHead({ title: 'Testing feedback' })
const api = useFeedbackHelper(); const sessions = ref([]); const loading = ref(true); const error = ref('')
const submission = session => session.submissions?.[0]
const date = value => new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value))
async function load() { loading.value = true; error.value = ''; try { sessions.value = (await api.available()).data || [] } catch (exception) { error.value = exception?.data?.message || 'Feedback sessions could not be loaded.' } finally { loading.value = false } }
onMounted(load)
</script>
