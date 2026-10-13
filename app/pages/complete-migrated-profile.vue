<template>
  <main class="min-h-screen bg-base-200 px-4 py-10">
    <section class="mx-auto max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl md:p-8">
      <div class="flex items-start gap-3">
        <div class="rounded-full bg-success/10 p-3 text-success">
          <Icon name="lucide:badge-check" size="28" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold">Confirm your migrated account</h1>
          <p class="mt-1 text-sm text-base-content/70">
            Your organization and approved 2026 categories have already been migrated. Confirm your
            personal details and replace the temporary password to continue.
          </p>
        </div>
      </div>

      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mt-5">
        <Icon name="lucide:circle-alert" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="submit">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">First name</legend>
          <input v-model.trim="form.name" class="input input-bordered w-full" type="text" autocomplete="given-name" />
          <p v-if="errors.name" class="text-xs text-error">{{ errors.name }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Middle name <span class="font-normal text-base-content/50">(optional)</span></legend>
          <input v-model.trim="form.middlename" class="input input-bordered w-full" type="text" autocomplete="additional-name" />
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Last name</legend>
          <input v-model.trim="form.lastname" class="input input-bordered w-full" type="text" autocomplete="family-name" />
          <p v-if="errors.lastname" class="text-xs text-error">{{ errors.lastname }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Mobile number</legend>
          <input v-model.trim="form.phone" class="input input-bordered w-full" type="tel" autocomplete="tel" />
          <p v-if="errors.phone" class="text-xs text-error">{{ errors.phone }}</p>
        </fieldset>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">Gender</legend>
          <select v-model="form.gender" class="select select-bordered w-full">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / prefer not to say</option>
          </select>
          <p v-if="errors.gender" class="text-xs text-error">{{ errors.gender }}</p>
        </fieldset>

        <div class="divider md:col-span-2">Secure your account</div>

        <fieldset class="fieldset md:col-span-2">
          <legend class="fieldset-legend">Temporary password</legend>
          <input
            v-model="form.current_password"
            class="input input-bordered w-full"
            type="password"
            autocomplete="current-password"
          />
          <p v-if="errors.current_password" class="text-xs text-error">{{ errors.current_password }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">New password</legend>
          <input v-model="form.password" class="input input-bordered w-full" type="password" autocomplete="new-password" />
          <p v-if="errors.password" class="text-xs text-error">{{ errors.password }}</p>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">Confirm new password</legend>
          <input
            v-model="form.password_confirmation"
            class="input input-bordered w-full"
            type="password"
            autocomplete="new-password"
          />
          <p v-if="errors.password_confirmation" class="text-xs text-error">{{ errors.password_confirmation }}</p>
        </fieldset>

        <div class="md:col-span-2">
          <button class="btn btn-success w-full" type="submit" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm" />
            {{ submitting ? 'Saving…' : 'Save and continue' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  sanctum: { authOnly: true },
})
useHead({ title: 'Confirm migrated account' })

const { user } = useSanctumAuth()
const auth = useAuthHelper()
const toast = useToast()
const submitting = ref(false)
const errorMessage = ref('')
const currentUser = computed(() => user.value?.data?.user ?? {})

const form = reactive({
  name: '',
  middlename: '',
  lastname: '',
  phone: '',
  gender: '',
  current_password: '',
  password: '',
  password_confirmation: '',
})
const errors = reactive({
  name: '',
  lastname: '',
  phone: '',
  gender: '',
  current_password: '',
  password: '',
  password_confirmation: '',
})

onMounted(() => {
  form.phone = currentUser.value.phone ?? ''
})

const validate = () => {
  Object.keys(errors).forEach((key) => { errors[key] = '' })
  if (!form.name) errors.name = 'First name is required.'
  if (!form.lastname) errors.lastname = 'Last name is required.'
  if (!form.phone) errors.phone = 'Mobile number is required.'
  if (!form.gender) errors.gender = 'Select a gender.'
  if (!form.current_password) errors.current_password = 'Enter the temporary password.'
  if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
    errors.password = 'Use at least 8 characters including a letter and a number.'
  }
  if (form.password_confirmation !== form.password) {
    errors.password_confirmation = 'Passwords do not match.'
  }
  return !Object.values(errors).some(Boolean)
}

const submit = async () => {
  errorMessage.value = ''
  if (!validate()) return
  submitting.value = true
  const result = await auth.completeMigratedProfile({ ...form })
  submitting.value = false
  if (!result.ok) {
    errorMessage.value = result.error
    return
  }
  toast.success({
    title: 'Account updated',
    message: 'Complete the remaining organization profile details.',
    position: 'topRight',
    layout: 2,
  })
  await navigateTo('/setup-organisation')
}
</script>
