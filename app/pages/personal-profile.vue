<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <header class="border-b border-base-300 pb-5">
      <h1 class="text-2xl font-bold">Personal profile</h1>
      <p class="mt-1 text-sm text-base-content/60">Your personal details for this ZimEpps account.</p>
    </header>

    <section class="card card-border bg-base-100">
      <div class="card-body gap-0 p-0">
        <div class="flex flex-col gap-4 border-b border-base-200 p-5 sm:flex-row sm:items-center">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-lg font-bold text-primary-content">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-lg font-bold">{{ fullName }}</h2>
              <span class="badge badge-success badge-soft badge-sm">{{ accountStatus }}</span>
            </div>
            <p class="mt-1 truncate text-sm text-base-content/55">{{ profile.email || 'Email not provided' }}</p>
          </div>
        </div>

        <dl class="grid sm:grid-cols-2">
          <div v-for="detail in details" :key="detail.label" class="border-b border-base-200 px-5 py-4 sm:odd:border-r">
            <dt class="text-xs text-base-content/50">{{ detail.label }}</dt>
            <dd class="mt-1 font-medium">{{ detail.value }}</dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Personal profile' })

const { user } = useSanctumAuth()
const profile = computed(() => user.value?.data?.user ?? {})
const fullName = computed(() => [profile.value.name, profile.value.middlename, profile.value.lastname].filter(Boolean).join(' ') || 'Supplier user')
const initials = computed(() => [profile.value.name, profile.value.lastname]
  .filter(Boolean)
  .map(value => value.charAt(0))
  .join('')
  .slice(0, 2)
  .toUpperCase() || 'SP')
const accountStatus = computed(() => {
  const value = String(profile.value.status || 'Active').toLowerCase()
  return value.charAt(0).toUpperCase() + value.slice(1)
})
const details = computed(() => [
  { label: 'First name', value: profile.value.name || 'Not provided' },
  { label: 'Middle name', value: profile.value.middlename || 'Not provided' },
  { label: 'Last name', value: profile.value.lastname || 'Not provided' },
  { label: 'Email address', value: profile.value.email || 'Not provided' },
  { label: 'Phone number', value: profile.value.phone || 'Not provided' },
  { label: 'Gender', value: profile.value.gender ? profile.value.gender.charAt(0).toUpperCase() + profile.value.gender.slice(1) : 'Not provided' },
])
</script>
