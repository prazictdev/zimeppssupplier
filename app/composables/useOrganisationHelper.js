export const useOrganisationHelper = () => {
  const client = useSupplierClient();
  const { presignAndUpload } = useS3Upload();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  const setupOrganisation = async (payload) => {
    try {
      const data = await client('/api/supplier/v1/organisation/setup', { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Organisation setup failed.') };
    }
  };

  const getSupplierGroupsWithThresholds = async (locality = null) => {
    try {
      const url = locality
        ? `/api/supplier/v1/global/supplier-groups?locality=${locality}`
        : '/api/supplier/v1/global/supplier-groups';
      const data = await client(url, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load supplier groups.') };
    }
  };

  const getCustomerTypesForSetup = async () => {
    try {
      const data = await client('/api/supplier/v1/global/company-types', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load customer types.') };
    }
  };

  const getRequiredDocuments = async (customertypeId) => {
    try {
      const data = await client(`/api/supplier/v1/global/required-documents/${customertypeId}`, { method: 'GET' });
      console.log(data);
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load required documents.') };
    }
  };

  const getDocumentRequirementGroups = async () => {
    try {
      const data = await client('/api/supplier/v1/global/document-requirement-groups', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load document groups.') };
    }
  };

  const getUploadedDocuments = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/documents/${companyId}`, { method: 'GET' });
      console.log(data);
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load uploaded documents.') };
    }
  };

  const uploadDocument = async (companyId, documentId, file, locality = 'local', documentrequirementgroupId = null) => {
    // Upload the file directly to S3, then persist only its object key and metadata.
    const upload = await presignAndUpload(file, `company-documents/${companyId}`);
    if (!upload.ok) return upload;

    try {
      const body = { document_id: documentId, locality, ...upload.data };
      if (documentrequirementgroupId) body.documentrequirementgroup_id = documentrequirementgroupId;
      const data = await client(`/api/supplier/v1/organisation/documents/${companyId}`, {
        method: 'POST',
        body,
      });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Upload failed.') };
    }
  };

  const removeDocument = async (companyId, id) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/documents/${companyId}/${id}`, { method: 'DELETE' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove document.') };
    }
  };

  const getMyCompany = async () => {
    try {
      const data = await client('/api/supplier/v1/organisation/my-company', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load organisation.') };
    }
  };

  return {
    setupOrganisation,
    getSupplierGroupsWithThresholds,
    getCustomerTypesForSetup,
    getDocumentRequirementGroups,
    getRequiredDocuments,
    getUploadedDocuments,
    uploadDocument,
    removeDocument,
    getMyCompany,
  };
};
