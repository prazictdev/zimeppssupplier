<template>
  <main class="min-h-screen bg-base-200">
    <section class="border-b border-base-300 bg-base-100">
      <div class="app-shell px-5 py-14 sm:px-8 sm:py-20">
        <div class="max-w-3xl">
          <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-box bg-primary text-primary-content">
            <Icon name="lucide:layout-grid" class="h-6 w-6" />
          </div>
          <h1 class="text-4xl font-black tracking-tight text-base-content sm:text-5xl">Supplier modules</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-base-content/65 sm:text-lg">
            Manage your organisation, maintain registration, find opportunities and follow every bid from preparation through to contract.
          </p>
        </div>
      </div>
    </section>

    <section class="app-shell px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="modules-heading">
      <div class="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 id="modules-heading" class="text-2xl font-black tracking-tight text-base-content">Everything suppliers need</h2>
          <p class="mt-2 text-sm leading-6 text-base-content/60">Six connected areas support the complete supplier journey.</p>
        </div>
        <span class="badge badge-outline hidden sm:inline-flex">6 modules</span>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="module in supplierModules" :key="module.title" class="card card-border bg-base-100 shadow-sm">
          <div class="card-body gap-0 p-6">
            <div class="flex items-start justify-between gap-4">
              <span class="flex h-12 w-12 items-center justify-center rounded-box bg-base-200 text-primary">
                <Icon :name="module.icon" class="h-6 w-6" />
              </span>
              <span class="badge badge-ghost badge-sm whitespace-nowrap">{{ module.audience }}</span>
            </div>
            <h3 class="card-title mt-6 text-lg font-black text-base-content">{{ module.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-base-content/60">{{ module.description }}</p>
            <div class="mt-5 border-t border-base-200 pt-4 text-xs font-semibold text-base-content/70">
              <span class="inline-flex items-center gap-2">
                <Icon name="lucide:circle-check" class="h-4 w-4 text-success" />
                {{ module.capability }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })

useHead({
  title: 'Supplier Modules — ZimEpps',
  meta: [{ name: 'description', content: 'Explore the ZimEpps modules available to suppliers.' }],
})

const supplierModules = [
  { title: 'Organisation and team', audience: 'My organisation', icon: 'lucide:building-2', description: 'Maintain business details, contact information, industry categories and authorised portal users.', capability: 'Profile, documents and user access' },
  { title: 'Registrations and renewals', audience: 'My registrations', icon: 'lucide:badge-check', description: 'Apply for supplier categories, upload compliance documents and renew registrations before expiry.', capability: 'Applications, certificates and renewals' },
  { title: 'Tender opportunities', audience: 'My opportunities', icon: 'lucide:search', description: 'Search published tenders, review requirements and follow clarifications, addenda and closing dates.', capability: 'Tender discovery and tracking' },
  { title: 'Secure bid submissions', audience: 'My bids', icon: 'lucide:file-lock-2', description: 'Prepare bid responses, encrypt final submissions and submit securely before the deadline.', capability: 'Encrypted bid preparation and submission' },
  { title: 'Payments and bid security', audience: 'My finance', icon: 'lucide:wallet-cards', description: 'Manage wallet balances, settle invoices, review statements and monitor bid bond requirements.', capability: 'Wallet, invoices, payments and bid bonds' },
  { title: 'Awards and contracts', audience: 'My outcomes', icon: 'lucide:file-signature', description: 'View award notifications, follow successful bids and access resulting supplier contracts.', capability: 'Award results and contract visibility' },
]
</script>
