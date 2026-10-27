<template>
  <header
    ref="navbarRoot"
    class="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur-md"
  >
    <div class="navbar mx-auto max-w-7xl px-4 py-1">
      <!-- Brand -->
      <div class="flex flex-1 items-center gap-3">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2" @click="closeMenus">
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
            <NuxtLink to="/" class="rounded-lg font-medium" active-class="bg-base-200" @click="closeMenus">
              Home
            </NuxtLink>
          </li>
          <li class="dropdown dropdown-bottom" :class="{ 'dropdown-open': openMenu === 'tenders' }">
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg font-medium"
              :aria-expanded="openMenu === 'tenders'"
              aria-controls="tenders-menu"
              @click.stop="toggleMenu('tenders')"
            >
              Tenders
              <Icon name="lucide:chevron-down" class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': openMenu === 'tenders' }" />
            </button>
            <ul id="tenders-menu" class="menu dropdown-content z-50 mt-2 w-52 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
              <li><NuxtLink to="/tenders" @click="closeMenus"><Icon name="lucide:search" class="h-4 w-4" /> Browse Tenders</NuxtLink></li>
              <li><NuxtLink to="/#current-tenders" @click="closeMenus"><Icon name="lucide:radio" class="h-4 w-4" /> Live Opportunities</NuxtLink></li>
            </ul>
          </li>
          <li class="dropdown dropdown-bottom" :class="{ 'dropdown-open': openMenu === 'suppliers' }">
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg font-medium"
              :aria-expanded="openMenu === 'suppliers'"
              aria-controls="suppliers-menu"
              @click.stop="toggleMenu('suppliers')"
            >
              Suppliers
              <Icon name="lucide:chevron-down" class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': openMenu === 'suppliers' }" />
            </button>
            <ul id="suppliers-menu" class="menu dropdown-content z-50 mt-2 w-52 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
              <li><NuxtLink to="/register" @click="closeMenus"><Icon name="lucide:user-plus" class="h-4 w-4" /> Supplier Registration</NuxtLink></li>
              <li><NuxtLink to="/#how-it-works" @click="closeMenus"><Icon name="lucide:list-checks" class="h-4 w-4" /> How It Works</NuxtLink></li>
            </ul>
          </li>
          <li class="dropdown dropdown-bottom" :class="{ 'dropdown-open': openMenu === 'entities' }">
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg font-medium"
              :aria-expanded="openMenu === 'entities'"
              aria-controls="entities-menu"
              @click.stop="toggleMenu('entities')"
            >
              Entities
              <Icon name="lucide:chevron-down" class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': openMenu === 'entities' }" />
            </button>
            <ul id="entities-menu" class="menu dropdown-content z-50 mt-2 w-52 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
              <li><button type="button" @click="closeMenus"><Icon name="lucide:building-2" class="h-4 w-4" /> Procuring Entities</button></li>
              <li><button type="button" @click="closeMenus"><Icon name="lucide:file-text" class="h-4 w-4" /> Publish a Tender</button></li>
            </ul>
          </li>
          <li>
            <button type="button" class="rounded-lg font-medium" @click="closeMenus">Resources</button>
          </li>
        </ul>
      </nav>

      <!-- Auth buttons -->
      <div class="flex flex-none items-center gap-2 pl-4">
        <NuxtLink to="/login" class="btn btn-sm hidden sm:flex" @click="closeMenus">
          <Icon name="lucide:lock" class="h-3.5 w-3.5" />
          Login
        </NuxtLink>
        <NuxtLink to="/register" class="btn btn-primary btn-sm hidden sm:flex" @click="closeMenus">
          <Icon name="lucide:user-plus" class="h-3.5 w-3.5" />
          Register
        </NuxtLink>

        <!-- Mobile hamburger -->
        <div class="dropdown dropdown-end lg:hidden" :class="{ 'dropdown-open': openMenu === 'mobile' }">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            aria-label="Toggle navigation menu"
            :aria-expanded="openMenu === 'mobile'"
            aria-controls="mobile-navigation-menu"
            @click.stop="toggleMenu('mobile')"
          >
            <Icon :name="openMenu === 'mobile' ? 'lucide:x' : 'lucide:menu'" class="h-5 w-5" />
          </button>
          <ul id="mobile-navigation-menu" class="menu dropdown-content z-50 mt-2 w-64 rounded-box border border-base-200 bg-base-100 p-2 shadow-xl">
            <li><NuxtLink to="/" @click="closeMenus">Home</NuxtLink></li>
            <li><NuxtLink to="/tenders" @click="closeMenus">Browse Tenders</NuxtLink></li>
            <li><NuxtLink to="/#current-tenders" @click="closeMenus">Live Opportunities</NuxtLink></li>
            <li><NuxtLink to="/register" @click="closeMenus">Supplier Registration</NuxtLink></li>
            <li><NuxtLink to="/#how-it-works" @click="closeMenus">How It Works</NuxtLink></li>
            <li><button type="button" @click="closeMenus">Procuring Entities</button></li>
            <li><button type="button" @click="closeMenus">Resources</button></li>
            <li class="mt-2 border-t border-base-200 pt-2">
              <NuxtLink to="/login" class="font-medium text-primary" @click="closeMenus">Login</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/register" class="font-medium" @click="closeMenus">Register</NuxtLink>
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
const navbarRoot = ref(null)
const openMenu = ref(null)
const route = useRoute()

const closeMenus = () => {
  openMenu.value = null
}

const toggleMenu = (menu) => {
  openMenu.value = openMenu.value === menu ? null : menu
}

const handleOutsideClick = (event) => {
  if (navbarRoot.value && !navbarRoot.value.contains(event.target)) {
    closeMenus()
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeMenus()
  }
}

watch(() => route.fullPath, closeMenus)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>
