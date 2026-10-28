<template>
  <div v-if="supported" class="tooltip tooltip-bottom" :data-tip="tooltipText">
    <button
      type="button"
      class="btn btn-ghost btn-xs gap-1"
      :class="subscribed ? 'text-success' : ''"
      :disabled="loading"
      @click.stop="toggle"
    >
      <span v-if="loading" class="loading loading-spinner loading-xs" />
      <Icon v-else :name="subscribed ? 'lucide:bell-ring' : 'lucide:bell-plus'" class="h-3.5 w-3.5" />
      {{ subscribed ? 'Push on' : 'Enable push' }}
    </button>
  </div>
</template>

<script setup>
const {
  supported,
  subscribed,
  permission,
  loading,
  error,
  initialize,
  enable,
  disable,
} = usePushNotifications()

const tooltipText = computed(() => {
  if (error.value) return error.value
  if (permission.value === 'denied') return 'Allow notifications in your browser settings'
  return subscribed.value ? 'Disable push notifications on this device' : 'Enable push notifications on this device'
})

const toggle = () => subscribed.value ? disable() : enable()

onMounted(initialize)
</script>
