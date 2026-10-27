<template>
  <main class="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-[#f5faf7] px-5 py-10 sm:px-8">
    <section class="card card-border w-full max-w-md bg-base-100 shadow-xl shadow-[#263b70]/5">
      <div class="card-body gap-0 p-6 sm:p-8">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e3f2eb] text-[#008f55]">
          <Icon name="lucide:lock-keyhole" class="h-5 w-5" />
        </div>
        <h1 class="mt-5 text-2xl font-bold tracking-tight text-base-content">Sign in</h1>
        <p class="mt-1 text-sm leading-6 text-base-content/55">Access your ZimEpps supplier workspace.</p>

        <form class="mt-6 space-y-4" novalidate @submit.prevent="handleLogin">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Email address</legend>
            <label :class="['input w-full gap-3', errors.email ? 'input-error' : '']">
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
            <label :class="['input w-full gap-3', errors.password ? 'input-error' : '']">
              <Icon name="lucide:lock-keyhole" class="h-4 w-4 text-base-content/35" />
              <input v-model="form.password" type="password" placeholder="Enter your password" autocomplete="current-password" aria-label="Password" />
            </label>
            <p v-if="errors.password" class="mt-1 text-xs text-error">{{ errors.password }}</p>
          </fieldset>

          <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm" />
            {{ submitting ? 'Signing in' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 border-t border-base-200 pt-5 text-center text-sm text-base-content/55">New supplier? <NuxtLink to="/register" class="link link-primary font-semibold">Create an account</NuxtLink></p>
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
