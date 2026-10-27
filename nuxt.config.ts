// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/icon',
    '@vite-pwa/nuxt',
    'nuxt-auth-sanctum',
    'nuxt-toast',
    '@pinia/nuxt'
  ],
  vite: {
    plugins: [tailwindcss() as any],
  },
  css: ['~/assets/css/main.css'],
  pwa: {
    registerType: 'autoUpdate',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    manifest: {
      name: 'ZimEpps — Zimbabwe Electronic Public Procurement System',
      short_name: 'ZimEpps',
      description: 'Find public procurement opportunities and manage supplier registrations, bids, awards and contracts.',
      theme_color: '#146c43',
      background_color: '#f7faf8',
      display: 'standalone',
      orientation: 'any',
      scope: '/',
      start_url: '/',
      categories: ['business', 'government', 'productivity'],
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
      suppressWarnings: true,
    },
  },
  pinia:{
    storesDirs: ['./stores'],
   },
  runtimeConfig: {
    public: {
      docmanBaseUrl: process.env.NUXT_PUBLIC_DOCMAN_BASE_URL || 'http://localhost:8001',
      docmanApiKey: process.env.NUXT_PUBLIC_DOCMAN_KEY || '',
    },
  },
  sanctum: {
    baseUrl: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
    mode: 'token',
    endpoints: {
      login: '/api/supplier/auth/login',
      logout: '/api/supplier/auth/logout',
      user: '/api/supplier/auth/me',
    },
    redirect: {
      onLogin: '/dashboard',
      onLogout: '/login',
      onAuthOnly: '/login',
      onGuestOnly: '/dashboard',
    },
    globalMiddleware: {
      enabled: true,
    },
  }
})
