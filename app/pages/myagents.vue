<template>
  <ComingSoon
    title="My Agents"
    subtitle="Delegate tender preparation and submission to AI-assisted agents."
    icon="lucide:bot"
    description="Configure intelligent agents that can draft bid responses, fill standard forms, and flag eligibility issues — letting your team focus on the parts that need a human touch."
    :features="[
      'Pre-built agents for bid drafting and review',
      'Eligibility checks against your company profile',
      'Document compilation and template fill-in',
      'Conversation history and audit trail',
    ]"
  />
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'My Agents' })
</script>
