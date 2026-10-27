<template>
  <footer class="border-t border-base-300 bg-base-100">
    <div class="footer footer-center gap-3 px-4 py-4 text-xs text-base-content/50 sm:footer-horizontal sm:justify-between sm:px-6 lg:px-8">
      <p>&copy; {{ currentYear }} Procurement Regulatory Authority of Zimbabwe.</p>
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
        <a href="https://www.praz.org.zw" target="_blank" rel="noopener noreferrer" class="link link-hover">Developed and maintained by PRAZ</a>
        <span class="inline-flex items-center gap-1.5">
          <span class="status status-success status-xs" aria-hidden="true" />
          Secure supplier workspace
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
