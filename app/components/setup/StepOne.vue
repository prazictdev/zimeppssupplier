<template>
  <div class="space-y-6">
    <div v-if="showVerificationNotice" role="alert" class="alert alert-info alert-soft">
      <Icon name="lucide:shield-check" class="h-5 w-5 shrink-0" />
      <div>
        <p class="font-semibold">Organisation verification happens after payment</p>
        <p class="text-sm">
          Capture your organisation details below. The system will automatically verify them after your registration invoice has been paid.
        </p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <div class="flex items-center gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
          <Icon name="lucide:building-2" class="h-5 w-5" />
        </span>
        <div>
          <h2 class="text-sm font-bold text-base-content">Organisation Details</h2>
          <p class="text-xs text-base-content/50">Enter the information as it appears on your official registration documents.</p>
        </div>
      </div>

      <div class="space-y-4 p-6">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Organisation Name <span class="text-error">*</span></legend>
          <input
            v-model.trim="form.name"
            type="text"
            :class="['input input-bordered w-full', errors.name ? 'input-error' : '']"
            placeholder="e.g. Example Trading (Private) Limited"
          />
          <label v-if="errors.name" class="label">
            <span class="label-text-alt text-error">{{ errors.name }}</span>
          </label>
        </fieldset>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Company Registration Number</legend>
            <input
              v-model.trim="form.company_number"
              type="text"
              class="input input-bordered w-full"
              placeholder="Enter company registration number"
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Existing PRAZ Registration Number</legend>
            <input
              v-model.trim="form.regnumber"
              type="text"
              class="input input-bordered w-full"
              placeholder="Enter number if previously registered"
            />
          </fieldset>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Email</legend>
            <input
              v-model.trim="form.email"
              type="email"
              :class="['input input-bordered w-full', errors.email ? 'input-error' : '']"
              placeholder="org@example.com"
            />
            <label v-if="errors.email" class="label">
              <span class="label-text-alt text-error">{{ errors.email }}</span>
            </label>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Phone</legend>
            <input v-model.trim="form.phone" type="tel" class="input input-bordered w-full" placeholder="+263 77 123 4567" />
          </fieldset>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Website</legend>
          <input
            v-model.trim="form.website"
            type="url"
            :class="['input input-bordered w-full', errors.website ? 'input-error' : '']"
            placeholder="https://example.com"
          />
          <label v-if="errors.website" class="label">
            <span class="label-text-alt text-error">{{ errors.website }}</span>
          </label>
        </fieldset>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <div class="flex items-center gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Icon name="lucide:map-pin" class="h-5 w-5" />
        </span>
        <div>
          <h2 class="text-sm font-bold text-base-content">Location &amp; Industry</h2>
          <p class="text-xs text-base-content/50">Select where your organisation is registered and the sector it operates in.</p>
        </div>
      </div>

      <div class="space-y-4 p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Country of Registration</legend>
            <select v-model="form.country" class="select select-bordered w-full">
              <option value="">Select country</option>
              <option v-for="country in countryOptions" :key="country.value" :value="country.value">
                {{ country.label }}
              </option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Industry</legend>
            <select v-model="form.companyindustry_id" class="select select-bordered w-full">
              <option :value="null">Select industry (optional)</option>
              <option v-for="industry in industries" :key="industry.id" :value="industry.id">
                {{ industry.name }}
              </option>
            </select>
          </fieldset>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Province</legend>
            <select
              v-model="form.province_id"
              class="select select-bordered w-full"
              :disabled="form.country !== 'Zimbabwe'"
              @change="onProvinceChange"
            >
              <option :value="null">Select province</option>
              <option v-for="province in provinces" :key="province.id" :value="province.id">
                {{ province.name }}
              </option>
            </select>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">District</legend>
            <select
              v-model="form.district_id"
              class="select select-bordered w-full"
              :disabled="form.country !== 'Zimbabwe' || !form.province_id"
            >
              <option :value="null">Select district</option>
              <option v-for="district in districts" :key="district.id" :value="district.id">
                {{ district.name }}
              </option>
            </select>
          </fieldset>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">City / Town</legend>
            <input v-model.trim="form.city" type="text" class="input input-bordered w-full" placeholder="Harare" />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Physical Address</legend>
            <textarea
              v-model.trim="form.address"
              class="textarea textarea-bordered w-full resize-none"
              rows="3"
              placeholder="123 Main Street, CBD"
            />
          </fieldset>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-sm">
      <div class="flex items-center gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Icon name="lucide:layers" class="h-5 w-5" />
        </span>
        <div>
          <h2 class="text-sm font-bold text-base-content">Classification</h2>
          <p class="text-xs text-base-content/50">Choose the classifications that apply to your organisation.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Customer Type <span class="text-error">*</span></legend>
          <select
            v-model="form.customertype_id"
            :class="['select select-bordered w-full', errors.customertype_id ? 'select-error' : '']"
          >
            <option :value="null">Select customer type</option>
            <option v-for="customerType in customerTypes" :key="customerType.id" :value="customerType.id">
              {{ customerType.name }}
            </option>
          </select>
          <label v-if="errors.customertype_id" class="label">
            <span class="label-text-alt text-error">{{ errors.customertype_id }}</span>
          </label>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Supplier Group <span class="text-error">*</span></legend>
          <select
            :value="form.suppliergroup_id ?? ''"
            :class="['select select-bordered w-full', errors.suppliergroup_id ? 'select-error' : '']"
            :disabled="loadingGroups"
            @change="onSupplierGroupChange"
          >
            <option value="">{{ loadingGroups ? 'Loading supplier groups...' : 'Select supplier group' }}</option>
            <option v-for="supplierGroup in supplierGroups" :key="supplierGroup.id" :value="supplierGroup.id">
              {{ supplierGroup.code }} — {{ supplierGroup.name }}
            </option>
          </select>
          <label v-if="errors.suppliergroup_id" class="label">
            <span class="label-text-alt text-error">{{ errors.suppliergroup_id }}</span>
          </label>
        </fieldset>
      </div>
    </div>

    <dialog id="suppliergroup_confirm_modal" class="modal">
      <div v-if="pendingSupplierGroup" class="modal-box max-w-2xl">
        <div class="mb-5 flex items-start gap-3">
          <span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Icon name="lucide:layers" class="h-5 w-5" />
          </span>
          <div>
            <h3 class="font-bold">Confirm Supplier Group</h3>
            <p class="mt-0.5 text-sm text-base-content/60">
              Review the procurement thresholds for {{ pendingSupplierGroup.name }} before confirming.
            </p>
          </div>
        </div>

        <div v-if="pendingSupplierGroup.thresholds?.length" class="overflow-hidden rounded-xl border border-base-200">
          <div class="overflow-x-auto">
            <table class="table table-sm w-full">
              <thead>
                <tr>
                  <th>Procurement Group</th>
                  <th>Method</th>
                  <th>Currency</th>
                  <th>Lower Limit</th>
                  <th>Upper Limit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="threshold in pendingSupplierGroup.thresholds" :key="threshold.id">
                  <td>{{ threshold.procurementgroup?.name }}</td>
                  <td>{{ threshold.procurementmethod?.name }}</td>
                  <td>{{ threshold.currency?.code }}</td>
                  <td class="font-mono">{{ formatAmount(threshold.lower_limit) }}</td>
                  <td class="font-mono">{{ formatAmount(threshold.upper_limit) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-else class="rounded-xl border border-base-200 p-4 text-sm text-base-content/50">
          No thresholds have been defined for this group.
        </p>

        <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-base-200/50 p-4">
          <input v-model="supplierGroupConfirmed" type="checkbox" class="checkbox checkbox-success mt-0.5 shrink-0" />
          <span class="text-sm">
            I have reviewed the thresholds and confirm that this supplier group applies to my organisation.
          </span>
        </label>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="cancelSupplierGroup">Cancel</button>
          <button type="button" class="btn btn-success" :disabled="!supplierGroupConfirmed" @click="confirmSupplierGroup">
            Confirm Selection
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="cancelSupplierGroup">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
const props = defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  provinces: { type: Array, required: true },
  industries: { type: Array, required: true },
  customerTypes: { type: Array, required: true },
  showVerificationNotice: { type: Boolean, default: true },
});

const { getSupplierGroupsWithThresholds } = useOrganisationHelper();
const { getDistrictsByProvince } = useProvinceHelper();

const supplierGroups = ref([]);
const loadingGroups = ref(false);
const districts = ref([]);
const pendingSupplierGroup = ref(null);
const supplierGroupConfirmed = ref(false);

const formatAmount = (value) => {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString();
};

const reloadSupplierGroups = async (country) => {
  loadingGroups.value = true;
  const locality = country === 'Zimbabwe' ? null : 'foreign';
  const response = await getSupplierGroupsWithThresholds(locality);
  supplierGroups.value = response.ok ? (response.data?.data ?? []) : [];
  loadingGroups.value = false;
};

const onSupplierGroupChange = (event) => {
  const supplierGroupId = Number(event.target.value);
  if (!supplierGroupId) {
    props.form.suppliergroup_id = null;
    return;
  }

  pendingSupplierGroup.value = supplierGroups.value.find((group) => group.id === supplierGroupId) ?? null;
  supplierGroupConfirmed.value = false;
  document.getElementById('suppliergroup_confirm_modal')?.showModal();
  event.target.value = props.form.suppliergroup_id ?? '';
};

const cancelSupplierGroup = () => {
  pendingSupplierGroup.value = null;
  supplierGroupConfirmed.value = false;
  document.getElementById('suppliergroup_confirm_modal')?.close();
};

const confirmSupplierGroup = () => {
  if (pendingSupplierGroup.value) {
    props.form.suppliergroup_id = pendingSupplierGroup.value.id;
  }
  cancelSupplierGroup();
};

const onProvinceChange = () => {
  props.form.district_id = null;
};

watch(() => props.form.country, async (country) => {
  props.form.locality = country === 'Zimbabwe' ? 'local' : 'foreign';
  if (country !== 'Zimbabwe') {
    props.form.province_id = null;
    props.form.district_id = null;
    districts.value = [];
  }
  await reloadSupplierGroups(country);
}, { immediate: true });

watch(() => props.form.province_id, async (provinceId) => {
  if (!provinceId) {
    districts.value = [];
    return;
  }
  const response = await getDistrictsByProvince(provinceId);
  districts.value = response.ok ? (response.data?.data ?? []) : [];
}, { immediate: true });

defineExpose({ reloadSupplierGroups });
</script>
