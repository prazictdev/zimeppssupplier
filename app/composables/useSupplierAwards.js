export const useSupplierAwards = () => {
  const client = useSupplierClient()

  const listAwards = async (page = 1) => client('/api/v1/tenders/awards', {
    method: 'GET',
    query: { page, per_page: 20 },
  })

  const getAward = async uuid => client(`/api/v1/tenders/${uuid}/award`, { method: 'GET' })

  const lodgeChallenge = async (uuid, grounds) => client(`/api/v1/tenders/${uuid}/challenges`, {
    method: 'POST',
    body: { grounds },
  })

  return { listAwards, getAward, lodgeChallenge }
}
