export const useSupplierBidOpening = () => {
  const client = useSupplierClient();
  const extractError = (error, fallback) => error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback;

  const call = async (url, fallback) => {
    try {
      const response = await client(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      return { ok: true, data: response?.data ?? null, error: null };
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, fallback) };
    }
  };

  return {
    list: () => call('/api/supplier/v1/bid-openings', 'Unable to retrieve bid-opening sessions.'),
    show: tenderUuid => call(`/api/supplier/v1/bid-openings/${tenderUuid}`, 'Unable to retrieve the bid-opening witness.'),
  };
};
