<template>
  <main class="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wider text-primary">Procurement outcomes</p>
        <h1 class="text-2xl font-bold sm:text-3xl">My award notices</h1>
        <p class="mt-1 text-sm text-base-content/60">Review proposed awards and lodge a challenge during the applicable standstill period.</p>
      </div>
      <button class="btn btn-outline btn-sm" :disabled="loading" @click="load(page)"><Icon name="lucide:refresh-cw" class="h-4 w-4" /> Refresh</button>
    </header>

    <div v-if="error" class="alert alert-error"><Icon name="lucide:alert-triangle" class="h-5 w-5" /><span>{{ error }}</span></div>
    <div v-if="notice" class="alert alert-success"><Icon name="lucide:check-circle-2" class="h-5 w-5" /><span>{{ notice }}</span></div>

    <div v-if="loading" class="flex min-h-52 items-center justify-center"><span class="loading loading-spinner loading-lg text-primary" /></div>
    <div v-else-if="awards.length === 0" class="card border border-dashed border-base-300 bg-base-100"><div class="card-body items-center py-14 text-center"><Icon name="lucide:trophy" class="h-12 w-12 text-base-content/20" /><h2 class="card-title">No award notices yet</h2><p class="text-sm text-base-content/60">Published notices for tenders in which your organisation submitted a bid will appear here.</p></div></div>

    <section v-else class="grid gap-4">
      <article v-for="award in awards" :key="award.uuid" class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body gap-4 p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs uppercase tracking-wide text-base-content/45">{{ award.tender?.entity?.name || 'Procuring entity' }}</p>
              <h2 class="text-lg font-semibold">{{ award.tender?.title }}</h2>
              <p class="mt-1 font-mono text-sm">{{ formatMoney(award.amount, award.currency_code) }}</p>
            </div>
            <span class="badge badge-lg" :class="award.status === 'FINALIZED' ? 'badge-success' : 'badge-warning'">{{ pretty(award.status) }}</span>
          </div>

          <div class="grid gap-2 text-sm sm:grid-cols-2">
            <p><span class="text-base-content/50">Recommended supplier:</span> {{ award.supplier?.name }}</p>
            <p><span class="text-base-content/50">Published:</span> {{ formatDate(award.published_at) }}</p>
            <p v-if="award.standstill_ends_at" class="sm:col-span-2"><span class="text-base-content/50">Standstill ends:</span> {{ formatDate(award.standstill_ends_at) }}</p>
          </div>

          <div v-if="award.challenge" class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <div class="flex items-center justify-between gap-2"><strong>Your challenge</strong><span class="badge badge-sm">{{ pretty(award.challenge.status) }}</span></div>
            <p class="mt-2 whitespace-pre-line">{{ award.challenge.grounds }}</p>
            <p v-if="award.challenge.decision" class="mt-2"><strong>Decision:</strong> {{ award.challenge.decision }}</p>
          </div>

          <form v-else-if="canChallenge(award)" class="rounded-lg border border-base-200 bg-base-200/20 p-4" @submit.prevent="submitChallenge(award)">
            <label class="fieldset"><span class="fieldset-legend">Grounds for challenge</span><textarea v-model.trim="challengeGrounds[award.tender.uuid]" class="textarea textarea-bordered min-h-24 w-full" maxlength="10000" required placeholder="State the facts and legal or procedural grounds clearly." /></label>
            <div class="mt-3 flex justify-end"><button class="btn btn-warning btn-sm" type="submit" :disabled="submitting === award.tender.uuid"><span v-if="submitting === award.tender.uuid" class="loading loading-spinner loading-xs" /><Icon v-else name="lucide:scale" class="h-4 w-4" /> Lodge challenge</button></div>
          </form>
        </div>
      </article>
    </section>

    <div v-if="lastPage > 1" class="join flex justify-center">
      <button class="btn join-item" :disabled="page <= 1 || loading" @click="load(page - 1)">Previous</button>
      <button class="btn join-item btn-disabled">Page {{ page }} of {{ lastPage }}</button>
      <button class="btn join-item" :disabled="page >= lastPage || loading" @click="load(page + 1)">Next</button>
    </div>
  </main>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'My Awards' })

const { listAwards, lodgeChallenge } = useSupplierAwards()
const awards = ref([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(true)
const submitting = ref(null)
const error = ref('')
const notice = ref('')
const challengeGrounds = reactive({})

function pretty(value) { return String(value || '—').replaceAll('_', ' ') }
function formatDate(value) { return value ? new Date(value).toLocaleString('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }
function formatMoney(value, currency) { const amount = Number(value); return Number.isFinite(amount) ? `${currency || 'USD'} ${amount.toLocaleString('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—' }
function canChallenge(award) { return award.status === 'PUBLISHED' && award.standstill_ends_at && new Date(award.standstill_ends_at).getTime() >= Date.now() }
function messageFrom(exception, fallback) { return exception?.data?.message || exception?.response?._data?.message || exception?.message || fallback }

async function load(targetPage = 1) {
  loading.value = true
  error.value = ''
  try {
    const response = await listAwards(targetPage)
    const paginator = response?.data ?? {}
    awards.value = paginator.data ?? []
    page.value = Number(paginator.current_page ?? targetPage)
    lastPage.value = Number(paginator.last_page ?? 1)
  } catch (exception) {
    error.value = messageFrom(exception, 'Award notices could not be loaded.')
  } finally { loading.value = false }
}

async function submitChallenge(award) {
  submitting.value = award.tender.uuid
  error.value = ''
  notice.value = ''
  try {
    await lodgeChallenge(award.tender.uuid, challengeGrounds[award.tender.uuid])
    notice.value = 'Your challenge was lodged and the procuring entity has been notified.'
    delete challengeGrounds[award.tender.uuid]
    await load(page.value)
  } catch (exception) {
    error.value = messageFrom(exception, 'The challenge could not be lodged.')
  } finally { submitting.value = null }
}

onMounted(() => load())
</script>
