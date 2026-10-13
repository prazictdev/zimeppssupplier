import { defineStore } from 'pinia'

export const useWalletStore = defineStore('wallet', () => {
  const wallets = ref([])
  const pending = ref(false)
  const error = ref(null)

  async function fetchWallets() {
    const client = useSupplierClient()
    pending.value = true
    error.value = null

    try {
      const response = await client('/api/supplier/v1/wallets', { method: 'GET' })
      wallets.value = response?.data ?? []
    } catch (err) {
      error.value = err
      wallets.value = []
    } finally {
      pending.value = false
    }
  }

  async function fetchWallet(bankaccounttypeId, currencyId) {
    const client = useSupplierClient()
    try {
      const response = await client(`/api/supplier/v1/wallets/${bankaccounttypeId}/${currencyId}`, { method: 'GET' })
      return response?.data ?? null
    } catch {
      return null
    }
  }

  async function fetchInvoiceWallet(invoiceId) {
    const client = useSupplierClient()
    try {
      const response = await client(`/api/supplier/v1/wallets/invoices/${invoiceId}`, { method: 'GET' })
      return response?.data ?? null
    } catch {
      return null
    }
  }

  return { wallets, pending, error, fetchWallets, fetchWallet, fetchInvoiceWallet }
})
