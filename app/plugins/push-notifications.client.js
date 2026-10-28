export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  const notifications = useNotificationStore()

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'ZIMEPPS_PUSH_RECEIVED') return

    if (Number.isFinite(Number(event.data.unreadCount))) {
      notifications.setUnreadCount(event.data.unreadCount)
    } else {
      notifications.refreshUnreadCount()
    }
  })
})
