<template>
  <div class="flex min-h-screen flex-col">
    <Defaultnavbar />
    <main class="flex-1">
      <slot />
    </main>
    <SystemFooter v-if="route.path !== '/'" />
  </div>
</template>

<script setup>
const route = useRoute()
</script>
