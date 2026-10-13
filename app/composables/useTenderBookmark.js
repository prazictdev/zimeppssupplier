export const useTenderBookmark = () => {
  const client = useSupplierClient()

  const extractError = (error, fallback) =>
    error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback

  const listBookmarks = async () => {
    try {
      const data = await client('/api/supplier/v1/tender-bookmarks', { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, 'Unable to load bookmarks.') }
    }
  }

  const addBookmark = async (tenderUuid) => {
    try {
      const data = await client('/api/supplier/v1/tender-bookmarks', {
        method: 'POST',
        body: { tender_uuid: tenderUuid },
      })
      return { ok: true, data, error: null }
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, 'Unable to bookmark this tender.') }
    }
  }

  const removeBookmark = async (tenderUuid) => {
    try {
      const data = await client(`/api/supplier/v1/tender-bookmarks/${tenderUuid}`, { method: 'DELETE' })
      return { ok: true, data, error: null }
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, 'Unable to remove this bookmark.') }
    }
  }

  return { listBookmarks, addBookmark, removeBookmark }
}
