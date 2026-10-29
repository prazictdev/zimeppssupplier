<template>
  <dialog ref="installDialog" class="modal modal-bottom sm:modal-middle" @close="isOpen = false">
    <div class="modal-box max-w-lg overflow-hidden p-0">
      <div class="bg-primary px-6 py-5 text-primary-content">
        <div class="flex items-start gap-4">
          <div class="rounded-box bg-primary-content/15 p-3">
            <Icon name="lucide:download" class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-content/75">
              ZimEpps on your device
            </p>
            <h2 class="mt-1 text-xl font-bold">Install the supplier portal</h2>
            <p class="mt-1 text-sm text-primary-content/80">
              Keep procurement work close, even when your connection is unreliable.
            </p>
          </div>
          <button type="button" class="btn btn-circle btn-ghost btn-sm text-primary-content" aria-label="Dismiss install prompt" @click="dismiss">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="p-6">
        <ul class="space-y-4 text-sm text-base-content/75">
          <li class="flex gap-3">
            <span class="rounded-box bg-base-200 p-2 text-primary"><Icon name="lucide:wifi-off" class="h-4 w-4" /></span>
            <span><strong class="block text-base-content">Work through connection interruptions</strong>Open cached pages and continue locally supported tasks while offline.</span>
          </li>
          <li class="flex gap-3">
            <span class="rounded-box bg-base-200 p-2 text-primary"><Icon name="lucide:bell-ring" class="h-4 w-4" /></span>
            <span><strong class="block text-base-content">Be ready for procurement alerts</strong>Use the installed app for timely updates when notifications are enabled.</span>
          </li>
          <li class="flex gap-3">
            <span class="rounded-box bg-base-200 p-2 text-primary"><Icon name="lucide:smartphone" class="h-4 w-4" /></span>
            <span><strong class="block text-base-content">Launch faster</strong>Open ZimEpps directly from your home screen or app menu.</span>
          </li>
        </ul>

        <div v-if="isIos" role="alert" class="alert alert-soft mt-5 text-sm">
          <Icon name="lucide:share" class="h-5 w-5" />
          <span>On iPhone or iPad, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</span>
        </div>

        <div v-else-if="requiresChromeInstall" role="alert" class="alert alert-warning alert-soft mt-5 text-sm">
          <Icon name="lucide:shield-alert" class="h-5 w-5" />
          <span>
            Samsung Internet may create an outdated Android app package that Play Protect blocks.
            Open this page in Chrome, then install ZimEpps there.
          </span>
        </div>

        <div class="modal-action mt-6">
          <button type="button" class="btn btn-ghost" @click="dismiss">Not now</button>
          <a
            v-if="requiresChromeInstall"
            :href="chromeInstallUrl"
            class="btn btn-primary min-w-36"
            @click="dismiss"
          >
            <Icon name="lucide:external-link" class="h-4 w-4" />
            Open in Chrome
          </a>
          <button v-else-if="canInstall" type="button" class="btn btn-primary min-w-36" :disabled="isInstalling" @click="installApp">
            <span v-if="isInstalling" class="loading loading-spinner loading-sm" />
            <Icon v-else name="lucide:download" class="h-4 w-4" />
            {{ isInstalling ? 'Opening installer' : 'Install ZimEpps' }}
          </button>
          <button v-else-if="isIos" type="button" class="btn btn-primary" @click="dismiss">Got it</button>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button aria-label="Close install prompt" @click="dismiss">close</button>
    </form>
  </dialog>
</template>

<script setup>
const DISMISS_KEY = 'zimepps-pwa-install-dismissed-at'
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000

const { $pwa } = useNuxtApp()
const installDialog = ref(null)
const isOpen = ref(false)
const isIos = ref(false)
const isStandalone = ref(false)
const isInstalling = ref(false)
const isAndroid = ref(false)
const isSamsungInternet = ref(false)
const chromeInstallUrl = ref('#')

const canInstall = computed(() => Boolean(unref($pwa?.showInstallPrompt)))
const isAlreadyInstalled = computed(() => Boolean(unref($pwa?.isPWAInstalled)) || isStandalone.value)
const requiresChromeInstall = computed(() => isAndroid.value && isSamsungInternet.value)

const buildChromeInstallUrl = () => {
  const currentUrl = new URL(window.location.href)
  const scheme = currentUrl.protocol.replace(':', '')
  const fallbackUrl = encodeURIComponent(currentUrl.href)

  return `intent://${currentUrl.host}${currentUrl.pathname}${currentUrl.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`
}

const wasRecentlyDismissed = () => {
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS
}

const openWhenAvailable = () => {
  if (isOpen.value || isAlreadyInstalled.value || wasRecentlyDismissed()) return
  if (!canInstall.value && !isIos.value && !requiresChromeInstall.value) return

  window.setTimeout(() => {
    if (!installDialog.value?.open && !isAlreadyInstalled.value && !wasRecentlyDismissed()) {
      installDialog.value?.showModal()
      isOpen.value = true
    }
  }, 1200)
}

const dismiss = () => {
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
  installDialog.value?.close()
  isOpen.value = false
}

const installApp = async () => {
  if (!$pwa?.install || isInstalling.value) return

  isInstalling.value = true
  try {
    await $pwa.install()
    installDialog.value?.close()
    isOpen.value = false
  } finally {
    isInstalling.value = false
  }
}

watch(canInstall, openWhenAvailable)

onMounted(() => {
  isIos.value = /iphone|ipad|ipod/i.test(navigator.userAgent)
  isAndroid.value = /android/i.test(navigator.userAgent)
  isSamsungInternet.value = /samsungbrowser/i.test(navigator.userAgent)
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone)
  chromeInstallUrl.value = buildChromeInstallUrl()
  window.addEventListener('appinstalled', dismiss)
  openWhenAvailable()
})

onBeforeUnmount(() => {
  window.removeEventListener('appinstalled', dismiss)
})
</script>
