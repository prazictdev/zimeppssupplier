export const useMediaCenter = () => {
  const client = useSupplierClient();
  const extractError = (error, fallback) => error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback;

  const call = async (url, options = {}, fallback = 'The Media Center request failed.') => {
    try {
      const response = await client(url, options);
      return { ok: true, data: response?.data ?? null, error: null };
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, fallback) };
    }
  };

  return {
    list: (search = '') => call(
      `/api/supplier/v1/media-center${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } },
      'Unable to retrieve Media Center documents.',
    ),
    create: (body) => call('/api/supplier/v1/media-center', { method: 'POST', body }, 'Unable to save the document.'),
    update: (uuid, body) => call(`/api/supplier/v1/media-center/${uuid}`, { method: 'PATCH', body }, 'Unable to update the document.'),
    archive: (uuid) => call(`/api/supplier/v1/media-center/${uuid}`, { method: 'DELETE' }, 'Unable to archive the document.'),
    download: (uuid) => call(`/api/supplier/v1/media-center/${uuid}/download`, {}, 'Unable to prepare the document download.'),
  };
};
