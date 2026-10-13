export default function useAutorenewal() {
  const store = useAutorenewalStore()

  const list = () => store.fetch()
  const subscribe = (registrationId) => store.subscribe(registrationId)
  const cancel = (id) => store.cancel(id)

  return {
    list,
    subscribe,
    cancel,
  }
}
