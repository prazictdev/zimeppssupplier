<template>
  <Html data-theme="procurement">
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  </Html>
</template>

<script setup>
useHead({
  titleTemplate: title => title ? `${title} | ZimEpps` : 'ZimEpps — Zimbabwe Electronic Public Procurement System',
})
</script>
