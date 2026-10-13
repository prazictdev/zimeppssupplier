<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:building-2" class="h-6 w-6" />
            Organisation Profile
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            {{ company?.name ?? 'Loading…' }}{{ company?.regnumber ? ` — ${company.regnumber}` : '' }}
          </p>
          <div v-if="company" class="mt-2 flex flex-wrap gap-1">
            <span v-if="company.customertype" class="badge badge-sm bg-green-400/30 text-white border-green-300">
              {{ company.customertype.name }}
            </span>
            <span v-if="company.suppliergroup" class="badge badge-sm bg-green-400/30 text-white border-green-300">
              {{ company.suppliergroup.name }}
            </span>
            <span v-if="company.country" class="badge badge-sm bg-green-400/30 text-white border-green-300">
              {{ company.country }}
            </span>
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <button
            v-if="company?.can_edit_profile && !editMode"
            type="button"
            class="btn btn-sm border-0 bg-white text-green-700 hover:bg-green-50 gap-1.5"
            @click="openProfileEditor"
          >
            <Icon name="lucide:pencil" class="h-4 w-4" />
            Edit profile
          </button>
          <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <SupplierVerificationActions />

    <div v-if="company && !company.can_edit_profile" role="alert" class="alert border border-info/30 bg-info/10 text-base-content">
      <Icon name="lucide:lock" class="h-5 w-5 shrink-0 text-info" />
      <div>
        <p class="font-semibold">Organisation profile approved</p>
        <p class="text-sm">{{ company.profile_edit_message }}</p>
      </div>
    </div>

    <section v-if="editMode" class="space-y-6">
      <div role="alert" class="alert border border-warning/40 bg-warning/15 text-base-content shadow-sm">
        <Icon name="lucide:circle-alert" class="h-5 w-5 shrink-0 text-warning" />
        <div class="flex-1">
          <p class="font-bold">Correct the information identified in the verification alert</p>
          <p class="text-sm">Save the company details and update the relevant directors or shareholders. Return to the alert and press “I’ve corrected the details — Reverify” only when every correction is complete.</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
        <div>
          <h2 class="font-bold">Edit organisation profile</h2>
          <p class="text-sm text-base-content/55">Changes are permitted while the current registration is awaiting approval.</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-ghost btn-sm" :disabled="savingProfile" @click="cancelProfileEditor">Cancel</button>
          <button type="button" class="btn btn-success btn-sm gap-2" :disabled="savingProfile" @click="saveCompanyProfile">
            <span v-if="savingProfile" class="loading loading-spinner loading-xs" />
            <Icon v-else name="lucide:save" class="h-4 w-4" />
            Save company details
          </button>
        </div>
      </div>

      <SetupStepOne
        :form="profileForm"
        :errors="profileErrors"
        :provinces="provinces"
        :industries="industries"
        :customer-types="customerTypes"
        :show-verification-notice="false"
      />

      <SetupStepTwo ref="editPeopleRef" :company-id="companyId" />
    </section>

    <!-- Tabs -->
    <div v-else class="card border border-base-200 bg-base-100 shadow-sm">

      <div class="border-b border-base-200 overflow-x-auto">
        <div role="tablist" class="tabs tabs-bordered min-w-max px-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            class="tab gap-2 whitespace-nowrap"
            :class="activeTab === tab.key ? 'tab-active text-primary' : ''"
            @click="onTab(tab.key)"
          >
            <Icon :name="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="p-5">

        <!-- Company tab -->
        <section v-if="activeTab === 'company'" class="space-y-4">
          <div v-if="companyLoading" class="space-y-2">
            <div v-for="n in 6" :key="n" class="h-10 rounded bg-base-200 animate-pulse" />
          </div>
          <div v-else-if="company" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="f in companyFields" :key="f.label" class="min-w-0" :class="f.span">
              <p class="text-xs text-base-content/50 uppercase">{{ f.label }}</p>
              <a v-if="f.link && f.value" :href="ensureHttp(f.value)" target="_blank" rel="noopener"
                 class="text-sm font-medium text-primary hover:underline break-all">
                {{ f.value }}
              </a>
              <p v-else class="text-sm font-medium text-base-content break-words"
                 :class="f.mono ? 'font-mono' : ''">
                {{ f.value || '—' }}
              </p>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:building" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No company data found.</p>
          </div>
        </section>

        <!-- Directors tab -->
        <section v-else-if="activeTab === 'directors'">
          <div v-if="directorsLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-10 rounded bg-base-200 animate-pulse" />
          </div>
          <div v-else-if="directors.length" class="overflow-x-auto">
            <table class="table table-sm w-full">
              <thead>
                <tr class="text-xs text-base-content/50 uppercase">
                  <th>Name</th>
                  <th class="hidden sm:table-cell">Gender</th>
                  <th class="hidden md:table-cell">National ID</th>
                  <th>Status</th>
                  <th class="hidden md:table-cell">ID Document</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in directors" :key="d.id" class="hover">
                  <td>
                    <p class="font-medium text-sm">{{ fullName(d) }}</p>
                    <p class="text-xs text-base-content/50 sm:hidden">{{ d.gender ?? '—' }} · {{ d.national_id ?? '—' }}</p>
                  </td>
                  <td class="hidden sm:table-cell text-sm text-base-content/70">{{ d.gender ?? '—' }}</td>
                  <td class="hidden md:table-cell text-sm font-mono text-base-content/70">{{ d.national_id ?? '—' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="reviewBadge(d.status)">{{ reviewLabel(d.status) }}</span>
                    <p v-if="d.reject_reason" class="text-xs text-error mt-0.5">{{ d.reject_reason }}</p>
                  </td>
                  <td class="hidden md:table-cell text-sm">
                    <a v-if="d.file_path" :href="d.file_path" target="_blank" rel="noopener"
                       class="link link-primary text-xs gap-1 inline-flex items-center">
                      <Icon name="lucide:file-text" class="h-3.5 w-3.5" />
                      {{ d.file_name ?? 'View' }}
                    </a>
                    <span v-else class="text-base-content/40">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:users" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No directors recorded.</p>
          </div>
        </section>

        <!-- Shareholders tab -->
        <section v-else-if="activeTab === 'shareholders'">
          <div v-if="shareholdersLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-10 rounded bg-base-200 animate-pulse" />
          </div>
          <div v-else-if="shareholders.length" class="overflow-x-auto">
            <table class="table table-sm w-full">
              <thead>
                <tr class="text-xs text-base-content/50 uppercase">
                  <th>Name</th>
                  <th class="hidden md:table-cell">Nationality</th>
                  <th class="hidden md:table-cell">ID Type</th>
                  <th>ID Number</th>
                  <th class="text-right">Shares %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in shareholders" :key="s.id" class="hover">
                  <td class="font-medium text-sm">{{ fullName(s) }}</td>
                  <td class="hidden md:table-cell text-sm text-base-content/70">{{ s.nationality ?? '—' }}</td>
                  <td class="hidden md:table-cell text-sm text-base-content/70">{{ s.identification_type ?? '—' }}</td>
                  <td class="text-sm font-mono text-base-content/70">{{ s.identification_number ?? '—' }}</td>
                  <td class="text-right text-sm font-medium">{{ formatPercent(s.share_percentage) }}</td>
                  <td>
                    <span class="badge badge-sm" :class="reviewBadge(s.status)">{{ reviewLabel(s.status) }}</span>
                    <p v-if="s.reject_reason" class="text-xs text-error mt-0.5">{{ s.reject_reason }}</p>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="totalShares !== null">
                <tr class="text-xs">
                  <td colspan="4" class="text-right font-medium text-base-content/60">Total</td>
                  <td class="text-right font-bold" :class="totalShares > 100.01 ? 'text-error' : 'text-base-content'">
                    {{ formatPercent(totalShares) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:pie-chart" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No shareholders recorded.</p>
          </div>
        </section>

        <!-- Documents tab -->
        <section v-else-if="activeTab === 'documents'">
          <div v-if="documentsLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-10 rounded bg-base-200 animate-pulse" />
          </div>
          <div v-else-if="documents.length" class="overflow-x-auto">
            <table class="table table-sm w-full">
              <thead>
                <tr class="text-xs text-base-content/50 uppercase">
                  <th>Document</th>
                  <th class="hidden md:table-cell">File</th>
                  <th class="hidden md:table-cell">Locality</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id" class="hover">
                  <td>
                    <p class="font-medium text-sm">{{ doc.document?.name ?? doc.file_name ?? '—' }}</p>
                    <p class="text-xs text-base-content/50">
                      {{ formatBytes(doc.file_size) }}<span v-if="doc.mime_type"> · {{ doc.mime_type }}</span>
                    </p>
                  </td>
                  <td class="hidden md:table-cell text-sm text-base-content/70">{{ doc.file_name ?? '—' }}</td>
                  <td class="hidden md:table-cell text-sm text-base-content/70 capitalize">{{ doc.locality ?? '—' }}</td>
                  <td>
                    <span class="badge badge-sm" :class="docStatusBadge(doc.status)">{{ docStatusLabel(doc.status) }}</span>
                    <p v-if="doc.rejection_reason" class="text-xs text-error mt-0.5">{{ doc.rejection_reason }}</p>
                  </td>
                  <td class="text-right">
                    <a v-if="doc.file_path" :href="doc.file_path" target="_blank" rel="noopener" class="btn btn-xs btn-ghost gap-1">
                      <Icon name="lucide:external-link" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">View</span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:file-text" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No documents uploaded.</p>
          </div>
        </section>

        <!-- Bank details tab -->
        <section v-else-if="activeTab === 'bank'">
          <div v-if="bankLoading" class="space-y-2">
            <div v-for="n in 2" :key="n" class="h-20 rounded bg-base-200 animate-pulse" />
          </div>
          <div v-else-if="bankDetails.length" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="b in bankDetails" :key="b.id" class="card border border-base-200 bg-base-50 p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-base-content">{{ b.bank ?? '—' }}</p>
                  <p class="text-xs text-base-content/60">
                    {{ b.branch_name ?? '—' }}<span v-if="b.branch_code"> · {{ b.branch_code }}</span>
                  </p>
                </div>
                <span v-if="b.currency" class="badge badge-sm bg-base-200 border-base-300">{{ b.currency.code }}</span>
              </div>
              <div class="mt-3 space-y-1.5 text-sm">
                <div class="flex justify-between gap-3">
                  <span class="text-base-content/50">Account Name</span>
                  <span class="font-medium text-base-content text-right">{{ b.account_name ?? '—' }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-base-content/50">Account Number</span>
                  <span class="font-mono text-base-content text-right">{{ b.account_number ?? '—' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:landmark" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No bank details recorded.</p>
          </div>
        </section>

        <!-- Portfolio tab -->
        <section v-else-if="activeTab === 'portfolio'" class="space-y-4">
          <div v-if="portfolioLoading" class="space-y-2">
            <div v-for="n in 4" :key="n" class="h-12 rounded bg-base-200 animate-pulse" />
          </div>
          <template v-else-if="portfolio">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="card border border-base-200 bg-base-50 p-4">
                <p class="text-xs text-base-content/50 uppercase">Established</p>
                <p class="text-sm font-medium text-base-content mt-1">{{ formatDate(portfolio.date_established) }}</p>
              </div>
              <div class="card border border-base-200 bg-base-50 p-4">
                <p class="text-xs text-base-content/50 uppercase">Branches</p>
                <p class="text-sm font-medium text-base-content mt-1">{{ portfolio.branches ?? 0 }}</p>
              </div>
              <div class="card border border-base-200 bg-base-50 p-4">
                <p class="text-xs text-base-content/50 uppercase">Products / Past Orders</p>
                <p class="text-sm font-medium text-base-content mt-1">
                  {{ (portfolio.products?.length ?? 0) }} · {{ (portfolio.orders?.length ?? 0) }}
                </p>
              </div>
            </div>

            <div v-if="portfolio.business_description" class="card border border-base-200 bg-base-50 p-4">
              <p class="text-xs text-base-content/50 uppercase mb-2">Business Description</p>
              <p class="text-sm whitespace-pre-line text-base-content/80">{{ portfolio.business_description }}</p>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-base-content mb-2">Products & Services</h3>
              <div v-if="portfolio.products?.length" class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr class="text-xs text-base-content/50 uppercase">
                      <th>Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="p in portfolio.products" :key="p.id" class="hover">
                      <td class="font-medium text-sm">{{ p.product_name ?? '—' }}</td>
                      <td class="text-sm text-base-content/70">{{ p.description ?? '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex items-center gap-2 text-sm text-base-content/50 py-4 px-3 border border-dashed border-base-200 rounded-lg">
                <Icon name="lucide:package" class="h-4 w-4" />
                No products listed.
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-base-content mb-2">Past Orders</h3>
              <div v-if="portfolio.orders?.length" class="overflow-x-auto">
                <table class="table table-sm w-full">
                  <thead>
                    <tr class="text-xs text-base-content/50 uppercase">
                      <th>Description</th>
                      <th class="text-right">Year</th>
                      <th class="text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="o in portfolio.orders" :key="o.id" class="hover">
                      <td class="text-sm">{{ o.order_description ?? '—' }}</td>
                      <td class="text-right text-sm text-base-content/70">{{ o.year ?? '—' }}</td>
                      <td class="text-right text-sm font-medium">
                        {{ o.currency?.code ?? '' }} {{ formatAmount(o.value) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="flex items-center gap-2 text-sm text-base-content/50 py-4 px-3 border border-dashed border-base-200 rounded-lg">
                <Icon name="lucide:history" class="h-4 w-4" />
                No past orders listed.
              </div>
            </div>
          </template>
          <div v-else class="flex flex-col items-center gap-2 py-12 text-center">
            <div class="rounded-full bg-base-200 p-3">
              <Icon name="lucide:briefcase" class="h-6 w-6 text-base-content/30" />
            </div>
            <p class="text-sm text-base-content/50">No portfolio created yet.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

useHead({ title: 'Organisation Profile' })

const route = useRoute()
const {
  getMyCompany,
  getUploadedDocuments,
  setupOrganisation,
  getCustomerTypesForSetup,
} = useOrganisationHelper()
const { getDirectors, getShareholders } = useDirectorShareholderHelper()
const { getBankDetails } = useCompanyBankDetailHelper()
const { getPortfolio } = useCompanyPortfolioHelper()
const { getProvinces } = useProvinceHelper()
const { getCompanyIndustries } = useCompanyIndustryHelper()
const toast = useToast()

const tabs = [
  { key: 'company',      label: 'Company',      icon: 'lucide:building' },
  { key: 'directors',    label: 'Directors',    icon: 'lucide:users' },
  { key: 'shareholders', label: 'Shareholders', icon: 'lucide:pie-chart' },
  { key: 'documents',    label: 'Documents',    icon: 'lucide:file-text' },
  { key: 'bank',         label: 'Bank Details', icon: 'lucide:landmark' },
  { key: 'portfolio',    label: 'Portfolio',    icon: 'lucide:briefcase' },
]

const activeTab = ref('company')

const company = ref(null)
const companyLoading = ref(false)
const editMode = ref(false)
const savingProfile = ref(false)
const editPeopleRef = ref(null)
const editLookupsLoaded = ref(false)
const customerTypes = ref([])
const provinces = ref([])
const industries = ref([])
const profileForm = reactive({
  name: '',
  regnumber: '',
  company_number: '',
  email: '',
  phone: '',
  website: '',
  country: 'Zimbabwe',
  locality: 'local',
  province_id: null,
  district_id: null,
  city: '',
  address: '',
  companyindustry_id: null,
  customertype_id: null,
  suppliergroup_id: null,
})
const profileErrors = reactive({
  name: '',
  email: '',
  website: '',
  customertype_id: '',
  suppliergroup_id: '',
})

const directors = ref([])
const directorsLoading = ref(false)
const directorsLoaded = ref(false)

const shareholders = ref([])
const shareholdersLoading = ref(false)
const shareholdersLoaded = ref(false)

const documents = ref([])
const documentsLoading = ref(false)
const documentsLoaded = ref(false)

const bankDetails = ref([])
const bankLoading = ref(false)
const bankLoaded = ref(false)

const portfolio = ref(null)
const portfolioLoading = ref(false)
const portfolioLoaded = ref(false)

const totalShares = computed(() => {
  if (!shareholders.value.length) return null
  return shareholders.value.reduce((sum, s) => sum + (Number(s.share_percentage) || 0), 0)
})

const companyId = computed(() => company.value?.id ?? null)

const companyFields = computed(() => {
  const c = company.value
  if (!c) return []
  return [
    { label: 'Company Name',         value: c.name },
    { label: 'Registration Number',  value: c.regnumber, mono: true },
    { label: 'Company Number',       value: c.company_number, mono: true },
    { label: 'Customer Type',        value: c.customertype?.name },
    { label: 'Supplier Group',       value: c.suppliergroup?.name },
    { label: 'Locality',             value: formatLocality(c.locality) },
    { label: 'Country',              value: c.country },
    { label: 'Province',             value: c.province?.name },
    { label: 'District',             value: c.district?.name },
    { label: 'City',                 value: c.city },
    { label: 'Address',              value: c.address, span: 'md:col-span-2' },
    { label: 'Phone',                value: c.phone },
    { label: 'Email',                value: c.email },
    { label: 'Website',              value: c.website, link: true },
  ]
})

async function loadCompany() {
  companyLoading.value = true
  const { ok, data, error } = await getMyCompany()
  companyLoading.value = false
  if (ok) {
    company.value = data?.data ?? null
    syncProfileForm()
    if (route.query.edit === '1' && company.value?.can_edit_profile) {
      await openProfileEditor()
    }
  } else {
    toast.error({ title: 'Could not load company', message: error, position: 'topRight', layout: 2 })
  }
}

function syncProfileForm() {
  const c = company.value
  if (!c) return
  Object.assign(profileForm, {
    name: c.name ?? '',
    regnumber: c.regnumber ?? '',
    company_number: c.company_number ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    website: c.website ?? '',
    country: c.country ?? 'Zimbabwe',
    locality: c.locality ?? 'local',
    province_id: c.province_id ?? null,
    district_id: c.district_id ?? null,
    city: c.city ?? '',
    address: c.address ?? '',
    companyindustry_id: c.companyindustry_id ?? null,
    customertype_id: c.customertype_id ?? null,
    suppliergroup_id: c.suppliergroup_id ?? null,
  })
}

async function loadEditLookups() {
  if (editLookupsLoaded.value) return
  const [customerTypeResult, provinceResult, industryResult] = await Promise.all([
    getCustomerTypesForSetup(),
    getProvinces(),
    getCompanyIndustries(),
  ])
  customerTypes.value = customerTypeResult.data?.data ?? []
  provinces.value = provinceResult.data?.data ?? []
  industries.value = industryResult.data?.data ?? []
  editLookupsLoaded.value = true
}

async function openProfileEditor() {
  if (!company.value?.can_edit_profile) return
  syncProfileForm()
  await loadEditLookups()
  editMode.value = true
  await nextTick()
  editPeopleRef.value?.load()
}

function cancelProfileEditor() {
  syncProfileForm()
  editMode.value = false
}

function validateProfileForm() {
  Object.keys(profileErrors).forEach(key => { profileErrors[key] = '' })
  if (!profileForm.name.trim()) profileErrors.name = 'Organisation name is required'
  if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) profileErrors.email = 'Enter a valid email'
  if (profileForm.website && !/^https?:\/\/.+/.test(profileForm.website)) profileErrors.website = 'Enter a valid URL'
  if (!profileForm.customertype_id) profileErrors.customertype_id = 'Please select a customer type'
  if (!profileForm.suppliergroup_id) profileErrors.suppliergroup_id = 'Please select a supplier group'
  return !Object.values(profileErrors).some(Boolean)
}

async function saveCompanyProfile() {
  if (!validateProfileForm()) {
    toast.error({ title: 'Check the form', message: 'Correct the highlighted company details before saving.', position: 'topRight', layout: 2 })
    return
  }

  savingProfile.value = true
  const { ok, error } = await setupOrganisation({ ...profileForm })
  savingProfile.value = false
  if (!ok) {
    toast.error({ title: 'Profile update failed', message: error, position: 'topRight', layout: 2 })
    return
  }

  await loadCompany()
  toast.success({ title: 'Company details saved', message: 'Complete any director or shareholder corrections before requesting reverification.', position: 'topRight', layout: 2 })
}

async function loadDirectors() {
  if (!companyId.value || directorsLoaded.value) return
  directorsLoading.value = true
  const { ok, data } = await getDirectors(companyId.value)
  directorsLoading.value = false
  directors.value = ok ? (data?.data ?? []) : []
  directorsLoaded.value = ok
}

async function loadShareholders() {
  if (!companyId.value || shareholdersLoaded.value) return
  shareholdersLoading.value = true
  const { ok, data } = await getShareholders(companyId.value)
  shareholdersLoading.value = false
  shareholders.value = ok ? (data?.data ?? []) : []
  shareholdersLoaded.value = ok
}

async function loadDocuments() {
  if (!companyId.value || documentsLoaded.value) return
  documentsLoading.value = true
  const { ok, data } = await getUploadedDocuments(companyId.value)
  documentsLoading.value = false
  documents.value = ok ? (data?.data ?? []) : []
  documentsLoaded.value = ok
}

async function loadBank() {
  if (!companyId.value || bankLoaded.value) return
  bankLoading.value = true
  const { ok, data } = await getBankDetails(companyId.value)
  bankLoading.value = false
  bankDetails.value = ok ? (data?.data ?? []) : []
  bankLoaded.value = ok
}

async function loadPortfolio() {
  if (!companyId.value || portfolioLoaded.value) return
  portfolioLoading.value = true
  const { ok, data } = await getPortfolio(companyId.value)
  portfolioLoading.value = false
  portfolio.value = ok ? (data?.data ?? null) : null
  portfolioLoaded.value = ok
}

const onTab = (key) => {
  activeTab.value = key
  if (key === 'directors') loadDirectors()
  else if (key === 'shareholders') loadShareholders()
  else if (key === 'documents') loadDocuments()
  else if (key === 'bank') loadBank()
  else if (key === 'portfolio') loadPortfolio()
}

onMounted(() => {
  loadCompany()
})

function fullName(p) {
  return [p?.firstname, p?.middlename, p?.lastname].filter(Boolean).join(' ') || '—'
}

function ensureHttp(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(val) {
  return new Intl.NumberFormat('en-ZW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0)
}

function formatPercent(val) {
  if (val == null) return '—'
  return `${Number(val).toFixed(2)}%`
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = Number(bytes)
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i ? 1 : 0)} ${units[i]}`
}

function formatLocality(val) {
  if (!val) return '—'
  return val.charAt(0).toUpperCase() + val.slice(1)
}

function reviewLabel(status) {
  const labels = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' }
  return labels[status] ?? status ?? '—'
}

function reviewBadge(status) {
  const classes = {
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    APPROVED: 'bg-green-100 text-green-700 border-green-300',
    REJECTED: 'bg-red-100 text-red-700 border-red-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}

function docStatusLabel(status) {
  const labels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }
  return labels[status] ?? status ?? '—'
}

function docStatusBadge(status) {
  const classes = {
    pending:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    approved: 'bg-green-100 text-green-700 border-green-300',
    rejected: 'bg-red-100 text-red-700 border-red-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}
</script>
