/**
 * Lets a signed-in supplier authorise (or deny) a desktop-app pairing code,
 * completing the "pair from browser" device-authorization flow.
 */
export const useDesktopAuthHelper = () => {
  const client = useSupplierClient();

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback;

  const lookupDevice = async (userCode) => {
    try {
      const data = await client(`/api/supplier/desktop/device/lookup?user_code=${encodeURIComponent(userCode)}`, { method: 'GET' });
      return { ok: true, data: data?.data ?? null, error: null };
    } catch (err) {
      const status = err?.response?.status ?? err?.status;
      if (status === 404) {
        return { ok: false, data: null, error: 'That pairing code was not found.', notFound: true };
      }
      return { ok: false, data: null, error: extractError(err, 'Could not look up that code.') };
    }
  };

  const approveDevice = async (userCode) => {
    try {
      const data = await client('/api/supplier/desktop/device/approve', { method: 'POST', body: { user_code: userCode } });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Could not authorise the desktop app.') };
    }
  };

  const denyDevice = async (userCode) => {
    try {
      const data = await client('/api/supplier/desktop/device/deny', { method: 'POST', body: { user_code: userCode } });
      return { ok: true, data, error: null };
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Could not deny the request.') };
    }
  };

  return { lookupDevice, approveDevice, denyDevice };
};
