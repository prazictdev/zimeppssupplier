import { supplierPageAccess } from '~/utils/supplierPermissions'

export default defineNuxtRouteMiddleware((to) => {
  const access = supplierPageAccess(to.path)
  if (access.public) return

  const { user } = useSanctumAuth()
  if (!user.value) return

  const deny = () => {
    return navigateTo({
      path: '/access-denied',
      query: { message: 'You do not have permission to access this page.' },
    })
  }

  // Unknown protected pages fail closed until their permission is registered.
  if (access.permissions === null) {
    return deny()
  }

  if (access.permissions.length === 0) return

  const permissions = user.value?.data?.permissions ?? []
  if (!access.permissions.some(permission => permissions.includes(permission))) {
    return deny()
  }
})
