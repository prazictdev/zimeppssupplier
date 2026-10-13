export default function useWallet() {
  const walletStore = useWalletStore()

  const getWalletBalances = () => walletStore.fetchWallets()
  const getWalletBalance = (bankaccounttypeId, currencyId) => walletStore.fetchWallet(bankaccounttypeId, currencyId)
  const getInvoiceWalletBalance = invoiceId => walletStore.fetchInvoiceWallet(invoiceId)

  return {
    getWalletBalances,
    getWalletBalance,
    getInvoiceWalletBalance,
  }
}
