<template>
  <div class="dropdown dropdown-end">
    <label
      tabindex="0"
      class="btn btn-ghost btn-sm relative"
      :aria-label="hasUnread ? `${unreadCount} unread notifications` : 'Notifications'"
      @click="open"
    >
      <Icon name="lucide:bell" class="h-5 w-5" />
      <span
        v-if="hasUnread"
        class="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold leading-5 text-error-content shadow-sm ring-2 ring-base-100"
        aria-hidden="true"
      >
        {{ displayUnreadCount }}
      </span>
    </label>

    <div
      tabindex="0"
      class="dropdown-content z-[60] mt-2 w-80 rounded-box border border-base-200 bg-base-100 shadow-xl sm:w-96"
    >
      <div class="flex items-center justify-between border-b border-base-200 px-4 py-2.5">
        <p class="text-sm font-semibold">Notifications</p>
        <div class="flex items-center gap-1">
          <PushNotificationToggle />
          <button
            v-if="hasUnread"
            class="btn btn-ghost btn-xs gap-1"
            @click="markAllRead"
          >
            <Icon name="lucide:check-check" class="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      <div v-if="loading" class="space-y-2 p-3">
        <div v-for="n in 3" :key="n" class="h-14 animate-pulse rounded bg-base-200" />
      </div>

      <!-- A failed request must not look identical to an empty inbox. -->
      <div v-else-if="error" class="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <Icon name="lucide:wifi-off" class="h-5 w-5 text-error" />
        <p class="text-sm text-base-content/60">{{ error }}</p>
        <button class="btn btn-xs btn-ghost gap-1" @click.stop="open">
          <Icon name="lucide:rotate-cw" class="h-3.5 w-3.5" />
          Try again
        </button>
      </div>

      <ul v-else-if="notifications.length" class="max-h-96 overflow-y-auto">
        <li v-for="notification in notifications.slice(0, 8)" :key="notification.id">
          <button
            class="flex w-full items-start gap-3 border-b border-base-200/70 px-4 py-3 text-left transition-colors hover:bg-base-200/60"
            :class="notification.read_at ? '' : 'bg-primary/5'"
            @click="openNotification(notification)"
          >
            <Icon
              :name="notification.icon"
              class="mt-0.5 h-4 w-4 shrink-0"
              :class="notification.read_at ? 'text-base-content/40' : 'text-primary'"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-base-content">{{ notification.title }}</span>
              <span class="mt-0.5 line-clamp-2 block text-xs text-base-content/60">{{ notification.message }}</span>
              <span class="mt-1 block text-[11px] text-base-content/40">{{ relativeTime(notification.created_at) }}</span>
            </span>
            <span v-if="!notification.read_at" class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          </button>
        </li>
      </ul>

      <div v-else class="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <div class="rounded-full bg-base-200 p-3">
          <Icon name="lucide:bell-off" class="h-5 w-5 text-base-content/30" />
        </div>
        <p class="text-sm text-base-content/50">You have no notifications yet.</p>
      </div>

      <NuxtLink
        to="/notifications"
        class="block border-t border-base-200 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-base-200/60"
      >
        View all notifications
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const {
  notifications,
  unreadCount,
  loading,
  error,
  listNotifications,
  markRead,
  markAllRead,
  relativeTime,
} = useNotifications()

const hasUnread = computed(() => unreadCount.value > 0)
const displayUnreadCount = computed(() => unreadCount.value > 99 ? '99+' : unreadCount.value)

async function open() {
  await listNotifications({ perPage: 15 })
}

async function openNotification(notification) {
  await markRead(notification.id)

  if (notification.url) {
    // Blur the dropdown so it closes before the route changes.
    document.activeElement?.blur()
    await navigateTo(notification.url)
  }
}

onMounted(() => {
  // Load the list up front rather than only on click — the panel then has
  // content the moment it opens, and it no longer depends on the open handler
  // firing before the dropdown becomes visible.
  listNotifications({ perPage: 15 })
})
</script>
