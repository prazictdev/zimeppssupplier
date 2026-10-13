export default function useCrmPaymentReturn() {
  const { getTransactionStatus } = usePayment()

  async function confirmPaymentReturn(invoiceId, paymentReference, attempts = 8) {
    let result = null

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      result = await getTransactionStatus(invoiceId, paymentReference)
      const status = String(result?.status || '').toUpperCase()

      if (status === 'PAID' || !['PENDING', 'PROCESSING'].includes(status)) {
        return result
      }

      if (attempt < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
    }

    return result
  }

  return { confirmPaymentReturn }
}
