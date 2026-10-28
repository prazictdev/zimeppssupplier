<template>
  <footer class="border-t border-base-300 bg-base-100">
    <div class="footer app-shell gap-8 px-5 py-10 text-sm sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-3">
          <img src="/img/prazlogo.jpg" alt="Procurement Regulatory Authority of Zimbabwe logo" class="h-14 w-14 rounded-box border border-base-300 object-contain">
          <div>
            <p class="font-black text-base-content">ZimEpps</p>
            <p class="text-xs text-base-content/50">Zimbabwe Electronic Public Procurement System</p>
          </div>
        </div>
        <p class="mt-4 max-w-sm leading-6 text-base-content/60">Developed and maintained by the Procurement Regulatory Authority of Zimbabwe.</p>
      </div>

      <div>
        <h2 class="footer-title">Location</h2>
        <div class="flex items-start gap-2 leading-6 text-base-content/65">
          <Icon name="lucide:map-pin" class="mt-1 h-4 w-4 shrink-0 text-primary" />
          <address class="not-italic">
            9th Floor, Pearl House<br>
            61 Samora Machel Avenue<br>
            Harare, Zimbabwe
          </address>
        </div>
      </div>

      <div>
        <h2 class="footer-title">Phone</h2>
        <div class="space-y-2 text-base-content/65">
          <a href="tel:+263242790080" class="link link-hover flex items-center gap-2"><Icon name="lucide:phone" class="h-4 w-4 shrink-0 text-primary" />+263 242 790 080</a>
          <div class="flex items-start gap-2">
            <Icon name="lucide:phone-call" class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>VOIP: <a href="tel:+2638688003491" class="link link-hover">+263 868 800 3491</a> / <a href="tel:+2638688003492" class="link link-hover">2</a></span>
          </div>
          <a href="tel:+263712899505" class="link link-hover flex items-center gap-2"><Icon name="lucide:smartphone" class="h-4 w-4 shrink-0 text-primary" />+263 71 289 9505</a>
        </div>
      </div>

      <div>
        <h2 class="footer-title">Email</h2>
        <div class="space-y-2 text-base-content/65">
          <a href="mailto:egpsupport@praz.org.zw" class="link link-hover flex items-center gap-2"><Icon name="lucide:mail" class="h-4 w-4 shrink-0 text-primary" />egpsupport@praz.org.zw</a>
          <a href="mailto:feedback@praz.org.zw" class="link link-hover flex items-center gap-2"><Icon name="lucide:message-square-text" class="h-4 w-4 shrink-0 text-primary" />feedback@praz.org.zw</a>
        </div>
      </div>
    </div>

    <div class="border-t border-base-200">
      <div class="app-shell flex flex-col gap-2 px-5 py-4 text-xs text-base-content/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>&copy; {{ currentYear }} Procurement Regulatory Authority of Zimbabwe.</p>
        <span class="inline-flex items-center gap-1.5"><span class="status status-success status-xs" aria-hidden="true" />Secure supplier workspace</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
