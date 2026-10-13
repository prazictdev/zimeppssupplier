<template>
  <div class="space-y-6">

    <!-- Directors card -->
    <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Icon name="lucide:user-check" class="w-5 h-5" />
          </span>
          <div>
            <h2 class="text-sm font-bold text-base-content">Directors</h2>
            <p class="text-xs text-base-content/50">Add all directors of the organisation.</p>
          </div>
        </div>
        <button type="button" class="btn btn-success btn-sm gap-1" @click="openDirectorModal()">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Add Director
        </button>
      </div>
      <div class="p-6">
        <div v-if="directorsLoading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
        <div v-else-if="!directors.length" class="text-center py-10 text-base-content/40 text-sm">
          No directors added yet. Click "Add Director" to get started.
        </div>
        <div v-else class="divide-y divide-base-200">
          <div v-for="d in directors" :key="d.id" class="flex items-center gap-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
              {{ d.firstname[0] }}{{ d.lastname[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate">{{ d.firstname }} {{ d.middlename ? d.middlename + ' ' : '' }}{{ d.lastname }}</p>
              <p class="text-xs text-base-content/50">{{ d.gender }} &middot; ID: {{ d.national_id }}</p>
            </div>
            <span v-if="d.file_name" class="badge badge-xs badge-ghost gap-1 shrink-0">
              <Icon name="lucide:paperclip" class="w-3 h-3" />
              Doc
            </span>
            <div class="flex gap-1 shrink-0">
              <button type="button" class="btn btn-ghost btn-xs text-info" @click="openDirectorModal(d)">
                <Icon name="lucide:edit" class="w-3.5 h-3.5" />
              </button>
              <button type="button" class="btn btn-ghost btn-xs text-error" :disabled="directorDeleting === d.id" @click="deleteDirector(d.id)">
                <span v-if="directorDeleting === d.id" class="loading loading-spinner loading-xs"></span>
                <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shareholders card -->
    <div class="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-base-200 bg-base-50 px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Icon name="lucide:pie-chart" class="w-5 h-5" />
          </span>
          <div>
            <h2 class="text-sm font-bold text-base-content">Shareholders</h2>
            <p class="text-xs text-base-content/50">Add all shareholders and their ownership percentage.</p>
          </div>
        </div>
        <button type="button" class="btn btn-success btn-sm gap-1" @click="openShareholderModal()">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Add Shareholder
        </button>
      </div>
      <div class="p-6">
        <div v-if="shareholdersLoading" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>
        <div v-else-if="!shareholders.length" class="text-center py-10 text-base-content/40 text-sm">
          No shareholders added yet. Click "Add Shareholder" to get started.
        </div>
        <div v-else>
          <div class="mb-4 flex items-center gap-3">
            <div class="flex-1 rounded-full bg-base-200 h-2 overflow-hidden">
              <div
                :class="['h-2 rounded-full transition-all', totalShares > 100 ? 'bg-error' : totalShares === 100 ? 'bg-success' : 'bg-primary']"
                :style="{ width: Math.min(totalShares, 100) + '%' }"
              />
            </div>
            <span :class="['text-xs font-semibold shrink-0', totalShares > 100 ? 'text-error' : totalShares === 100 ? 'text-success' : 'text-base-content/60']">
              {{ totalShares.toFixed(2) }}% allocated
            </span>
          </div>
          <div class="divide-y divide-base-200">
            <div v-for="s in shareholders" :key="s.id" class="flex items-center gap-4 py-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 font-bold text-sm">
                {{ s.firstname[0] }}{{ s.lastname[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold truncate">{{ s.firstname }} {{ s.middlename ? s.middlename + ' ' : '' }}{{ s.lastname }}</p>
                <p class="text-xs text-base-content/50">{{ s.nationality }} &middot; {{ idTypeLabel(s.identification_type) }}: {{ s.identification_number }}</p>
              </div>
              <span class="badge badge-primary badge-sm shrink-0">{{ s.share_percentage }}%</span>
              <span v-if="s.file_name" class="badge badge-xs badge-ghost gap-1 shrink-0">
                <Icon name="lucide:paperclip" class="w-3 h-3" />
                Doc
              </span>
              <div class="flex gap-1 shrink-0">
                <button type="button" class="btn btn-ghost btn-xs text-info" @click="openShareholderModal(s)">
                  <Icon name="lucide:edit" class="w-3.5 h-3.5" />
                </button>
                <button type="button" class="btn btn-ghost btn-xs text-error" :disabled="shareholderDeleting === s.id" @click="deleteShareholder(s.id)">
                  <span v-if="shareholderDeleting === s.id" class="loading loading-spinner loading-xs"></span>
                  <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Director modal -->
    <dialog id="director_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-base">{{ editingDirector ? 'Edit Director' : 'Add Director' }}</h3>
          <button type="button" class="btn btn-ghost btn-circle btn-sm" onclick="document.getElementById('director_modal').close()">
            <Icon name="lucide:x" />
          </button>
        </div>
        <form @submit.prevent="submitDirector" class="space-y-4">
          <div v-if="directorError" role="alert" class="alert alert-error alert-soft py-2 text-sm">
            <Icon name="lucide:alert-circle" class="w-4 h-4" />
            {{ directorError }}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">First Name <span class="text-error">*</span></legend>
              <input v-model.trim="directorForm.firstname" type="text" :class="['input input-bordered w-full', directorErrors.firstname ? 'input-error' : '']" />
              <label v-if="directorErrors.firstname" class="label"><span class="label-text-alt text-error">{{ directorErrors.firstname }}</span></label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Middle Name</legend>
              <input v-model.trim="directorForm.middlename" type="text" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Last Name <span class="text-error">*</span></legend>
              <input v-model.trim="directorForm.lastname" type="text" :class="['input input-bordered w-full', directorErrors.lastname ? 'input-error' : '']" />
              <label v-if="directorErrors.lastname" class="label"><span class="label-text-alt text-error">{{ directorErrors.lastname }}</span></label>
            </fieldset>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Gender <span class="text-error">*</span></legend>
              <select v-model="directorForm.gender" :class="['select select-bordered w-full', directorErrors.gender ? 'select-error' : '']">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <label v-if="directorErrors.gender" class="label"><span class="label-text-alt text-error">{{ directorErrors.gender }}</span></label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">National ID <span class="text-error">*</span></legend>
              <input v-model.trim="directorForm.national_id" type="text" :class="['input input-bordered w-full', directorErrors.national_id ? 'input-error' : '']" placeholder="e.g. 63-123456A78" />
              <label v-if="directorErrors.national_id" class="label"><span class="label-text-alt text-error">{{ directorErrors.national_id }}</span></label>
            </fieldset>
          </div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ID Document <span class="text-base-content/40 font-normal">(PDF, JPG, PNG — max 10 MB)</span></legend>
            <input
              id="director_file_input"
              type="file"
              class="file-input file-input-bordered w-full"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="(e) => directorForm.file = e.target.files[0] ?? null"
            />
            <p v-if="editingDirector?.file_name && !directorForm.file" class="text-xs text-base-content/50 mt-1">
              Current: {{ editingDirector.file_name }} — upload a new file to replace it.
            </p>
          </fieldset>
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('director_modal').close()">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="directorSubmitting">
              <span v-if="directorSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingDirector ? 'Save Changes' : 'Add Director' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Shareholder modal -->
    <dialog id="shareholder_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-bold text-base">{{ editingShareholder ? 'Edit Shareholder' : 'Add Shareholder' }}</h3>
          <button type="button" class="btn btn-ghost btn-circle btn-sm" onclick="document.getElementById('shareholder_modal').close()">
            <Icon name="lucide:x" />
          </button>
        </div>
        <form @submit.prevent="submitShareholder" class="space-y-4">
          <div v-if="shareholderError" role="alert" class="alert alert-error alert-soft py-2 text-sm">
            <Icon name="lucide:alert-circle" class="w-4 h-4" />
            {{ shareholderError }}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">First Name <span class="text-error">*</span></legend>
              <input v-model.trim="shareholderForm.firstname" type="text" :class="['input input-bordered w-full', shareholderErrors.firstname ? 'input-error' : '']" />
              <label v-if="shareholderErrors.firstname" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.firstname }}</span></label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Middle Name</legend>
              <input v-model.trim="shareholderForm.middlename" type="text" class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Last Name <span class="text-error">*</span></legend>
              <input v-model.trim="shareholderForm.lastname" type="text" :class="['input input-bordered w-full', shareholderErrors.lastname ? 'input-error' : '']" />
              <label v-if="shareholderErrors.lastname" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.lastname }}</span></label>
            </fieldset>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Share % <span class="text-error">*</span></legend>
              <input v-model.number="shareholderForm.share_percentage" type="number" min="0.01" max="100" step="0.01" :class="['input input-bordered w-full', shareholderErrors.share_percentage ? 'input-error' : '']" placeholder="e.g. 25.00" />
              <label v-if="shareholderErrors.share_percentage" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.share_percentage }}</span></label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Nationality <span class="text-error">*</span></legend>
              <input v-model.trim="shareholderForm.nationality" type="text" :class="['input input-bordered w-full', shareholderErrors.nationality ? 'input-error' : '']" placeholder="e.g. Zimbabwean" />
              <label v-if="shareholderErrors.nationality" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.nationality }}</span></label>
            </fieldset>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ID Type <span class="text-error">*</span></legend>
              <select v-model="shareholderForm.identification_type" :class="['select select-bordered w-full', shareholderErrors.identification_type ? 'select-error' : '']">
                <option value="">Select type</option>
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
              <label v-if="shareholderErrors.identification_type" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.identification_type }}</span></label>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">ID Number <span class="text-error">*</span></legend>
              <input v-model.trim="shareholderForm.identification_number" type="text" :class="['input input-bordered w-full', shareholderErrors.identification_number ? 'input-error' : '']" />
              <label v-if="shareholderErrors.identification_number" class="label"><span class="label-text-alt text-error">{{ shareholderErrors.identification_number }}</span></label>
            </fieldset>
          </div>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ID Document <span class="text-base-content/40 font-normal">(PDF, JPG, PNG — max 10 MB)</span></legend>
            <input
              id="shareholder_file_input"
              type="file"
              class="file-input file-input-bordered w-full"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="(e) => shareholderForm.file = e.target.files[0] ?? null"
            />
            <p v-if="editingShareholder?.file_name && !shareholderForm.file" class="text-xs text-base-content/50 mt-1">
              Current: {{ editingShareholder.file_name }} — upload a new file to replace it.
            </p>
          </fieldset>
          <div class="modal-action mt-2">
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('shareholder_modal').close()">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="shareholderSubmitting">
              <span v-if="shareholderSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingShareholder ? 'Save Changes' : 'Add Shareholder' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

  </div>
</template>

<script setup>
const props = defineProps({
  companyId: { type: Number, default: null },
});

const {
  getDirectors, addDirector, updateDirector, removeDirector,
  getShareholders, addShareholder, updateShareholder, removeShareholder,
} = useDirectorShareholderHelper();

// ── Directors ──
const directors = ref([]);
const directorsLoading = ref(false);
const directorDeleting = ref(null);
const directorSubmitting = ref(false);
const directorError = ref('');
const editingDirector = ref(null);
const directorForm = reactive({ firstname: '', middlename: '', lastname: '', gender: '', national_id: '', file: null });
const directorErrors = reactive({ firstname: '', middlename: '', lastname: '', gender: '', national_id: '' });

const idTypeLabel = (type) => ({ national_id: 'National ID', passport: 'Passport', drivers_license: "Driver's License" }[type] ?? type);

const loadDirectors = async () => {
  if (!props.companyId) return;
  directorsLoading.value = true;
  const { ok, data } = await getDirectors(props.companyId);
  if (ok) directors.value = data?.data ?? [];
  directorsLoading.value = false;
};

const openDirectorModal = (director = null) => {
  editingDirector.value = director;
  directorError.value = '';
  Object.keys(directorErrors).forEach((k) => (directorErrors[k] = ''));
  if (director) {
    directorForm.firstname = director.firstname;
    directorForm.middlename = director.middlename ?? '';
    directorForm.lastname = director.lastname;
    directorForm.gender = director.gender;
    directorForm.national_id = director.national_id;
    directorForm.file = null;
  } else {
    Object.assign(directorForm, { firstname: '', middlename: '', lastname: '', gender: '', national_id: '', file: null });
  }
  const inp = document.getElementById('director_file_input');
  if (inp) inp.value = '';
  document.getElementById('director_modal').showModal();
};

const submitDirector = async () => {
  Object.keys(directorErrors).forEach((k) => (directorErrors[k] = ''));
  directorError.value = '';
  let valid = true;
  if (!directorForm.firstname) { directorErrors.firstname = 'Required'; valid = false; }
  if (!directorForm.lastname) { directorErrors.lastname = 'Required'; valid = false; }
  if (!directorForm.gender) { directorErrors.gender = 'Required'; valid = false; }
  if (!directorForm.national_id) { directorErrors.national_id = 'Required'; valid = false; }
  if (!valid) return;

  directorSubmitting.value = true;
  const body = {
    firstname: directorForm.firstname,
    lastname: directorForm.lastname,
    gender: directorForm.gender,
    national_id: directorForm.national_id,
    ...(directorForm.middlename && { middlename: directorForm.middlename }),
    ...(directorForm.file && { file: directorForm.file }),
  };

  const { ok, error } = editingDirector.value
    ? await updateDirector(props.companyId, editingDirector.value.id, body)
    : await addDirector(props.companyId, body);

  directorSubmitting.value = false;
  if (!ok) { directorError.value = error; return; }
  await loadDirectors();
  document.getElementById('director_modal').close();
};

const deleteDirector = async (id) => {
  directorDeleting.value = id;
  await removeDirector(props.companyId, id);
  directors.value = directors.value.filter((d) => d.id !== id);
  directorDeleting.value = null;
};

// ── Shareholders ──
const shareholders = ref([]);
const shareholdersLoading = ref(false);
const shareholderDeleting = ref(null);
const shareholderSubmitting = ref(false);
const shareholderError = ref('');
const editingShareholder = ref(null);
const shareholderForm = reactive({ firstname: '', middlename: '', lastname: '', share_percentage: '', nationality: '', identification_type: '', identification_number: '', file: null });
const shareholderErrors = reactive({ firstname: '', lastname: '', share_percentage: '', nationality: '', identification_type: '', identification_number: '' });

const totalShares = computed(() => shareholders.value.reduce((sum, s) => sum + parseFloat(s.share_percentage ?? 0), 0));

const loadShareholders = async () => {
  if (!props.companyId) return;
  shareholdersLoading.value = true;
  const { ok, data } = await getShareholders(props.companyId);
  if (ok) shareholders.value = data?.data ?? [];
  shareholdersLoading.value = false;
};

const openShareholderModal = (shareholder = null) => {
  editingShareholder.value = shareholder;
  shareholderError.value = '';
  Object.keys(shareholderErrors).forEach((k) => (shareholderErrors[k] = ''));
  if (shareholder) {
    shareholderForm.firstname = shareholder.firstname;
    shareholderForm.middlename = shareholder.middlename ?? '';
    shareholderForm.lastname = shareholder.lastname;
    shareholderForm.share_percentage = shareholder.share_percentage;
    shareholderForm.nationality = shareholder.nationality;
    shareholderForm.identification_type = shareholder.identification_type;
    shareholderForm.identification_number = shareholder.identification_number;
    shareholderForm.file = null;
  } else {
    Object.assign(shareholderForm, { firstname: '', middlename: '', lastname: '', share_percentage: '', nationality: '', identification_type: '', identification_number: '', file: null });
  }
  const inp = document.getElementById('shareholder_file_input');
  if (inp) inp.value = '';
  document.getElementById('shareholder_modal').showModal();
};

const submitShareholder = async () => {
  Object.keys(shareholderErrors).forEach((k) => (shareholderErrors[k] = ''));
  shareholderError.value = '';
  let valid = true;
  if (!shareholderForm.firstname) { shareholderErrors.firstname = 'Required'; valid = false; }
  if (!shareholderForm.lastname) { shareholderErrors.lastname = 'Required'; valid = false; }
  if (!shareholderForm.share_percentage) { shareholderErrors.share_percentage = 'Required'; valid = false; }
  if (!shareholderForm.nationality) { shareholderErrors.nationality = 'Required'; valid = false; }
  if (!shareholderForm.identification_type) { shareholderErrors.identification_type = 'Required'; valid = false; }
  if (!shareholderForm.identification_number) { shareholderErrors.identification_number = 'Required'; valid = false; }
  if (!valid) return;

  shareholderSubmitting.value = true;
  const body = {
    firstname: shareholderForm.firstname,
    lastname: shareholderForm.lastname,
    share_percentage: shareholderForm.share_percentage,
    nationality: shareholderForm.nationality,
    identification_type: shareholderForm.identification_type,
    identification_number: shareholderForm.identification_number,
    ...(shareholderForm.middlename && { middlename: shareholderForm.middlename }),
    ...(shareholderForm.file && { file: shareholderForm.file }),
  };

  const { ok, error } = editingShareholder.value
    ? await updateShareholder(props.companyId, editingShareholder.value.id, body)
    : await addShareholder(props.companyId, body);

  shareholderSubmitting.value = false;
  if (!ok) { shareholderError.value = error; return; }
  await loadShareholders();
  document.getElementById('shareholder_modal').close();
};

const deleteShareholder = async (id) => {
  shareholderDeleting.value = id;
  await removeShareholder(props.companyId, id);
  shareholders.value = shareholders.value.filter((s) => s.id !== id);
  shareholderDeleting.value = null;
};

const load = async () => {
  await Promise.all([loadDirectors(), loadShareholders()]);
};

defineExpose({ load });
</script>
