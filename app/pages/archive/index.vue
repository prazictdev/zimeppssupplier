<template>
  <div class="space-y-5">
    <div class="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
      <h1 class="text-2xl font-bold">My legacy procurement archive</h1>
      <p class="mt-1 text-sm text-slate-200">Tenders you participated in and awards or contracts involving your organisation.</p>
    </div>
    <form class="card border border-base-200 bg-base-100 shadow-sm" @submit.prevent="load">
      <div class="card-body flex flex-col gap-3 md:flex-row">
        <input v-model="search" class="input input-bordered flex-1" placeholder="Search by reference, title or contract">
        <button class="btn btn-success"><Icon name="lucide:search" /> Search</button>
      </div>
    </form>
    <div role="tablist" class="tabs tabs-boxed w-fit">
      <button v-for="name in resources" :key="name" role="tab" class="tab capitalize" :class="{ 'tab-active': tab === name }" @click="select(name)">{{ name }}</button>
    </div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="py-20 text-center"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else class="space-y-3">
      <article v-for="row in rows" :key="row.uuid" class="rounded-xl border border-base-200 bg-base-100 p-5 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="badge badge-outline">{{ row.source_status }}</span>
          <span class="font-mono">{{ row.reference_number || row.contract_number || 'Legacy record' }}</span>
          <span v-if="row.is_final" class="badge badge-success">Final</span>
        </div>
        <h2 class="mt-2 text-lg font-bold">{{ row.title || 'Untitled legacy record' }}</h2>
        <p class="mt-1 text-sm text-base-content/60">{{ row.procurement_entity || row.awardee_name }}</p>
        <NuxtLink v-if="tab === 'tenders'" :to="`/archive/tenders/${row.uuid}`" class="btn btn-ghost btn-sm mt-3">View archived tender</NuxtLink>
      </article>
      <p v-if="!rows.length" class="rounded-xl border border-dashed border-base-300 py-16 text-center text-base-content/50">No archived records found.</p>
      <div class="flex justify-between">
        <button class="btn btn-sm" :disabled="page <= 1" @click="change(page - 1)">Previous</button>
        <span class="text-sm">Page {{ page }} of {{ lastPage }}</span>
        <button class="btn btn-sm" :disabled="page >= lastPage" @click="change(page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>
<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } })
useHead({ title: 'My procurement archive' })
const archive = useLegacyArchive()
const resources = ['tenders', 'awards', 'contracts']
const tab = ref('tenders')
const search = ref('')
const rows = ref([])
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')
onMounted(load)
function select(value) { tab.value = value; page.value = 1; load() }
function change(value) { page.value = value; load() }
async function load() {
  loading.value = true; error.value = ''
  try {
    const response = await archive[tab.value]({ search: search.value, page: page.value, per_page: 25 })
    rows.value = response.data?.data ?? []
    page.value = response.data?.current_page ?? 1
    lastPage.value = response.data?.last_page ?? 1
  } catch (exception) { error.value = exception?.data?.message || exception?.message || 'Could not load your archive.' }
  finally { loading.value = false }
}
</script>
