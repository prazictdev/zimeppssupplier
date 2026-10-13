export const useConsultancyEoi = () => {
  const client = useSupplierClient()

  const request = async (url, options = {}) => {
    try {
      const data = await client(url, options)
      return { ok: true, data, error: '' }
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: error?.data?.errors
          ? Object.values(error.data.errors).flat().join(' ')
          : error?.data?.message ?? 'The request could not be completed.',
      }
    }
  }

  return {
    list: () => request('/api/supplier/v1/consultancy-eois'),
    show: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}`),
    getSealingKey: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}/sealing-key`),
    addToMyBids: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}/my-bids`, { method: 'POST' }),
    recall: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}/response/recall`, { method: 'POST' }),
    searchJointVenturePartners: (uuid, search) => request(`/api/supplier/v1/consultancy-eois/${uuid}/joint-venture-partners?search=${encodeURIComponent(search)}`),
    fee: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}/spoc-fee`),
    generateFeeInvoice: uuid => request(`/api/supplier/v1/consultancy-eois/${uuid}/spoc-fee/invoice`, { method: 'POST' }),
    submit: (uuid, payload) => request(`/api/supplier/v1/consultancy-eois/${uuid}/response`, { method: 'PUT', body: payload }),
  }
}
