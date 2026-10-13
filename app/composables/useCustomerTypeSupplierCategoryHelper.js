export const useCustomerTypeSupplierCategoryHelper = () => {
  const client = useSupplierClient();

  const getCustomerTypeSupplierCategories = async () => {
    try {
      const data = await client('/api/v1/customer-type-supplier-categories', { method: 'GET' });
      return { data: ref(data), error: ref(null) };
    } catch (err) {
      return { data: ref(null), error: ref(err) };
    }
  };

  const getCustomerTypeSupplierCategory = async (id) => {
    try {
      const data = await client(`/api/v1/customer-type-supplier-categories/${id}`, { method: 'GET' });
      return { data: ref(data), error: ref(null) };
    } catch (err) {
      return { data: ref(null), error: ref(err) };
    }
  };

  const createCustomerTypeSupplierCategory = async (payload) => {
    try {
      const data = await client('/api/v1/customer-type-supplier-categories', { method: 'POST', body: payload });
      return { data: ref(data), status: ref(true), error: ref(null) };
    } catch (err) {
      return { data: ref(null), status: ref(false), error: ref(err) };
    }
  };

  const updateCustomerTypeSupplierCategory = async (id, payload) => {
    try {
      const data = await client(`/api/v1/customer-type-supplier-categories/${id}`, { method: 'PUT', body: payload });
      return { data: ref(data), status: ref(true), error: ref(null) };
    } catch (err) {
      return { data: ref(null), status: ref(false), error: ref(err) };
    }
  };

  const deleteCustomerTypeSupplierCategory = async (id) => {
    try {
      const data = await client(`/api/v1/customer-type-supplier-categories/${id}`, { method: 'DELETE' });
      return { data: ref(data), status: ref(true), error: ref(null) };
    } catch (err) {
      return { data: ref(null), status: ref(false), error: ref(err) };
    }
  };

  return {
    getCustomerTypeSupplierCategories,
    getCustomerTypeSupplierCategory,
    createCustomerTypeSupplierCategory,
    updateCustomerTypeSupplierCategory,
    deleteCustomerTypeSupplierCategory,
  };
};
