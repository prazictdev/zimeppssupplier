export const useDirectorShareholderHelper = () => {
  const client = useSupplierClient();
  const { presignAndUpload } = useS3Upload();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  /** Upload an ID document directly to S3 and merge its metadata into the API payload. */
  const withUploadedFile = async (payload, folder) => {
    const { file, ...rest } = payload;
    if (!file) return { ok: true, body: rest };

    const upload = await presignAndUpload(file, folder);
    if (!upload.ok) return { ok: false, error: upload.error };

    return { ok: true, body: { ...rest, ...upload.data } };
  };

  // ── Directors ──
  const getDirectors = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/directors/${companyId}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load directors.') };
    }
  };

  const addDirector = async (companyId, payload) => {
    const { ok, body, error } = await withUploadedFile(payload, `company-directors/${companyId}`);
    if (!ok) return { ok: false, data: null, error };
    try {
      const data = await client(`/api/supplier/v1/organisation/directors/${companyId}`, { method: 'POST', body });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to add director.') };
    }
  };

  const updateDirector = async (companyId, id, payload) => {
    const { ok, body, error } = await withUploadedFile(payload, `company-directors/${companyId}`);
    if (!ok) return { ok: false, data: null, error };
    try {
      const data = await client(`/api/supplier/v1/organisation/directors/${companyId}/${id}`, { method: 'POST', body });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update director.') };
    }
  };

  const removeDirector = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/directors/${companyId}/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove director.') };
    }
  };

  // ── Shareholders ──
  const getShareholders = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/shareholders/${companyId}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load shareholders.') };
    }
  };

  const addShareholder = async (companyId, payload) => {
    const { ok, body, error } = await withUploadedFile(payload, `company-shareholders/${companyId}`);
    if (!ok) return { ok: false, data: null, error };
    try {
      const data = await client(`/api/supplier/v1/organisation/shareholders/${companyId}`, { method: 'POST', body });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to add shareholder.') };
    }
  };

  const updateShareholder = async (companyId, id, payload) => {
    const { ok, body, error } = await withUploadedFile(payload, `company-shareholders/${companyId}`);
    if (!ok) return { ok: false, data: null, error };
    try {
      const data = await client(`/api/supplier/v1/organisation/shareholders/${companyId}/${id}`, { method: 'POST', body });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update shareholder.') };
    }
  };

  const removeShareholder = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/shareholders/${companyId}/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove shareholder.') };
    }
  };

  return {
    getDirectors,
    addDirector,
    updateDirector,
    removeDirector,
    getShareholders,
    addShareholder,
    updateShareholder,
    removeShareholder,
  };
};
