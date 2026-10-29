<template>
  <footer class="footer footer-center border-t border-base-300 bg-base-100 px-4 py-3 text-xs text-base-content/55">
    <p>&copy; {{ currentYear }} Procurement Regulatory Authority of Zimbabwe</p>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
