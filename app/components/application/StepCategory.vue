<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-base-content">Select Supplier Categories</h2>
      <p class="text-sm text-base-content/50 mt-1">Add one or more categories that describe the goods or services your company provides.</p>
    </div>

    <!-- Step instructions -->
    <div class="flex gap-3 rounded-lg border border-blue-300 bg-blue-600 px-4 py-3 text-sm text-white">
      <Icon name="lucide:info" class="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Click <strong>Select Category</strong> to search and add one or more supplier categories your company offers.
        You can add multiple categories and remove any by clicking the trash icon.
        When you are done, click <strong>Next</strong> to continue.
      </span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div class="h-32 rounded-xl bg-base-200 animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error alert-soft">
      <Icon name="lucide:alert-circle" class="h-4 w-4" />
      <span>Failed to load categories. Please try again.</span>
    </div>

    <template v-else>
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body gap-4">

          <!-- Card header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon name="lucide:tag" class="h-4 w-4 text-primary" />
              </div>
              <div>
                <p class="font-semibold text-sm text-base-content">Supplier Categories</p>
                <p class="text-xs text-base-content/50">
                  {{ selected.length ? `${selected.length} selected` : 'None selected' }}
                </p>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm gap-1.5" @click="openModal">
              <Icon name="lucide:plus" class="h-4 w-4" />
              Select Category
            </button>
          </div>

          <div class="divider my-0" />

          <!-- Selected categories table -->
          <div v-if="selected.length" class="overflow-x-auto rounded-lg border border-base-200">
            <table class="table table-sm w-full">
              <thead>
                <tr class="bg-base-200/60 text-xs uppercase tracking-wide text-base-content/60">
                  <th>#</th>
                  <th>Category</th>
                  <th>Section</th>
                  <th>Code</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reg, idx) in selected" :key="reg.id" class="hover">
                  <td class="text-base-content/50 font-mono text-xs">{{ idx + 1 }}</td>
                  <td class="font-medium text-sm text-base-content">{{ reg.suppliercategory?.name }}</td>
                  <td class="text-sm text-base-content/60">{{ reg.suppliercategory?.section?.name ?? '—' }}</td>
                  <td>
                    <span v-if="reg.suppliercategory?.code" class="badge badge-ghost badge-sm font-mono">
                      {{ reg.suppliercategory.code }}
                    </span>
                    <span v-else class="text-base-content/30">—</span>
                  </td>
                  <td class="text-right">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      :disabled="deleting === reg.id"
                      @click="remove(reg)"
                    >
                      <span v-if="deleting === reg.id" class="loading loading-spinner loading-xs" />
                      <Icon v-else name="lucide:trash-2" class="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-300 py-8 text-center gap-2">
            <Icon name="lucide:folder-open" class="h-8 w-8 text-base-content/30" />
            <p class="text-sm font-medium text-base-content/60">No categories selected</p>
            <p class="text-xs text-base-content/40">Click "Select Category" above to get started.</p>
          </div>

        </div>
      </div>
    </template>

    <!-- Category picker modal -->
    <dialog ref="modalRef" class="modal">
      <div class="modal-box max-w-xl w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">Choose a Category</h3>
          <button type="button" class="btn btn-ghost btn-sm btn-circle" @click="closeModal">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>

        <!-- Search -->
        <label class="input input-bordered flex items-center gap-2 mb-4">
          <Icon name="lucide:search" class="h-4 w-4 text-base-content/40 shrink-0" />
          <input
            v-model="search"
            type="text"
            placeholder="Search by name, code or section…"
            class="grow"
          />
          <button v-if="search" type="button" class="btn btn-ghost btn-xs btn-circle" @click="search = ''">
            <Icon name="lucide:x" class="h-3 w-3" />
          </button>
        </label>

        <!-- Results -->
        <div class="max-h-80 overflow-y-auto space-y-2 pr-1">
          <div v-if="!filteredCategories.length" class="py-8 text-center text-sm text-base-content/50">
            No categories match your search.
          </div>
          <button
            v-for="cat in filteredCategories"
            :key="cat.id"
            type="button"
            class="flex w-full items-start gap-4 rounded-xl border-2 p-3 text-left transition-all"
            :class="isSelected(cat.id)
              ? 'border-green-500 bg-green-50 text-green-700 opacity-60 cursor-default'
              : saving === cat.id
              ? 'border-primary/30 bg-base-200 cursor-wait'
              : 'border-base-200 bg-base-100 hover:border-green-300 hover:bg-green-50/50'"
            :disabled="isSelected(cat.id) || saving === cat.id"
            @click="pick(cat)"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
              :class="isSelected(cat.id) ? 'bg-green-500 text-white' : 'bg-base-200 text-base-content/50'"
            >
              {{ cat.code ?? cat.name?.charAt(0) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm truncate">{{ cat.name }}</p>
              <p v-if="cat.section?.name" class="text-xs text-base-content/50 mt-0.5 truncate">{{ cat.section.name }}</p>
            </div>
            <span v-if="saving === cat.id" class="loading loading-spinner loading-xs text-primary mt-0.5" />
            <Icon v-else-if="isSelected(cat.id)" name="lucide:circle-check" class="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
          </button>
        </div>

        <div class="modal-action mt-4">
          <button type="button" class="btn btn-primary btn-sm" @click="closeModal">Done</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeModal">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
const props = defineProps({
  application: { type: Object, required: true },
})

const emit = defineEmits(['init', 'select', 'remove', 'invoice-voided'])

const client = useSupplierClient()

const categories = ref([])
const loading = ref(true)
const error = ref(false)
const modalRef = ref(null)
const search = ref('')
const saving = ref(null)
const deleting = ref(null)

const selected = computed(() => props.application.suppliercategories ?? [])

onMounted(async () => {
  try {
    const [availRes, pendingRes] = await Promise.all([
      client('/api/supplier/v1/available-categories', { method: 'GET' }),
      client('/api/supplier/v1/pending-categories', { method: 'GET' }),
    ])
    categories.value = availRes?.data ?? []
    const pending = pendingRes?.data ?? []
    if (pending.length) {
      emit('init', pending)
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.code?.toLowerCase().includes(q) ||
    c.section?.name?.toLowerCase().includes(q)
  )
})

function isSelected(categoryId) {
  return selected.value.some(r => r.suppliercategory_id === categoryId || r.suppliercategory?.id === categoryId)
}

function openModal() {
  search.value = ''
  modalRef.value?.showModal()
}

function closeModal() {
  modalRef.value?.close()
}

async function pick(cat) {
  if (isSelected(cat.id) || saving.value) return
  saving.value = cat.id
  try {
    const res = await client('/api/supplier/v1/registrations', {
      method: 'POST',
      body: { suppliercategory_id: cat.id },
    })
    emit('select', res.data)
  } catch {
    // silently ignore — category stays unselected
  } finally {
    saving.value = null
  }
}

async function remove(reg) {
  deleting.value = reg.id
  try {
    const res = await client(`/api/supplier/v1/registrations/${reg.id}`, { method: 'DELETE' })
    emit('remove', reg.id)
    if (res?.data?.invoice_voided) {
      emit('invoice-voided')
    }
  } catch {
    // silently ignore
  } finally {
    deleting.value = null
  }
}
</script>
