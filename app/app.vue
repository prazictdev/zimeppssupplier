<template>
  <Html data-theme="procurement">
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PwaInstallPrompt />
  </Html>
</template>

<script setup>
useHead({
  titleTemplate: title => title ? `${title} | ZePPs` : 'ZePPs — Zimbabwe Electronic Public Procurement System',
})
</script>
