<template>
  <header class="navbar sticky top-0 z-40 border-b border-base-200/70 bg-base-100/90 px-4 py-2 shadow-sm backdrop-blur-md">
    <div class="flex flex-1 items-center gap-2">
      <!-- Sidebar toggle — visible on mobile only -->
      <button
        class="btn btn-ghost btn-sm lg:hidden"
        aria-label="Toggle sidebar"
        @click="$emit('toggleSidebar')"
      >
        <Icon name="lucide:menu" class="h-5 w-5" />
      </button>
      <button
        class="btn btn-ghost btn-sm hidden lg:inline-flex"
        :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="$emit('toggleCollapse')"
      >
        <Icon :name="sidebarCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="h-5 w-5" />
      </button>

      <div class="hidden min-w-0 flex-col sm:flex">
        <h1 class="truncate text-sm font-bold text-base-content">
          Welcome back, {{ fullName }}
        </h1>
        <p class="truncate text-xs font-semibold text-base-content/70">
          {{ companyDisplayName }}
        </p>
        <p v-if="companyClassification" class="truncate text-[11px] text-base-content/50">
          {{ companyClassification }}
        </p>
      </div>
    </div>

    <div class="flex flex-none items-center gap-1">
      <button
        v-if="upgradable && canViewRegistrations"
        class="btn btn-primary btn-sm gap-1.5"
        @click="upgradeModal?.open()"
      >
        <Icon name="lucide:arrow-up-circle" class="h-4 w-4" />
        <span class="hidden md:inline">Upgrade Supplier Group</span>
        <span class="md:hidden">Upgrade</span>
      </button>

      <NotificationBell />

      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-outline gap-3 rounded-full border border-base-200/80  px-3 normal-case  hover:bg-base-200/60">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="lucide:user" class="h-4 w-4 " />
          </span>
          <span class="hidden text-sm font-medium  lg:block">
            Welcome {{ userName || "Guest" }}
          </span>
          <Icon name="lucide:chevron-down" class="h-4 w-4 text-base-content/60" />
        </label>

        <ul tabindex="0" class="menu dropdown-content z-[60] mt-2 w-56 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
          <li>
            <NuxtLink to="/" class="gap-2 rounded-lg">
              <Icon name="lucide:user" />
              Profile
            </NuxtLink>
          </li>
          <li>
            <button class="gap-2 rounded-lg text-error" @click="logout">
              <Icon name="lucide:log-out" />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>

    <UpgradeSupplierGroupModal ref="upgradeModal" @upgraded="onUpgraded" />
  </header>
</template>

<script setup>
defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggleSidebar', 'toggleCollapse'])

const { user } = useSanctumAuth()
const { logoutUser } = useAuthHelper()
const { can } = useAbility()
const upgradeModal = ref(null)

const userName = computed(() => {
  if (!user.value) return ''
  const u = user.value.data.user
  return `${u.name} ${u.lastname}`
})

const userData = computed(() => user.value?.data?.user ?? null)
const company = computed(() => user.value?.data?.company ?? null)
const upgradable = computed(() => user.value?.data?.upgradable ?? false)
const canViewRegistrations = computed(() => can('can.access.myregistrations'))

const fullName = computed(() => {
  if (!userData.value) return 'User'
  return [userData.value.name, userData.value.middlename, userData.value.lastname]
    .filter(Boolean)
    .join(' ')
})

const companyDisplayName = computed(() => {
  if (!company.value) return 'Supplier Portal'
  return `${company.value.name}${company.value.regnumber ? ` (${company.value.regnumber})` : ''}`
})

const companyClassification = computed(() => [
  company.value?.customertype?.name,
  company.value?.suppliergroup?.name,
].filter(Boolean).join(' · '))

function onUpgraded() {
  refreshNuxtData()
}

const logout = async () => {
  const { ok } = await logoutUser()
  if (ok) {
    await navigateTo('/login')
  }
}
</script>
