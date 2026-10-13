export const useProvinceHelper = () => {
  const client = useSupplierClient();

  const getProvinces = async () => {
    try {
      const data = await client('/api/supplier/v1/global/provinces-with-districts', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: err };
    }
  };

  const getDistrictsByProvince = async (provinceId) => {
    try {
      const data = await client(`/api/supplier/v1/global/provinces/${provinceId}/districts`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: err };
    }
  };

  return {
    getProvinces,
    getDistrictsByProvince,
  };
};
