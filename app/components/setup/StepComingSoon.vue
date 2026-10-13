<template>
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <div class="flex h-20 w-20 items-center justify-center rounded-full bg-base-200 mb-6">
      <Icon :name="icon" class="w-9 h-9 text-base-content/40" />
    </div>
    <h2 class="text-xl font-bold mb-2">{{ label }}</h2>
    <p class="text-base-content/50 text-sm max-w-sm">
      This section is under construction and will be available soon.
      You can proceed to complete your setup.
    </p>
    <span class="badge badge-warning badge-outline mt-4">Coming Soon</span>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
});
</script>
