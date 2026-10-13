const DATABASE_NAME = 'egp-supplier-drafts'
const STORE_NAME = 'eoi-responses'
const DATABASE_VERSION = 1

export const useEoiLocalDraft = () => {
  const openDatabase = () => new Promise((resolve, reject) => {
    if (!import.meta.client || !window.indexedDB) return reject(new Error('IndexedDB is not available.'))
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  const transaction = async (mode, operation) => {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, mode)
      const request = operation(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => database.close()
      tx.onerror = () => { database.close(); reject(tx.error) }
    })
  }

  return {
    loadDraft: key => transaction('readonly', store => store.get(key)),
    saveDraft: (key, payload) => transaction('readwrite', store => store.put({ key, ...payload, saved_at: new Date().toISOString() })),
    deleteDraft: key => transaction('readwrite', store => store.delete(key)),
  }
}
