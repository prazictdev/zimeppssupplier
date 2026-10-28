<script setup>
definePageMeta({ layout: 'auth', sanctum: { excluded: true } })
await navigateTo('/published-plans', { redirectCode: 301, replace: true })
</script>
