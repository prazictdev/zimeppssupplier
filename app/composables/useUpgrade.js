export default function useUpgrade() {
  const client = useSupplierClient()

  async function getEligibleGroups() {
    try {
      const res = await client('/api/supplier/v1/upgrade/groups', { method: 'GET' })
      return res?.data ?? null
    } catch {
      return null
    }
  }

  async function previewUpgrade(toGroupId, currencyId) {
    try {
      const res = await client('/api/supplier/v1/upgrade/preview', {
        method: 'POST',
        body: { to_suppliergroup_id: toGroupId, currency_id: currencyId },
      })
      return res?.data ?? null
    } catch {
      return null
    }
  }

  async function initiateUpgrade(toGroupId, currencyId) {
    try {
      return await client('/api/supplier/v1/upgrade/initiate', {
        method: 'POST',
        body: { to_suppliergroup_id: toGroupId, currency_id: currencyId },
      })
    } catch (err) {
      return { status: false, message: err?.data?.message ?? 'Failed to initiate upgrade.' }
    }
  }

  async function getUpgradeInvoice(uuid) {
    try {
      const res = await client(`/api/supplier/v1/upgrade/invoice/${uuid}`, { method: 'GET' })
      return res?.data ?? null
    } catch {
      return null
    }
  }

  return { getEligibleGroups, previewUpgrade, initiateUpgrade, getUpgradeInvoice }
}
