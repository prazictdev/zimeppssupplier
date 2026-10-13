const normaliseMessage = (message) => String(message || 'You do not have permission to perform this action.')
  .replace(/&#x20;|&#32;|&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export const usePermissionDenied = () => {
  const denial = useState('supplier-permission-denied', () => null)

  const showPermissionDenied = (message = null) => {
    denial.value = {
      message: normaliseMessage(message),
      occurredAt: Date.now(),
    }
  }

  const clearPermissionDenied = () => {
    denial.value = null
  }

  return {
    denial: readonly(denial),
    showPermissionDenied,
    clearPermissionDenied,
  }
}
