import { usePaymentStore } from '~/stores/usePaymentStore'

export default function usePayment() {
  const paymentStore = usePaymentStore()

  const getChannels = () => paymentStore.fetchChannels()

  const initiateOnline = (invoiceId, methodOrReturnUrl, returnUrl) =>
    paymentStore.initiateOnline(invoiceId, methodOrReturnUrl, returnUrl)

  const initiatePaynow = (invoiceData) =>
    paymentStore.initiatePaynow(invoiceData)

  const verifyPaynow = (data) =>
    paymentStore.verifyPaynow(data)

  const payRtgs = (invoiceId, formData) =>
    paymentStore.payRtgs(invoiceId, formData)

  const payBank = (invoiceId, data) =>
    paymentStore.payBank(invoiceId, data)

  const payZipit = (invoiceId, data) =>
    paymentStore.payZipit(invoiceId, data)

  const payWallet = (invoiceId) =>
    paymentStore.payWallet(invoiceId)

  const getTransactionStatus = (invoiceId, paymentReference) =>
    paymentStore.fetchTransactionStatus(invoiceId, paymentReference)

  const listTransactions = () => paymentStore.fetchTransactions()

  const getVerificationFindings = (transactionUuid) =>
    paymentStore.fetchVerificationFindings(transactionUuid)

  const submitCorrection = (transactionUuid, payload) =>
    paymentStore.submitVerificationCorrection(transactionUuid, payload)

  return {
    channels: computed(() => paymentStore.channels),
    pending: computed(() => paymentStore.pending),
    transactionStatus: computed(() => paymentStore.transactionStatus),
    verificationFindings: computed(() => paymentStore.verificationFindings),
    getChannels,
    initiateOnline,
    initiatePaynow,
    verifyPaynow,
    payBank,
    payRtgs,
    payZipit,
    payWallet,
    getTransactionStatus,
    listTransactions,
    getVerificationFindings,
    submitCorrection,
  }
}
