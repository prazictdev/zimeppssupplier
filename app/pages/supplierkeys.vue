<template>
  <ComingSoon
    title="Cryptographic Keys"
    subtitle="Generate and manage the key pairs you use to sign and seal bids."
    icon="lucide:key-round"
    description="Create your supplier key pair, download your private key securely, and register your public key with the portal so your bids can be cryptographically sealed and verified."
    :features="[
      'Generate RSA / ECDSA key pairs in-browser',
      'Register and rotate your public key',
      'Sign tender submissions and contracts',
      'Audit log of every key-related action',
    ]"
  />
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Cryptographic Keys' })
</script>
