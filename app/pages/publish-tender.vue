<template>
  <div class="min-h-screen bg-base-200">
    <main class="app-shell px-5 py-12 sm:px-8 sm:py-16">
      <div class="mx-auto max-w-4xl space-y-6">
        <section class="card bg-primary text-primary-content shadow-xl">
          <div class="card-body gap-5 p-7 sm:p-10">
            <span class="grid h-12 w-12 place-items-center rounded-box bg-primary-content/15"><Icon name="lucide:file-plus-2" class="h-6 w-6" /></span>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary-content/65">For procuring entities</p>
              <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Publish a tender</h1>
              <p class="mt-4 max-w-2xl text-base leading-7 text-primary-content/75">Tender preparation, review and publication are completed in the dedicated Procuring Entity portal. Supplier accounts cannot publish procurement notices.</p>
            </div>
            <div class="card-actions">
              <a :href="pePortalUrl" class="btn bg-primary-content text-primary hover:bg-primary-content/90" rel="noopener">Open Procuring Entity portal <Icon name="lucide:external-link" class="h-4 w-4" /></a>
              <NuxtLink to="/live-opportunities" class="btn border-primary-content/25 bg-primary-content/10 text-primary-content hover:bg-primary-content/20">Browse published tenders</NuxtLink>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-3">
          <article v-for="step in steps" :key="step.title" class="card card-border bg-base-100 shadow-sm">
            <div class="card-body p-6">
              <span class="grid h-10 w-10 place-items-center rounded-box bg-base-200 text-primary"><Icon :name="step.icon" class="h-5 w-5" /></span>
              <h2 class="card-title mt-3 text-base">{{ step.title }}</h2>
              <p class="text-sm leading-6 text-base-content/60">{{ step.description }}</p>
            </div>
          </article>
        </section>

        <div role="alert" class="alert alert-info alert-soft">
          <Icon name="lucide:info" class="h-5 w-5" />
          <span>If your organisation should operate as a procuring entity but does not yet have access, contact your ZimEpps administrator or PRAZ support.</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({ title: 'Publish a Tender — ZimEpps', meta: [{ name: 'description', content: 'Access the ZimEpps Procuring Entity portal to prepare and publish public tenders.' }] })

const config = useRuntimeConfig()
const pePortalUrl = config.public.pePortalUrl
const steps = [
  { title: 'Prepare', icon: 'lucide:notebook-pen', description: 'Create the procurement request, items, requirements, dates and evaluation approach.' },
  { title: 'Review', icon: 'lucide:clipboard-check', description: 'Complete the entity approval workflow and address any review comments.' },
  { title: 'Publish', icon: 'lucide:radio-tower', description: 'Release the approved notice to suppliers and manage clarifications and addenda.' },
]
</script>
