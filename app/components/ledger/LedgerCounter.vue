<template>
  <div class="card border border-base-200 bg-base-100 shadow-sm p-4">
    <p class="text-xs text-base-content/50 uppercase">{{ label }}</p>
    <p class="text-2xl font-bold mt-1" :class="textClass">{{ formatted }}</p>
    <p v-if="caption" class="text-xs text-base-content/50 mt-0.5">{{ caption }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  caption: { type: String, default: '' },
  tone: { type: String, default: 'base' },
  money: { type: Boolean, default: false },
  prefix: { type: String, default: '' },
})

const formatted = computed(() => {
  if (!props.money) return props.value
  return `${props.prefix} ${new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(props.value) || 0)}`.trim()
})

const textClass = computed(() => ({
  base:   'text-base-content',
  green:  'text-green-600',
  yellow: 'text-yellow-600',
  blue:   'text-blue-600',
  red:    'text-red-600',
  orange: 'text-orange-500',
  gray:   'text-base-content/60',
}[props.tone] ?? 'text-base-content'))
</script>
