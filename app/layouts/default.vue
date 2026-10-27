<template>
  <div class="flex min-h-screen bg-base-200">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-neutral/45 backdrop-blur-[2px] lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-[18rem] flex-col border-r border-[#cfe1d9] bg-[#f5faf7] text-[#263b70] shadow-2xl transition-all duration-300 ease-in-out',
        'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none',
        isSidebarCollapsed ? 'lg:w-[4.75rem]' : 'lg:w-[18rem]',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <AppSidebar :collapsed="isSidebarCollapsed" @close="closeSidebar" />
    </aside>

    <!-- Main content -->
    <div class="flex min-w-0 flex-1 flex-col">
      <Navbar
        :sidebar-collapsed="isSidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-collapse="toggleCollapse"
      />
      <main class="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <PermissionDenied
          v-if="denial"
          :message="denial.message"
          @back="goBack"
          @clear="clearPermissionDenied"
        />
        <div v-else class="w-full">
          <slot />
        </div>
      </main>
      <SystemFooter />
    </div>

    <PendingAddendumDialog />
  </div>
</template>

<script setup>
import { usePermissionDenied } from '~/composables/usePermissionDenied'

const isSidebarOpen = ref(false);
const isSidebarCollapsed = ref(false);
const route = useRoute();
const { denial, clearPermissionDenied } = usePermissionDenied();

watch(() => route.fullPath, () => clearPermissionDenied());

onMounted(() => {
  isSidebarCollapsed.value = localStorage.getItem('supplier-sidebar-collapsed') === 'true';
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const toggleCollapse = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  localStorage.setItem('supplier-sidebar-collapsed', String(isSidebarCollapsed.value));
};

const goBack = () => {
  clearPermissionDenied();
  if (window.history.length > 1) window.history.back();
  else navigateTo('/dashboard');
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
