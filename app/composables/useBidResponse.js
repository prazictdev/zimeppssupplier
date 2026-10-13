export const useBidResponse = () => {
  const client = useSupplierClient();
  const extractError = (error, fallback) =>
    error?.data?.message ?? error?.response?._data?.message ?? error?.message ?? fallback;

  const call = async (url, options = {}, fallback = 'The bid request failed.') => {
    try {
      const response = await client(url, options);
      return { ok: true, data: response?.data ?? null, error: null };
    } catch (error) {
      return { ok: false, data: null, error: extractError(error, fallback), status: error?.status ?? error?.response?.status };
    }
  };

  return {
    getVault: () => call('/api/supplier/v1/bid-vault', {}, 'Unable to retrieve the Bid Vault.'),
    saveVault: (body) => call('/api/supplier/v1/bid-vault', { method: 'PUT', body }, 'Unable to save the Bid Vault.'),
    getEligibility: (uuid) => call(`/api/supplier/v1/tenders/${uuid}/bid-eligibility`, {}, 'Unable to check bid eligibility.'),
    getTenderFeeOptions: (uuid) => call(`/api/supplier/v1/tenders/${uuid}/fee-options`, {}, 'Unable to retrieve tender-fee options.'),
    getTenderFeeInvoices: (uuid) => call(`/api/supplier/v1/tenders/${uuid}/fee-invoices`, {}, 'Unable to retrieve tender-fee invoices.'),
    generateBidSecurityInvoices: (uuid, currencyId = null) => call(
      `/api/supplier/v1/tenders/${uuid}/bid-security/invoices`,
      { method: 'POST', body: currencyId ? { currency_id: currencyId } : {} },
      'Unable to generate the bid-security invoices.',
    ),
    generateAdministrationFeeInvoice: (uuid, currencyId = null) => call(
      `/api/supplier/v1/tenders/${uuid}/administration-fee/invoice`,
      { method: 'POST', body: currencyId ? { currency_id: currencyId } : {} },
      'Unable to generate the administration-fee invoice.',
    ),
    getDraft: (uuid) => call(`/api/supplier/v1/tenders/${uuid}/bid-draft`, {}, 'Unable to retrieve the response draft.'),
    saveDraft: (uuid, body) => call(`/api/supplier/v1/tenders/${uuid}/bid-draft`, { method: 'PUT', body }, 'Unable to save the response draft.'),
    getSealingKey: (uuid) => call(`/api/supplier/v1/tenders/${uuid}/sealing-key`, {}, 'Unable to retrieve the procuring entity sealing key.'),
    getSubmissionKeys: () => call('/api/supplier/v1/me/submission-keys', {}, 'Unable to retrieve submission keys.'),
    getSigningMaterial: (uuid) => call(`/api/supplier/v1/me/submission-keys/${uuid}/material`, {}, 'Unable to retrieve signing-key material.'),
    issueKeyChallenge: (uuid) => call(`/api/supplier/v1/me/submission-keys/${uuid}/challenge`, { method: 'POST', body: { channel: 'PORTAL' } }, 'Unable to issue the signing-key challenge.'),
    registerPortalKey: (uuid, body) => call(`/api/supplier/v1/me/submission-keys/${uuid}/register`, { method: 'POST', body: { ...body, channel: 'PORTAL' } }, 'Unable to register the portal signing key.'),
    resetKey: (uuid, reason) => call(`/api/supplier/v1/me/submission-keys/${uuid}/reset`, { method: 'POST', body: { reason } }, 'Unable to reset the submission key.'),
    submitBid: (uuid, body) => call(`/api/supplier/v1/tenders/${uuid}/bid-submit`, { method: 'POST', body }, 'Unable to submit the bid.'),
    addToMyBids: (uuid) => call('/api/supplier/v1/bids', { method: 'POST', body: { tender_uuid: uuid } }, 'Unable to add the tender to My Bids.'),
    listBids: () => call('/api/supplier/v1/bids', {}, 'Unable to retrieve bids.'),
    recallBid: (uuid) => call(`/api/supplier/v1/bids/${uuid}/recall`, { method: 'POST' }, 'Unable to recall the submitted response.'),
  };
};
