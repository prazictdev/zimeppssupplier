export const useBidderSubmissionKeyHelper = () => {
  const client = useSupplierClient();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  const list = async () => {
    try {
      const data = await client('/api/supplier/v1/me/submission-keys', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load submission keys.') };
    }
  };

  const eligibleUsers = async () => {
    try {
      const data = await client('/api/supplier/v1/me/submission-keys/eligible-users', { method: 'GET' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load eligible users.') };
    }
  };

  const apply = async (payload) => {
    try {
      const data = await client('/api/supplier/v1/me/submission-keys', { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to apply for licences.') };
    }
  };

  const assign = async (uuid, payload) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/${uuid}/assign`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to assign the licence.') };
    }
  };

  const challenge = async (uuid) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/${uuid}/challenge`, { method: 'POST' });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to issue challenge.') };
    }
  };

  const register = async (uuid, payload) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/${uuid}/register`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to register the key.') };
    }
  };

  const revoke = async (uuid, payload) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/${uuid}/revoke`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to revoke the key.') };
    }
  };

  const reset = async (uuid, payload) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/${uuid}/reset`, { method: 'POST', body: payload });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to reset the licence.') };
    }
  };

  const getInvoice = async (invoiceUuid) => {
    try {
      const data = await client(`/api/supplier/v1/me/submission-keys/invoice/${invoiceUuid}`, { method: 'GET' });
      return { ok: true, data: data?.data ?? null, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load the invoice.') };
    }
  };

  return { list, eligibleUsers, apply, assign, challenge, register, revoke, reset, getInvoice };
};
