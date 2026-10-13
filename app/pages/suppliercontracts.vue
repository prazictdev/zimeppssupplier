<template>
  <ComingSoon
    title="Contracts"
    subtitle="Sign, manage, and deliver against your awarded contracts."
    icon="lucide:file-check"
    description="Sign contracts digitally, view obligations and milestones, and submit deliverables — all in one place."
    :features="[
      'Digital signing with your registered key',
      'Milestone, payment and delivery tracking',
      'Contract amendments and variation requests',
      'Performance-bond and warranty management',
    ]"
  />
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Contracts' })
</script>
