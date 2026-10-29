<template>
  <footer class="footer footer-center border-t border-base-300 bg-base-100 px-4 py-4 text-xs text-base-content/55 sm:footer-horizontal sm:justify-between sm:px-8">
    <p>&copy; {{ currentYear }} Procurement Regulatory Authority of Zimbabwe</p>
    <a href="mailto:egpsupport@praz.org.zw" class="link link-hover inline-flex items-center gap-1.5">
      <Icon name="lucide:life-buoy" class="h-3.5 w-3.5" aria-hidden="true" />
      egpsupport@praz.org.zw
    </a>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
