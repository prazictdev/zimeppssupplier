export const useLegacyArchive = () => {
  const client = useSanctumClient()
  const list = (resource, query = {}) => client(`/api/supplier/v1/archive/${resource}`, { query })
  const tenders = (query) => list('tenders', query)
  const tender = (uuid) => list(`tenders/${uuid}`)
  const awards = (query) => list('awards', query)
  const contracts = (query) => list('contracts', query)

  return { tenders, tender, awards, contracts }
}
