<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:users" class="h-6 w-6" />
            Organisation Users
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            Manage who has access to {{ companyName ?? 'your organisation' }} and what they can do.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 shrink-0">
          <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
            <Icon name="lucide:arrow-left" class="h-4 w-4" />
            <span class="hidden sm:inline">Dashboard</span>
          </NuxtLink>
          <button
            v-if="canAddUser"
            class="btn btn-sm bg-white text-green-700 hover:bg-green-50 border-0 font-semibold gap-1.5"
            :disabled="!companyId || availableRoles.length === 0"
            @click="openInviteModal"
          >
            <Icon name="lucide:user-plus" class="h-4 w-4" />
            Invite User
          </button>
        </div>
      </div>
    </div>

    <!-- No-roles warning -->
    <div v-if="rolesLoaded && availableRoles.length === 0" class="rounded-xl border border-warning/50 bg-warning/8 px-5 py-4">
      <div class="flex items-start gap-3">
        <div class="rounded-lg bg-warning/15 p-2 shrink-0">
          <Icon name="lucide:triangle-alert" class="h-4 w-4 text-warning" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-warning text-sm">No roles available</p>
          <p class="text-sm text-base-content/70 mt-0.5">
            Your organisation has no account types with roles assigned. Contact PRAZ support to set up your account type.
          </p>
        </div>
      </div>
    </div>

    <div v-if="pageError" class="alert alert-error border border-error/30">
      <Icon name="lucide:alert-triangle" class="h-5 w-5 shrink-0" />
      <span>{{ pageError }}</span>
      <button type="button" class="btn btn-ghost btn-sm" @click="reload">Try again</button>
    </div>

    <!-- Users card -->
    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-200">
        <div class="flex items-center gap-3">
          <div class="rounded-lg bg-primary/10 p-2">
            <Icon name="lucide:user-cog" class="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-base-content">Team Members</h2>
            <p class="text-xs text-base-content/50">
              {{ users.length }} user{{ users.length === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost gap-1.5" :disabled="loading" @click="reload">
          <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div class="card-body p-4">

        <div v-if="loading" class="space-y-2">
          <div v-for="n in 4" :key="n" class="h-12 rounded bg-base-200 animate-pulse" />
        </div>

        <div v-else-if="users.length" class="overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr class="text-xs text-base-content/50 uppercase">
                <th>User</th>
                <th class="hidden md:table-cell">Phone</th>
                <th>Status</th>
                <th>Roles</th>
                <th class="hidden lg:table-cell">Last Login</th>
                <th class="text-right"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id" class="hover">
                <td>
                  <p class="font-medium text-sm">{{ fullName(u) }}</p>
                  <p class="text-xs text-base-content/60">{{ u.email }}</p>
                  <p v-if="isCurrentUser(u)" class="text-[10px] text-primary mt-0.5 uppercase font-semibold">You</p>
                </td>
                <td class="hidden md:table-cell text-sm text-base-content/70">{{ u.phone ?? '—' }}</td>
                <td>
                  <span class="badge badge-sm" :class="statusBadge(u.status)">{{ statusLabel(u.status) }}</span>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="r in u.roles ?? []"
                      :key="r.id"
                      class="badge badge-xs bg-base-200 border-base-300 text-base-content/70 capitalize"
                    >
                      {{ r.name }}
                    </span>
                    <span v-if="!(u.roles?.length)" class="text-xs text-base-content/40">No roles</span>
                  </div>
                </td>
                <td class="hidden lg:table-cell text-sm text-base-content/70">{{ formatDateTime(u.last_login_at) }}</td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="canEditUser"
                      class="btn btn-xs btn-ghost gap-1"
                      :disabled="availableRoles.length === 0"
                      :title="availableRoles.length === 0 ? 'No roles available to assign.' : 'Edit roles'"
                      @click="openRolesModal(u)"
                    >
                      <Icon name="lucide:shield" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">Roles</span>
                    </button>
                    <button
                      v-if="canDeleteUser && !isCurrentUser(u)"
                      class="btn btn-xs btn-outline btn-error gap-1"
                      :disabled="actionId === u.id"
                      @click="confirmRemove(u)"
                    >
                      <span v-if="actionId === u.id" class="loading loading-spinner loading-xs" />
                      <Icon v-else name="lucide:user-minus" class="h-3.5 w-3.5" />
                      <span class="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="flex flex-col items-center gap-3 py-12 text-center">
          <div class="rounded-full bg-base-200 p-4">
            <Icon name="lucide:users" class="h-8 w-8 text-base-content/30" />
          </div>
          <div>
            <p class="font-semibold text-base-content/60">No users yet</p>
            <p class="text-sm text-base-content/40 mt-0.5">Invite your first team member to start collaborating.</p>
          </div>
          <button
            v-if="canAddUser && availableRoles.length"
            class="btn btn-sm btn-primary gap-1.5 mt-1"
            @click="openInviteModal"
          >
            <Icon name="lucide:user-plus" class="h-4 w-4" />
            Invite User
          </button>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <dialog ref="inviteDialog" class="modal">
      <div class="modal-box max-w-2xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 class="text-lg font-bold flex items-center gap-2 mb-1">
          <Icon name="lucide:user-plus" class="h-5 w-5 text-primary" />
          Invite a User
        </h3>
        <p class="text-sm text-base-content/60 mb-4">
          We will email an activation link so the user can set their password.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-base-content/70">First Name *</label>
            <input v-model="inviteForm.name" type="text" class="input input-sm input-bordered w-full mt-1" :class="inviteErrors.name ? 'input-error' : ''" />
            <p v-if="inviteErrors.name" class="text-xs text-error mt-1">{{ inviteErrors.name }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-base-content/70">Middle Name</label>
            <input v-model="inviteForm.middlename" type="text" class="input input-sm input-bordered w-full mt-1" />
          </div>
          <div>
            <label class="text-xs font-medium text-base-content/70">Last Name *</label>
            <input v-model="inviteForm.lastname" type="text" class="input input-sm input-bordered w-full mt-1" :class="inviteErrors.lastname ? 'input-error' : ''" />
            <p v-if="inviteErrors.lastname" class="text-xs text-error mt-1">{{ inviteErrors.lastname }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-base-content/70">Gender *</label>
            <select v-model="inviteForm.gender" class="select select-sm select-bordered w-full mt-1" :class="inviteErrors.gender ? 'select-error' : ''">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <p v-if="inviteErrors.gender" class="text-xs text-error mt-1">{{ inviteErrors.gender }}</p>
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs font-medium text-base-content/70">Email *</label>
            <input v-model="inviteForm.email" type="email" class="input input-sm input-bordered w-full mt-1" :class="inviteErrors.email ? 'input-error' : ''" />
            <p v-if="inviteErrors.email" class="text-xs text-error mt-1">{{ inviteErrors.email }}</p>
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs font-medium text-base-content/70">Phone</label>
            <input v-model="inviteForm.phone" type="text" class="input input-sm input-bordered w-full mt-1" />
          </div>
          <div class="sm:col-span-2">
            <label class="text-xs font-medium text-base-content/70 mb-1 block">Roles</label>
            <div class="rounded-lg border border-base-200 p-3 max-h-48 overflow-y-auto">
              <label
                v-for="role in availableRoles"
                :key="role.id"
                class="flex items-center gap-2 py-1 cursor-pointer hover:bg-base-100 rounded px-2"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  :value="role.id"
                  :checked="inviteForm.role_ids.includes(role.id)"
                  @change="toggleInviteRole(role.id)"
                />
                <span class="text-sm capitalize">{{ role.name }}</span>
              </label>
              <p v-if="availableRoles.length === 0" class="text-xs text-base-content/40 py-2">No roles available.</p>
            </div>
            <p class="text-xs text-base-content/50 mt-1">If left empty, the primary role for your organisation will be assigned.</p>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-sm btn-ghost" :disabled="inviteSubmitting" @click="closeInviteModal">Cancel</button>
          <button class="btn btn-sm btn-primary gap-1.5" :disabled="inviteSubmitting" @click="onInviteSubmit">
            <span v-if="inviteSubmitting" class="loading loading-spinner loading-xs" />
            <Icon v-else name="lucide:send" class="h-4 w-4" />
            Send Invitation
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Edit Roles Modal -->
    <dialog ref="rolesDialog" class="modal">
      <div class="modal-box">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 class="text-lg font-bold flex items-center gap-2 mb-1">
          <Icon name="lucide:shield" class="h-5 w-5 text-primary" />
          Edit Roles
        </h3>
        <p class="text-sm text-base-content/60 mb-4">
          {{ rolesTarget ? fullName(rolesTarget) : '' }}
        </p>

        <div class="rounded-lg border border-base-200 p-3 max-h-64 overflow-y-auto">
          <label
            v-for="role in availableRoles"
            :key="role.id"
            class="flex items-center gap-2 py-1 cursor-pointer hover:bg-base-100 rounded px-2"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
              :value="role.id"
              :checked="rolesSelection.includes(role.id)"
              @change="toggleRoleSelection(role.id)"
            />
            <span class="text-sm capitalize">{{ role.name }}</span>
          </label>
          <p v-if="availableRoles.length === 0" class="text-xs text-base-content/40 py-2">No roles available.</p>
        </div>

        <div class="modal-action">
          <button class="btn btn-sm btn-ghost" :disabled="rolesSubmitting" @click="closeRolesModal">Cancel</button>
          <button class="btn btn-sm btn-primary gap-1.5" :disabled="rolesSubmitting" @click="onRolesSubmit">
            <span v-if="rolesSubmitting" class="loading loading-spinner loading-xs" />
            <Icon v-else name="lucide:check" class="h-4 w-4" />
            Save Roles
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

  </div>
</template>

<script setup>
import { organisationUserPermissions } from '~/utils/supplierPermissions'

definePageMeta({ layout: 'default' })

useHead({ title: 'Organisation Users' })

const { user } = useSanctumAuth()
const { listUsers, listAvailableRoles, inviteUser, updateUserRoles, removeUser } = useOrganisationUsersHelper()
const toast = useToast()
const { can, guardAction } = useCheckPermission()
const canAddUser = computed(() => can(organisationUserPermissions.add))
const canEditUser = computed(() => can(organisationUserPermissions.edit))
const canDeleteUser = computed(() => can(organisationUserPermissions.delete))

const company = computed(() => user.value?.data?.company ?? user.value?.company ?? null)
const companyId = computed(() => company.value?.id ?? null)
const companyName = computed(() => company.value?.name ?? null)
const currentUserId = computed(() => user.value?.data?.user?.id ?? user.value?.user?.id ?? null)

const users = ref([])
const availableRoles = ref([])
const loading = ref(true)
const rolesLoaded = ref(false)
const actionId = ref(null)
const pageError = ref('')
let loadedCompanyId = null

// Invite modal
const inviteDialog = ref(null)
const inviteSubmitting = ref(false)
const inviteForm = reactive({ name: '', middlename: '', lastname: '', email: '', phone: '', gender: '', role_ids: [] })
const inviteErrors = ref({})

// Roles modal
const rolesDialog = ref(null)
const rolesTarget = ref(null)
const rolesSelection = ref([])
const rolesSubmitting = ref(false)

watch(companyId, async (id) => {
  if (!id || id === loadedCompanyId) return
  loadedCompanyId = id
  await reload()
}, { immediate: true })

async function loadUsers() {
  if (!companyId.value) return
  loading.value = true
  const { ok, data, error } = await listUsers(companyId.value)
  loading.value = false
  if (ok) {
    users.value = data?.data ?? []
  } else {
    pageError.value = error
    toast.error({ title: 'Could not load users', message: error, position: 'topRight', layout: 2 })
  }
}

async function loadRoles() {
  if (!companyId.value) return
  const { ok, data, error } = await listAvailableRoles(companyId.value)
  rolesLoaded.value = true
  if (ok) {
    availableRoles.value = data?.data ?? []
  } else {
    pageError.value = error
    toast.error({ title: 'Could not load roles', message: error, position: 'topRight', layout: 2 })
  }
}

async function reload() {
  if (!companyId.value) return
  pageError.value = ''
  await Promise.all([loadUsers(), loadRoles()])
}

function isCurrentUser(u) {
  return currentUserId.value && u.id === currentUserId.value
}

function fullName(p) {
  return [p?.name, p?.middlename, p?.lastname].filter(Boolean).join(' ') || p?.email || '—'
}

function statusLabel(status) {
  const labels = { active: 'Active', pending: 'Pending', locked: 'Locked', disabled: 'Disabled' }
  return labels[status] ?? status ?? '—'
}

function statusBadge(status) {
  const classes = {
    active:   'bg-green-100 text-green-700 border-green-300',
    pending:  'bg-yellow-100 text-yellow-700 border-yellow-300',
    locked:   'bg-red-100 text-red-700 border-red-300',
    disabled: 'bg-base-200 text-base-content/60 border-base-300',
  }
  return classes[status] ?? 'bg-base-200 text-base-content/50'
}

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-ZW', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Invite
function openInviteModal() {
  if (!guardAction(organisationUserPermissions.add)) return
  Object.assign(inviteForm, { name: '', middlename: '', lastname: '', email: '', phone: '', gender: '', role_ids: [] })
  inviteErrors.value = {}
  inviteDialog.value?.showModal()
}

function closeInviteModal() {
  inviteDialog.value?.close()
}

function toggleInviteRole(id) {
  const idx = inviteForm.role_ids.indexOf(id)
  if (idx === -1) inviteForm.role_ids.push(id)
  else inviteForm.role_ids.splice(idx, 1)
}

function validateInvite() {
  const errs = {}
  if (!inviteForm.name?.trim()) errs.name = 'First name is required.'
  if (!inviteForm.lastname?.trim()) errs.lastname = 'Last name is required.'
  if (!inviteForm.email?.trim()) errs.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) errs.email = 'Enter a valid email.'
  if (!inviteForm.gender) errs.gender = 'Select a gender.'
  inviteErrors.value = errs
  return Object.keys(errs).length === 0
}

async function onInviteSubmit() {
  if (!guardAction(organisationUserPermissions.add)) return
  if (!validateInvite()) return
  inviteSubmitting.value = true
  const { ok, data, error } = await inviteUser(companyId.value, { ...inviteForm })
  inviteSubmitting.value = false

  if (ok) {
    toast.success({
      title: 'User invited',
      message: data?.message ?? 'An activation email has been sent.',
      position: 'topRight',
      layout: 2,
    })
    closeInviteModal()
    loadUsers()
  } else {
    toast.error({ title: 'Could not invite user', message: error, position: 'topRight', layout: 2 })
  }
}

// Roles
function openRolesModal(u) {
  if (!guardAction(organisationUserPermissions.edit)) return
  rolesTarget.value = u
  rolesSelection.value = (u.roles ?? []).map(r => r.id)
  rolesDialog.value?.showModal()
}

function closeRolesModal() {
  rolesDialog.value?.close()
  rolesTarget.value = null
}

function toggleRoleSelection(id) {
  const idx = rolesSelection.value.indexOf(id)
  if (idx === -1) rolesSelection.value.push(id)
  else rolesSelection.value.splice(idx, 1)
}

async function onRolesSubmit() {
  if (!guardAction(organisationUserPermissions.edit)) return
  if (!rolesTarget.value) return
  rolesSubmitting.value = true
  const { ok, error } = await updateUserRoles(companyId.value, rolesTarget.value.id, rolesSelection.value)
  rolesSubmitting.value = false

  if (ok) {
    toast.success({
      title: 'Roles updated',
      message: 'The user’s organisation roles have been saved.',
      position: 'topRight',
      layout: 2,
    })
    closeRolesModal()
    loadUsers()
  } else {
    toast.error({ title: 'Could not update roles', message: error, position: 'topRight', layout: 2 })
  }
}

// Remove
async function confirmRemove(u) {
  if (!guardAction(organisationUserPermissions.delete)) return
  if (!confirm(`Remove ${fullName(u)} from your organisation? They will lose access immediately.`)) return
  actionId.value = u.id
  const { ok, error } = await removeUser(companyId.value, u.id)
  actionId.value = null

  if (ok) {
    toast.success({
      title: 'User removed',
      message: 'The user no longer has access to this organisation.',
      position: 'topRight',
      layout: 2,
    })
    loadUsers()
  } else {
    toast.error({ title: 'Could not remove user', message: error, position: 'topRight', layout: 2 })
  }
}
</script>
