<template>
  <main class="grid min-h-[calc(100vh-4.5rem)] bg-base-200 lg:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)]">
    <aside class="relative hidden overflow-hidden bg-neutral px-10 py-12 text-neutral-content lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div class="absolute inset-y-0 right-0 w-1.5 bg-accent" aria-hidden="true" />
      <div>
        <div class="flex items-center gap-3">
          <img src="/img/nationalemblem.png" alt="Coat of Arms of Zimbabwe" class="h-12 w-12 rounded-md bg-white object-contain p-0.5" />
          <div><p class="font-bold">ZimEpps</p><p class="text-xs text-neutral-content/55">Zimbabwe Electronic Public Procurement System</p></div>
        </div>
        <h1 class="mt-16 max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Your public procurement work, in one secure place.</h1>
        <p class="mt-5 max-w-md text-base leading-7 text-neutral-content/65">Manage registrations, settle invoices, find opportunities and track every bid from one workspace.</p>
      </div>
      <div class="border-t border-neutral-content/15 pt-6">
        <div class="flex gap-3 text-sm text-neutral-content/70"><Icon name="lucide:shield-check" class="mt-0.5 h-5 w-5 shrink-0 text-accent" /><p>Only sign in from a trusted device. Your activity is protected and recorded.</p></div>
      </div>
    </aside>

    <section class="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
      <div class="w-full max-w-md">
        <div class="mb-9 flex items-center gap-3 lg:hidden">
          <img src="/img/nationalemblem.png" alt="Coat of Arms of Zimbabwe" class="h-11 w-11 rounded-md bg-white object-contain" />
          <div><p class="font-bold">ZimEpps</p><p class="text-xs text-base-content/50">Supplier portal</p></div>
        </div>
        <p class="section-kicker">Welcome back</p>
        <h2 class="mt-2 text-3xl font-bold tracking-tight">Sign in to your workspace</h2>
        <p class="mt-2 text-sm leading-6 text-base-content/60">Use the email address registered to your supplier account.</p>

        <form class="mt-8 space-y-5" novalidate @submit.prevent="handleLogin">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Email address</legend>
            <label :class="['input w-full gap-3 bg-base-100', errors.email ? 'input-error' : '']">
              <Icon name="lucide:mail" class="h-4 w-4 text-base-content/35" />
              <input v-model.trim="form.email" type="email" placeholder="name@company.co.zw" autocomplete="email" aria-label="Email address" />
            </label>
            <p v-if="errors.email" class="mt-1 text-xs text-error">{{ errors.email }}</p>
          </fieldset>

          <fieldset class="fieldset">
            <div class="flex items-center justify-between">
              <legend class="fieldset-legend">Password</legend>
              <NuxtLink to="/forgot-password" class="link link-primary text-xs">Forgot password?</NuxtLink>
            </div>
            <label :class="['input w-full gap-3 bg-base-100', errors.password ? 'input-error' : '']">
              <Icon name="lucide:lock-keyhole" class="h-4 w-4 text-base-content/35" />
              <input v-model="form.password" type="password" placeholder="Enter your password" autocomplete="current-password" aria-label="Password" />
            </label>
            <p v-if="errors.password" class="mt-1 text-xs text-error">{{ errors.password }}</p>
          </fieldset>

          <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm" />
            {{ submitting ? 'Signing in' : 'Sign in securely' }}
          </button>
        </form>

        <p class="mt-7 border-t border-base-300 pt-6 text-sm text-base-content/60">New to the supplier portal? <NuxtLink to="/register" class="link link-primary font-semibold">Create an account</NuxtLink></p>
      </div>
    </section>
    <Loader :loading="submitting" />
  </main>
</template>

<script setup>
definePageMeta({ layout: 'auth', sanctum: { guestOnly: true } })
useHead({ title: 'Supplier sign in' })

const toast = useToast()
const authHelper = useAuthHelper()
const submitting = ref(false)
const errors = reactive({ email: '', password: '' })
const form = reactive({ email: '', password: '' })

const handleLogin = async () => {
  submitting.value = true
  errors.email = ''
  errors.password = ''
  try {
    const validData = await AuthSchema.validate(form, { abortEarly: false })
    const { ok, error, reason } = await authHelper.loginWithPassword(validData)
    if (!ok) {
      if (reason === 'activation_required') {
        await navigateTo({ path: '/activation-required', query: { email: validData.email } })
        return
      }
      toast.error({ title: 'Sign in failed', message: error || 'Check your details and try again.', position: 'topRight', layout: 2 })
    }
  } catch (error) {
    if (error?.inner?.length) {
      error.inner.forEach((entry) => {
        if (entry.path && Object.prototype.hasOwnProperty.call(errors, entry.path)) errors[entry.path] = entry.message
      })
    } else if (error?.path && Object.prototype.hasOwnProperty.call(errors, error.path)) errors[error.path] = error.message
  } finally {
    submitting.value = false
  }
}
</script>
