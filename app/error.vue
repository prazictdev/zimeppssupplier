<template>
  <NuxtLayout v-if="isForbidden" name="default">
    <PermissionDenied :message="message" @back="goBack" @clear="goDashboard" />
  </NuxtLayout>

  <main v-else class="flex min-h-screen items-center justify-center bg-base-200 p-6">
    <section class="w-full max-w-xl rounded-3xl border border-base-300 bg-base-100 p-10 text-center shadow-sm">
      <Icon name="lucide:triangle-alert" class="mx-auto h-12 w-12 text-error" />
      <h1 class="mt-5 text-2xl font-bold">Something went wrong</h1>
      <p class="mt-3 text-sm text-base-content/65">{{ message }}</p>
      <button class="btn btn-success mt-7 text-white" @click="goDashboard">Return to dashboard</button>
    </section>
  </main>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true,
  },
})

const statusCode = computed(() => props.error?.statusCode ?? props.error?.status ?? 500)
const isForbidden = computed(() => statusCode.value === 403)
const message = computed(() => props.error?.data?.message ?? props.error?.message ?? 'The request could not be completed.')

const goDashboard = () => clearError({ redirect: '/dashboard' })
const goBack = () => {
  clearError()
  if (window.history.length > 1) window.history.back()
  else navigateTo('/dashboard')
}
</script>
