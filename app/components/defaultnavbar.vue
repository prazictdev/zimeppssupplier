<template>
  <header
    class="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur-md"
  >
    <div class="navbar mx-auto max-w-7xl px-4 py-1">
      <!-- Brand -->
      <div class="flex flex-1 items-center gap-3">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2">
          <img
            v-if="showLogoImage"
            :src="imgUrl"
            alt="Coat of Arms of Zimbabwe"
            class="h-11 w-11 rounded-md border border-base-300 object-contain"
            @error="showLogoImage = false"
          />
          <div class="hidden flex-col sm:flex">
            <span class="text-sm font-bold leading-tight text-base-content">
              ZimEpps
            </span>
            <span class="text-xs text-base-content/60">
              Zimbabwe Electronic Public Procurement System
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Desktop nav -->
      <nav class="hidden lg:flex lg:flex-none">
        <ul class="menu menu-horizontal gap-1 p-0 text-sm">
          <li>
            <NuxtLink to="/" class="rounded-lg font-medium" active-class="bg-base-200">
              Home
            </NuxtLink>
          </li>
          <li>
            <details>
              <summary class="rounded-lg font-medium">Tenders</summary>
              <ul class="w-48 rounded-box bg-base-100 shadow-lg">
                <li><NuxtLink to="/tenders"><Icon name="lucide:search" class="h-4 w-4" /> Browse Tenders</NuxtLink></li>
                <li><NuxtLink to="/#categories"><Icon name="lucide:layout-grid" class="h-4 w-4" /> Browse Categories</NuxtLink></li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary class="rounded-lg font-medium">Suppliers</summary>
              <ul class="w-52 rounded-box bg-base-100 shadow-lg">
                <li><NuxtLink to="/register"><Icon name="lucide:user-plus" class="h-4 w-4" /> Supplier Registration</NuxtLink></li>
                <li><NuxtLink to="/#how-it-works"><Icon name="lucide:list-checks" class="h-4 w-4" /> How It Works</NuxtLink></li>
              </ul>
            </details>
          </li>
          <li>
            <details>
              <summary class="rounded-lg font-medium">Entities</summary>
              <ul class="w-52 rounded-box bg-base-100 shadow-lg">
                <li><a><Icon name="lucide:building-2" class="h-4 w-4" /> Procuring Entities</a></li>
                <li><a><Icon name="lucide:file-text" class="h-4 w-4" /> Publish a Tender</a></li>
              </ul>
            </details>
          </li>
          <li>
            <a class="rounded-lg font-medium">Resources</a>
          </li>
        </ul>
      </nav>

      <!-- Auth buttons -->
      <div class="flex flex-none items-center gap-2 pl-4">
        <NuxtLink to="/login" class="btn btn-sm hidden sm:flex">
          <Icon name="lucide:lock" class="h-3.5 w-3.5" />
          Login
        </NuxtLink>
        <NuxtLink to="/register" class="btn btn-primary btn-sm hidden sm:flex">
          <Icon name="lucide:user-plus" class="h-3.5 w-3.5" />
          Register
        </NuxtLink>

        <!-- Mobile hamburger -->
        <div class="dropdown dropdown-end lg:hidden">
          <label tabindex="0" class="btn btn-ghost btn-sm">
            <Icon name="lucide:menu" class="h-5 w-5" />
          </label>
          <ul tabindex="0" class="menu dropdown-content z-50 mt-2 w-56 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
            <li><NuxtLink to="/">Home</NuxtLink></li>
            <li><NuxtLink to="/tenders">Browse Tenders</NuxtLink></li>
            <li><NuxtLink to="/#categories">Browse Categories</NuxtLink></li>
            <li><NuxtLink to="/register">Supplier Registration</NuxtLink></li>
            <li><NuxtLink to="/#how-it-works">How It Works</NuxtLink></li>
            <li><a>Procuring Entities</a></li>
            <li><a>Resources</a></li>
            <li class="mt-2 border-t border-base-200 pt-2">
              <NuxtLink to="/login" class="font-medium text-primary">Login</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/register" class="font-medium">Register</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
const imgUrl = ref('/img/nationalemblem.png')
const showLogoImage = ref(true)
</script>
