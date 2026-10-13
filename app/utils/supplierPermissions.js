const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/activate',
  '/activation-required',
  '/forgot-password',
  '/reset-password',
  '/tenders',
]

const AUTHENTICATED_ONLY_PATHS = [
  '/dashboard',
  '/notifications',
  '/setup-organisation',
  '/complete-migrated-profile',
  '/access-denied',
]

const PAGE_PERMISSION_RULES = [
  [/^\/organisationprofile(?:\/|$)/, ['can.access.organisationprofile']],
  [/^\/organisationusers(?:\/|$)/, ['can.access.organisationusers']],
  [/^\/(?:archive|media-center)(?:\/|$)/, ['can.access.myorganisation']],
  [/^\/(?:supplieropportunities|expressions-of-interest)(?:\/|$)/, ['can.access.supplieropportunities']],
  [/^\/restricted-tenders(?:\/|$)/, ['can.access.restrictedtenders']],
  [/^\/myagents(?:\/|$)/, ['can.access.myagents']],
  [/^\/supplierbidopening(?:\/|$)/, ['can.access.bidopening']],
  [/^\/mysupplierawards(?:\/|$)/, ['can.access.mysupplierwards']],
  [/^\/mysupplierbids(?:\/|$)/, ['can.access.mysupplierbids']],
  [/^\/suppliercontracts(?:\/|$)/, ['can.access.suppliercontracts']],
  [/^\/(?:bids|authorize-device)(?:\/|$)/, ['can.access.mytendering', 'can.access.mysupplierbids']],
  [/^\/bid-bonds(?:\/|$)/, ['can.access.mytendering']],
  [/^\/(?:submission-keys|supplierkeys|invoice\/submission-key)(?:\/|$)/, ['can.manage.biddersubmissionkeys']],
  [/^\/(?:supplierregistrations|suppliernewapplication)(?:\/|$)/, ['can.access.myregistrations']],
  [/^\/supplierautorenewals(?:\/|$)/, ['can.access.supplierautorenewals']],
  [/^\/supplierinvoices(?:\/|$)/, ['can.acccess.supplierinvoices']],
  [/^\/supplierstatement(?:\/|$)/, ['can.access.supplierstatement']],
  [/^\/supplierbankpayments(?:\/|$)/, ['can.access.supplierbankpayments']],
  [/^\/supplieronlinepayments(?:\/|$)/, ['can.access.onlinepayments']],
  [/^\/(?:supplierpayments|payments\/verification|invoice\/settle)(?:\/|$)/, [
    'can.acccess.supplierinvoices',
    'can.access.supplierbankpayments',
    'can.access.onlinepayments',
  ]],
  [/^\/invoice\/upgrade(?:\/|$)/, ['can.access.myregistrations']],
]

const matchesPath = (path, base) => path === base || path.startsWith(`${base}/`)

export const supplierPageAccess = (path) => {
  if (PUBLIC_PATHS.some(base => matchesPath(path, base))) {
    return { public: true, permissions: [] }
  }

  if (AUTHENTICATED_ONLY_PATHS.some(base => matchesPath(path, base))) {
    return { public: false, permissions: [] }
  }

  const rule = PAGE_PERMISSION_RULES.find(([pattern]) => pattern.test(path))

  return rule
    ? { public: false, permissions: rule[1] }
    : { public: false, permissions: null }
}

export const organisationUserPermissions = Object.freeze({
  access: 'can.access.organisationusers',
  add: 'can.add.organisationuser',
  edit: 'can.edit.organisationuser',
  delete: 'can.delete.organsationuser',
})
