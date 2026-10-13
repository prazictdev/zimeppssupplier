<template>
  <section class="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12">
    <div class="w-full rounded-3xl border border-error/25 bg-base-100 p-8 text-center shadow-sm sm:p-12">
      <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
        <Icon name="lucide:shield-x" class="h-8 w-8" />
      </span>
      <p class="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-error">Access denied</p>
      <h1 class="mt-2 text-2xl font-bold text-base-content">Permission required</h1>
      <p class="mx-auto mt-3 max-w-lg text-sm leading-6 text-base-content/65">{{ message }}</p>
      <p class="mt-2 text-xs text-base-content/45">
        Ask your organisation administrator to assign the required permission if you need access.
      </p>
      <div class="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" class="btn btn-ghost" @click="$emit('back')">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          Go back
        </button>
        <NuxtLink to="/dashboard" class="btn btn-success text-white" @click="$emit('clear')">
          <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
          Dashboard
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'You do not have permission to perform this action.',
  },
})

defineEmits(['back', 'clear'])
</script>
