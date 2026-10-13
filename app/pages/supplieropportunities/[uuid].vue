<template>
  <div class="space-y-5">
    <div v-if="loading" class="space-y-4 py-8">
      <div class="skeleton h-8 w-44" />
      <div class="skeleton h-48 w-full" />
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="skeleton h-80 lg:col-span-2" />
        <div class="skeleton h-64" />
      </div>
    </div>

    <div v-else-if="!tender" class="rounded-xl border border-base-200 bg-base-100 py-20 text-center">
      <Icon name="lucide:file-x" class="mx-auto h-12 w-12 text-base-content/30" />
      <h1 class="mt-4 text-2xl font-bold">Tender not available</h1>
      <p class="mt-2 text-sm text-base-content/60">{{ error || 'This tender is no longer available.' }}</p>
      <NuxtLink to="/supplieropportunities" class="btn btn-success btn-sm mt-5">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to opportunities
      </NuxtLink>
    </div>

    <template v-else>
      <section class="overflow-hidden rounded-2xl bg-gradient-to-r from-green-800 to-green-600 text-white shadow-sm">
        <div class="p-6 lg:p-8">
          <NuxtLink to="/supplieropportunities" class="inline-flex items-center gap-1 text-sm text-green-100 hover:text-white">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            Tender opportunities
          </NuxtLink>

          <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="badge border-0 bg-white/20 text-white">{{ tender.status === 'PUBLISHED' ? 'Open' : tender.status }}</span>
                <span class="font-mono text-green-100">{{ tender.reference }}</span>
                <span v-if="tender.method" class="badge border-0 bg-white/15 text-white">{{ tender.method }}</span>
              </div>
              <h1 class="mt-3 text-2xl font-extrabold leading-tight lg:text-3xl">{{ tender.title }}</h1>
              <p class="mt-3 flex items-center gap-2 text-sm text-green-100">
                <Icon name="lucide:building-2" class="h-4 w-4" />
                {{ tender.entity || 'Procuring entity' }}
              </p>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
              <button class="btn btn-sm border-white/30 bg-white/10 text-white hover:bg-white/20" :disabled="bookmarking" @click="toggleBookmark">
                <span v-if="bookmarking" class="loading loading-spinner loading-xs" />
                <Icon v-else :name="bookmarked ? 'lucide:bookmark-check' : 'lucide:bookmark-plus'" class="h-4 w-4" />
                {{ bookmarked ? 'Bookmarked' : 'Bookmark' }}
              </button>
              <NuxtLink v-if="inMyBids" to="/mysupplierbids" class="btn btn-sm bg-white text-green-800 hover:bg-green-50">
                <Icon name="lucide:check" class="h-4 w-4" />
                In My Bids
              </NuxtLink>
              <button v-else class="btn btn-sm bg-white text-green-800 hover:bg-green-50" :disabled="addingBid" @click="addToMyBids">
                <span v-if="addingBid" class="loading loading-spinner loading-xs" />
                <Icon v-else name="lucide:folder-plus" class="h-4 w-4" />
                Add to My Bids
              </button>
            </div>
          </div>

          <div class="mt-6 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-xl bg-black/10 p-3">
              <p class="text-xs text-green-100">Closing</p>
              <p class="mt-1 font-semibold">{{ formatDateTime(tender.closing_at) }}</p>
            </div>
            <div class="rounded-xl bg-black/10 p-3">
              <p class="text-xs text-green-100">Bid opening</p>
              <p class="mt-1 font-semibold">{{ formatDateTime(tender.opening_at) }}</p>
            </div>
            <div class="rounded-xl bg-black/10 p-3">
              <p class="text-xs text-green-100">Lots</p>
              <p class="mt-1 font-semibold">{{ tender.items?.length || 0 }}</p>
            </div>
            <div class="rounded-xl bg-black/10 p-3">
              <p class="text-xs text-green-100">Time remaining</p>
              <p class="mt-1 font-semibold">{{ timeRemaining(tender.closing_at) }}</p>
            </div>
          </div>
        </div>
      </section>

      <div v-if="actionError" role="alert" class="alert alert-error py-3 text-sm">
        <Icon name="lucide:circle-alert" />
        <span>{{ actionError }}</span>
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        <main class="space-y-5 xl:col-span-2">
          <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <div class="flex items-center gap-2">
              <Icon name="lucide:align-left" class="h-5 w-5 text-green-600" />
              <h2 class="text-lg font-bold">Tender overview</h2>
            </div>
            <p class="mt-3 whitespace-pre-line text-sm leading-6 text-base-content/75">
              {{ tender.description || 'No tender description was provided.' }}
            </p>
          </section>

          <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Icon name="lucide:boxes" class="h-5 w-5 text-green-600" />
                <h2 class="text-lg font-bold">Lots, products and specifications</h2>
              </div>
              <span class="badge badge-ghost">{{ tender.items?.length || 0 }} {{ tender.items?.length === 1 ? 'lot' : 'lots' }}</span>
            </div>

            <div v-if="tender.items?.length" class="mt-4 space-y-4">
              <article v-for="lot in tender.items" :key="lot.id" class="overflow-hidden rounded-xl border border-base-200">
                <header class="flex flex-col gap-2 bg-base-200/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Lot {{ lot.lot_number }}</p>
                    <h3 class="font-semibold">{{ lot.description }}</h3>
                  </div>
                  <span class="badge badge-outline whitespace-nowrap">Quantity {{ formatQuantity(lot.quantity) }}</span>
                </header>

                <div v-if="lot.products?.length" class="divide-y divide-base-200">
                  <div v-for="product in lot.products" :key="product.id" class="p-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div class="flex min-w-0 items-start gap-2">
                        <Icon name="lucide:package" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <div>
                          <h4 class="text-sm font-semibold">{{ product.description }}</h4>
                          <p class="mt-0.5 text-xs text-base-content/50">Product requirement</p>
                        </div>
                      </div>
                      <span class="text-sm font-medium">Qty {{ formatQuantity(product.quantity) }}</span>
                    </div>

                    <div v-if="product.specifications?.length" class="mt-3 overflow-x-auto rounded-lg border border-base-200">
                      <table class="table table-sm w-full">
                        <thead>
                          <tr class="text-xs text-base-content/50">
                            <th>Specification</th>
                            <th>Required value</th>
                            <th>Acceptance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="specification in product.specifications" :key="specification.uuid || specification.id">
                            <td class="font-medium">{{ specification.label }}</td>
                            <td class="whitespace-pre-line">{{ specification.value || '—' }}</td>
                            <td><span class="badge badge-ghost badge-sm">{{ acceptanceLabel(specification.acceptance_policy) }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p v-else class="mt-3 text-xs text-base-content/45">No separate specifications were published for this product.</p>
                  </div>
                </div>
                <p v-else class="p-4 text-sm text-base-content/50">This lot does not contain separate product lines.</p>
              </article>
            </div>
            <p v-else class="mt-4 rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50">No lots have been published.</p>
          </section>

          <section v-if="tender.addenda?.length" class="rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <div class="flex items-center gap-2">
              <Icon name="lucide:megaphone" class="h-5 w-5 text-warning" />
              <h2 class="text-lg font-bold">Addenda and amendments</h2>
              <span class="badge badge-warning badge-sm">{{ tender.addenda.length }}</span>
            </div>
            <div class="mt-4 space-y-3">
              <article v-for="addendum in tender.addenda" :key="addendum.uuid" class="rounded-xl border border-warning/30 bg-base-100 p-4">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="text-xs font-semibold text-warning">Addendum #{{ addendum.number }}</p>
                    <h3 class="font-semibold">{{ addendum.title }}</h3>
                  </div>
                  <button v-if="addendum.has_attachment" class="btn btn-outline btn-xs" :disabled="downloadingAddendum === addendum.uuid" @click="downloadAddendum(addendum.uuid)">
                    <span v-if="downloadingAddendum === addendum.uuid" class="loading loading-spinner loading-xs" />
                    <Icon v-else name="lucide:paperclip" class="h-3.5 w-3.5" />
                    Attachment
                  </button>
                </div>
                <p class="mt-2 whitespace-pre-line text-sm text-base-content/70">{{ addendum.description }}</p>
              </article>
            </div>
          </section>

          <TenderClarificationsPanel :tender-uuid="uuid" />
        </main>

        <aside class="space-y-5">
          <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/55">Key details</h2>
            <dl class="mt-3 divide-y divide-base-200 text-sm">
              <div v-for="detail in keyDetails" :key="detail.label" class="flex items-start justify-between gap-4 py-3">
                <dt class="text-base-content/55">{{ detail.label }}</dt>
                <dd class="max-w-[58%] text-right font-medium">{{ detail.value || '—' }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/55">Tender documents</h2>
            <button v-if="tender.sbd_available" class="btn btn-success btn-sm mt-4 w-full" :disabled="downloadingSbd" @click="downloadSbd">
              <span v-if="downloadingSbd" class="loading loading-spinner loading-xs" />
              <Icon v-else name="lucide:file-down" class="h-4 w-4" />
              Download bidding document
            </button>
            <p v-else class="mt-3 text-sm text-base-content/50">The bidding document is not available yet.</p>

            <div v-if="providedDocuments.length" class="mt-4 space-y-2 border-t border-base-200 pt-4">
              <button v-for="document in providedDocuments" :key="document.uuid" class="btn btn-ghost btn-sm h-auto w-full justify-start py-2 text-left" :disabled="downloadingDocument === document.uuid" @click="downloadDocument(document)">
                <span v-if="downloadingDocument === document.uuid" class="loading loading-spinner loading-xs" />
                <Icon v-else name="lucide:file-text" class="h-4 w-4 shrink-0" />
                <span class="min-w-0 truncate">{{ document.name }}</span>
              </button>
            </div>
          </section>

          <section v-if="tender.required_categories?.length" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/55">Eligible categories</h2>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-for="category in tender.required_categories" :key="category.code || category.name" class="badge badge-outline badge-success">
                {{ category.code || category.name }}
              </span>
            </div>
          </section>

          <section v-if="tender.document_requirements?.length" class="rounded-2xl border border-base-200 bg-base-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold uppercase tracking-wide text-base-content/55">Required bid documents</h2>
            <ul class="mt-3 space-y-2">
              <li v-for="document in tender.document_requirements" :key="document.uuid || document.name" class="flex items-start gap-2 text-sm">
                <Icon name="lucide:circle-check" class="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{{ document.name }}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const tenderApi = usePublicTenderHelper()
const bookmarkApi = useTenderBookmark()
const bidApi = useBidResponse()

const uuid = computed(() => String(route.params.uuid))
const tender = ref(null)
const loading = ref(true)
const error = ref('')
const actionError = ref('')
const bookmarked = ref(false)
const bookmarking = ref(false)
const inMyBids = ref(false)
const addingBid = ref(false)
const downloadingSbd = ref(false)
const downloadingDocument = ref('')
const downloadingAddendum = ref('')

const providedDocuments = computed(() => (tender.value?.document_requirements || [])
  .filter(document => document.type === 'PROVIDE' && document.has_file && document.uuid))

const keyDetails = computed(() => [
  { label: 'Method', value: tender.value?.method },
  { label: 'Category', value: tender.value?.category },
  { label: 'Participation', value: tender.value?.allowed_participants },
  { label: 'Opening type', value: tender.value?.bid_opening_type },
  { label: 'Published', value: formatDate(tender.value?.publication_start_date) },
  { label: 'Closing', value: formatDateTime(tender.value?.closing_at) },
  { label: 'Bid opening', value: formatDateTime(tender.value?.opening_at) },
  { label: 'Bid bond', value: tender.value?.required_bid_bond ? 'Required' : 'Not required' },
  { label: 'Bid validity', value: tender.value?.bid_validity_period ? `${tender.value.bid_validity_period} days` : null },
])

async function loadPage() {
  loading.value = true
  error.value = ''

  const [tenderResult, bookmarkResult, bidsResult] = await Promise.all([
    tenderApi.getSupplierOpportunity(uuid.value),
    bookmarkApi.listBookmarks(),
    bidApi.listBids(),
  ])

  if (!tenderResult.ok) {
    error.value = tenderResult.error
    tender.value = null
    loading.value = false
    return
  }

  tender.value = tenderResult.data?.data ?? null
  const bookmarkData = bookmarkResult.data?.data ?? {}
  bookmarked.value = (bookmarkData.bookmarked_uuids || []).includes(uuid.value)
  inMyBids.value = bidsResult.ok && (bidsResult.data || []).some(bid => bid.tender_uuid === uuid.value)
  loading.value = false
}

async function toggleBookmark() {
  if (bookmarking.value) return
  bookmarking.value = true
  actionError.value = ''
  const result = bookmarked.value
    ? await bookmarkApi.removeBookmark(uuid.value)
    : await bookmarkApi.addBookmark(uuid.value)
  bookmarking.value = false

  if (!result.ok) {
    actionError.value = result.error
    return
  }

  bookmarked.value = !bookmarked.value
  toast.success({
    title: bookmarked.value ? 'Tender bookmarked' : 'Bookmark removed',
    message: bookmarked.value ? 'You will receive tender reminders and amendment notices.' : 'Tender reminders have been disabled.',
    position: 'topRight',
    layout: 2,
  })
}

async function addToMyBids() {
  addingBid.value = true
  actionError.value = ''
  const result = await bidApi.addToMyBids(uuid.value)
  addingBid.value = false
  if (!result.ok) return void (actionError.value = result.error)
  inMyBids.value = true
}

async function openDownload(result, fallback) {
  const url = result.data?.data?.url
  if (result.ok && url) return void window.open(url, '_blank', 'noopener')
  toast.error({ title: 'Download unavailable', message: result.error || fallback, position: 'topRight', layout: 2 })
}

async function downloadSbd() {
  downloadingSbd.value = true
  const result = await tenderApi.getSupplierOpportunitySbd(uuid.value)
  downloadingSbd.value = false
  openDownload(result, 'The bidding document could not be retrieved.')
}

async function downloadDocument(document) {
  downloadingDocument.value = document.uuid
  const result = await tenderApi.getSupplierOpportunityDocument(uuid.value, document.uuid)
  downloadingDocument.value = ''
  openDownload(result, 'The tender document could not be retrieved.')
}

async function downloadAddendum(addendumUuid) {
  downloadingAddendum.value = addendumUuid
  const result = await tenderApi.getSupplierOpportunityAddendum(uuid.value, addendumUuid)
  downloadingAddendum.value = ''
  openDownload(result, 'The addendum attachment could not be retrieved.')
}

function formatDate(value) {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-ZW', { dateStyle: 'medium' })
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-ZW', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatQuantity(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : value || '—'
}

function timeRemaining(value) {
  if (!value) return 'Not specified'
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

function acceptanceLabel(value) {
  if (!value) return 'As specified'
  return String(value).replaceAll('_', ' ').toLowerCase().replace(/^./, character => character.toUpperCase())
}

onMounted(loadPage)
useHead(() => ({ title: tender.value ? `${tender.value.title} — Opportunity` : 'Tender Opportunity' }))
</script>
