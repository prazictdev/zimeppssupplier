export const useCompanyPortfolioHelper = () => {
  const client = useSupplierClient();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  const getPortfolio = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load portfolio.') };
    }
  };

  const savePortfolio = async (companyId, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to save portfolio.') };
    }
  };

  const deletePortfolio = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to delete portfolio.') };
    }
  };

  const addProduct = async (companyId, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/products`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to add product.') };
    }
  };

  const updateProduct = async (companyId, id, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/products/${id}`, { method: 'PUT', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update product.') };
    }
  };

  const removeProduct = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/products/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove product.') };
    }
  };

  const addOrder = async (companyId, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/orders`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to add order.') };
    }
  };

  const updateOrder = async (companyId, id, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/orders/${id}`, { method: 'PUT', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update order.') };
    }
  };

  const removeOrder = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/portfolio/${companyId}/orders/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove order.') };
    }
  };

  return { getPortfolio, savePortfolio, deletePortfolio, addProduct, updateProduct, removeProduct, addOrder, updateOrder, removeOrder };
};
