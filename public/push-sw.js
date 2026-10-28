self.addEventListener('push', (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'ZimEpps notification', body: event.data?.text() || '' }
  }

  const notificationData = payload.data || {}
  const unreadCount = Math.max(0, Number(notificationData.unread_count) || 0)

  event.waitUntil((async () => {
    if ('setAppBadge' in self.navigator) {
      if (unreadCount > 0) {
        await self.navigator.setAppBadge(unreadCount).catch(() => {})
      } else if ('clearAppBadge' in self.navigator) {
        await self.navigator.clearAppBadge().catch(() => {})
      }
    }

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    windows.forEach(client => client.postMessage({
      type: 'ZIMEPPS_PUSH_RECEIVED',
      unreadCount,
      notificationId: notificationData.notification_id,
    }))

    await self.registration.showNotification(payload.title || 'ZimEpps notification', {
      body: payload.body || 'You have a new supplier portal notification.',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || `zimepps-${notificationData.notification_id || Date.now()}`,
      data: notificationData,
      renotify: Boolean(payload.renotify),
    })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/notifications'

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const target = new URL(targetUrl, self.location.origin)
    const existing = windows.find(client => new URL(client.url).origin === target.origin)

    if (existing) {
      await existing.navigate(target.href)
      return existing.focus()
    }

    return self.clients.openWindow(target.href)
  })())
})
