const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bytes = atob(base64)

  return Uint8Array.from([...bytes].map(character => character.charCodeAt(0)))
}

export const usePushNotifications = () => {
  const supported = useState('push-supported', () => false)
  const subscribed = useState('push-subscribed', () => false)
  const permission = useState('push-permission', () => 'default')
  const loading = useState('push-loading', () => false)
  const error = useState('push-error', () => '')
  const client = useSupplierClient()

  const subscriptionPayload = subscription => ({
    ...subscription.toJSON(),
    content_encoding: 'aes128gcm',
  })

  const saveSubscription = subscription => client('/api/supplier/v1/push-subscriptions', {
    method: 'POST',
    body: subscriptionPayload(subscription),
  })

  const initialize = async () => {
    if (!import.meta.client) return

    supported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!supported.value) return

    permission.value = Notification.permission
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    subscribed.value = Boolean(subscription)

    if (subscription && permission.value === 'granted') {
      try {
        await saveSubscription(subscription)
      } catch {
        error.value = 'Your browser subscription could not be synchronized.'
      }
    }
  }

  const enable = async () => {
    if (!supported.value || loading.value) return false

    loading.value = true
    error.value = ''

    try {
      permission.value = await Notification.requestPermission()
      if (permission.value !== 'granted') {
        error.value = permission.value === 'denied'
          ? 'Notifications are blocked in your browser settings.'
          : 'Notification permission was not granted.'
        return false
      }

      const [{ data }, registration] = await Promise.all([
        client('/api/supplier/v1/push-subscriptions/vapid-key', { method: 'GET' }),
        navigator.serviceWorker.ready,
      ])

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.public_key),
        })
      }

      await saveSubscription(subscription)
      subscribed.value = true
      return true
    } catch (exception) {
      error.value = exception?.data?.message ?? exception?.message ?? 'Push notifications could not be enabled.'
      return false
    } finally {
      loading.value = false
    }
  }

  const disable = async () => {
    if (!supported.value || loading.value) return false

    loading.value = true
    error.value = ''

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await client('/api/supplier/v1/push-subscriptions', {
          method: 'DELETE',
          body: { endpoint: subscription.endpoint },
        })
        await subscription.unsubscribe()
      }

      subscribed.value = false
      return true
    } catch (exception) {
      error.value = exception?.data?.message ?? exception?.message ?? 'Push notifications could not be disabled.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    supported: readonly(supported),
    subscribed: readonly(subscribed),
    permission: readonly(permission),
    loading: readonly(loading),
    error: readonly(error),
    initialize,
    enable,
    disable,
  }
}
