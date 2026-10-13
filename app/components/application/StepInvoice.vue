<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-base-content">Registration Invoice</h2>
        <p class="text-sm text-base-content/50 mt-1">Review the invoice details before proceeding to payment.</p>
      </div>
      <button
        v-if="invoice"
        type="button"
        class="btn btn-outline btn-sm gap-2 shrink-0"
        @click="printInvoice"
      >
        <Icon name="lucide:printer" class="h-4 w-4" />
        Print PDF
      </button>
    </div>

    <!-- Step instructions -->
    <div class="flex gap-3 rounded-lg border border-blue-300 bg-blue-600 px-4 py-3 text-sm text-white">
      <Icon name="lucide:info" class="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Your invoice has been generated. Please review the details — company information, selected categories, and the total amount due.
        Make note of the invoice number as your payment reference.
        When you are ready to make payment, click <strong>Next</strong> to proceed to the payment step.
      </span>
    </div>

    <!-- Invoice card -->
    <div class="rounded-xl border border-base-200 bg-base-100 overflow-hidden">

      <!-- Invoice header -->
      <div class="bg-green-600 px-6 py-5 text-white flex items-start justify-between gap-4">
        <div>
          <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Invoice</p>
          <p class="text-2xl font-bold mt-0.5">{{ invoice?.invoice_number ?? '—' }}</p>
          <p class="text-green-100 text-sm mt-1">{{ invoiceDate }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Status</p>
          <span class="badge badge-sm bg-yellow-400/20 text-yellow-200 border-yellow-300 mt-1">Pending Payment</span>
        </div>
      </div>

      <div class="p-6 space-y-6">

        <!-- Company & billing info -->
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
            <p class="text-sm text-base-content/60">Supplier Registration Authority</p>
            <p class="text-sm text-base-content/60">registrations@egp.gov.zw</p>
          </div>
        </div>

        <!-- Exchange rate notice -->
        <div v-if="invoice && invoice.exchangerate != 1" class="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-500 px-4 py-2.5 text-sm text-white">
          <Icon name="lucide:arrow-right-left" class="h-4 w-4 shrink-0" />
          <span>Exchange rate applied: <strong>1 ZIG = {{ invoice.exchangerate }} {{ invoice.currency?.code }}</strong></span>
        </div>

        <div class="divider my-0" />

        <!-- Line items -->
        <div>
          <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-3">Line Items</p>
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/40 uppercase">
                <th>#</th>
                <th>Category</th>
                <th class="text-right">Base Fee</th>
                <th class="text-right">Amount ({{ currencyCode }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in invoice?.items ?? []" :key="item.id">
                <td class="font-mono text-xs text-base-content/50">{{ idx + 1 }}</td>
                <td>
                  <p class="font-medium text-base-content">{{ item.suppliercategory?.name ?? '—' }}</p>
                  <p class="text-xs text-base-content/50">Year: {{ currentYear }}</p>
                </td>
                <td class="text-right text-sm text-base-content/60">{{ formatNum(item.base_fee) }}</td>
                <td class="text-right font-semibold text-sm">{{ currencyCode }} {{ formatNum(item.amount) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-base-200">
                <td colspan="3" class="font-bold text-base-content text-right">Total Due</td>
                <td class="text-right font-bold text-lg text-green-700">
                  {{ currencyCode }} {{ formatNum(invoice?.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Payment bank accounts -->
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

        <!-- Payment instructions -->
        <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800 space-y-2">
          <div class="flex items-center gap-2 font-semibold">
            <Icon name="lucide:info" class="h-4 w-4 shrink-0" />
            Payment Instructions
          </div>
          <p>When making payment, use the reference below as the description or narration. Our system will automatically match the transaction and settle your invoice.</p>
          <div class="flex items-center gap-3 rounded-lg border border-blue-300 bg-white px-4 py-2.5 mt-1">
            <span class="text-xs text-blue-400 uppercase tracking-wide shrink-0">Payment Reference</span>
            <span class="font-mono font-bold text-blue-900 text-base tracking-wider">{{ invoice?.paymentreference ?? '—' }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  application: { type: Object, required: true },
})

const { user } = useSanctumAuth()
const company = computed(() => user.value?.data?.company ?? null)
const currentYear = new Date().getFullYear()

const invoice = computed(() => props.application.invoice ?? null)
const currencyCode = computed(() => invoice.value?.currency?.code ?? props.application.currency?.code ?? '—')
const bankAccounts = computed(() => invoice.value?.inventoryitem?.bankaccounttype?.bankaccounts ?? [])
const invoiceDate = computed(() => {
  const d = invoice.value?.invoice_date
  if (!d) return new Date().toLocaleDateString('en-ZW', { day: '2-digit', month: 'long', year: 'numeric' })
  return new Date(d).toLocaleDateString('en-ZW', { day: '2-digit', month: 'long', year: 'numeric' })
})

function formatNum(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val ?? 0)
}

function printInvoice() {
  const inv = invoice.value
  const comp = company.value
  const cc = currencyCode.value
  const date = invoiceDate.value
  const accounts = bankAccounts.value

  const lineItems = (inv?.items ?? []).map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <strong>${item.suppliercategory?.name ?? '—'}</strong>
        <br><span style="font-size:11px;color:#888;">Year: ${currentYear}</span>
      </td>
      <td style="text-align:right;">${formatNum(item.base_fee)}</td>
      <td style="text-align:right;"><strong>${cc} ${formatNum(item.amount)}</strong></td>
    </tr>`).join('')

  const bankRows = accounts.map(a => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Bank</div><strong>${a.bank?.name ?? '—'}</strong></div>
      <div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Account Number</div><strong style="font-family:monospace;">${a.accountnumber}</strong></div>
      ${a.branchname ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Branch</div>${a.branchname}</div>` : ''}
      ${a.branchcode ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">Branch Code</div><span style="font-family:monospace;">${a.branchcode}</span></div>` : ''}
      ${a.swiftcode ? `<div><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;">SWIFT</div><span style="font-family:monospace;">${a.swiftcode}</span></div>` : ''}
    </div>`).join('')

  const exchangeNotice = inv?.exchangerate != 1
    ? `<div style="background:#f59e0b;color:#fff;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;">
        Exchange rate applied: <strong>1 ZIG = ${inv.exchangerate} ${inv.currency?.code}</strong>
       </div>`
    : ''

  const logoUrl = `${window.location.origin}/img/logo.png`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${inv?.invoice_number ?? ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; font-size: 13px; line-height: 1.5; }
    .page { max-width: 760px; margin: 0 auto; padding: 32px 24px; }
    .logo-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .logo-bar img { height: 48px; width: auto; object-fit: contain; }
    .logo-bar-meta { text-align: right; font-size: 11px; color: #6b7280; line-height: 1.6; }
    .logo-bar-meta strong { font-size: 13px; color: #111; }
    .header { background: #16a34a; color: #fff; border-radius: 10px 10px 0 0; padding: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-title { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #bbf7d0; }
    .header-number { font-size: 26px; font-weight: 700; margin: 4px 0; }
    .header-date { font-size: 13px; color: #d1fae5; }
    .header-status { text-align: right; }
    .status-badge { display: inline-block; background: rgba(250,204,21,.2); color: #fef08a; border: 1px solid #fde047; border-radius: 999px; padding: 2px 10px; font-size: 11px; margin-top: 6px; }
    .body { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 24px; }
    .section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 8px; }
    .billing { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
    .billing p { margin: 1px 0; font-size: 13px; color: #374151; }
    .billing strong { color: #111; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #f9fafb; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; border-bottom: 1px solid #e5e7eb; }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(3), td:nth-child(3) { text-align: right; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tfoot td { border-top: 2px solid #e5e7eb; border-bottom: none; font-weight: 700; padding-top: 12px; }
    tfoot td:last-child { font-size: 16px; color: #16a34a; }
    .note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #1e40af; margin-top: 20px; }
    .note p { margin-bottom: 10px; }
    .ref-box { display: flex; align-items: center; gap: 16px; background: #fff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; }
    .ref-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #93c5fd; white-space: nowrap; }
    .ref-value { font-family: monospace; font-size: 16px; font-weight: 700; color: #1e3a8a; letter-spacing: .1em; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="logo-bar">
    <img src="${logoUrl}" alt="Logo" />
    <div class="logo-bar-meta">
      <strong>Zimbabwe Electronic Procurement</strong><br>
      Supplier Registration Authority<br>
      registrations@egp.gov.zw
    </div>
  </div>
  <div class="header">
    <div>
      <div class="header-title">Invoice</div>
      <div class="header-number">${inv?.invoice_number ?? '—'}</div>
      <div class="header-date">${date}</div>
    </div>
    <div class="header-status">
      <div class="header-title">Status</div>
      <div class="status-badge">Pending Payment</div>
    </div>
  </div>
  <div class="body">
    <div class="billing">
      <div>
        <div class="section-label">Billed To</div>
        <p><strong>${comp?.name ?? '—'}</strong></p>
        ${comp?.regnumber ? `<p>${comp.regnumber}</p>` : ''}
        ${comp?.email ? `<p>${comp.email}</p>` : ''}
      </div>
    </div>

    ${exchangeNotice}
    <hr>

    <div class="section-label" style="margin-bottom:10px;">Line Items</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Category</th>
          <th>Base Fee</th>
          <th>Amount (${cc})</th>
        </tr>
      </thead>
      <tbody>${lineItems}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align:right;">Total Due</td>
          <td>${cc} ${formatNum(inv?.total)}</td>
        </tr>
      </tfoot>
    </table>

    ${accounts.length ? `
    <hr>
    <div class="section-label" style="margin-bottom:10px;">Bank Details</div>
    ${bankRows}` : ''}

    <div class="note">
      <p><strong>Payment Instructions</strong></p>
      <p>When making payment, use the reference below as the description or narration. Our system will automatically match the transaction and settle your invoice.</p>
      <div class="ref-box">
        <span class="ref-label">Payment Reference</span>
        <span class="ref-value">${inv?.paymentreference ?? '—'}</span>
      </div>
    </div>
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}
</script>
