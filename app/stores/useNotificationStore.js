import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref([])
  const unreadCount = ref(0)
  const meta = ref(null)
  const loading = ref(false)
  const error = ref(null)

  let inFlight = null
  let inFlightKey = null

  function syncAppBadge() {
    if (!import.meta.client || !('setAppBadge' in navigator)) return

    if (unreadCount.value > 0) {
      navigator.setAppBadge(unreadCount.value).catch(() => {})
    } else if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {})
    }
  }

  function setUnreadCount(count) {
    unreadCount.value = Math.max(0, Number(count) || 0)
    syncAppBadge()
  }

  async function fetchNotifications({ page = 1, perPage = 15, unreadOnly = false } = {}) {
    // The bell and the notifications page can mount together — share the request
    // only when it is genuinely the same one, otherwise paging to page 2 while
    // the bell is still loading page 1 would silently return page 1.
    const key = `${page}:${perPage}:${unreadOnly}`
    if (inFlight && inFlightKey === key) return inFlight

    const client = useSupplierClient()
    inFlightKey = key
    loading.value = true
    error.value = null

    inFlight = (async () => {
      try {
        const query = new URLSearchParams({ page, per_page: perPage })
        if (unreadOnly) query.set('unread_only', '1')

        const response = await client(`/api/supplier/v1/notifications?${query}`, { method: 'GET' })
        items.value = response?.data?.notifications ?? []
        setUnreadCount(response?.data?.unread_count ?? 0)
        meta.value = response?.data?.meta ?? null
      } catch (err) {
        error.value = err?.data?.message ?? 'Failed to load notifications.'
        items.value = []
      } finally {
        loading.value = false
        inFlight = null
        inFlightKey = null
      }
      return items.value
    })()

    return inFlight
  }

  async function refreshUnreadCount() {
    const client = useSupplierClient()
    try {
      const response = await client('/api/supplier/v1/notifications/unread-count', { method: 'GET' })
      setUnreadCount(response?.data?.unread_count ?? 0)
    } catch {
      // A failed poll must never break the page chrome — keep the last count.
    }
    return unreadCount.value
  }

  async function markRead(id) {
    const client = useSupplierClient()
    const target = items.value.find((item) => item.id === id)
    if (target?.read_at) return true

    try {
      const response = await client(`/api/supplier/v1/notifications/${id}/read`, { method: 'POST' })
      if (target) target.read_at = response?.data?.notification?.read_at ?? new Date().toISOString()
      setUnreadCount(response?.data?.unread_count ?? Math.max(0, unreadCount.value - 1))
      return true
    } catch {
      return false
    }
  }

  async function markAllRead() {
    const client = useSupplierClient()
    try {
      await client('/api/supplier/v1/notifications/read-all', { method: 'POST' })
      const stamp = new Date().toISOString()
      items.value.forEach((item) => { item.read_at = item.read_at ?? stamp })
      setUnreadCount(0)
      return true
    } catch {
      return false
    }
  }

  async function remove(id) {
    const client = useSupplierClient()
    try {
      const response = await client(`/api/supplier/v1/notifications/${id}`, { method: 'DELETE' })
      items.value = items.value.filter((item) => item.id !== id)
      setUnreadCount(response?.data?.unread_count ?? unreadCount.value)
      return true
    } catch {
      return false
    }
  }

  return {
    items,
    unreadCount,
    meta,
    loading,
    error,
    setUnreadCount,
    fetchNotifications,
    refreshUnreadCount,
    markRead,
    markAllRead,
    remove,
  }
})
