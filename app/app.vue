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
  titleTemplate: title => title ? `${title} | ZimEpps` : 'ZimEpps — Zimbabwe Electronic Public Procurement System',
})
</script>
