<template>
  <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

    <!-- Back -->
    <div>
      <NuxtLink to="/dashboard" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Dashboard
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex flex-col items-center gap-3 py-24">
      <span class="loading loading-spinner loading-lg text-base-content/30" />
      <p class="text-sm text-base-content/40">Loading invoice…</p>
    </div>

    <!-- Error -->
    <div v-else-if="!invoice" class="card border border-base-200 bg-base-100">
      <div class="card-body flex flex-col items-center gap-3 py-16 text-center text-base-content/40">
        <Icon name="lucide:file-x" class="h-10 w-10" />
        <p class="font-semibold">Invoice not found</p>
        <p class="text-sm">This upgrade invoice could not be loaded.</p>
      </div>
    </div>

    <template v-else>

      <!-- Page header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-base-content">Supplier Group Upgrade Invoice</h1>
          <p class="text-sm text-base-content/50 mt-0.5">Review your upgrade invoice and make payment to complete the upgrade.</p>
        </div>
        <button
          type="button"
          class="btn btn-outline btn-sm gap-2 shrink-0"
          @click="printInvoice"
        >
          <Icon name="lucide:printer" class="h-4 w-4" />
          <span class="hidden sm:inline">Print PDF</span>
          <span class="sm:hidden">Print</span>
        </button>
      </div>

      <!-- Upgrade context banner -->
      <div class="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning/5 px-5 py-4">
        <div class="rounded-xl bg-warning/10 p-2.5 shrink-0">
          <Icon name="lucide:arrow-up-circle" class="h-5 w-5 text-warning" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-base-content">
            Upgrading from
            <span class="text-base-content/60">{{ invoice.current_group_name ?? '—' }}</span>
            to
            <span class="text-warning">{{ invoice.upgradesuppliergroup?.name ?? '—' }}</span>
          </p>
          <p class="text-xs text-base-content/50 mt-0.5">
            All {{ invoice.items?.length ?? 0 }} existing registration(s) are locked until this invoice is settled.
          </p>
        </div>
        <span class="badge badge-warning badge-outline shrink-0">{{ invoice.status }}</span>
      </div>

      <!-- Invoice card -->
      <div class="rounded-xl border border-base-200 bg-base-100 overflow-hidden">

        <!-- Invoice header -->
        <div class="bg-green-600 px-6 py-5 text-white flex items-start justify-between gap-4">
          <div>
            <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Upgrade Invoice</p>
            <p class="text-2xl font-bold mt-0.5">{{ invoice.invoice_number }}</p>
            <p class="text-green-100 text-sm mt-1">{{ invoiceDate }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-green-200 uppercase tracking-wide font-medium">Status</p>
            <span class="badge badge-sm bg-yellow-400/20 text-yellow-200 border-yellow-300 mt-1">Pending Payment</span>
          </div>
        </div>

        <div class="p-6 space-y-6">

          <!-- Billing info -->
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
          <div v-if="invoice.exchangerate != 1" class="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-500 px-4 py-2.5 text-sm text-white">
            <Icon name="lucide:arrow-right-left" class="h-4 w-4 shrink-0" />
            <span>Exchange rate applied: <strong>1 ZIG = {{ invoice.exchangerate }} {{ invoice.currency?.code }}</strong></span>
          </div>

          <div class="divider my-0" />

          <!-- Line items -->
          <div>
            <p class="text-xs font-medium text-base-content/50 uppercase tracking-wide mb-3">Upgrade Fee — Registered Categories</p>
            <table class="table table-sm w-full">
              <thead>
                <tr class="text-xs text-base-content/40 uppercase">
                  <th>#</th>
                  <th>Category</th>
                  <th class="text-right">Difference Fee</th>
                  <th class="text-right">Amount ({{ currencyCode }})</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in invoice.items ?? []" :key="item.id">
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
            <p>Use the reference below as the description or narration when making payment. Our system will automatically match the transaction and settle your invoice.</p>
            <div class="flex items-center gap-3 rounded-lg border border-blue-300 bg-white px-4 py-2.5 mt-1">
              <span class="text-xs text-blue-400 uppercase tracking-wide shrink-0">Payment Reference</span>
              <span class="font-mono font-bold text-blue-900 text-base tracking-wider">{{ invoice.paymentreference ?? invoice.invoice_number }}</span>
            </div>
          </div>

          <!-- Locking warning -->
          <div class="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error/80 flex gap-2">
            <Icon name="lucide:lock" class="h-4 w-4 shrink-0 mt-0.5 text-error" />
            <span>Your {{ invoice.items?.length ?? 0 }} existing registration(s) are <strong>locked</strong> and cannot be renewed until this invoice is fully settled.</span>
          </div>

        </div>
      </div>

      <!-- Status footer -->
      <div v-if="invoice.status === 'PAID'" class="rounded-xl border border-success/40 bg-success/5 px-5 py-5 flex items-center gap-4">
        <div class="rounded-xl bg-success/15 p-3 shrink-0">
          <Icon name="lucide:circle-check" class="h-6 w-6 text-success" />
        </div>
        <div>
          <p class="font-semibold text-success">Invoice Settled</p>
          <p class="text-sm text-base-content/60 mt-0.5">This upgrade invoice has been paid. Your supplier group has been upgraded and registrations are unlocked.</p>
        </div>
      </div>

      <div v-else class="flex justify-end">
        <NuxtLink :to="`/invoice/upgrade/pay/${route.params.uuid}`" class="btn btn-primary gap-2">
          <Icon name="lucide:credit-card" class="h-4 w-4" />
          Proceed to Payment
        </NuxtLink>
      </div>

    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

useHead({ title: 'Upgrade Invoice' })

const route = useRoute()
const { getUpgradeInvoice } = useUpgrade()
const { user } = useSanctumAuth()

const company = computed(() => user.value?.data?.company ?? null)
const currentYear = new Date().getFullYear()

const invoice = ref(null)
const pending = ref(true)

onMounted(async () => {
  const data = await getUpgradeInvoice(route.params.uuid)
  invoice.value = data
  pending.value = false
})

const currencyCode = computed(() => invoice.value?.currency?.code ?? '—')
const bankAccounts = computed(() => invoice.value?.inventoryitem?.bankaccounttype?.bankaccounts ?? [])

const invoiceDate = computed(() => {
  const d = invoice.value?.invoice_date
  if (!d) return ''
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

  const upgradeContext = `
    <div style="border:1px solid #fcd34d;background:#fffbeb;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400e;">
      <strong>Supplier Group Upgrade:</strong>
      ${inv?.upgradesuppliergroup?.name ?? '—'}
    </div>`

  const logoUrl = `${window.location.origin}/img/logo.png`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Upgrade Invoice ${inv?.invoice_number ?? ''}</title>
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
      <div class="header-title">Upgrade Invoice</div>
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
      <div>
        <div class="section-label">Upgrade To</div>
        <p><strong>${inv?.upgradesuppliergroup?.name ?? '—'}</strong></p>
        <p style="color:#d97706;">Supplier Group Upgrade</p>
      </div>
    </div>

    ${upgradeContext}
    ${exchangeNotice}
    <hr>

    <div class="section-label" style="margin-bottom:10px;">Upgrade Fee — Registered Categories</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Category</th>
          <th>Difference Fee</th>
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
      <p>Use the reference below as the description or narration when making payment. Our system will automatically match the transaction and settle your invoice, completing your supplier group upgrade.</p>
      <div class="ref-box">
        <span class="ref-label">Payment Reference</span>
        <span class="ref-value">${inv?.paymentreference ?? inv?.invoice_number ?? '—'}</span>
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
