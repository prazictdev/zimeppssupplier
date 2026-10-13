<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <div>
      <NuxtLink :to="`/invoice/submission-key/${route.params.uuid}`" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Invoice
      </NuxtLink>
    </div>

    <!-- Paynow callback verification -->
    <div v-if="verifying" class="flex flex-col items-center gap-4 py-24">
      <span class="loading loading-spinner loading-lg text-primary" />
      <p class="text-sm font-medium text-base-content">Verifying your Paynow payment…</p>
      <p class="text-xs text-base-content/40">Please wait, this may take a few seconds.</p>
    </div>

    <template v-else-if="verifyResult">
      <div
        class="rounded-xl px-5 py-5 flex items-start gap-4"
        :class="verifyResult.success ? 'border border-success/40 bg-success/5' : verifyResult.processing ? 'border border-warning/40 bg-warning/5' : 'border border-error/40 bg-error/5'"
      >
        <div class="rounded-xl p-3 shrink-0" :class="verifyResult.success ? 'bg-success/15' : verifyResult.processing ? 'bg-warning/15' : 'bg-error/15'">
          <Icon :name="verifyResult.success ? 'lucide:circle-check' : verifyResult.processing ? 'lucide:clock' : 'lucide:circle-x'" class="h-6 w-6"
                :class="verifyResult.success ? 'text-success' : verifyResult.processing ? 'text-warning' : 'text-error'" />
        </div>
        <div class="flex-1">
          <p class="font-semibold" :class="verifyResult.success ? 'text-success' : verifyResult.processing ? 'text-warning' : 'text-error'">
            {{ verifyResult.success ? 'Payment Verified' : verifyResult.processing ? 'Payment Processing' : 'Payment Not Confirmed' }}
          </p>
          <p class="text-sm text-base-content/60 mt-0.5">{{ verifyResult.message }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <NuxtLink :to="`/invoice/submission-key/${route.params.uuid}`" class="btn btn-sm" :class="verifyResult.success ? 'btn-success' : 'btn-warning'">
              <Icon name="lucide:receipt" class="h-4 w-4" />
              {{ verifyResult.success ? 'View invoice' : 'Back to invoice' }}
            </NuxtLink>
            <NuxtLink to="/submission-keys" class="btn btn-sm btn-ghost">
              Submission Keys
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="pending" class="flex flex-col items-center gap-3 py-24">
      <span class="loading loading-spinner loading-lg text-base-content/30" />
      <p class="text-sm text-base-content/40">Loading invoice…</p>
    </div>

    <template v-else-if="!invoice">
      <div class="card border border-base-200 bg-base-100">
        <div class="card-body flex flex-col items-center gap-3 py-16 text-center text-base-content/40">
          <Icon name="lucide:file-x" class="h-10 w-10" />
          <p class="font-semibold">Invoice not found</p>
        </div>
      </div>
    </template>

    <template v-else-if="invoice.status === 'PAID'">
      <div class="rounded-xl border border-success/40 bg-success/5 px-5 py-5 flex items-center gap-4">
        <div class="rounded-xl bg-success/15 p-3 shrink-0">
          <Icon name="lucide:circle-check" class="h-6 w-6 text-success" />
        </div>
        <div>
          <p class="font-semibold text-success">Invoice Already Settled</p>
          <p class="text-sm text-base-content/60 mt-0.5">This submission-key invoice has already been paid. The user can generate their keypair now.</p>
        </div>
      </div>
    </template>

    <template v-else>
      <div>
        <h1 class="text-xl font-bold text-base-content">Payment</h1>
        <p class="text-sm text-base-content/50 mt-0.5">Settle invoice <span class="font-mono font-medium text-base-content">{{ invoice.invoice_number }}</span></p>
      </div>

      <div class="rounded-xl border border-base-200 bg-base-100 overflow-hidden">
        <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-base-200 bg-base-50">
          <div class="flex items-center gap-3 min-w-0">
            <div class="rounded-lg bg-primary/10 p-2 shrink-0">
              <Icon name="lucide:key-round" class="h-4 w-4 text-primary" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-base-content">Bid submission key — annual licence</p>
              <p class="text-xs text-base-content/50">Ref: <span class="font-mono">{{ invoice.paymentreference }}</span></p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs text-base-content/40 uppercase tracking-wide">Total Due</p>
            <p class="font-bold text-lg text-green-700">{{ currencyCode }} {{ formatNum(invoice.total) }}</p>
          </div>
        </div>
      </div>

      <div v-if="walletLoading" class="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
        <span class="loading loading-spinner loading-sm text-primary shrink-0" />
        <div>
          <p class="text-sm font-medium text-primary">Checking your PRAZ CRM wallet…</p>
          <p class="text-xs text-base-content/60">Payment options will be available after the balance check.</p>
        </div>
      </div>

      <template v-else>
        <div
          class="rounded-xl border px-5 py-4"
          :class="canSettleFromWallet
            ? 'border-success/40 bg-success/5'
            : walletError
              ? 'border-warning/40 bg-warning/5'
              : 'border-base-300 bg-base-200/40'"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="rounded-lg p-2" :class="canSettleFromWallet ? 'bg-success/15' : 'bg-base-200'">
                <Icon name="lucide:wallet-cards" class="h-5 w-5" :class="canSettleFromWallet ? 'text-success' : 'text-base-content/60'" />
              </div>
              <div>
                <p class="text-sm font-semibold">PRAZ CRM Wallet</p>
                <p v-if="walletError" class="text-xs text-warning">{{ walletError }}</p>
                <p v-else class="text-xs text-base-content/60">
                  {{ wallet?.currency || currencyCode }} {{ formatNum(walletBalance) }}
                  available in the {{ wallet?.type || 'applicable' }} wallet
                </p>
              </div>
            </div>

            <button
              v-if="canSettleFromWallet"
              type="button"
              class="btn btn-success btn-sm gap-2"
              :disabled="submitting"
              @click="settleFromWallet"
            >
              <span v-if="submitting" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:wallet-cards" class="h-4 w-4" />
              Settle Invoice
            </button>
          </div>
          <p v-if="!walletError && !canSettleFromWallet" class="mt-2 text-xs text-base-content/50">
            The wallet balance is insufficient for this {{ currencyCode }} {{ formatNum(invoice.total) }} invoice.
            Choose another payment method below.
          </p>
        </div>

        <template v-if="!canSettleFromWallet">
          <ApplicationStepPayment :application="paymentApplication" @payment="onPaymentUpdate" />

          <div class="flex items-center justify-between gap-4">
            <NuxtLink :to="`/invoice/submission-key/${route.params.uuid}`" class="btn btn-ghost btn-sm">Cancel</NuxtLink>
            <button class="btn btn-primary gap-2" :disabled="!paymentData || submitting" @click="handlePayment">
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              <template v-else>
                <Icon name="lucide:send" class="h-4 w-4" />
                Submit Payment
              </template>
            </button>
          </div>
        </template>
      </template>
    </template>

  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Submission Key Payment' });

const route = useRoute();
const toast = useToast();
const { getInvoice } = useBidderSubmissionKeyHelper();
const { initiateOnline, verifyPaynow, payRtgs, payZipit, payWallet } = usePayment();
const { confirmPaymentReturn } = useCrmPaymentReturn();
const { getWalletBalances, getInvoiceWalletBalance } = useWallet();

const invoice = ref(null);
const pending = ref(true);
const paymentData = ref(null);
const submitting = ref(false);
const verifying = ref(false);
const verifyResult = ref(null);
const wallet = ref(null);
const walletLoading = ref(false);
const walletError = ref(null);

onMounted(async () => {
  const { data } = await getInvoice(route.params.uuid);
  invoice.value = data;

  const paymentReference = route.query.payment_reference;
  if (typeof paymentReference === 'string' && paymentReference && data) {
    verifying.value = true;
    const status = await confirmPaymentReturn(data.id, paymentReference);
    const succeeded = status?.status === 'PAID';
    verifyResult.value = {
      success: succeeded,
      processing: status?.status === 'PROCESSING',
      message: succeeded
        ? 'Payment confirmed successfully.'
        : (status?.status === 'PROCESSING'
            ? 'Your payment succeeded and PRAZ CRM is still receipting the invoice. Please refresh shortly.'
            : 'Payment could not be confirmed.'),
    };
    if (succeeded) {
      getWalletBalances();
      await navigateTo(`/invoice/settle/${data.uuid}`, { replace: true });
      return;
    }
    verifying.value = false;
    pending.value = false;
    return;
  }

  const transactionid = route.query.transactionid;
  if (transactionid && data) {
    verifying.value = true;
    const bankAccount = data.inventoryitem?.bankaccounttype?.bankaccounts?.[0] ?? null;
    const res = await verifyPaynow({
      transactionid,
      currency_id: data.currency_id,
      amount: data.total,
      bankaccounttype_id: data.inventoryitem?.bankaccounttype?.id ?? null,
      bankaccount_id: bankAccount?.id ?? null,
    });
    const succeeded = res?.status === true;
    verifyResult.value = {
      success: succeeded,
      message: res?.message ?? (succeeded ? 'Payment confirmed successfully.' : 'Payment could not be confirmed.'),
    };
    if (succeeded) {
      getWalletBalances();
      await navigateTo(`/invoice/settle/${data.uuid}`, { replace: true });
      return;
    }
    verifying.value = false;
  }

  pending.value = false;

  if (data && data.status !== 'PAID' && !verifyResult.value) {
    await loadWalletBalance();
  }
});

const currencyCode = computed(() => invoice.value?.currency?.code ?? '—');
const walletBalance = computed(() => {
  const parsed = Number(String(wallet.value?.balance ?? '0').replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : 0;
});
const canSettleFromWallet = computed(() => {
  const amountDue = Number(invoice.value?.total ?? 0);

  return !walletLoading.value
    && !walletError.value
    && amountDue > 0
    && walletBalance.value >= amountDue;
});
const paymentApplication = computed(() => ({
  invoice: invoice.value,
  currency: invoice.value?.currency ?? null,
}));

const onPaymentUpdate = (p) => { paymentData.value = p; };

async function loadWalletBalance() {
  const invoiceId = invoice.value?.id;
  if (!invoiceId) return;

  walletLoading.value = true;
  walletError.value = null;
  wallet.value = null;

  try {
    wallet.value = await getInvoiceWalletBalance(invoiceId);
    if (!wallet.value) {
      walletError.value = 'Wallet balance is unavailable. You can still use another payment method.';
    }
  } catch {
    walletError.value = 'Wallet balance is unavailable. You can still use another payment method.';
  } finally {
    walletLoading.value = false;
  }
}

async function settleFromWallet() {
  const invoiceId = invoice.value?.id;
  if (!invoiceId || !canSettleFromWallet.value || submitting.value) return;

  submitting.value = true;
  try {
    const result = await payWallet(invoiceId);

    if (result?.status) {
      getWalletBalances();
      toast.success({
        title: 'Wallet payment settled',
        message: 'The assigned user can now generate their submission keypair.',
        position: 'topRight',
        layout: 2,
      });
      await navigateTo('/submission-keys');
      return;
    }

    toast.error({
      title: 'Wallet payment failed',
      message: result?.message ?? 'Unable to settle the invoice from the wallet.',
      position: 'topRight',
      layout: 2,
    });
    await loadWalletBalance();
  } finally {
    submitting.value = false;
  }
}

async function handlePayment() {
  const p = paymentData.value;
  const invoiceId = invoice.value?.id;
  if (!p || !invoiceId) return;

  submitting.value = true;
  try {
    let res;

    if (p.channel === 'wallet') {
      res = await payWallet(invoiceId);
      if (res?.status) {
        getWalletBalances();
        toast.success({
          title: 'Wallet payment settled',
          message: 'The assigned user can now generate their submission keypair.',
          position: 'topRight',
          layout: 2,
        });
        await navigateTo('/submission-keys');
      } else {
        toast.error({
          title: 'Wallet payment failed',
          message: res?.message ?? 'Wallet payment failed.',
          position: 'topRight',
          layout: 2,
        });
      }
      return;
    }

    if (p.channel === 'online') {
      const returnUrl = `${window.location.origin}/invoice/settle/${invoice.value.uuid}`;
      res = await initiateOnline(invoiceId, p.method, returnUrl);
      if (res?.status && res?.data?.settled) {
        toast.success({
          title: 'Invoice already settled',
          message: res?.message ?? 'PRAZ CRM confirmed the payment and eGP has been updated.',
          position: 'topRight',
          layout: 2,
        });
        await navigateTo('/submission-keys');
      } else if (res?.status && res?.data?.redirect_url) {
        navigateTo(res.data.redirect_url, { external: true });
      } else if (res && !res.status) {
        toast.error({
          title: 'Online payment failed',
          message: res?.message ?? 'Failed to initiate online payment.',
          position: 'topRight',
          layout: 2,
        });
      }
      return;
    }

    if (p.transferType === 'rtgs') {
      res = await payRtgs(invoiceId, {
        source_bank: p.sourceBank,
        account_name: p.accountName,
        account_number: p.accountNumber,
        payment_date: p.paymentDate,
        source_reference: p.sourceReference,
        proof_key: p.proofKey,
      });
    } else if (p.transferType === 'zipit') {
      res = await payZipit(invoiceId, {
        source_bank: p.sourceBank,
        account_name: p.accountName,
        account_number: p.accountNumber,
        payment_date: p.paymentDate,
        stan_code: p.stanCode,
      });
    }

    if (res?.status) {
      toast.success({
        title: 'Payment submitted',
        message: 'Your payment is awaiting verification.',
        position: 'topRight',
        layout: 2,
      });
      await navigateTo('/submission-keys');
    } else if (res && !res.status) {
      toast.error({
        title: 'Payment submission failed',
        message: res?.message ?? 'Payment submission failed.',
        position: 'topRight',
        layout: 2,
      });
    }
  } finally {
    submitting.value = false;
  }
}

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);
}
</script>
