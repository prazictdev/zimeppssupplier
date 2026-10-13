export const useCompanyBankDetailHelper = () => {
  const client = useSupplierClient();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  const getBankDetails = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/bank-details/${companyId}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load bank details.') };
    }
  };

  const addBankDetail = async (companyId, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/bank-details/${companyId}`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to add bank detail.') };
    }
  };

  const updateBankDetail = async (companyId, id, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/bank-details/${companyId}/${id}`, { method: 'PUT', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update bank detail.') };
    }
  };

  const removeBankDetail = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/bank-details/${companyId}/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove bank detail.') };
    }
  };

  return { getBankDetails, addBankDetail, updateBankDetail, removeBankDetail };
};
