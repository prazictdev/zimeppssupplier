export const useFeedbackHelper = () => {
  const client = useSanctumClient()
  const base = '/api/v1/feedback'
  const available = () => client(`${base}/available`, { query: { portal: 'SUPPLIER' } })
  const get = uuid => client(`${base}/${uuid}`, { query: { portal: 'SUPPLIER' } })
  const saveDraft = (uuid, answers) => client(`${base}/${uuid}/draft`, { method: 'PUT', query: { portal: 'SUPPLIER' }, body: { answers } })
  const submit = (uuid, answers) => client(`${base}/${uuid}/submit`, { method: 'POST', query: { portal: 'SUPPLIER' }, body: { answers } })
  return { available, get, saveDraft, submit }
}
