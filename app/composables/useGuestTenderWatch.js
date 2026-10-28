const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from([...atob(base64)].map(character => character.charCodeAt(0)))
}

const visitorToken = () => {
  const storageKey = 'zimepps-tender-watch-token'
  let token = localStorage.getItem(storageKey)
  if (token) return token

  const bytes = crypto.getRandomValues(new Uint8Array(32))
  token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  localStorage.setItem(storageKey, token)
  return token
}

export const useGuestTenderWatch = () => {
  const client = useSanctumClient()

  const supported = computed(() => import.meta.client
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window)

  const status = async (tenderUuid) => {
    if (!supported.value) return { ok: true, watching: false }
    const token = localStorage.getItem('zimepps-tender-watch-token')
    if (!token) return { ok: true, watching: false }

    try {
      const response = await client(`/api/supplier/v1/public/tender-watches/${tenderUuid}?visitor_token=${encodeURIComponent(token)}`, { method: 'GET' })
      return { ok: true, watching: Boolean(response.data?.watching) }
    } catch (error) {
      return { ok: false, watching: false, error: error?.data?.message ?? error?.message ?? 'Unable to check tender alerts.' }
    }
  }

  const watch = async (tenderUuid) => {
    if (!supported.value) return { ok: false, error: 'Push notifications are not supported by this browser.' }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        return { ok: false, error: permission === 'denied' ? 'Notifications are blocked in your browser settings.' : 'Notification permission was not granted.' }
      }

      const [{ data }, registration] = await Promise.all([
        client('/api/supplier/v1/public/tender-watches/vapid-key', { method: 'GET' }),
        navigator.serviceWorker.ready,
      ])

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.public_key),
        })
      }

      await client(`/api/supplier/v1/public/tender-watches/${tenderUuid}`, {
        method: 'POST',
        body: {
          visitor_token: visitorToken(),
          ...subscription.toJSON(),
          content_encoding: 'aes128gcm',
        },
      })

      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.data?.message ?? error?.message ?? 'Tender alerts could not be enabled.' }
    }
  }

  const unwatch = async (tenderUuid) => {
    const token = localStorage.getItem('zimepps-tender-watch-token')
    if (!token) return { ok: true }

    try {
      await client(`/api/supplier/v1/public/tender-watches/${tenderUuid}`, {
        method: 'DELETE',
        body: { visitor_token: token },
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.data?.message ?? error?.message ?? 'Tender alerts could not be disabled.' }
    }
  }

  return { supported, status, watch, unwatch }
}
