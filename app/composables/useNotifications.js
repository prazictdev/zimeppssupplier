import { useNotificationStore } from '~/stores/useNotificationStore'

export default function useNotifications() {
  const store = useNotificationStore()

  const relativeTime = (value) => {
    if (!value) return ''

    const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
    if (seconds < 60) return 'just now'

    const units = [
      { limit: 3600, divisor: 60, unit: 'minute' },
      { limit: 86400, divisor: 3600, unit: 'hour' },
      { limit: 604800, divisor: 86400, unit: 'day' },
      { limit: 2629800, divisor: 604800, unit: 'week' },
      { limit: Infinity, divisor: 2629800, unit: 'month' },
    ]
    const match = units.find(({ limit }) => seconds < limit)
    const amount = Math.round(seconds / match.divisor)

    return `${amount} ${match.unit}${amount === 1 ? '' : 's'} ago`
  }

  return {
    notifications: computed(() => store.items),
    unreadCount: computed(() => store.unreadCount),
    meta: computed(() => store.meta),
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    listNotifications: (options) => store.fetchNotifications(options),
    refreshUnreadCount: () => store.refreshUnreadCount(),
    markRead: (id) => store.markRead(id),
    markAllRead: () => store.markAllRead(),
    removeNotification: (id) => store.remove(id),
    relativeTime,
  }
}
