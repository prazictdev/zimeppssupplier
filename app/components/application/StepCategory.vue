<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-bold text-base-content">Select Supplier Categories</h2>
      <p class="text-sm text-base-content/50 mt-1">Add one or more categories that describe the goods or services your company provides.</p>
    </div>

    <div role="alert" class="alert alert-soft">
      <Icon name="lucide:info" class="h-4 w-4" />
      <span>
        Add every category your company wants to register for. Your fee is calculated per category.
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

    <dialog ref="modalRef" class="modal">
      <div class="modal-box w-full max-w-2xl overflow-hidden p-0">
        <div class="flex items-start justify-between gap-4 border-b border-base-300 px-5 py-5 sm:px-6">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-bold">Choose supplier categories</h3>
              <span v-if="selected.length" class="badge badge-primary badge-soft badge-sm">{{ selected.length }} selected</span>
            </div>
            <p class="mt-1 text-sm leading-5 text-base-content/60">Add every category that describes the goods or services your company supplies.</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm btn-circle shrink-0" aria-label="Close category picker" @click="closeModal">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>

        <div class="border-b border-base-300 px-5 py-4 sm:px-6">
          <label class="input flex w-full items-center gap-2">
          <Icon name="lucide:search" class="h-4 w-4 shrink-0 text-base-content/40" />
          <input
            v-model="search"
            type="text"
            placeholder="Search categories by name, code or section"
            class="grow"
            autofocus
          />
          <button v-if="search" type="button" class="btn btn-ghost btn-xs btn-circle" aria-label="Clear search" @click="search = ''">
            <Icon name="lucide:x" class="h-3 w-3" />
          </button>
        </label>
          <p class="mt-2 text-xs text-base-content/50">{{ filteredCategories.length }} {{ filteredCategories.length === 1 ? 'category' : 'categories' }} found</p>
        </div>

        <div class="max-h-[26rem] overflow-y-auto px-5 py-4 sm:px-6">
          <div v-if="!filteredCategories.length" class="flex flex-col items-center py-10 text-center">
            <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-base-200">
              <Icon name="lucide:search-x" class="h-5 w-5 text-base-content/50" />
            </div>
            <p class="font-semibold">No matching categories</p>
            <p class="mt-1 text-sm text-base-content/55">Try a category name, code or section.</p>
          </div>

          <ul v-else class="list gap-2">
          <li
            v-for="cat in filteredCategories"
            :key="cat.id"
            class="list-row items-center rounded-selector border border-base-300 px-4 py-3"
            :class="isSelected(cat.id) ? 'bg-primary/5' : 'bg-base-100'"
          >
            <span
              class="flex h-10 w-12 shrink-0 items-center justify-center rounded-selector bg-base-200 px-2 text-xs font-bold text-base-content/65"
            >
              {{ cat.code ?? cat.name?.charAt(0) }}
            </span>
            <div class="list-col-grow min-w-0">
              <p class="truncate text-sm font-semibold text-base-content">{{ cat.name }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/55">
                <span v-if="cat.section?.name">{{ cat.section.name }}</span>
                <span v-if="cat.code" class="badge badge-ghost badge-xs">{{ cat.code }}</span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-sm min-w-20 shrink-0"
              :class="isSelected(cat.id) ? 'btn-ghost' : 'btn-primary'"
              :disabled="isSelected(cat.id) || saving === cat.id"
              :aria-label="`${isSelected(cat.id) ? 'Added' : 'Add'} ${cat.name}`"
              @click="pick(cat)"
            >
              <span v-if="saving === cat.id" class="loading loading-spinner loading-xs" />
              <Icon v-else :name="isSelected(cat.id) ? 'lucide:check' : 'lucide:plus'" class="h-4 w-4" />
              {{ isSelected(cat.id) ? 'Added' : 'Add' }}
            </button>
          </li>
          </ul>
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-base-300 bg-base-200/40 px-5 py-4 sm:px-6">
          <p class="text-sm text-base-content/60">
            <strong class="text-base-content">{{ selected.length }}</strong> {{ selected.length === 1 ? 'category' : 'categories' }} selected
          </p>
          <button type="button" class="btn btn-primary btn-sm min-w-24" @click="closeModal">Done</button>
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
const toast = useToast()

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
  } catch (error) {
    toast.error({
      title: 'Category could not be added',
      message: error?.data?.message
        ?? error?.response?._data?.message
        ?? 'Please check your connection and try again.',
      position: 'topRight',
      layout: 2,
    })
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
