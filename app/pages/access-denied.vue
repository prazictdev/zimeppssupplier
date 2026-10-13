<template>
  <PermissionDenied :message="message" @back="goBack" @clear="goDashboard" />
</template>

<script setup>
definePageMeta({ layout: 'default', sanctum: { authOnly: true } })
useHead({ title: 'Access denied' })

const route = useRoute()
const message = computed(() => String(
  route.query.message || 'You do not have permission to access this page.',
))

const goDashboard = () => navigateTo('/dashboard')
const goBack = () => {
  if (window.history.length > 1) window.history.back()
  else navigateTo('/dashboard')
}
</script>
