import { defineStore } from 'pinia'

export const useRegistrationStore = defineStore('registrations', () => {
  const registrations = ref({
    pending: [],
    awaiting: [],
    approved: [],
    rejected: [],
    expired: [],
  })
  const pending = ref(false)
  const error = ref(null)
  const outstandingActions = ref([])
  const actionsPending = ref(false)
  const paymentReconciliation = ref({
    affected_invoice_count: 0,
    affected_registration_count: 0,
    invoices: [],
  })
  const reconciliationPending = ref(false)
  const reconciliationError = ref(null)

  async function fetchRegistrations() {
    const client = useSupplierClient()
    pending.value = true
    error.value = null

    try {
      const response = await client('/api/supplier/v1/registrations', { method: 'GET' })
      registrations.value = response?.data ?? { pending: [], awaiting: [], approved: [], rejected: [], expired: [] }
    } catch (err) {
      error.value = err
    } finally {
      pending.value = false
    }
  }

  async function downloadCertificate(registrationId, certificateNumber = null) {
    const client = useSupplierClient()

    try {
      const blob = await client(`/api/supplier/v1/registrations/${registrationId}/certificate`, {
        method: 'GET',
        responseType: 'blob',
      })

      const filename = certificateNumber
        ? `registration-certificate-${certificateNumber}.pdf`
        : `registration-certificate-${registrationId}.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      return { ok: true, error: null }
    } catch (err) {
      const message =
        err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to download certificate.'
      return { ok: false, error: message }
    }
  }

  async function fetchOutstandingActions() {
    const client = useSupplierClient()
    actionsPending.value = true

    try {
      const response = await client('/api/supplier/v1/registration-actions', { method: 'GET' })
      outstandingActions.value = response?.data ?? []
      return { ok: true, data: outstandingActions.value, error: null }
    } catch (err) {
      const message = err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to load required verification actions.'
      return { ok: false, data: [], error: message }
    } finally {
      actionsPending.value = false
    }
  }

  async function actionRequirement(commentId, payload) {
    const client = useSupplierClient()

    try {
      const response = await client(`/api/supplier/v1/registration-actions/${commentId}/actioned`, {
        method: 'POST',
        body: payload,
      })
      outstandingActions.value = outstandingActions.value.filter(action => action.id !== commentId)
      return { ok: true, data: response?.data ?? null, message: response?.message ?? null, error: null }
    } catch (err) {
      const message = err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to notify the assigned reviewer.'
      return { ok: false, data: null, message: null, error: message }
    }
  }

  async function fetchPaymentReconciliation() {
    const client = useSupplierClient()
    reconciliationError.value = null

    try {
      const response = await client('/api/supplier/v1/registrations/payment-reconciliation', { method: 'GET' })
      paymentReconciliation.value = response?.data ?? {
        affected_invoice_count: 0,
        affected_registration_count: 0,
        invoices: [],
      }
      return { ok: true, data: paymentReconciliation.value, error: null }
    } catch (err) {
      const message = err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Failed to check registration payment status.'
      reconciliationError.value = message
      return { ok: false, data: null, error: message }
    }
  }

  async function reconcilePaidRegistrations() {
    const client = useSupplierClient()
    reconciliationPending.value = true
    reconciliationError.value = null

    try {
      const response = await client('/api/supplier/v1/registrations/payment-reconciliation', { method: 'POST' })
      paymentReconciliation.value = response?.data ?? paymentReconciliation.value
      return { ok: true, data: paymentReconciliation.value, message: response?.message ?? null, error: null }
    } catch (err) {
      const message = err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? 'Automatic registration correction failed.'
      reconciliationError.value = message
      return { ok: false, data: null, message: null, error: message }
    } finally {
      reconciliationPending.value = false
    }
  }

  return {
    registrations,
    outstandingActions,
    actionsPending,
    paymentReconciliation,
    reconciliationPending,
    reconciliationError,
    pending,
    error,
    fetchRegistrations,
    fetchOutstandingActions,
    actionRequirement,
    fetchPaymentReconciliation,
    reconcilePaidRegistrations,
    downloadCertificate,
  }
})
