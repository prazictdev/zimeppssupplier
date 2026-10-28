<template>
  <div class="flex h-full flex-col">
    <!-- Sidebar header -->
    <div class="flex min-h-20 items-center justify-between border-b border-[#dce9e3] bg-white/70 px-4 py-3">
      <NuxtLink to="/dashboard" class="flex min-w-0 items-center gap-3" @click="$emit('close')">
        <img
          v-if="showLogoImage"
          :src="imgUrl"
          alt="Coat of Arms of Zimbabwe"
          class="h-10 w-10 shrink-0 rounded-md bg-white object-contain p-0.5"
          @error="onLogoError"
        />
        <div :class="['min-w-0 leading-tight', collapsed ? 'lg:hidden' : '']">
          <span class="block truncate text-sm font-bold text-[#263b70]">ZimEpps</span>
          <span class="mt-0.5 block text-[11px] font-medium text-[#008f55]">Supplier portal</span>
        </div>
      </NuxtLink>

      <!-- Close button — mobile only -->
      <button
        class="btn btn-ghost btn-sm text-[#263b70] lg:hidden"
        aria-label="Close sidebar"
        @click="$emit('close')"
      >
        <Icon name="lucide:x" class="h-4 w-4" />
      </button>
    </div>

    <!-- Nav links -->
    <nav :class="['flex-1 overflow-y-auto px-3 py-5', collapsed ? 'lg:hidden' : '']">
      <p class="mb-2 px-3 text-[11px] font-semibold text-[#263b70]/55">Your workspace</p>
      <ul class="menu menu-sm w-full gap-1 p-0">
        <li>
          <NuxtLink
            to="/dashboard"
            :class="['gap-3 rounded-md py-2.5', route.path === '/dashboard' ? 'bg-[#008f55] text-white shadow-sm' : 'text-[#263b70]/80 hover:bg-[#e3f2eb] hover:text-[#263b70]']"
            @click="$emit('close')"
          >
            <Icon name="lucide:home" class="h-4 w-4 shrink-0" />
            <span>Home</span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/feedback"
            :class="['gap-3 rounded-md py-2.5', route.path.startsWith('/feedback') ? 'bg-[#008f55] text-white shadow-sm' : 'text-[#263b70]/80 hover:bg-[#e3f2eb] hover:text-[#263b70]']"
            @click="$emit('close')"
          >
            <Icon name="lucide:messages-square" class="h-4 w-4 shrink-0" />
            <span>Testing feedback</span>
          </NuxtLink>
        </li>

        <li v-for="module in visibleModules" :key="module.uuid" class="mt-1">
          <details :open="module.submodules.some(submodule => route.path.startsWith(submodule.url))">
            <summary class="gap-3 rounded-md py-2.5 font-medium text-[#263b70]/80 hover:bg-[#e3f2eb] hover:text-[#263b70]">
              <Icon :name="module.icon" class="h-4 w-4 shrink-0" />
              {{ module.name }}
            </summary>
            <ul class="mt-1">
              <li v-for="submodule in module.submodules" :key="submodule.uuid">
                <NuxtLink
                  :to="submodule.url"
                  :class="['gap-3 rounded-md py-2 text-sm', route.path.startsWith(submodule.url) ? 'bg-[#008f55] text-white shadow-sm' : 'text-[#263b70]/70 hover:bg-[#e3f2eb] hover:text-[#263b70]']"
                  @click="$emit('close')"
                >
                  <Icon :name="submodule.icon" class="h-4 w-4 shrink-0" />
                  {{ submodule.name }}
                </NuxtLink>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </nav>

    <!-- Compact desktop navigation -->
    <nav v-if="collapsed" class="hidden flex-1 overflow-y-auto px-2 py-4 lg:block">
      <ul class="menu w-full gap-2 p-0">
        <li>
          <NuxtLink
            to="/dashboard"
            title="Home"
            :class="['flex justify-center rounded-md px-0', route.path === '/dashboard' ? 'bg-[#008f55] text-white' : 'text-[#263b70]/70 hover:bg-[#e3f2eb]']"
          >
            <Icon name="lucide:home" class="h-5 w-5 shrink-0" />
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/feedback"
            title="Testing feedback"
            :class="['flex justify-center rounded-md px-0', route.path.startsWith('/feedback') ? 'bg-[#008f55] text-white' : 'text-[#263b70]/70 hover:bg-[#e3f2eb]']"
          >
            <Icon name="lucide:messages-square" class="h-5 w-5 shrink-0" />
          </NuxtLink>
        </li>
        <template v-for="module in visibleModules" :key="module.uuid">
          <li class="my-1 border-t border-[#dce9e3]" />
          <li v-for="submodule in module.submodules" :key="submodule.uuid">
            <NuxtLink
              :to="submodule.url"
              :title="`${module.name}: ${submodule.name}`"
              :aria-label="submodule.name"
              :class="['flex justify-center rounded-md px-0', route.path.startsWith(submodule.url) ? 'bg-[#008f55] text-white' : 'text-[#263b70]/70 hover:bg-[#e3f2eb]']"
            >
              <Icon :name="submodule.icon" class="h-5 w-5 shrink-0" />
            </NuxtLink>
          </li>
        </template>
      </ul>
    </nav>

    <!-- Sidebar footer -->
    <div :class="['border-t border-[#dce9e3] bg-white/50 py-3', collapsed ? 'px-4 lg:px-2' : 'px-4']">
      <button
        :class="['btn btn-ghost btn-sm w-full gap-2 text-[#263b70]/70 hover:bg-error/10 hover:text-error', collapsed ? 'justify-start lg:justify-center lg:px-0' : 'justify-start']"
        title="Logout"
        @click="logout"
      >
        <Icon name="lucide:log-out" class="h-4 w-4" />
        <span :class="collapsed ? 'lg:hidden' : ''">Sign out</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const route = useRoute()
const { user } = useSanctumAuth()
const { can } = useAbility()
const { logoutUser } = useAuthHelper()

const modules = ref([])
if (user.value) {
  modules.value = user.value.data.modules ?? []
}
const visibleModules = computed(() => modules.value
  .map(module => ({
    ...module,
    submodules: (module.submodules ?? []).filter(submodule => can(submodule.default_permission)),
  }))
  .filter(module => module.submodules.length > 0))

const imgUrl = ref('/img/nationalemblem.png')
const showLogoImage = ref(true)

const onLogoError = () => {
  showLogoImage.value = false
}

const logout = async () => {
  const { ok } = await logoutUser()
  if (ok) {
    await navigateTo('/login')
  }
}
</script>
