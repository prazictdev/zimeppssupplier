<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
    <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Icon name="lucide:landmark" class="w-5 h-5" />
        </span>
        <div>
          <h2 class="text-sm font-bold text-base-content">Banking Details</h2>
          <p class="text-xs text-base-content/50">Add the bank accounts your organisation uses for procurement transactions.</p>
        </div>
      </div>
      <button type="button" class="btn btn-success btn-sm gap-1" @click="openModal()">
        <Icon name="lucide:plus" class="w-4 h-4" />
        Add Account
      </button>
    </div>

    <div class="p-6">
      <div v-if="loading" class="flex justify-center py-10">
        <span class="loading loading-spinner loading-md text-primary"></span>
      </div>

      <div v-else-if="!records.length" class="text-center py-10 text-base-content/40 text-sm">
        No bank accounts added yet. Click "Add Account" to get started.
      </div>

      <div v-else class="divide-y divide-base-200">
        <div v-for="rec in records" :key="rec.id" class="flex items-start gap-4 py-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="lucide:building-2" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ rec.bank }}</p>
            <p class="text-xs text-base-content/50 truncate">
              {{ rec.account_name }} &middot; {{ rec.account_number }}
            </p>
            <p class="text-xs text-base-content/40 truncate">
              Branch: {{ rec.branch_name }} ({{ rec.branch_code }})
            </p>
          </div>
          <span class="badge badge-sm badge-ghost shrink-0">{{ rec.currency?.code }}</span>
          <div class="flex gap-1 shrink-0">
            <button type="button" class="btn btn-ghost btn-xs text-info" @click="openModal(rec)">
              <Icon name="lucide:edit" class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs text-error"
              :disabled="deleting === rec.id"
              @click="remove(rec.id)"
            >
              <span v-if="deleting === rec.id" class="loading loading-spinner loading-xs"></span>
              <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add / Edit modal -->
  <dialog ref="modalRef" class="modal">
    <div class="modal-box max-w-lg">
      <div class="flex items-center justify-between mb-5">
        <h3 class="font-bold text-base">{{ editing ? 'Edit Bank Account' : 'Add Bank Account' }}</h3>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" @click="closeModal">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="serverError" role="alert" class="alert alert-error alert-soft mb-4 text-sm">
        <Icon name="lucide:alert-circle" class="w-4 h-4" />
        {{ serverError }}
      </div>

      <div class="space-y-4">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Bank Name <span class="text-error">*</span></legend>
          <input
            v-model.trim="form.bank"
            type="text"
            :class="['input input-bordered w-full', errors.bank ? 'input-error' : '']"
            placeholder="e.g. CBZ Bank"
          />
          <label v-if="errors.bank" class="label"><span class="label-text-alt text-error">{{ errors.bank }}</span></label>
        </fieldset>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Branch Code <span class="text-error">*</span></legend>
            <input
              v-model.trim="form.branch_code"
              type="text"
              :class="['input input-bordered w-full', errors.branch_code ? 'input-error' : '']"
              placeholder="e.g. 003"
            />
            <label v-if="errors.branch_code" class="label"><span class="label-text-alt text-error">{{ errors.branch_code }}</span></label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Branch Name <span class="text-error">*</span></legend>
            <input
              v-model.trim="form.branch_name"
              type="text"
              :class="['input input-bordered w-full', errors.branch_name ? 'input-error' : '']"
              placeholder="e.g. Harare CBD Branch"
            />
            <label v-if="errors.branch_name" class="label"><span class="label-text-alt text-error">{{ errors.branch_name }}</span></label>
          </fieldset>
        </div>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Account Name <span class="text-error">*</span></legend>
          <input
            v-model.trim="form.account_name"
            type="text"
            :class="['input input-bordered w-full', errors.account_name ? 'input-error' : '']"
            placeholder="e.g. Harare City Council Operations"
          />
          <label v-if="errors.account_name" class="label"><span class="label-text-alt text-error">{{ errors.account_name }}</span></label>
        </fieldset>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Account Number <span class="text-error">*</span></legend>
            <input
              v-model.trim="form.account_number"
              type="text"
              :class="['input input-bordered w-full', errors.account_number ? 'input-error' : '']"
              placeholder="e.g. 123456789"
            />
            <label v-if="errors.account_number" class="label"><span class="label-text-alt text-error">{{ errors.account_number }}</span></label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Currency <span class="text-error">*</span></legend>
            <select
              v-model="form.currency_id"
              :class="['select select-bordered w-full', errors.currency_id ? 'select-error' : '']"
            >
              <option :value="null">Select currency</option>
              <option v-for="c in currencies" :key="c.id" :value="c.id">{{ c.code }} — {{ c.name }}</option>
            </select>
            <label v-if="errors.currency_id" class="label"><span class="label-text-alt text-error">{{ errors.currency_id }}</span></label>
          </fieldset>
        </div>
      </div>

      <div class="modal-action mt-6">
        <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
        <button type="button" class="btn btn-success" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-xs"></span>
          {{ editing ? 'Save Changes' : 'Add Account' }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup>
const props = defineProps({
  companyId: { type: Number, default: null },
});

const { getBankDetails, addBankDetail, updateBankDetail, removeBankDetail } = useCompanyBankDetailHelper();
const { getActiveCurrencies } = useCurrencyHelper();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const deleting = ref(null);
const records = ref([]);
const currencies = ref([]);
const modalRef = ref(null);
const editing = ref(null); // holds the record being edited, or null for add
const serverError = ref('');

const blankForm = () => ({ bank: '', branch_code: '', branch_name: '', account_name: '', account_number: '', currency_id: null });
const form = reactive(blankForm());
const errors = reactive({ bank: '', branch_code: '', branch_name: '', account_name: '', account_number: '', currency_id: '' });

const clearErrors = () => Object.keys(errors).forEach((k) => (errors[k] = ''));

const validate = () => {
  clearErrors();
  let valid = true;
  if (!form.bank) { errors.bank = 'Bank name is required'; valid = false; }
  if (!form.branch_code) { errors.branch_code = 'Branch code is required'; valid = false; }
  if (!form.branch_name) { errors.branch_name = 'Branch name is required'; valid = false; }
  if (!form.account_name) { errors.account_name = 'Account name is required'; valid = false; }
  if (!form.account_number) { errors.account_number = 'Account number is required'; valid = false; }
  if (!form.currency_id) { errors.currency_id = 'Currency is required'; valid = false; }
  return valid;
};

const load = async () => {
  if (!props.companyId) return;
  loading.value = true;
  const [detailsRes, currRes] = await Promise.all([
    getBankDetails(props.companyId),
    getActiveCurrencies(),
  ]);
  records.value = detailsRes.data?.data ?? [];
  currencies.value = currRes.data?.data ?? [];
  loading.value = false;
};

const openModal = (record = null) => {
  serverError.value = '';
  clearErrors();
  editing.value = record;
  if (record) {
    Object.assign(form, {
      bank: record.bank,
      branch_code: record.branch_code,
      branch_name: record.branch_name,
      account_name: record.account_name,
      account_number: record.account_number,
      currency_id: record.currency_id,
    });
  } else {
    Object.assign(form, blankForm());
  }
  modalRef.value?.showModal();
};

const closeModal = () => modalRef.value?.close();

const isStepComplete = computed(() => records.value.length > 0);

const save = async () => {
  if (!validate()) return;
  saving.value = true;
  serverError.value = '';

  const payload = { ...form };
  const { ok, data, error } = editing.value
    ? await updateBankDetail(props.companyId, editing.value.id, payload)
    : await addBankDetail(props.companyId, payload);

  saving.value = false;

  if (!ok) {
    serverError.value = error;
    return;
  }

  toast.success({
    title: editing.value ? 'Bank account updated' : 'Bank account added',
    message: 'Your organisation banking information has been saved.',
    position: 'topRight',
    layout: 2,
  });
  closeModal();
  await load();
};

const remove = async (id) => {
  deleting.value = id;
  const { ok, error } = await removeBankDetail(props.companyId, id);
  deleting.value = null;
  if (!ok) {
    toast.error({
      title: 'Could not remove bank account',
      message: error,
      position: 'topRight',
      layout: 2,
    });
    return;
  }
  records.value = records.value.filter((r) => r.id !== id);
};

defineExpose({ load, isStepComplete });
</script>
