<template>
  <div v-if="value" class="flex items-start justify-between gap-3 py-2">
    <dt class="text-base-content/60">{{ label }}</dt>
    <dd class="text-right font-medium" :class="highlight ? 'text-green-700' : 'text-base-content'">{{ value }}</dd>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
  highlight: { type: Boolean, default: false },
})
</script>
