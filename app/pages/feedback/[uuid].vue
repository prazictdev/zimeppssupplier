<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error && !session" role="alert" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span><NuxtLink to="/feedback" class="btn btn-sm">Back</NuxtLink></div>
    <template v-else-if="session">
      <header class="border-b border-base-300 pb-5"><div class="breadcrumbs text-sm text-base-content/55"><ul><li><NuxtLink to="/feedback">Feedback</NuxtLink></li><li>{{ session.title }}</li></ul></div><div class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div class="flex flex-wrap gap-2"><span class="badge badge-outline">Supplier portal</span><span v-if="session.anonymous" class="badge badge-success badge-soft">Anonymous report</span></div><h1 class="mt-3 text-2xl font-bold">{{ session.title }}</h1><p class="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-base-content/65">{{ session.description }}</p></div><div v-if="session.closes_at" class="rounded-box bg-base-200 px-4 py-3 text-sm"><p class="text-xs text-base-content/45">Complete by</p><p class="font-semibold">{{ date(session.closes_at) }}</p></div></div></header>

      <div v-if="submitted" role="alert" class="alert alert-success"><Icon name="lucide:circle-check" /><div><h2 class="font-bold">Feedback submitted</h2><p class="text-sm">Thank you. Your experience has been recorded for this testing round.</p></div></div>
      <div v-if="error" role="alert" class="alert alert-error"><Icon name="lucide:circle-alert" /><span>{{ error }}</span></div>

      <form class="space-y-8" @submit.prevent="submitFeedback">
        <section v-if="session.questions?.length" class="space-y-4"><div><h2 class="text-lg font-bold">Overall experience</h2><p class="text-sm text-base-content/55">Think about the full test while answering these questions.</p></div><FeedbackQuestionForm v-for="(question, index) in session.questions" :key="question.uuid" v-model="answers[question.uuid]" :question="question" :number="index + 1" :disabled="submitted" /></section>

        <section v-for="(scenario, scenarioIndex) in session.scenarios" :key="scenario.uuid" class="space-y-4">
          <div class="card bg-neutral text-neutral-content"><div class="card-body"><div class="flex items-start gap-4"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-box bg-neutral-content font-bold text-neutral">{{ scenarioIndex + 1 }}</span><div><h2 class="card-title">{{ scenario.title }}</h2><p v-if="scenario.instructions" class="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-content/75">{{ scenario.instructions }}</p><div v-if="scenario.expected_outcome" class="mt-4 rounded-box bg-neutral-content/10 p-3 text-sm"><strong>Expected outcome:</strong> {{ scenario.expected_outcome }}</div></div></div></div></div>
          <FeedbackQuestionForm v-for="(question, questionIndex) in scenario.questions" :key="question.uuid" v-model="answers[question.uuid]" :question="question" :number="questionIndex + 1" :disabled="submitted" />
        </section>

        <div v-if="!submitted" class="sticky bottom-3 z-10 flex flex-col gap-3 rounded-box border border-base-300 bg-base-100/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p class="text-sm text-base-content/55">Save a draft if you need to continue later. Once submitted, answers cannot be changed.</p><div class="flex gap-2"><button type="button" class="btn" :disabled="saving" @click="saveDraft"><span v-if="saving === 'draft'" class="loading loading-spinner loading-sm" />Save draft</button><button type="submit" class="btn btn-primary" :disabled="Boolean(saving)"><span v-if="saving === 'submit'" class="loading loading-spinner loading-sm" />Submit feedback</button></div></div>
      </form>
    </template>
  </div>
</template>
<script setup>
definePageMeta({ middleware: ['sanctum:auth'] }); useHead({ title: 'Testing feedback' })
const route = useRoute(); const api = useFeedbackHelper(); const session = ref(null); const answers = reactive({}); const loading = ref(true); const saving = ref(''); const error = ref('')
const submission = computed(() => session.value?.submissions?.[0]); const submitted = computed(() => submission.value?.status === 'SUBMITTED')
const date = value => new Intl.DateTimeFormat('en-ZW', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
const payload = () => ({ answers: Object.entries(answers).map(([question_uuid, value]) => ({ question_uuid, value })) })
function hydrateAnswers(data) { data.submissions?.[0]?.answers?.forEach(answer => { answers[answer.question.uuid] = answer.value }) }
async function load() { try { session.value = (await api.get(route.params.uuid)).data; hydrateAnswers(session.value) } catch (exception) { error.value = exception?.data?.message || 'This feedback session could not be loaded.' } finally { loading.value = false } }
async function saveDraft() { saving.value = 'draft'; error.value = ''; try { await api.saveDraft(route.params.uuid, payload().answers) } catch (exception) { error.value = exception?.data?.message || 'Your draft could not be saved.' } finally { saving.value = '' } }
async function submitFeedback() { if (!confirm('Submit this feedback? You will not be able to change it afterwards.')) return; saving.value = 'submit'; error.value = ''; try { await api.submit(route.params.uuid, payload().answers); await load() } catch (exception) { error.value = Object.values(exception?.data?.data || {}).flat().join(' ') || exception?.data?.message || 'Your feedback could not be submitted.' } finally { saving.value = '' } }
onMounted(load)
</script>
