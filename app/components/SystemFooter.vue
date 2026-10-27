<template>
  <footer class="border-t border-base-300 bg-base-100">
    <div class="footer footer-vertical w-full gap-8 px-4 py-8 sm:footer-horizontal sm:px-6 lg:px-8">
      <div class="grid max-w-3xl grid-cols-[4.5rem_1fr] items-start gap-4 sm:grid-cols-[5.5rem_1fr]">
        <img
          src="/img/prazlogo.jpg"
          alt="Procurement Regulatory Authority of Zimbabwe logo"
          class="h-[4.5rem] w-[4.5rem] rounded-box border border-base-300 bg-base-100 object-contain sm:h-[5.5rem] sm:w-[5.5rem]"
        />
        <div>
          <p class="text-lg font-bold text-base-content">ZimEpps</p>
          <p class="mt-0.5 text-sm font-semibold text-primary">Zimbabwe Electronic Public Procurement System</p>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-base-content/60">
            ZimEpps provides a secure digital environment for suppliers, procuring entities and oversight teams to conduct transparent and accountable public procurement.
          </p>
        </div>
      </div>

      <div class="max-w-xl sm:ml-auto">
        <p class="footer-title text-base-content">About PRAZ</p>
        <p class="max-w-lg text-sm leading-6 text-base-content/60">
          The Procurement Regulatory Authority of Zimbabwe regulates public procurement and the disposal of public assets, promoting fairness, competition, transparency and value for money.
        </p>
        <p class="mt-3 text-sm font-semibold text-base-content">System developed and maintained by PRAZ.</p>
        <a href="https://www.praz.org.zw" target="_blank" rel="noopener noreferrer" class="link link-primary mt-2 text-sm">Visit the PRAZ website</a>
      </div>
    </div>

    <div class="border-t border-base-200 px-4 py-4 text-xs text-base-content/45 sm:px-6 lg:px-8">
      &copy; {{ currentYear }} Procurement Regulatory Authority of Zimbabwe. All rights reserved.
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
