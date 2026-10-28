<template>
  <div class="min-h-screen bg-base-200">
    <section class="border-b border-base-300 bg-base-100">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Public buyers</p>
        <h1 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Procuring entities</h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-base-content/60">Explore public organisations with tenders published through ZimEpps, then open their current and historical opportunities.</p>
      </div>
    </section>

    <main class="app-shell space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <label class="input flex w-full max-w-xl items-center gap-2 bg-base-100">
        <Icon name="lucide:search" class="h-4 w-4 text-base-content/40" />
        <input v-model="search" type="search" class="grow" placeholder="Search procuring entities">
      </label>

      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="index in 6" :key="index" class="skeleton h-40" />
      </div>
      <div v-else-if="error" role="alert" class="alert alert-error alert-soft"><Icon name="lucide:circle-alert" /><span>{{ error }}</span><button type="button" class="btn btn-sm" @click="loadEntities">Try again</button></div>
      <div v-else-if="!filteredEntities.length" class="card card-dash bg-base-100"><div class="card-body items-center py-14 text-center"><Icon name="lucide:building-2" class="h-8 w-8 text-base-content/30" /><h2 class="card-title mt-2 text-base">No procuring entities found</h2><p class="text-sm text-base-content/55">Try a different organisation name.</p></div></div>
      <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article v-for="entity in filteredEntities" :key="entity.id" class="card card-border bg-base-100 shadow-sm">
          <div class="card-body gap-0 p-6">
            <span class="grid h-11 w-11 place-items-center rounded-box bg-primary/10 text-primary"><Icon name="lucide:landmark" class="h-5 w-5" /></span>
            <h2 class="card-title mt-5 text-base leading-6">{{ entity.name }}</h2>
            <p class="mt-2 text-sm text-base-content/55">View tenders published by this procuring entity.</p>
            <div class="card-actions mt-5"><NuxtLink :to="{ path: '/tenders', query: { company_id: entity.id } }" class="btn btn-outline btn-primary btn-sm">View tenders <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink></div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({ title: 'Procuring Entities — ZimEpps', meta: [{ name: 'description', content: 'Browse procuring entities publishing tenders through ZimEpps.' }] })

const { getTenderCatalogueFilters } = usePublicTenderHelper()
const entities = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
const filteredEntities = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? entities.value.filter(entity => entity.name?.toLowerCase().includes(term)) : entities.value
})

async function loadEntities() {
  loading.value = true
  error.value = ''
  const result = await getTenderCatalogueFilters()
  if (result.ok) entities.value = result.data?.data?.procurement_entities ?? []
  else error.value = result.error
  loading.value = false
}

onMounted(loadEntities)
</script>
