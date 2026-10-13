export const useTenderClarification = () => {
  const client = useSupplierClient()

  const extractError = (error, fallback) =>
    error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback

  const call = async (url, options = {}, fallback = 'The clarification request could not be completed.') => {
    try {
      return { ok: true, data: await client(url, options), error: null }
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, fallback) }
    }
  }

  const baseUrl = tenderUuid => `/api/supplier/v1/tenders/${tenderUuid}/clarifications`

  return {
    listClarifications: (tenderUuid, page = 1) => call(
      `${baseUrl(tenderUuid)}?page=${page}`,
      { method: 'GET' },
      'Unable to load your tender clarifications.',
    ),
    getClarification: (tenderUuid, clarificationUuid) => call(
      `${baseUrl(tenderUuid)}/${clarificationUuid}`,
      { method: 'GET' },
      'Unable to load this clarification.',
    ),
    askQuestion: (tenderUuid, payload) => call(
      baseUrl(tenderUuid),
      { method: 'POST', body: payload },
      'Unable to submit your question.',
    ),
    addFollowUp: (tenderUuid, clarificationUuid, payload) => call(
      `${baseUrl(tenderUuid)}/${clarificationUuid}/messages`,
      { method: 'POST', body: payload },
      'Unable to send your follow-up.',
    ),
    getAttachmentUrl: (tenderUuid, clarificationUuid, messageUuid) => call(
      `${baseUrl(tenderUuid)}/${clarificationUuid}/messages/${messageUuid}/attachment`,
      { method: 'GET' },
      'Unable to open this attachment.',
    ),
  }
}
