export const useBidBondManagement = () => {
  const client = useSupplierClient()

  const list = async (page = 1) => {
    try {
      return { ok: true, data: await client(`/api/supplier/v1/bid-bonds?page=${page}`), error: null }
    } catch (error) {
      return { ok: false, data: null, error: error?.data?.message ?? error?.message ?? 'Unable to load bid bonds.' }
    }
  }

  return { list }
}
