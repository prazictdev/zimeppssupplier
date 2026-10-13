<template>
  <div class="drawer drawer-start">
    <input ref="sidebarToggleRef" id="main-sidebar-drawer" type="checkbox" class="drawer-toggle" v-model="isOpen" />

    <div class="drawer-content">
      <button class="btn btn-ghost " @click="toggleSidebar" aria-label="open sidebar">
         <Icon name="lucide:menu" class="" />
         <span class="hidden lg:block">Menu</span>
      </button>
    </div>

    <div class="drawer-side z-50">
      <label
        for="main-sidebar-drawer"
        aria-label="close sidebar"
        class="drawer-overlay bg-black/40"
      ></label>

      <ul class="menu min-h-full w-80 bg-base-100 p-4 text-base-content shadow-xl">
        <li>
          <NuxtLink to="/dashboard" :class="{ 'bg-success text-white': route.path === '/dashboard' }" @click="closeSidebar">
            <Icon name="lucide:home" />
            Home
          </NuxtLink>
        </li>

     
        <li v-for="module in visibleModules" :key="module.uuid">
          <details :open="module.submodules.some(submodule => route.path.startsWith(submodule.url))">
            <summary>
              <Icon :name="module.icon" />
              {{ module.name }}
            </summary>
            <ul>
              <li v-for="submodule in module.submodules" :key="submodule.uuid">
                <NuxtLink :to="submodule.url" :class="{ 'bg-success text-white': route.path.startsWith(submodule.url) }" @click="closeSidebar">
                  <Icon :name="submodule.icon" />
                  {{ submodule.name }}
                </NuxtLink>
              </li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const isOpen = ref(false);
const { user } = useSanctumAuth()
const modules = ref([])
if (user.value) {
  modules.value = user.value.data.modules ?? [];
}
const visibleModules = computed(() => modules.value.filter(module => (module.submodules ?? []).length > 0))

const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

const closeSidebar = () => {
  isOpen.value = false;
};
</script>
