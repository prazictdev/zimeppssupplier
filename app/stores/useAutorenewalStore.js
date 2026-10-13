import { defineStore } from 'pinia'

export const useAutorenewalStore = defineStore('autorenewal', () => {
  const subscriptions = ref([])
  const pending = ref(false)
  const submitting = ref(false)
  const error = ref(null)

  async function fetch() {
    const client = useSupplierClient()
    pending.value = true
    error.value = null

    try {
      const response = await client('/api/supplier/v1/autorenewals', { method: 'GET' })
      subscriptions.value = response?.data ?? []
    } catch (err) {
      error.value = err
      subscriptions.value = []
    } finally {
      pending.value = false
    }
  }

  async function subscribe(registrationId) {
    const client = useSupplierClient()
    submitting.value = true

    try {
      const response = await client('/api/supplier/v1/autorenewals', {
        method: 'POST',
        body: { registration_id: registrationId },
      })
      await fetch()
      return { ok: true, data: response?.data ?? null, error: null }
    } catch (err) {
      const message =
        err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to enrol in autorenewal.'
      return { ok: false, data: null, error: message }
    } finally {
      submitting.value = false
    }
  }

  async function cancel(id) {
    const client = useSupplierClient()
    submitting.value = true

    try {
      await client(`/api/supplier/v1/autorenewals/${id}`, { method: 'DELETE' })
      await fetch()
      return { ok: true, error: null }
    } catch (err) {
      const message =
        err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to cancel autorenewal.'
      return { ok: false, error: message }
    } finally {
      submitting.value = false
    }
  }

  const activeSubscriptions = computed(() =>
    subscriptions.value.filter(s => s.status === 'ACTIVE'),
  )

  const enrolledCategoryIds = computed(() =>
    new Set(activeSubscriptions.value.map(s => s.suppliercategory_id)),
  )

  return {
    subscriptions,
    activeSubscriptions,
    enrolledCategoryIds,
    pending,
    submitting,
    error,
    fetch,
    subscribe,
    cancel,
  }
})
