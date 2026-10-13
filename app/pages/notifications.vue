<template>
  <div class="space-y-4">

    <div class="bg-green-600 p-6 text-white shadow-lg rounded-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <Icon name="lucide:bell" class="h-6 w-6" />
            Notifications
          </h1>
          <p class="mt-1 text-green-100 text-sm">
            Review updates and actions related to your supplier account.
          </p>
        </div>
        <NuxtLink to="/dashboard" class="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-0 gap-1.5">
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <div class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="flex flex-col gap-3 border-b border-base-200 px-5 py-3 sm:flex-row sm:items-center">
        <div class="flex flex-1 flex-wrap gap-1.5">
          <button
            v-for="tab in tabs" :key="tab.key"
            class="btn btn-xs"
            :class="filter === tab.key ? 'btn-primary' : 'btn-ghost'"
            @click="applyFilter(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="hasUnread" class="btn btn-sm btn-ghost gap-1.5" @click="markAllRead">
            <Icon name="lucide:check-check" class="h-4 w-4" />
            <span class="hidden sm:inline">Mark all read</span>
          </button>
          <button class="btn btn-sm btn-ghost gap-1.5" :disabled="loading" @click="load()">
            <Icon name="lucide:rotate-cw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div class="card-body p-0">
        <div v-if="loading" class="space-y-2 p-4">
          <div v-for="n in 5" :key="n" class="h-16 animate-pulse rounded bg-base-200" />
        </div>

        <ul v-else-if="notifications.length" class="divide-y divide-base-200">
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-base-200/40"
            :class="notification.read_at ? '' : 'bg-primary/5'"
          >
            <div class="rounded-lg p-2 shrink-0" :class="notification.read_at ? 'bg-base-200' : 'bg-primary/10'">
              <Icon
                :name="notification.icon"
                class="h-4 w-4"
                :class="notification.read_at ? 'text-base-content/40' : 'text-primary'"
              />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate font-medium text-base-content">{{ notification.title }}</p>
                <span v-if="!notification.read_at" class="badge badge-primary badge-xs">New</span>
              </div>
              <p class="mt-0.5 text-sm text-base-content/60">{{ notification.message }}</p>
              <p class="mt-1 text-xs text-base-content/40">{{ relativeTime(notification.created_at) }}</p>
            </div>

            <div class="flex shrink-0 items-center gap-1">
              <button class="btn btn-xs btn-ghost gap-1" @click="view(notification)">
                <Icon name="lucide:eye" class="h-3.5 w-3.5" />
                <span class="hidden sm:inline">View</span>
              </button>
              <NuxtLink
                v-if="notification.url"
                :to="notification.url"
                class="btn btn-xs btn-ghost gap-1"
                @click="markRead(notification.id)"
              >
                Open
                <Icon name="lucide:arrow-right" class="h-3.5 w-3.5" />
              </NuxtLink>
              <button
                v-if="!notification.read_at"
                class="btn btn-xs btn-ghost"
                title="Mark as read"
                @click="markRead(notification.id)"
              >
                <Icon name="lucide:check" class="h-3.5 w-3.5" />
              </button>
              <button
                class="btn btn-xs btn-ghost text-error"
                title="Remove"
                @click="removeNotification(notification.id)"
              >
                <Icon name="lucide:trash-2" class="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        </ul>

        <div v-else class="flex flex-col items-center gap-2 py-16 text-center">
          <div class="rounded-full bg-base-200 p-3">
            <Icon name="lucide:bell-off" class="h-6 w-6 text-base-content/30" />
          </div>
          <p class="text-sm text-base-content/50">
            {{ filter === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.' }}
          </p>
        </div>
      </div>

      <!-- Full notification -->
      <dialog ref="detailModal" class="modal">
        <div class="modal-box max-w-2xl">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Close">✕</button>
          </form>

          <template v-if="selected">
            <div class="flex items-start gap-3 pr-8">
              <div class="rounded-lg bg-primary/10 p-2 shrink-0">
                <Icon :name="selected.icon" class="h-5 w-5 text-primary" />
              </div>
              <div class="min-w-0">
                <h3 class="text-lg font-semibold">{{ selected.title }}</h3>
                <p class="mt-0.5 text-xs text-base-content/50">
                  {{ formatDateTime(selected.created_at) }} · {{ selected.category }}
                </p>
              </div>
            </div>

            <p class="mt-4 text-sm text-base-content/70">{{ selected.message }}</p>

            <dl v-if="detailRows.length" class="mt-5 divide-y divide-base-200 border-t border-base-200">
              <div v-for="row in detailRows" :key="row.label" class="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-3 sm:gap-4">
                <dt class="text-xs text-base-content/50 sm:pt-0.5">{{ row.label }}</dt>
                <dd class="break-all font-mono text-sm text-base-content sm:col-span-2">{{ row.value }}</dd>
              </div>
            </dl>

            <div class="modal-action">
              <NuxtLink v-if="selected.url" :to="selected.url" class="btn btn-primary btn-sm gap-1" @click="closeDetail">
                Go to {{ selected.category }}
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <form method="dialog">
                <button class="btn btn-sm btn-ghost">Close</button>
              </form>
            </div>
          </template>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button aria-label="Close">close</button>
        </form>
      </dialog>

      <div v-if="meta && meta.last_page > 1" class="flex items-center justify-between border-t border-base-200 px-5 py-3">
        <p class="text-xs text-base-content/50">Page {{ meta.current_page }} of {{ meta.last_page }}</p>
        <div class="join">
          <button class="btn btn-xs join-item" :disabled="meta.current_page <= 1" @click="load(meta.current_page - 1)">
            Previous
          </button>
          <button class="btn btn-xs join-item" :disabled="meta.current_page >= meta.last_page" @click="load(meta.current_page + 1)">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })
useHead({ title: 'Notifications' })

const {
  notifications,
  meta,
  loading,
  listNotifications,
  markRead,
  markAllRead,
  removeNotification,
  relativeTime,
} = useNotifications()

const filter = ref('all')
const selected = ref(null)
const detailModal = ref(null)
const hasUnread = computed(() => notifications.value.some(notification => !notification.read_at))

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

// Fields the row and modal header already render — everything else in the
// payload is detail worth showing in full.
const PRESENTATION_KEYS = ['category', 'icon', 'title', 'message', 'url']

const detailRows = computed(() => {
  const data = selected.value?.data ?? {}

  return Object.entries(data)
    .filter(([key, value]) => !PRESENTATION_KEYS.includes(key) && value !== null && value !== '')
    .map(([key, value]) => ({ label: humanise(key), value: formatValue(key, value) }))
})

function humanise(key) {
  const label = key.replaceAll('_', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatValue(key, value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  // Timestamp-ish keys arrive as ISO strings — show them the way a person reads them.
  if (/(_at|date)$/.test(key) && !Number.isNaN(Date.parse(value))) return formatDateTime(value)
  return String(value)
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function view(notification) {
  selected.value = notification
  markRead(notification.id)
  detailModal.value?.showModal()
}

function closeDetail() {
  detailModal.value?.close()
}

function load(page = 1) {
  return listNotifications({ page, perPage: 20, unreadOnly: filter.value === 'unread' })
}

function applyFilter(key) {
  filter.value = key
  load()
}

onMounted(() => load())
</script>
