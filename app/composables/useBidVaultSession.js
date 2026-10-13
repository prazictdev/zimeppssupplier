const STORAGE_KEY = 'egp.bid-vault.unlocked-session.v1'

const bytesToBase64 = (bytes) => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

const base64ToBytes = (value) => {
  const binary = atob(value)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

const vaultFingerprint = record => [
  record?.uuid,
  record?.version,
  record?.updated_at,
  record?.encrypted_master_key,
].join('|')

export const useBidVaultSession = () => {
  const clear = () => {
    if (!import.meta.client) return
    try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* storage unavailable */ }
  }

  const remember = (record, masterKey, userId) => {
    if (!import.meta.client || !record?.uuid || !masterKey || !userId) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        user_id: Number(userId),
        vault_uuid: record.uuid,
        vault_fingerprint: vaultFingerprint(record),
        master_key: bytesToBase64(masterKey),
      }))
    } catch {
      // Private browsing or browser policy may disable session storage. The
      // vault remains usable, but the user will be asked again after navigation.
    }
  }

  const restore = (record, userId) => {
    if (!import.meta.client || !record?.uuid || !userId) return null
    try {
      const cached = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
      const matches = cached
        && Number(cached.user_id) === Number(userId)
        && cached.vault_uuid === record.uuid
        && cached.vault_fingerprint === vaultFingerprint(record)
      if (!matches) {
        clear()
        return null
      }

      const key = base64ToBytes(cached.master_key)
      if (key.length !== 32) {
        clear()
        return null
      }
      return key
    } catch {
      clear()
      return null
    }
  }

  return { remember, restore, clear }
}
