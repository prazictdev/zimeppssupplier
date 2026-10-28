<template>
  <div class="min-h-screen bg-base-200">
    <section class="border-b border-base-300 bg-base-100">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Help centre</p>
        <h1 class="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Supplier resources</h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-base-content/60">Quick access to the pages and guidance suppliers use most when registering and participating in public procurement.</p>
      </div>
    </section>

    <main class="app-shell space-y-10 px-5 py-10 sm:px-8 sm:py-14">
      <section>
        <h2 class="text-xl font-black">Popular resources</h2>
        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article v-for="resource in resources" :key="resource.title" class="card card-border bg-base-100 shadow-sm">
            <div class="card-body gap-0 p-6">
              <span class="grid h-11 w-11 place-items-center rounded-box bg-primary/10 text-primary"><Icon :name="resource.icon" class="h-5 w-5" /></span>
              <h3 class="card-title mt-5 text-lg">{{ resource.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-base-content/60">{{ resource.description }}</p>
              <div class="card-actions mt-5"><NuxtLink :to="resource.to" class="btn btn-outline btn-primary btn-sm">Open resource <Icon name="lucide:arrow-up-right" class="h-4 w-4" /></NuxtLink></div>
            </div>
          </article>
        </div>
      </section>

      <section class="card card-border bg-base-100">
        <div class="card-body gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 class="card-title text-xl">Official procurement information</h2>
            <p class="mt-2 max-w-xl text-sm leading-6 text-base-content/60">Visit PRAZ for legislation, circulars, notices and regulatory guidance related to public procurement in Zimbabwe.</p>
          </div>
          <div class="card-actions shrink-0"><a href="https://www.praz.org.zw" class="btn btn-primary" rel="noopener">Visit PRAZ website <Icon name="lucide:external-link" class="h-4 w-4" /></a></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({ title: 'Supplier Resources — ZimEpps', meta: [{ name: 'description', content: 'Find ZimEpps supplier registration, tender and participation resources.' }] })

const resources = [
  { title: 'How ZimEpps works', description: 'Follow the supplier journey from account creation and registration through submission and award.', icon: 'lucide:list-checks', to: '/how-it-works' },
  { title: 'Live opportunities', description: 'Search active tenders and filter them by closing days, entity, method and supplier category.', icon: 'lucide:radio', to: '/live-opportunities' },
  { title: 'Full tender catalogue', description: 'Browse active, closed, awarded and cancelled public procurement notices.', icon: 'lucide:library-big', to: '/tenders' },
  { title: 'Supplier registration', description: 'Create an account and begin registering your organisation for relevant supplier categories.', icon: 'lucide:user-plus', to: '/register' },
  { title: 'Procuring entities', description: 'Find public organisations and view tenders they have published through ZimEpps.', icon: 'lucide:landmark', to: '/procuring-entities' },
  { title: 'Supplier sign in', description: 'Access your organisation dashboard, registrations, payments, bids and notifications.', icon: 'lucide:log-in', to: '/login' },
]
</script>
