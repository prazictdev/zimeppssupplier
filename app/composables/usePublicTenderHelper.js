/**
 * Read-only access to the public "live published tenders" feed used on the
 * landing page. These endpoints are unauthenticated, so we use the bare
 * useSanctumClient() (which simply omits the bearer header when no token is
 * present) rather than useSupplierClient() — we don't want the 401 refresh /
 * redirect-to-login behaviour on a guest page.
 */
export const usePublicTenderHelper = () => {
  const client = useSanctumClient();
  const supplierClient = useSupplierClient();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  /**
   * @param {{ search?: string, procurementgroup_id?: number|string, procurementmethod_id?: number|string, suppliercategory_id?: number|string, company_id?: number|string, closing_date?: string, per_page?: number, page?: number }} params
   */
  const getPublishedTenders = async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.procurementgroup_id) query.set('procurementgroup_id', params.procurementgroup_id);
    if (params.procurementmethod_id) query.set('procurementmethod_id', params.procurementmethod_id);
    if (params.suppliercategory_id) query.set('suppliercategory_id', params.suppliercategory_id);
    if (params.company_id) query.set('company_id', params.company_id);
    if (params.closing_date) query.set('closing_date', params.closing_date);
    if (params.per_page) query.set('per_page', params.per_page);
    if (params.page) query.set('page', params.page);

    const qs = query.toString();
    const url = `/api/supplier/v1/public/tenders${qs ? `?${qs}` : ''}`;

    try {
      const data = await client(url, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load tenders.') };
    }
  };

  const getTenderFilters = async () => {
    try {
      const data = await client('/api/supplier/v1/public/tenders/filters', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load tender filters.') };
    }
  };

  /**
   * @param {{ status?: string, search?: string, procurementgroup_id?: number|string, procurementmethod_id?: number|string, suppliercategory_id?: number|string, company_id?: number|string, per_page?: number, page?: number }} params
   */
  const getTenderCatalogue = async (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    }

    const qs = query.toString();
    try {
      const data = await client(`/api/supplier/v1/public/tender-catalogue${qs ? `?${qs}` : ''}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load the tender catalogue.') };
    }
  };

  const getTenderCatalogueFilters = async () => {
    try {
      const data = await client('/api/supplier/v1/public/tender-catalogue/filters', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load tender filters.') };
    }
  };

  const getPublicConsultancyEois = async (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    }

    const qs = query.toString();
    try {
      const data = await client(`/api/supplier/v1/public/consultancy-eois${qs ? `?${qs}` : ''}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load expressions of interest.') };
    }
  };

  const getPublicConsultancyEoi = async (uuid) => {
    try {
      const data = await client(`/api/supplier/v1/public/tenders/${uuid}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      return {
        ok: false,
        data: null,
        error: status === 404 ? 'This expression of interest is no longer available.' : extractError(err, 'Failed to load the expression of interest.'),
        notFound: status === 404,
      };
    }
  };

  const getTenderStats = async () => {
    try {
      const data = await client('/api/supplier/v1/public/tenders/stats', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load tender statistics.') };
    }
  };

  const getTenderDetail = async (uuid) => {
    try {
      const data = await client(`/api/supplier/v1/public/tenders/${uuid}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 404) {
        return { ok: false, data: null, error: 'This tender is no longer available.', notFound: true };
      }
      return { ok: false, data: null, error: extractError(err, 'Failed to load the tender.') };
    }
  };

  const authenticatedCall = async (url, fallback) => {
    try {
      const data = await supplierClient(url, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, fallback), notFound: (err?.response?.status ?? err?.status) === 404 };
    }
  };

  const getSupplierOpportunities = async (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    }
    return authenticatedCall(`/api/supplier/v1/opportunities?${query.toString()}`, 'Failed to load tender opportunities.');
  };

  const getRestrictedTenders = async (params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    }
    return authenticatedCall(`/api/supplier/v1/restricted-tenders?${query.toString()}`, 'Failed to load restricted tenders.');
  };

  const getSupplierOpportunityFilters = () => authenticatedCall('/api/supplier/v1/opportunities/filters', 'Failed to load tender filters.');
  const getRestrictedTenderFilters = () => authenticatedCall('/api/supplier/v1/restricted-tenders/filters', 'Failed to load restricted tender filters.');
  const getSupplierOpportunity = uuid => authenticatedCall(`/api/supplier/v1/opportunities/${uuid}`, 'Failed to load the tender.');
  const getSupplierOpportunitySbd = uuid => authenticatedCall(`/api/supplier/v1/opportunities/${uuid}/sbd`, 'The bidding document is not available yet.');
  const getSupplierOpportunityDocument = (uuid, documentUuid) => authenticatedCall(`/api/supplier/v1/opportunities/${uuid}/documents/${documentUuid}`, 'The tender document is not available.');
  const getSupplierOpportunityAddendum = (uuid, addendumUuid) => authenticatedCall(`/api/supplier/v1/opportunities/${uuid}/addenda/${addendumUuid}/attachment`, 'The addendum attachment is not available.');

  const getSbdDownloadUrl = async (uuid) => {
    try {
      const data = await client(`/api/supplier/v1/public/tenders/${uuid}/sbd`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'The bidding document is not available yet.') };
    }
  };

  const getTenderDocumentUrl = async (uuid, documentUuid) => {
    try {
      const data = await client(`/api/supplier/v1/public/tenders/${uuid}/documents/${documentUuid}`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'The tender document is not available.') };
    }
  };

  const getAddendumAttachmentUrl = async (uuid, addendumUuid) => {
    try {
      const data = await client(`/api/supplier/v1/public/tenders/${uuid}/addenda/${addendumUuid}/attachment`, { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'The addendum attachment is not available.') };
    }
  };

  return {
    getPublishedTenders,
    getTenderFilters,
    getTenderCatalogue,
    getTenderCatalogueFilters,
    getPublicConsultancyEois,
    getPublicConsultancyEoi,
    getTenderStats,
    getTenderDetail,
    getSbdDownloadUrl,
    getTenderDocumentUrl,
    getAddendumAttachmentUrl,
    getSupplierOpportunities,
    getRestrictedTenders,
    getSupplierOpportunityFilters,
    getRestrictedTenderFilters,
    getSupplierOpportunity,
    getSupplierOpportunitySbd,
    getSupplierOpportunityDocument,
    getSupplierOpportunityAddendum,
  };
};
