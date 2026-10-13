export const supplierRegistrationPaymentOptions = [
  {
    id: 'online',
    name: 'Online Payment',
    description: 'Pay securely through the PRAZ CRM payment gateway',
    icon: 'lucide:credit-card',
  },
  {
    id: 'bank',
    name: 'Bank Payment',
    description: 'Submit a foreign or local bank transaction',
    icon: 'lucide:landmark',
  },
]

export const supplierRegistrationBankTypes = [
  {
    id: 'foreign_deposit',
    name: 'Foreign Deposit',
    description: 'Foreign-currency deposit made at a bank',
    icon: 'lucide:banknote',
  },
  {
    id: 'foreign_transfer',
    name: 'Foreign Transfer',
    description: 'International bank or wire transfer',
    icon: 'lucide:earth',
  },
  {
    id: 'rtgs',
    name: 'Local RTGS',
    description: 'Zimbabwean RTGS bank transfer',
    icon: 'lucide:building-2',
  },
  {
    id: 'zipit',
    name: 'Local ZIPIT',
    description: 'Zimbabwean ZIPIT transfer',
    icon: 'lucide:smartphone',
  },
]
