<template>
  <div class="flex h-[calc(100vh-4rem)]">

    <!-- Sidebar -->
    <SetupWizardSidebar :steps="steps" :current-step="step" @go-to-step="step = $event" />

    <!-- Main content -->
    <div class="flex flex-1 flex-col min-w-0">

      <!-- Mobile step bar -->
      <div class="lg:hidden bg-green-600 text-white px-4 py-3 flex items-center gap-3">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">{{ step }}</span>
        <div>
          <div class="font-semibold text-sm">{{ steps[step - 1].label }}</div>
          <div class="text-green-200 text-xs">Step {{ step }} of {{ steps.length }}</div>
        </div>
        <div class="ml-auto text-xs text-green-200">{{ Math.round(((step - 1) / steps.length) * 100) }}%</div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="max-w-4xl mx-auto p-6 lg:p-8">

          <!-- Server error -->
          <div v-if="serverError" role="alert" class="alert alert-error alert-soft mb-6">
            <Icon name="lucide:alert-circle" />
            <span>{{ serverError }}</span>
          </div>

          <SetupStepOne
            v-if="step === 1"
            ref="step1Ref"
            :form="form"
            :errors="errors"
            :provinces="provinces"
            :industries="industries"
            :customer-types="customerTypes"
          />

          <SetupStepTwo
            v-else-if="step === 2"
            ref="step2Ref"
            :company-id="savedCompanyId"
          />

          <SetupStepThree
            v-else-if="step === 3"
            ref="step3Ref"
            :company-id="savedCompanyId"
            :customertype-id="form.customertype_id"
          />

          <SetupStepFour
            v-else-if="step === 4"
            ref="step4Ref"
            :company-id="savedCompanyId"
          />

          <SetupStepComingSoon
            v-else
            :icon="steps[step - 1].icon"
            :label="steps[step - 1].label"
          />

        </div>
      </div>

      <!-- Validation errors modal -->
      <dialog id="setup_validation_modal" class="modal">
        <div class="modal-box max-w-sm">
          <div class="flex items-center gap-3 mb-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
              <Icon name="lucide:alert-triangle" class="w-5 h-5" />
            </span>
            <div>
              <h3 class="font-bold text-base">Please correct the following</h3>
              <p class="text-xs text-base-content/50">Fix these errors before continuing.</p>
            </div>
          </div>
          <ul class="space-y-2 mb-6">
            <li v-for="(msg, idx) in validationErrors" :key="idx" class="flex items-start gap-2 text-sm text-base-content">
              <Icon name="lucide:circle-x" class="w-4 h-4 text-error shrink-0 mt-0.5" />
              {{ msg }}
            </li>
          </ul>
          <div class="modal-action mt-0">
            <button type="button" class="btn btn-primary w-full" onclick="document.getElementById('setup_validation_modal').close()">Got it</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button>close</button></form>
      </dialog>

      <!-- Footer nav -->
      <div class="shrink-0 border-t border-base-200 bg-base-100 px-6 py-4 flex items-center justify-between gap-4">
        <button v-if="step > 1" type="button" class="btn btn-ghost gap-2" @click="step--">
          <Icon name="lucide:arrow-left" class="w-4 h-4" />
          Back
        </button>
        <div v-else />

        <div class="flex items-center gap-3">
          <!-- Progress dots (mobile) -->
          <div class="lg:hidden flex gap-1">
            <span
              v-for="(_, idx) in steps"
              :key="idx"
              :class="['w-2 h-2 rounded-full', step === idx + 1 ? 'bg-green-500' : step > idx + 1 ? 'bg-green-300' : 'bg-base-300']"
            />
          </div>

          <button
            v-if="step < steps.length"
            type="button"
            class="btn btn-success gap-2"
            :disabled="submitting"
            @click="nextStep"
          >
            <span v-if="submitting && step === 1" class="loading loading-spinner loading-xs"></span>
            <template v-else>
              Next
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </template>
          </button>

          <template v-else-if="step === steps.length">
            <p v-if="!step4Ref?.isStepComplete" class="text-sm text-base-content/50">
              Add at least one bank account to complete setup.
            </p>
            <button
              v-else
              type="button"
              class="btn btn-success gap-2"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <span v-if="submitting">Saving...</span>
              <span v-else>Complete Setup</span>
              <Icon v-if="!submitting" name="lucide:check" class="w-4 h-4" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'minimal',
  sanctum: { authenticated: true },
});

useHead({ title: 'Set Up Organisation' });

const { refreshIdentity, user } = useSanctumAuth();
const route = useRoute();
const { setupOrganisation, getCustomerTypesForSetup } = useOrganisationHelper();
const { getProvinces } = useProvinceHelper();
const { getCompanyIndustries } = useCompanyIndustryHelper();
const toast = useToast();

const steps = [
  { label: 'Organisation Details', sub: 'Name, contact & classification', icon: 'lucide:building-2' },
  { label: 'Directors & Shareholders', sub: 'Key people in your organisation', icon: 'lucide:users' },
  { label: 'Document Uploads', sub: 'Registration & compliance documents', icon: 'lucide:file-text' },
  { label: 'Banking Details', sub: 'Bank account information', icon: 'lucide:landmark' },
];

const DRAFT_KEY = 'egp_setup_step1_draft';

const step = ref(1);
const submitting = ref(false);
const serverError = ref('');
const validationErrors = ref([]);
const savedCompanyId = ref(null);

// Shared data for StepOne
const customerTypes = ref([]);
const provinces = ref([]);
const industries = ref([]);

const _company = user.value?.data?.company;
const form = reactive({
  name: _company?.name ?? '',
  regnumber: _company?.regnumber ?? '',
  company_number: _company?.company_number ?? '',
  email: _company?.email ?? '',
  phone: _company?.phone ?? '',
  website: _company?.website ?? '',
  country: _company?.country ?? 'Zimbabwe',
  locality: _company?.locality ?? 'local',
  province_id: _company?.province_id ?? null,
  district_id: _company?.district_id ?? null,
  city: _company?.city ?? '',
  address: _company?.address ?? '',
  companyindustry_id: _company?.companyindustry_id ?? null,
  customertype_id: _company?.customertype_id ?? null,
  suppliergroup_id: _company?.suppliergroup_id ?? null,
});

watch(form, (val) => {
  if (savedCompanyId.value) return; // backend is source of truth once company exists
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...val })); } catch { /* storage unavailable */ }
}, { deep: true });

const errors = reactive({
  name: '',
  email: '',
  website: '',
  customertype_id: '',
  suppliergroup_id: '',
});

// Component refs
const step1Ref = ref(null);
const step2Ref = ref(null);
const step3Ref = ref(null);
const step4Ref = ref(null);


const clearErrors = () => Object.keys(errors).forEach((k) => (errors[k] = ''));

const validateStep = () => {
  clearErrors();
  validationErrors.value = [];

  if (step.value === 1) {
    if (!form.name.trim()) { errors.name = 'Organisation name is required'; validationErrors.value.push(errors.name); }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errors.email = 'Enter a valid email'; validationErrors.value.push(errors.email); }
    if (form.website && !/^https?:\/\/.+/.test(form.website)) { errors.website = 'Enter a valid URL (must start with http:// or https://)'; validationErrors.value.push(errors.website); }
    if (!form.customertype_id) { errors.customertype_id = 'Please select a customer type'; validationErrors.value.push(errors.customertype_id); }
    if (!form.suppliergroup_id) { errors.suppliergroup_id = 'Please select a supplier group'; validationErrors.value.push(errors.suppliergroup_id); }
  }

  if (step.value === 3 && step3Ref.value) {
    const missing = step3Ref.value.missingDocs ?? [];
    missing.forEach((d) => {
      validationErrors.value.push(`"${d.document?.name}" is required and has not been uploaded.`);
    });
  }

  return validationErrors.value.length === 0;
};

const nextStep = async () => {
  if (!validateStep()) {
    document.getElementById('setup_validation_modal').showModal();
    return;
  }

  if (step.value === 1) {
    submitting.value = true;
    serverError.value = '';

    const payload = { ...form };
    if (!payload.regnumber) delete payload.regnumber;
    if (!payload.company_number) delete payload.company_number;
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.website) delete payload.website;

    const { ok, data, error } = await setupOrganisation(payload);
    submitting.value = false;

    if (!ok) {
      serverError.value = error || 'Failed to save organisation. Please try again.';
      return;
    }

    savedCompanyId.value = data?.data?.id ?? null;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  step.value++;

  await nextTick();
  if (step.value === 2) step2Ref.value?.load();
  else if (step.value === 3) step3Ref.value?.load();
  else if (step.value === 4) step4Ref.value?.load();
};

const handleSubmit = async () => {
  submitting.value = true;
  serverError.value = '';
  await refreshIdentity();
  submitting.value = false;
  toast.success({ title: 'Setup complete', message: 'Your organisation profile has been saved.', position: 'topRight', layout: 2 });
  navigateTo('/dashboard');
};

onMounted(async () => {
 
  const [ctRes, pvRes, indRes] = await Promise.all([
    getCustomerTypesForSetup(),
    getProvinces(),
    getCompanyIndustries(),
  ]);
  customerTypes.value = ctRes.data?.data ?? [];
  provinces.value = pvRes.data?.data ?? [];
  industries.value = indRes.data?.data ?? [];

  // If the user already has a company (returning to complete setup), pre-populate
  const companyId = user.value?.data?.company_id;
  if (!companyId) {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
      if (draft) Object.assign(form, draft);
    } catch { /* corrupted storage — ignore */ }
  }
  if (companyId) {
    savedCompanyId.value = companyId;

    const c = user.value?.data?.company;
    if (c) {
      Object.assign(form, {
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
      });
    }

    const targetStep = parseInt(route.query.step) || user.value?.data?.setup_step || null;
    if (targetStep >= steps.length + 1) {
      navigateTo('/dashboard');
      return;
    }
    if (targetStep && targetStep > 1) {
      step.value = targetStep;
      await nextTick();
     
      if (targetStep === 2) step2Ref.value?.load();
      if (targetStep === 3) step3Ref.value?.load();
      if (targetStep === 4) step4Ref.value?.load();
    }
  }
});
</script>
