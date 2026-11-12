<template>
  <nav class="dock dock-sm z-30 border-t border-base-300 bg-base-100/95 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden" aria-label="Mobile navigation">
    <NuxtLink
      v-for="item in visibleItems"
      :key="item.key"
      :to="item.to"
      :class="{ 'dock-active text-primary': isActive(item) }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <Icon :name="item.icon" class="h-5 w-5" aria-hidden="true" />
      <span class="dock-label text-[0.625rem] font-medium">{{ item.label }}</span>
    </NuxtLink>

    <button
      type="button"
      :class="{ 'dock-active text-primary': moreIsActive }"
      aria-label="Open full menu"
      @click="$emit('open-menu')"
    >
      <Icon name="lucide:menu" class="h-5 w-5" aria-hidden="true" />
      <span class="dock-label text-[0.625rem] font-medium">More</span>
    </button>
  </nav>
</template>

<script setup>
defineEmits(['open-menu'])

const route = useRoute()
const { can } = useAbility()

const items = [
  { key: 'home', label: 'Home', to: '/dashboard', icon: 'lucide:house', matches: ['/dashboard'] },
  { key: 'categories', label: 'Categories', to: '/supplierregistrations', icon: 'lucide:layout-list', permission: 'can.access.myregistrations', matches: ['/supplierregistrations', '/suppliernewapplication'] },
  { key: 'opportunities', label: 'Opportunities', to: '/supplieropportunities', icon: 'lucide:search', permission: 'can.access.supplieropportunities', matches: ['/supplieropportunities'] },
  { key: 'bids', label: 'My bids', to: '/mysupplierbids', icon: 'lucide:file-lock-2', permission: 'can.access.mysupplierbids', matches: ['/mysupplierbids', '/bids/', '/expressions-of-interest/', '/supplierbidopening/'] },
]

const visibleItems = computed(() => items.filter(item => !item.permission || can(item.permission)))
const isActive = item => item.matches.some(path => path === '/dashboard' ? route.path === path : route.path.startsWith(path))
const moreIsActive = computed(() => !visibleItems.value.some(isActive))
</script>
