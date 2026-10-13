export const useCompanyIndustryHelper = () => {
  const client = useSupplierClient();

  const getCompanyIndustries = async () => {
    try {
      const data = await client('/api/supplier/v1/global/company-industries', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: err };
    }
  };

  return {
    getCompanyIndustries,
  };
};
