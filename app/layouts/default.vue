<template>
  <div class="min-h-screen flex">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-base-200 bg-base-100 shadow-lg transition-all duration-300 ease-in-out',
        'lg:static lg:translate-x-0 lg:shadow-none',
        isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72',
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
      <main class="flex-1 overflow-auto p-4">
        <PermissionDenied
          v-if="denial"
          :message="denial.message"
          @back="goBack"
          @clear="clearPermissionDenied"
        />
        <slot v-else />
      </main>
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
