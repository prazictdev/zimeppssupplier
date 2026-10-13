export const useCurrencyHelper = () => {
  const client = useSupplierClient();

  const getActiveCurrencies = async () => {
    try {
      const data = await client('/api/supplier/v1/global/currencies', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: err };
    }
  };

  return {
    getActiveCurrencies,
  };
};
