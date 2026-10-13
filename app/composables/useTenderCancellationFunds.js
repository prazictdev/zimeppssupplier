export const useTenderCancellationFunds = () => {
  const client = useSupplierClient()

  const list = async (page = 1) => {
    try {
      const data = await client(`/api/supplier/v1/tender-cancellation-settlements?page=${page}`, { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (error) {
      return { ok: false, data: null, error: error?.data?.message ?? error?.message ?? 'Unable to load cancellation funds.' }
    }
  }

  const elect = async (uuid, election, notes = null) => {
    try {
      const data = await client(`/api/supplier/v1/tender-cancellation-settlements/${uuid}/election`, {
        method: 'POST',
        body: { election, notes },
      })
      return { ok: true, data, error: null }
    } catch (error) {
      return { ok: false, data: null, error: error?.data?.message ?? error?.message ?? 'Unable to submit your fund instruction.' }
    }
  }

  return { list, elect }
}
