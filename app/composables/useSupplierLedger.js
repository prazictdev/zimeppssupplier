export const useSupplierLedger = () => {
  const client = useSupplierClient()

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback

  const listInvoices = async () => {
    try {
      const data = await client('/api/supplier/v1/ledger/invoices', { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load invoices.') }
    }
  }

  const listBankTransactions = async () => {
    try {
      const data = await client('/api/supplier/v1/ledger/bank-transactions', { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load bank transactions.') }
    }
  }

  const listOnlineTransactions = async () => {
    try {
      const data = await client('/api/supplier/v1/ledger/online-transactions', { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load online transactions.') }
    }
  }

  const getStatement = async () => {
    try {
      const data = await client('/api/supplier/v1/ledger/statement', { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load statement.') }
    }
  }

  // Delete a still-pending tender-fee invoice (bid security / administration fee).
  const deleteFeeInvoice = async (invoiceId) => {
    try {
      const data = await client(`/api/supplier/v1/fee-invoices/${invoiceId}`, { method: 'DELETE' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to delete invoice.') }
    }
  }

  return {
    listInvoices,
    listBankTransactions,
    listOnlineTransactions,
    getStatement,
    deleteFeeInvoice,
  }
}
