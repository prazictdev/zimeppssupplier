<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <div>
      <NuxtLink to="/submission-keys" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Submission Keys
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex flex-col items-center gap-3 py-24">
      <span class="loading loading-spinner loading-lg text-base-content/30" />
      <p class="text-sm text-base-content/40">Loading invoice…</p>
    </div>

    <div v-else-if="!invoice" class="card border border-base-200 bg-base-100">
      <div class="card-body flex flex-col items-center gap-3 py-16 text-center text-base-content/40">
        <Icon name="lucide:file-x" class="h-10 w-10" />
        <p class="font-semibold">Invoice not found</p>
        <p class="text-sm">This submission-key invoice could not be loaded.</p>
      </div>
    </div>

    <template v-else>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-base-content">Bid Submission Key Invoice</h1>
          <p class="text-sm text-base-content/50 mt-0.5">Annual signing key licence — pay this invoice to enable keypair generation for the bidder user.</p>
        </div>
        <button type="button" class="btn btn-outline btn-sm gap-2 shrink-0" @click="printInvoice">
          <Icon name="lucide:printer" class="h-4 w-4" />
          <span class="hidden sm:inline">Print PDF</span>
          <span class="sm:hidden">Print</span>
        </button>
      </div>

      <div class="rounded-xl border border-base-200 bg-base-100 overflow-hidden">
        <!-- Invoice header -->
        <div class="bg-green-600 px-6 py-5 text-white flex items-start justify-between gap-4">
          <div>
            <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Bid Submission Key Invoice</p>
            <p class="text-2xl font-bold mt-0.5">{{ invoice.invoice_number }}</p>
            <p class="text-green-100 text-sm mt-1">{{ invoiceDate }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Status</p>
            <span :class="['badge badge-sm mt-1', statusBadge(invoice.status)]">{{ invoice.status }}</span>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Billing -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-2">Billed To</p>
              <p class="font-semibold text-base-content">{{ company?.name ?? '—' }}</p>
              <p class="text-sm text-base-content/60">{{ company?.regnumber ?? '' }}</p>
              <p class="text-sm text-base-content/60">{{ company?.email ?? '' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-2">Issued By</p>
              <p class="font-semibold text-base-content">Zimbabwe Electronic Procurement</p>
              <p class="text-sm text-base-content/60">PRAZ — Bid Submission Authority</p>
              <p class="text-sm text-base-content/60">registrations@egp.gov.zw</p>
            </div>
          </div>

          <div class="divider my-0" />

          <!-- Line item (single fee) -->
          <div>
            <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-3">Annual Submission Key Fee</p>
            <table class="table table-sm w-full">
              <thead>
                <tr class="text-xs text-base-content/40 uppercase">
                  <th>#</th>
                  <th>Description</th>
                  <th class="text-right">Amount ({{ currencyCode }})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="font-mono text-xs text-base-content/50">1</td>
                  <td>
                    <p class="font-medium text-base-content">Bid submission key — annual licence</p>
                    <p class="text-xs text-base-content/50">Issued for one calendar year on registration.</p>
                  </td>
                  <td class="text-right font-semibold text-sm">{{ currencyCode }} {{ formatNum(invoice.total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t border-base-200">
                  <td colspan="2" class="font-bold text-base-content text-right">Total Due</td>
                  <td class="text-right font-bold text-lg text-green-700">
                    {{ currencyCode }} {{ formatNum(invoice.total) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Bank accounts -->
          <div v-if="bankAccounts.length">
            <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-3">Bank Details</p>
            <div class="space-y-3">
              <div
                v-for="account in bankAccounts"
                :key="account.id"
                class="rounded-lg border border-base-200 bg-base-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm"
              >
                <div>
                  <p class="text-xs text-base-content/40 uppercase tracking-wide">Bank</p>
                  <p class="font-semibold text-base-content">{{ account.bank?.name ?? '—' }}</p>
                </div>
                <div>
                  <p class="text-xs text-base-content/40 uppercase tracking-wide">Account Number</p>
                  <p class="font-mono font-semibold text-base-content">{{ account.accountnumber }}</p>
                </div>
                <div v-if="account.branchname">
                  <p class="text-xs text-base-content/40 uppercase tracking-wide">Branch</p>
                  <p class="text-base-content">{{ account.branchname }}</p>
                </div>
                <div v-if="account.branchcode">
                  <p class="text-xs text-base-content/40 uppercase tracking-wide">Branch Code</p>
                  <p class="font-mono text-base-content">{{ account.branchcode }}</p>
                </div>
                <div v-if="account.swiftcode">
                  <p class="text-xs text-base-content/40 uppercase tracking-wide">SWIFT</p>
                  <p class="font-mono text-base-content">{{ account.swiftcode }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment reference -->
          <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800 space-y-2">
            <div class="flex items-center gap-2 font-semibold">
              <Icon name="lucide:info" class="h-4 w-4 shrink-0" />
              Payment Instructions
            </div>
            <p>Use the reference below as the description / narration when making payment. Our system will automatically match the transaction and settle this invoice — the user can then generate their keypair.</p>
            <div class="flex items-center gap-3 rounded-lg border border-blue-300 bg-white px-4 py-2.5 mt-1">
              <span class="text-xs text-blue-400 uppercase tracking-wide shrink-0">Payment Reference</span>
              <span class="font-mono font-bold text-blue-900 text-base tracking-wider">{{ invoice.paymentreference ?? invoice.invoice_number }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="invoice.status === 'PAID'" class="rounded-xl border border-success/40 bg-success/5 px-5 py-5 flex items-center gap-4">
        <div class="rounded-xl bg-success/15 p-3 shrink-0">
          <Icon name="lucide:circle-check" class="h-6 w-6 text-success" />
        </div>
        <div>
          <p class="font-semibold text-success">Invoice Settled</p>
          <p class="text-sm text-base-content/60 mt-0.5">The user can now generate their bid submission keypair.</p>
        </div>
      </div>

      <div v-else class="flex justify-end">
        <NuxtLink :to="`/invoice/submission-key/pay/${route.params.uuid}`" class="btn btn-primary gap-2">
          <Icon name="lucide:credit-card" class="h-4 w-4" />
          Proceed to Payment
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Submission Key Invoice' });

const route = useRoute();
const { getInvoice } = useBidderSubmissionKeyHelper();
const { user } = useSanctumAuth();

const company = computed(() => user.value?.data?.company ?? null);
const invoice = ref(null);
const pending = ref(true);

onMounted(async () => {
  const { data } = await getInvoice(route.params.uuid);
  invoice.value = data;
  pending.value = false;
});

const currencyCode = computed(() => invoice.value?.currency?.code ?? '—');
const bankAccounts = computed(() => invoice.value?.inventoryitem?.bankaccounttype?.bankaccounts ?? []);
const invoiceDate = computed(() => {
  const d = invoice.value?.invoice_date;
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-ZW', { day: '2-digit', month: 'long', year: 'numeric' });
});

const statusBadge = (s) => ({
  PAID: 'bg-green-400/20 text-green-200 border-green-300',
  AWAITING: 'bg-blue-400/20 text-blue-200 border-blue-300',
  PENDING: 'bg-yellow-400/20 text-yellow-200 border-yellow-300',
})[s] ?? 'bg-yellow-400/20 text-yellow-200 border-yellow-300';

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0);
}

function printInvoice() {
  const inv = invoice.value;
  const comp = company.value;
  const cc = currencyCode.value;
  const date = invoiceDate.value;
  const accounts = bankAccounts.value;
  const logoUrl = `${window.location.origin}/img/logo.png`;

  const bankRows = accounts.map((a) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Bank</div><strong>${a.bank?.name ?? '—'}</strong></div>
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Account Number</div><strong style="font-family:monospace;">${a.accountnumber}</strong></div>
      ${a.branchname ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Branch</div>${a.branchname}</div>` : ''}
      ${a.branchcode ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Branch Code</div><span style="font-family:monospace;">${a.branchcode}</span></div>` : ''}
      ${a.swiftcode ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">SWIFT</div><span style="font-family:monospace;">${a.swiftcode}</span></div>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Submission Key Invoice ${inv?.invoice_number ?? ''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;font-size:13px;line-height:1.5}
  .page{max-width:760px;margin:0 auto;padding:32px 24px}
  .logo-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .logo-bar img{height:48px;width:auto;object-fit:contain}
  .logo-bar-meta{text-align:right;font-size:11px;color:#6b7280;line-height:1.6}
  .header{background:#16a34a;color:#fff;border-radius:10px 10px 0 0;padding:24px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-title{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#bbf7d0}
  .header-number{font-size:26px;font-weight:700;margin:4px 0}
  .body{border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px}
  .section-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px}
  .billing{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px}
  hr{border:none;border-top:1px solid #e5e7eb;margin:16px 0}
  table{width:100%;border-collapse:collapse;font-size:13px}
  thead tr{background:#f9fafb}
  th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;border-bottom:1px solid #e5e7eb}
  th:last-child,td:last-child{text-align:right}
  td{padding:8px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
  tfoot td{border-top:2px solid #e5e7eb;border-bottom:none;font-weight:700;padding-top:12px}
  tfoot td:last-child{font-size:16px;color:#16a34a}
  .note{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;font-size:12px;color:#1e40af;margin-top:20px}
  .ref-box{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px}
  .ref-value{font-family:monospace;font-size:16px;font-weight:700;color:#1e3a8a;letter-spacing:.1em}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:0}}
</style></head><body>
<div class="page">
  <div class="logo-bar"><img src="${logoUrl}" alt="eGP" onerror="this.style.display='none'"><div class="logo-bar-meta"><strong>Procurement Regulatory Authority of Zimbabwe</strong><br>Electronic Procurement Platform</div></div>
  <div class="header"><div><div class="header-title">Bid Submission Key Invoice</div><div class="header-number">${inv?.invoice_number ?? '—'}</div><div>${date}</div></div></div>
  <div class="body">
    <div class="billing">
      <div><div class="section-label">Billed To</div><strong>${comp?.name ?? '—'}</strong><br><span style="color:#6b7280">${comp?.regnumber ?? ''}</span><br><span style="color:#6b7280">${comp?.email ?? ''}</span></div>
      <div><div class="section-label">Issued By</div><strong>Zimbabwe Electronic Procurement</strong><br><span style="color:#6b7280">PRAZ — Bid Submission Authority</span></div>
    </div>
    <hr>
    <div class="section-label">Annual Submission Key Fee</div>
    <table><thead><tr><th>#</th><th>Description</th><th>Amount (${cc})</th></tr></thead>
    <tbody><tr><td>1</td><td><strong>Bid submission key — annual licence</strong><br><span style="font-size:11px;color:#888;">Issued for one calendar year on registration.</span></td><td>${cc} ${formatNum(inv?.total)}</td></tr></tbody>
    <tfoot><tr><td colspan="2" style="text-align:right;">Total Due</td><td>${cc} ${formatNum(inv?.total)}</td></tr></tfoot></table>
    ${bankRows ? `<hr><div class="section-label">Bank Details</div>${bankRows}` : ''}
    <div class="note"><p><strong>Payment Instructions</strong></p><p>Use the reference below as the description or narration when making payment.</p><div class="ref-box"><span style="font-size:10px;color:#93c5fd;text-transform:uppercase;letter-spacing:.08em;">Payment Reference</span><span class="ref-value">${inv?.paymentreference ?? inv?.invoice_number ?? '—'}</span></div></div>
  </div>
</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
</script>
