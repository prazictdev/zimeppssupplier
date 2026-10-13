<template>
  <aside class="hidden lg:flex flex-col w-72 shrink-0 bg-base-100 border-r border-base-200">
    <div class="bg-green-600 text-white p-6">
      <h1 class="text-lg font-bold leading-snug">Organisation Setup</h1>
      <p class="text-green-100 text-xs mt-1">Complete all steps to activate your account.</p>
    </div>
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <button
        v-for="(s, idx) in steps"
        :key="idx"
        type="button"
        :class="[
          'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
          currentStep === idx + 1
            ? 'bg-green-50 text-green-700 font-semibold border border-green-200'
            : currentStep > idx + 1
            ? 'text-base-content/60'
            : 'text-base-content/40 cursor-default'
        ]"
        :disabled="currentStep < idx + 1"
        @click="currentStep > idx + 1 ? $emit('go-to-step', idx + 1) : null"
      >
        <span
          :class="[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2',
            currentStep > idx + 1
              ? 'bg-green-500 border-green-500 text-white'
              : currentStep === idx + 1
              ? 'border-green-500 text-green-600 bg-white'
              : 'border-base-300 text-base-content/30 bg-white'
          ]"
        >
          <Icon v-if="currentStep > idx + 1" name="lucide:check" class="w-3.5 h-3.5" />
          <span v-else>{{ idx + 1 }}</span>
        </span>
        <div class="min-w-0">
          <div class="text-sm truncate">{{ s.label }}</div>
          <div class="text-xs truncate" :class="currentStep === idx + 1 ? 'text-green-600/70' : 'text-base-content/40'">{{ s.sub }}</div>
        </div>
      </button>
    </nav>
  </aside>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  currentStep: { type: Number, required: true },
});
defineEmits(['go-to-step']);
</script>
