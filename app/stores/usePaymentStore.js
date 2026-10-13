import { defineStore } from 'pinia'

export const usePaymentStore = defineStore('payment', () => {
  const channels = ref([])
  const pending = ref(false)
  const error = ref(null)
  const transactionStatus = ref(null)
  const verificationFindings = ref(null)

  let inFlight = null

  async function fetchChannels(force = false) {
    // Channels are admin-config static — keep them in the store across page
    // navigations to avoid the user staring at a spinner on every visit.
    if (!force && channels.value.length > 0) return channels.value

    // Coalesce concurrent requests — if two components mount at the same
    // time the second one waits on the first's response.
    if (inFlight) return inFlight

    const client = useSupplierClient()
    pending.value = true
    error.value = null

    inFlight = (async () => {
      try {
        const response = await client('/api/supplier/v1/payment/channels', { method: 'GET' })
        channels.value = response?.data ?? []
      } catch (err) {
        error.value = err
        channels.value = []
      } finally {
        pending.value = false
        inFlight = null
      }
      return channels.value
    })()

    return inFlight
  }

  async function initiateOnline(invoiceId, methodOrReturnUrl = null, returnUrl = null) {
    const client = useSupplierClient()
    // Registration Step 4 no longer asks the customer to select a gateway.
    // Keep the former three-argument shape working for the other invoice
    // screens while the API uses its configured online method.
    const callbackUrl = returnUrl ?? methodOrReturnUrl
    try {
      return await client(`/api/supplier/v1/payment/invoices/${invoiceId}/online`, {
        method: 'POST',
        body: { ...(callbackUrl ? { return_url: callbackUrl } : {}) },
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to initiate payment.' }
    }
  }

  async function payRtgs(invoiceId, formData) {
    const client = useSupplierClient()
    try {
      return await client(`/api/supplier/v1/payment/invoices/${invoiceId}/rtgs`, {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to submit RTGS payment.' }
    }
  }

  async function payBank(invoiceId, data) {
    const client = useSupplierClient()
    try {
      return await client(`/api/supplier/v1/payment/invoices/${invoiceId}/bank`, {
        method: 'POST',
        body: data,
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to submit bank payment.' }
    }
  }

  async function payZipit(invoiceId, data) {
    const client = useSupplierClient()
    try {
      return await client(`/api/supplier/v1/payment/invoices/${invoiceId}/zipit`, {
        method: 'POST',
        body: data,
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to submit ZIPIT payment.' }
    }
  }

  async function initiatePaynow(invoiceData) {
    const client = useSupplierClient()
    try {
      return await client('/api/paymentgateway/initiate', {
        method: 'POST',
        body: invoiceData,
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to initiate Paynow payment.' }
    }
  }

  async function verifyPaynow(data) {
    const client = useSupplierClient()
    try {
      return await client('/api/paymentgateway/update', {
        method: 'POST',
        body: data,
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to verify Paynow payment.' }
    }
  }

  async function payWallet(invoiceId) {
    const client = useSupplierClient()
    try {
      return await client(`/api/supplier/v1/payment/invoices/${invoiceId}/wallet`, {
        method: 'POST',
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to process wallet payment.' }
    }
  }

  async function fetchTransactionStatus(invoiceId, paymentReference = null) {
    const client = useSupplierClient()
    try {
      const query = paymentReference
        ? `?${new URLSearchParams({ payment_reference: paymentReference })}`
        : ''
      const response = await client(`/api/supplier/v1/payment/invoices/${invoiceId}/status${query}`, { method: 'GET' })
      transactionStatus.value = response?.data ?? null
      return transactionStatus.value
    } catch {
      transactionStatus.value = null
      return null
    }
  }

  async function fetchTransactions() {
    const client = useSupplierClient()
    try {
      const response = await client('/api/supplier/v1/payment/transactions', { method: 'GET' })
      return { ok: true, data: response?.data ?? [], error: null }
    } catch (err) {
      return { ok: false, data: [], error: err?.data?.message ?? 'Failed to load your payments.' }
    }
  }

  // Why automated PRAZ CRM matching could not confirm a bank payment, and
  // which of the submitted details the supplier is allowed to correct.
  async function fetchVerificationFindings(transactionUuid) {
    const client = useSupplierClient()
    try {
      const response = await client(
        `/api/supplier/v1/payment/transactions/${transactionUuid}/verification`,
        { method: 'GET' },
      )
      verificationFindings.value = response?.data ?? null
      return verificationFindings.value
    } catch (err) {
      error.value = err
      verificationFindings.value = null
      return null
    }
  }

  async function submitVerificationCorrection(transactionUuid, payload) {
    const client = useSupplierClient()
    try {
      const response = await client(
        `/api/supplier/v1/payment/transactions/${transactionUuid}/correction`,
        { method: 'POST', body: payload },
      )
      verificationFindings.value = response?.data ?? verificationFindings.value
      return { status: true, message: response?.message, data: response?.data ?? null }
    } catch (err) {
      return {
        status: false,
        message: err?.data?.message ?? 'Failed to submit the corrected payment details.',
        errors: err?.data?.errors ?? null,
      }
    }
  }

  return {
    channels,
    pending,
    error,
    transactionStatus,
    verificationFindings,
    fetchChannels,
    initiateOnline,
    initiatePaynow,
    verifyPaynow,
    payBank,
    payRtgs,
    payZipit,
    payWallet,
    fetchTransactionStatus,
    fetchTransactions,
    fetchVerificationFindings,
    submitVerificationCorrection,
  }
})
