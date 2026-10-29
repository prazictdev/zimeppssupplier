<template>
  <header class="sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur-md">
    <div class="navbar app-shell min-h-[4.75rem] px-4 py-2 sm:px-6 lg:px-8">
    <div class="navbar-start min-w-0 gap-2">
      <button class="btn btn-ghost btn-sm lg:hidden" aria-label="Open navigation" @click="$emit('toggleSidebar')">
        <Icon name="lucide:menu" class="h-5 w-5" />
      </button>
      <button class="btn btn-ghost btn-sm hidden lg:inline-flex" :aria-label="sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'" :title="sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'" @click="$emit('toggleCollapse')">
        <Icon :name="sidebarCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="h-5 w-5" />
      </button>
      <NuxtLink to="/dashboard" class="flex min-w-0 flex-col sm:hidden" aria-label="ZimEpps supplier portal home">
        <span class="truncate text-sm font-bold leading-tight text-base-content">ZimEpps</span>
        <span class="truncate text-[0.6875rem] leading-tight text-base-content/50">Supplier portal</span>
      </NuxtLink>
      <div class="hidden min-w-0 flex-col sm:flex">
        <p class="truncate text-sm font-bold leading-tight text-base-content">{{ companyDisplayName }}</p>
        <p class="mt-0.5 truncate text-xs text-base-content/50">Registration number: {{ companyRegistrationNumber }}</p>
        <p v-if="companyClassification" class="mt-0.5 truncate text-xs font-medium text-primary">{{ companyClassification }}</p>
      </div>
    </div>

    <div class="navbar-end flex-none gap-1.5">
      <NuxtLink v-if="canViewOpportunities" to="/supplieropportunities" class="btn btn-sm">
        <Icon name="lucide:search" class="h-4 w-4" />
        <span class="hidden xl:inline">Find opportunities</span>
      </NuxtLink>
      <button v-if="upgradable && canViewRegistrations" class="btn btn-outline btn-sm gap-1.5" @click="upgradeModal?.open()">
        <Icon name="lucide:arrow-up-circle" class="h-4 w-4" />
        <span class="hidden md:inline">Upgrade supplier group</span><span class="md:hidden">Upgrade</span>
      </button>
      <NotificationBell />
      <div class="dropdown dropdown-end">
        <button tabindex="0" class="btn btn-ghost gap-2 px-2 normal-case">
          <span class="flex h-8 w-8 items-center justify-center rounded-md bg-neutral text-xs font-bold text-neutral-content">{{ initials }}</span>
          <span class="hidden max-w-48 truncate text-left text-sm font-semibold lg:block">{{ userName || 'Guest' }}</span>
          <Icon name="lucide:chevron-down" class="h-4 w-4 text-base-content/45" />
        </button>
        <ul tabindex="0" class="menu dropdown-content z-[60] mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
          <li><NuxtLink to="/personal-profile" class="gap-2 rounded-md"><Icon name="lucide:user-round" />Personal profile</NuxtLink></li>
          <li><button class="gap-2 rounded-md text-error" @click="logout"><Icon name="lucide:log-out" />Sign out</button></li>
        </ul>
      </div>
    </div>
      <UpgradeSupplierGroupModal ref="upgradeModal" @upgraded="onUpgraded" />
    </div>
  </header>
</template>

<script setup>
defineProps({ sidebarCollapsed: { type: Boolean, default: false } })
defineEmits(['toggleSidebar', 'toggleCollapse'])

const { user } = useSanctumAuth()
const { logoutUser } = useAuthHelper()
const { can } = useAbility()
const upgradeModal = ref(null)
const userData = computed(() => user.value?.data?.user ?? null)
const company = computed(() => user.value?.data?.company ?? null)
const upgradable = computed(() => user.value?.data?.upgradable ?? false)
const canViewRegistrations = computed(() => can('can.access.myregistrations'))
const canViewOpportunities = computed(() => can('can.access.supplieropportunities'))
const userName = computed(() => [userData.value?.name, userData.value?.lastname].filter(Boolean).join(' '))
const initials = computed(() => [userData.value?.name, userData.value?.lastname].filter(Boolean).map(value => value.charAt(0)).join('').slice(0, 2).toUpperCase() || 'SP')
const companyDisplayName = computed(() => company.value?.name || 'Supplier account')
const companyRegistrationNumber = computed(() => company.value?.regnumber || 'Not provided')
const companyClassification = computed(() => [company.value?.customertype?.name, company.value?.suppliergroup?.name].filter(Boolean).join(' / '))

function onUpgraded() { refreshNuxtData() }
const logout = async () => {
  const { ok } = await logoutUser()
  if (ok) await navigateTo('/login')
}
</script>
