<template>
  <div class="space-y-5">
    <NuxtLink to="/archive" class="btn btn-ghost btn-sm"><Icon name="lucide:arrow-left" /> My archive</NuxtLink>
    <div v-if="loading" class="py-20 text-center"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else-if="tender">
      <section class="card border border-base-200 bg-base-100 shadow-sm"><div class="card-body">
        <span class="badge badge-outline w-fit">{{ tender.source_status }}</span>
        <h1 class="text-2xl font-bold">{{ tender.title }}</h1>
        <p class="font-mono text-sm">{{ tender.reference_number }}</p>
        <p>{{ tender.procurement_entity }} · {{ tender.procurement_method }}</p>
      </div></section>
      <section class="card border border-base-200 bg-base-100 shadow-sm"><div class="card-body">
        <h2 class="card-title">Documents</h2>
        <a v-for="document in tender.documents" :key="document.id" :href="document.url" target="_blank" rel="noopener" class="link link-primary">{{ document.name }}</a>
        <p v-if="!tender.documents?.length" class="text-sm text-base-content/50">No archived documents are available.</p>
      </div></section>
      <section class="card border border-base-200 bg-base-100 shadow-sm"><div class="card-body">
        <h2 class="card-title">Awards and contracts</h2>
        <div v-for="award in tender.awards" :key="award.id" class="rounded-lg border border-base-200 p-4">
          <p class="font-semibold">{{ award.awardee_name }}</p>
          <p class="text-sm">{{ award.reference_number }} · {{ award.contract_amount }}</p>
          <span v-if="award.is_final" class="badge badge-success badge-sm">Final award</span>
        </div>
      </div></section>
    </template>
  </div>
</template>
<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } })
const archive = useLegacyArchive()
const route = useRoute()
const tender = ref(null)
const loading = ref(true)
const error = ref('')
onMounted(async () => {
  try { tender.value = (await archive.tender(route.params.uuid)).data }
  catch (exception) { error.value = exception?.data?.message || exception?.message || 'Archived tender was not found.' }
  finally { loading.value = false }
})
</script>
