<template>
  <div class="flex items-start gap-3">
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success font-bold text-success-content">{{ number }}</span>
    <div><h1 class="text-xl font-bold">{{ title }}</h1><p class="mt-1 text-sm text-base-content/60">{{ description }}</p></div>
  </div>
</template>

<script setup>
defineProps({ number: { type: [Number, String], required: true }, title: { type: String, required: true }, description: { type: String, default: '' } })
</script>
