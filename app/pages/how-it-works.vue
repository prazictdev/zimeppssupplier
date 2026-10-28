<template>
  <div class="min-h-screen bg-base-200">
    <section class="border-b border-base-300 bg-base-100">
      <div class="app-shell px-5 py-12 sm:px-8 sm:py-16">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Supplier guide</p>
        <h1 class="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">From registration to contract award</h1>
        <p class="mt-4 max-w-2xl text-base leading-7 text-base-content/60">ZimEpps gives suppliers one secure workflow for finding opportunities, preparing compliant responses, submitting on time and following procurement outcomes.</p>
        <div class="mt-7 flex flex-wrap gap-3">
          <NuxtLink to="/live-opportunities" class="btn btn-primary">Browse live opportunities <Icon name="lucide:arrow-right" class="h-4 w-4" /></NuxtLink>
          <NuxtLink to="/register" class="btn btn-outline">Create supplier account</NuxtLink>
        </div>
      </div>
    </section>

    <main class="app-shell space-y-10 px-5 py-10 sm:px-8 sm:py-14">
      <section>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="(stage, index) in stages" :key="stage.title" class="card card-border bg-base-100 shadow-sm">
            <div class="card-body gap-0 p-6">
              <div class="flex items-center justify-between gap-4">
                <span class="grid h-11 w-11 place-items-center rounded-box bg-primary/10 text-primary"><Icon :name="stage.icon" class="h-5 w-5" /></span>
                <span class="text-3xl font-black text-base-content/10">{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
              <h2 class="card-title mt-5 text-lg">{{ stage.title }}</h2>
              <p class="mt-2 text-sm leading-6 text-base-content/60">{{ stage.description }}</p>
              <ul class="mt-4 space-y-2 border-t border-base-200 pt-4 text-sm text-base-content/70">
                <li v-for="item in stage.items" :key="item" class="flex items-start gap-2"><Icon name="lucide:circle-check" class="mt-0.5 h-4 w-4 shrink-0 text-success" />{{ item }}</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section class="card bg-neutral text-neutral-content">
        <div class="card-body gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 class="card-title text-2xl">Ready to participate?</h2>
            <p class="mt-2 max-w-xl text-sm leading-6 text-neutral-content/70">Register your organisation, select the relevant supplier categories and keep your compliance documents current before responding.</p>
          </div>
          <div class="card-actions shrink-0"><NuxtLink to="/register" class="btn btn-primary">Register as a supplier</NuxtLink></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
useHead({ title: 'How ZimEpps Works', meta: [{ name: 'description', content: 'Learn how suppliers register, find public tenders, prepare bids and follow awards on ZimEpps.' }] })

const stages = [
  { title: 'Register your organisation', icon: 'lucide:building-2', description: 'Create the supplier account that represents your business on the platform.', items: ['Capture organisation and contact details', 'Add authorised team members', 'Upload required company documents'] },
  { title: 'Complete supplier registration', icon: 'lucide:badge-check', description: 'Apply for the categories that match the goods, works or services your business provides.', items: ['Select supplier categories', 'Settle applicable registration invoices', 'Download approved registration certificates'] },
  { title: 'Find a live opportunity', icon: 'lucide:search', description: 'Search active tenders and focus on opportunities that fit your registration and capacity.', items: ['Filter by entity, method and category', 'Review closing days and tender requirements', 'Read clarifications and published addenda'] },
  { title: 'Prepare your response', icon: 'lucide:clipboard-pen-line', description: 'Add the tender to My Bids and complete every requested section and supporting document.', items: ['Answer eligibility questions', 'Prepare technical and financial responses', 'Check fees and bid security requirements'] },
  { title: 'Seal and submit securely', icon: 'lucide:file-lock-2', description: 'Finalise the response and submit before the published closing time.', items: ['Review the final bid package', 'Encrypt the sealed submission', 'Retain the submission acknowledgement'] },
  { title: 'Follow the outcome', icon: 'lucide:trophy', description: 'Track opening, evaluation, award notices and resulting contract activity.', items: ['Review published award information', 'Observe applicable standstill periods', 'Proceed to contract management when successful'] },
]
</script>
