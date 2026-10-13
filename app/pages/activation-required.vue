<template>
  <main class="flex min-h-screen items-center justify-center bg-base-200 p-4 md:p-6">
    <section class="w-full max-w-lg rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
      <div class="flex flex-col items-center text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-error/15">
          <Icon name="lucide:mail-warning" class="h-8 w-8 text-error" />
        </div>
        <p class="mt-5 text-sm font-semibold uppercase tracking-wide text-error">Activation required</p>
        <h1 class="mt-1 text-2xl font-bold">Your supplier account is not active</h1>
        <p class="mt-3 text-sm leading-6 text-base-content/70">
          You need to activate your account before signing in. If the original email did not arrive,
          request a new activation link below.
        </p>
      </div>

      <div v-if="successMessage" role="alert" class="alert alert-success alert-soft mt-6">
        <Icon name="lucide:circle-check" />
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mt-6">
        <Icon name="lucide:circle-alert" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="handleResend">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Supplier account email</legend>
          <input
            v-model.trim="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            :class="['input input-bordered w-full', validationError ? 'input-error' : '']"
          />
          <p v-if="validationError" class="text-xs text-error">{{ validationError }}</p>
        </fieldset>

        <button type="submit" class="btn btn-success w-full" :disabled="resending">
          <span v-if="resending" class="loading loading-spinner loading-sm" aria-hidden="true"></span>
          <span>{{ resending ? 'Sending activation link...' : 'Resend activation link' }}</span>
        </button>
      </form>

      <div class="mt-6 flex flex-col gap-2 text-center text-sm sm:flex-row sm:justify-center sm:gap-4">
        <NuxtLink to="/login" class="link link-hover">Back to login</NuxtLink>
        <NuxtLink to="/register" class="link link-hover">Create another account</NuxtLink>
      </div>
    </section>

    <Loader :loading="resending" />
  </main>
</template>

<script setup>
definePageMeta({
  layout: 'auth',
  sanctum: { guestOnly: true },
});

useHead({ title: 'Account Activation Required' });

const route = useRoute();
const { resendActivation } = useAuthHelper();

const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const resending = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const validationError = ref('');

const handleResend = async () => {
  successMessage.value = '';
  errorMessage.value = '';
  validationError.value = '';

  try {
    const validData = await ResetSchema.validate({ email: email.value });
    resending.value = true;

    const { ok, data, error } = await resendActivation(validData.email);

    if (ok) {
      successMessage.value =
        data?.message || 'If a pending account exists for this email, a new activation link has been sent.';
      return;
    }

    errorMessage.value = error || 'Could not resend the activation link. Please try again.';
  } catch (error) {
    validationError.value = error?.message || 'Enter a valid email address.';
  } finally {
    resending.value = false;
  }
};
</script>
