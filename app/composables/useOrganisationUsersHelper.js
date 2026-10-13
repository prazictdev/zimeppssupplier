export const useOrganisationUsersHelper = () => {
  const client = useSupplierClient()

  const extractError = (err, fallback) =>
    err?.data?.message ?? err?.response?._data?.message ?? err?.message ?? fallback

  const listUsers = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/users/${companyId}`, { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load users.') }
    }
  }

  const listAvailableRoles = async (companyId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/users/${companyId}/available-roles`, { method: 'GET' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to load roles.') }
    }
  }

  const inviteUser = async (companyId, payload) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/users/${companyId}`, {
        method: 'POST',
        body: payload,
      })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to invite user.') }
    }
  }

  const updateUserRoles = async (companyId, userId, roleIds) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/users/${companyId}/${userId}/roles`, {
        method: 'PUT',
        body: { role_ids: roleIds },
      })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to update roles.') }
    }
  }

  const removeUser = async (companyId, userId) => {
    try {
      const data = await client(`/api/supplier/v1/organisation/users/${companyId}/${userId}`, { method: 'DELETE' })
      return { ok: true, data, error: null }
    } catch (err) {
      return { ok: false, data: null, error: extractError(err, 'Failed to remove user.') }
    }
  }

  return {
    listUsers,
    listAvailableRoles,
    inviteUser,
    updateUserRoles,
    removeUser,
  }
}
