<template>
  <div class="space-y-3">
    <div class="card outline card-xs outline-1 outline-base-200">
      <div class="card-body">
        <div class="breadcrumbs text-sm">
          <ul>
            <li><NuxtLink to="/">Home</NuxtLink></li>
            <li>Bid Submission Keys</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Buy / overview card -->
    <div class="card border border-base-200">
      <div class="card-body">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-base-200 pb-2">
          <div>
            <span class="text-lg font-bold">Bid submission licences</span>
            <p class="text-xs text-base-content/60 mt-1">
              Each licence binds one bidder user to a protected signing key in the browser Bid Vault or EGP Desktop.
              Buy as many as you need and assign each to a user when ready.
              All licences expire at the end of the calendar year.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="bidderType" class="badge badge-sm" :class="bidderType === 'DOMESTIC' ? 'badge-info' : 'badge-warning'">{{ bidderType }}</span>
            <button v-if="canManage" class="btn btn-primary btn-sm" @click="openApply">
              <Icon name="lucide:plus" /> Buy licences
            </button>
          </div>
        </div>

        <div v-if="!canManage" role="alert" class="alert alert-warning mt-3 text-sm">
          <Icon name="lucide:alert-circle" />
          <span>You can view licences but only users with <code>can.manage.biddersubmissionkeys</code> can buy, assign, or revoke.</span>
        </div>

        <!-- Counters -->
        <div v-if="!loading" class="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div class="rounded-lg border border-base-200 p-3">
            <p class="text-xs text-base-content/50">Awaiting payment</p>
            <p class="text-2xl font-bold">{{ countByStatus.PENDING_PAYMENT }}</p>
          </div>
          <div class="rounded-lg border border-warning/40 bg-warning/5 p-3">
            <p class="text-xs text-base-content/50">Unassigned</p>
            <p class="text-2xl font-bold text-warning">{{ countByStatus.UNASSIGNED }}</p>
          </div>
          <div class="rounded-lg border border-info/40 bg-info/5 p-3">
            <p class="text-xs text-base-content/50">Ready to generate</p>
            <p class="text-2xl font-bold text-info">{{ countByStatus.PENDING_GENERATION }}</p>
          </div>
          <div class="rounded-lg border border-success/40 bg-success/5 p-3">
            <p class="text-xs text-base-content/50">Active</p>
            <p class="text-2xl font-bold text-success">{{ countByStatus.ACTIVE }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <template v-else>
      <!-- Purchased licences (company-wide overview) -->
      <div class="card border border-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between border-b border-base-200 pb-2">
            <span class="text-base font-bold">Purchased licences</span>
            <span class="text-xs text-base-content/50">
              {{ purchased.length }} licence(s) ·
              {{ purchased.filter((k) => k.status === 'UNASSIGNED').length }} unassigned
            </span>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
              <thead>
                <tr class="text-left">
                  <th>Serial</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!purchased.length">
                  <td colspan="4" class="text-center text-base-content/50 py-6">
                    No purchased licences yet. Buy some above to get started.
                  </td>
                </tr>
                <tr v-for="k in purchased" :key="k.id">
                  <td class="font-mono text-xs">{{ k.key_serial }}</td>
                  <td>
                    <span :class="['badge badge-sm', statusBadge(k.status)]">{{ statusLabel(k.status) }}</span>
                    <span
                      v-if="k.revokes_cap"
                      class="badge badge-ghost badge-xs ml-1 gap-1"
                      :class="{ 'badge-warning': (k.revokes_used ?? 0) >= k.revokes_cap }"
                      :title="`Revokes used this year: ${k.revokes_used ?? 0} of ${k.revokes_cap}. Once the limit is reached this licence can't be revoked again until next year.`"
                    >
                      <Icon name="lucide:shield-off" class="h-3 w-3" />
                      {{ k.revokes_used ?? 0 }}/{{ k.revokes_cap }} revoked
                    </span>
                  </td>
                  <td>
                    <template v-if="k.user">
                      <p class="text-sm font-medium">{{ k.user.name }}</p>
                      <p class="text-xs text-base-content/60">{{ k.user.email || k.user.phone || '' }}</p>
                    </template>
                    <span v-else class="badge badge-warning badge-sm">Not assigned</span>
                  </td>
                  <td class="text-right">
                    <div class="flex justify-end gap-1">
                      <button
                        v-if="canManage && k.status === 'UNASSIGNED'"
                        class="btn btn-primary btn-xs"
                        @click="openAssign(k)"
                      >
                        <Icon name="lucide:user-plus" /> Assign
                      </button>
                      <button
                        v-if="canManage && (k.status === 'PENDING_GENERATION' || k.status === 'ACTIVE')"
                        class="btn btn-error btn-xs"
                        :disabled="revokeLimitReached(k)"
                        :title="revokeLimitReached(k)
                          ? `This licence has already been revoked ${k.revokes_used}/${k.revokes_cap} time(s) this year. It can't be revoked again until next year.`
                          : 'Revoke this licence'"
                        @click="openRevoke(k)"
                      >
                        <Icon name="lucide:shield-off" /> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- My assigned licences (current user only) -->
      <div class="card border border-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between border-b border-base-200 pb-2">
            <span class="text-base font-bold">My assigned licences</span>
            <span class="text-xs text-base-content/50">{{ assigned.length }} licence(s)</span>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-zebra w-full text-sm">
              <thead>
                <tr class="text-left">
                  <th>User / device</th>
                  <th>Serial</th>
                  <th>Status</th>
                  <th>Assigned on</th>
                  <th>Validity</th>
                  <th>Fingerprint</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!assigned.length">
                  <td colspan="7" class="text-center text-base-content/50 py-6">
                    No assigned licences yet.
                  </td>
                </tr>
                <tr v-for="k in assigned" :key="k.id">
                  <td>
                    <p class="font-medium">{{ k.user?.name || '—' }}</p>
                    <p class="text-xs text-base-content/60">{{ k.user?.email || k.user?.phone || '' }}</p>
                    <p v-if="k.status === 'ACTIVE' && isCurrentUser(k)" class="mt-1">
                      <span
                        v-if="k.storage_mode === 'PORTAL_VAULT'"
                        class="badge badge-success badge-xs gap-1"
                        title="The encrypted signing key is available through your browser Bid Vault."
                      >
                        <Icon name="lucide:vault" class="h-3 w-3" /> Browser Bid Vault
                      </span>
                      <span
                        v-else-if="k.desktop_device"
                        class="badge badge-success badge-xs gap-1"
                        :title="`Locked to ${k.desktop_device}. Sign bids from the EGP Desktop app on that device. To move it, reset the licence.`"
                      >
                        <Icon name="lucide:monitor-check" class="h-3 w-3" /> {{ k.desktop_device }}
                      </span>
                      <span
                        v-else
                        class="badge badge-ghost badge-xs gap-1"
                        title="This licence is registered to a desktop device. Sign bids from the EGP Desktop app."
                      >
                        <Icon name="lucide:monitor" class="h-3 w-3" /> Registered to a device
                      </span>
                    </p>
                  </td>
                  <td class="font-mono text-xs">{{ k.key_serial }}</td>
                  <td>
                    <span :class="['badge badge-sm', statusBadge(k.status)]">{{ statusLabel(k.status) }}</span>
                  </td>
                  <td class="text-xs">{{ formatDateTime(k.assigned_at) }}</td>
                  <td class="text-xs">
                    <template v-if="k.valid_from && k.valid_until">
                      {{ formatDate(k.valid_from) }} → {{ formatDate(k.valid_until) }}
                    </template>
                    <span v-else class="text-base-content/40">—</span>
                  </td>
                  <td class="font-mono text-xs">{{ k.fingerprint || '—' }}</td>
                  <td class="text-right">
                    <div class="flex justify-end gap-1">
                      <button
                        v-if="k.status === 'PENDING_GENERATION' && isCurrentUser(k)"
                        type="button"
                        class="btn btn-info btn-xs gap-1"
                        @click="openBrowserSetup(k)"
                      >
                        <Icon name="lucide:vault" class="h-3.5 w-3.5" />
                        Set up in browser
                      </button>
                      <button
                        v-if="k.status === 'ACTIVE' && k.storage_mode !== 'PORTAL_VAULT' && isCurrentUser(k)"
                        type="button"
                        class="btn btn-warning btn-xs gap-1"
                        title="Reset the desktop binding and generate a replacement key in your browser Bid Vault."
                        @click="openBrowserSetup(k)"
                      >
                        <Icon name="lucide:monitor-smartphone" class="h-3.5 w-3.5" />
                        Move to browser
                      </button>
                      <span
                        v-if="k.status === 'ACTIVE' && k.storage_mode === 'PORTAL_VAULT' && isCurrentUser(k)"
                        class="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[11px] font-medium text-success"
                      >
                        <Icon name="lucide:shield-check" class="h-3.5 w-3.5" />
                        Ready in browser
                      </span>
                      <!-- Self-revoke is intentionally not allowed. Ask
                           your company's primary user / admin to revoke
                           a licence that's been assigned to you. -->
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pending-payment row banner with quick link to invoice -->
      <div v-if="pendingPaymentInvoice" class="alert alert-warning shadow-sm">
        <Icon name="lucide:receipt" class="h-5 w-5" />
        <div class="flex-1">
          <p class="font-semibold">{{ countByStatus.PENDING_PAYMENT }} licence(s) awaiting payment</p>
          <p class="text-xs">Invoice <span class="font-mono">{{ pendingPaymentInvoice.invoice_number }}</span> — pay to release them as credits.</p>
        </div>
        <button class="btn btn-sm btn-warning" @click="openInvoice(pendingPaymentInvoice)">Pay invoice</button>
      </div>
    </template>

    <!-- Browser Bid Vault setup modal -->
    <dialog id="browser_submission_key_modal" class="modal">
      <div class="modal-box max-w-xl">
        <div class="flex items-center justify-between border-b border-base-200 pb-2">
          <div>
            <h3 class="text-lg font-bold">Set up submission key in browser</h3>
            <p class="mt-0.5 text-xs text-base-content/50">
              Licence <span class="font-mono">{{ browserSetupKey?.key_serial }}</span>
            </p>
          </div>
          <button class="btn btn-ghost btn-circle" :disabled="browserSetupBusy" @click="closeBrowserSetup">
            <Icon name="lucide:x" />
          </button>
        </div>

        <div v-if="browserSetupComplete" class="mt-4 space-y-4">
          <div role="alert" class="alert alert-success">
            <Icon name="lucide:shield-check" />
            <div>
              <p class="font-semibold">Submission key ready</p>
              <p class="text-xs">The private key was generated in this browser and encrypted with your Bid Vault.</p>
            </div>
          </div>
          <div v-if="browserRecoveryCode" role="alert" class="alert alert-warning items-start">
            <Icon name="lucide:key-round" class="mt-1" />
            <div class="min-w-0 flex-1">
              <p class="font-semibold">Save this recovery code now</p>
              <p class="text-xs">This is the only time the recovery code will be displayed.</p>
              <code class="mt-2 block break-all rounded bg-base-100 p-2 text-xs">{{ browserRecoveryCode }}</code>
              <button class="btn btn-warning btn-sm mt-3" @click="downloadBrowserRecoveryCode">
                <Icon name="lucide:download" /> Download recovery code
              </button>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn btn-primary" @click="closeBrowserSetup">Done</button>
          </div>
        </div>

        <template v-else>
          <div
            v-if="browserSetupKey?.status === 'ACTIVE' && browserSetupKey?.storage_mode !== 'PORTAL_VAULT'"
            role="alert"
            class="alert alert-warning mt-4 items-start"
          >
            <Icon name="lucide:triangle-alert" class="mt-1" />
            <div>
              <p class="font-semibold">This will replace the desktop signing key</p>
              <p class="text-xs">The existing desktop key will stop signing new submissions after the browser key is registered.</p>
            </div>
          </div>

          <div v-if="browserVaultLoading" class="flex items-center justify-center gap-3 py-10">
            <span class="loading loading-spinner loading-md text-primary" />
            <span class="text-sm text-base-content/60">Loading your Bid Vault…</span>
          </div>

          <div v-else-if="!browserVaultRecord" class="mt-4 space-y-4">
            <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p class="font-semibold">Create your browser Bid Vault</p>
              <p class="mt-1 text-xs text-base-content/60">
                Use at least 12 characters. The passphrase never leaves this browser and cannot be recovered by EGP.
              </p>
            </div>
            <label class="fieldset">
              <span class="fieldset-legend">Bid Vault passphrase</span>
              <input v-model="browserPassphrase" type="password" class="input input-bordered w-full" autocomplete="new-password">
            </label>
            <label class="fieldset">
              <span class="fieldset-legend">Confirm passphrase</span>
              <input v-model="browserPassphraseConfirmation" type="password" class="input input-bordered w-full" autocomplete="new-password">
            </label>
            <div class="modal-action">
              <button class="btn" :disabled="browserSetupBusy" @click="closeBrowserSetup">Cancel</button>
              <button
                class="btn btn-primary"
                :disabled="browserSetupBusy || browserPassphrase.length < 12 || browserPassphrase !== browserPassphraseConfirmation"
                @click="createVaultAndSetBrowserKey"
              >
                <span v-if="browserSetupBusy" class="loading loading-spinner loading-sm" />
                Create vault & set up key
              </button>
            </div>
          </div>

          <div v-else-if="!browserVaultLoading" class="mt-4 space-y-4">
            <div class="rounded-xl border border-base-200 bg-base-50 p-4">
              <p class="font-semibold">Unlock your Bid Vault</p>
              <p class="mt-1 text-xs text-base-content/60">The vault is unlocked locally so the server never receives your passphrase.</p>
            </div>
            <label class="fieldset">
              <span class="fieldset-legend">Bid Vault passphrase</span>
              <input v-model="browserPassphrase" type="password" class="input input-bordered w-full" autocomplete="current-password">
            </label>
            <details>
              <summary class="cursor-pointer text-sm text-primary">Use recovery code</summary>
              <label class="fieldset mt-2">
                <span class="fieldset-legend">Recovery code</span>
                <textarea v-model="browserRecoveryInput" class="textarea textarea-bordered w-full font-mono text-xs" rows="3" />
              </label>
              <button
                class="btn btn-outline btn-sm mt-2"
                :disabled="browserSetupBusy || !browserRecoveryInput.trim()"
                @click="recoverVaultAndSetBrowserKey"
              >
                Recover & set up key
              </button>
            </details>
            <div class="modal-action">
              <button class="btn" :disabled="browserSetupBusy" @click="closeBrowserSetup">Cancel</button>
              <button
                class="btn btn-primary"
                :disabled="browserSetupBusy || !browserPassphrase"
                @click="unlockVaultAndSetBrowserKey"
              >
                <span v-if="browserSetupBusy" class="loading loading-spinner loading-sm" />
                Unlock & set up key
              </button>
            </div>
          </div>

          <div v-if="browserSetupError" role="alert" class="alert alert-error mt-4">
            <Icon name="lucide:circle-alert" />
            <span>{{ browserSetupError }}</span>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button :disabled="browserSetupBusy">close</button>
      </form>
    </dialog>

    <!-- Apply (bulk buy) modal -->
    <dialog id="apply_submission_key_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between border-b border-base-200 pb-2">
          <h3 class="text-lg font-bold">Buy bid submission licences</h3>
          <button class="btn btn-ghost btn-circle" @click="closeApply">
            <Icon name="lucide:x" />
          </button>
        </div>
        <p class="mt-3 text-sm text-base-content/70">
          Pick how many licences you need — one per bidder user/device. After paying, you can assign each licence to a user when ready.
          Licences expire at the end of the current calendar year.
        </p>
        <fieldset class="fieldset mt-3">
          <legend class="fieldset-legend">Quantity</legend>
          <input
            v-model.number="applyForm.quantity"
            type="number"
            min="1"
            max="100"
            class="input input-bordered w-32"
          />
        </fieldset>
        <fieldset class="fieldset mt-2">
          <legend class="fieldset-legend">Notes (optional)</legend>
          <textarea v-model="applyForm.notes" rows="2" class="textarea textarea-bordered w-full" />
        </fieldset>
        <div v-if="applyError" class="alert alert-error mt-3 text-sm">
          <Icon name="lucide:alert-circle" />
          <span>{{ applyError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeApply">Cancel</button>
          <button
            class="btn btn-primary"
            :disabled="busy || !applyForm.quantity || applyForm.quantity < 1"
            @click="confirmApply"
          >
            <span v-if="busy" class="loading loading-spinner loading-sm" />
            <span>Raise invoice for {{ applyForm.quantity || 0 }} licence(s)</span>
          </button>
        </div>
      </div>
    </dialog>

    <!-- Assign modal -->
    <dialog id="assign_submission_key_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between border-b border-base-200 pb-2">
          <h3 class="text-lg font-bold">Assign licence to a user</h3>
          <button class="btn btn-ghost btn-circle" @click="closeAssign">
            <Icon name="lucide:x" />
          </button>
        </div>
        <p class="mt-3 text-sm text-base-content/70">
          Licence <span class="font-mono">{{ activeKey?.key_serial }}</span> will be bound to the selected user.
          They set it up from the <strong>EGP Desktop app</strong>, which generates the keypair and locks the licence to that device.
        </p>
        <fieldset class="fieldset mt-3">
          <legend class="fieldset-legend">Target user</legend>
          <select v-model.number="assignForm.user_id" class="select select-bordered w-full">
            <option :value="null">Select a user...</option>
            <option v-for="u in eligibleUsers" :key="u.id" :value="u.id">
              {{ u.name }} — {{ u.email || u.phone || '—' }}
              <template v-if="u.active_key_count > 0">({{ u.active_key_count }} active)</template>
            </option>
          </select>
        </fieldset>
        <fieldset class="fieldset mt-2">
          <legend class="fieldset-legend">Notes (optional)</legend>
          <textarea v-model="assignForm.notes" rows="2" class="textarea textarea-bordered w-full" />
        </fieldset>
        <div v-if="assignError" class="alert alert-error mt-3 text-sm">
          <Icon name="lucide:alert-circle" />
          <span>{{ assignError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeAssign">Cancel</button>
          <button class="btn btn-primary" :disabled="busy || !assignForm.user_id" @click="confirmAssign">
            <span v-if="busy" class="loading loading-spinner loading-sm" />
            <span>Assign</span>
          </button>
        </div>
      </div>
    </dialog>

    <!-- Revoke modal -->
    <dialog id="revoke_submission_key_modal" class="modal">
      <div class="modal-box max-w-lg">
        <div class="flex items-center justify-between border-b border-base-200 pb-2">
          <h3 class="text-lg font-bold">Revoke licence</h3>
          <button class="btn btn-ghost btn-circle" @click="closeRevoke">
            <Icon name="lucide:x" />
          </button>
        </div>
        <div role="alert" class="alert alert-warning mt-3 text-sm">
          <Icon name="lucide:alert-triangle" class="h-5 w-5" />
          <div>
            <p class="font-semibold">This action is permanent.</p>
            <p class="text-xs">
              Once revoked, <span class="font-mono">{{ activeKey?.key_serial }}</span> cannot be re-revoked — the action is one-shot.
              The licence returns to the company's pool of credits and can be reassigned to a different user/device.
              The previously-assigned user keeps a REVOKED record on their personal view.
              Bid signatures produced before revocation still verify.
            </p>
          </div>
        </div>
        <p class="mt-3 text-sm text-base-content/70">
          Revoking <span class="font-mono">{{ activeKey?.key_serial }}</span><template v-if="activeKey?.user"> assigned to <span class="font-semibold">{{ activeKey.user.name }}</span></template>.
        </p>
        <fieldset class="fieldset mt-3">
          <legend class="fieldset-legend">Reason (required, min 10 chars)</legend>
          <textarea v-model="revokeForm.reason" rows="3" class="textarea textarea-bordered w-full" placeholder="e.g. Employee left, lost device, role change..." />
        </fieldset>
        <div v-if="revokeError" class="alert alert-error mt-3 text-sm">
          <Icon name="lucide:alert-circle" />
          <span>{{ revokeError }}</span>
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeRevoke">Back</button>
          <button class="btn btn-error" :disabled="busy" @click="confirmRevoke">
            <span v-if="busy" class="loading loading-spinner loading-sm" />
            <span>Revoke</span>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' });
useHead({ title: 'Bid Submission Licences' });

const helper = useBidderSubmissionKeyHelper();
const bidApi = useBidResponse();
const bidCrypto = useBidCrypto();
const vaultSession = useBidVaultSession();
const { setSubmissionKeyOnBrowser } = useBrowserSubmissionKey();
const toast = useToast();
const { user } = useSanctumAuth();
const { can } = useCheckPermission();
const canManage = computed(() => can('can.manage.biddersubmissionkeys'));
const currentUserId = computed(() => user.value?.data?.user?.id ?? user.value?.data?.id ?? user.value?.id ?? null);

const keys = ref([]);
const revokedForMe = ref([]);
const bidderType = ref(null);
const loading = ref(false);
const busy = ref(false);
const eligibleUsers = ref([]);

const activeKey = ref(null);
const applyForm = reactive({ quantity: 1, notes: '' });
const assignForm = reactive({ user_id: null, notes: '' });
const revokeForm = reactive({ reason: '' });
const applyError = ref('');
const assignError = ref('');
const revokeError = ref('');
const browserSetupKey = ref(null);
const browserVaultRecord = ref(null);
const browserVaultLoading = ref(false);
const browserSetupBusy = ref(false);
const browserSetupComplete = ref(false);
const browserSetupError = ref('');
const browserPassphrase = ref('');
const browserPassphraseConfirmation = ref('');
const browserRecoveryInput = ref('');
const browserRecoveryCode = ref('');

const fetchAll = async () => {
  loading.value = true;
  const { ok, data } = await helper.list();
  if (ok) {
    const payload = data?.data ?? {};
    keys.value = payload.keys ?? [];
    revokedForMe.value = payload.revoked_for_me ?? [];
    bidderType.value = payload.bidder_type ?? null;
  }
  loading.value = false;
};
onMounted(fetchAll);

// "Purchased" = paid licences (any status except awaiting payment) —
// gives the primary user the full company-wide picture of who has what.
const purchased = computed(() => keys.value.filter((k) => k.status !== 'PENDING_PAYMENT'));

// Personal list = live licences assigned to me + historical REVOKED
// entries from the server-derived `revoked_for_me` array. Sorted with
// active stuff first.
const assigned = computed(() => {
  const myId = user.value?.data?.user?.id ?? user.value?.id;
  const live = keys.value.filter((k) =>
    ['PENDING_GENERATION', 'ACTIVE', 'EXPIRED'].includes(k.status)
    && k.user?.id === myId,
  );
  return [...live, ...revokedForMe.value];
});
const countByStatus = computed(() => {
  const acc = { PENDING_PAYMENT: 0, UNASSIGNED: 0, PENDING_GENERATION: 0, ACTIVE: 0, EXPIRED: 0, REVOKED: 0 };
  for (const k of keys.value) {
    if (acc[k.status] !== undefined) acc[k.status]++;
  }
  return acc;
});
const pendingPaymentInvoice = computed(() => keys.value.find((k) => k.status === 'PENDING_PAYMENT')?.invoice ?? null);

const isCurrentUser = (k) => k.user?.id === (user.value?.data?.user?.id ?? user.value?.id);

// A licence can only be revoked a capped number of times per year. Once the
// cap is reached the Revoke button is disabled until the next year.
const revokeLimitReached = (k) => !!k.revokes_cap && (k.revokes_used ?? 0) >= k.revokes_cap;

const openBrowserSetup = async (key) => {
  browserSetupKey.value = key;
  browserVaultRecord.value = null;
  browserSetupComplete.value = false;
  browserSetupError.value = '';
  browserPassphrase.value = '';
  browserPassphraseConfirmation.value = '';
  browserRecoveryInput.value = '';
  browserRecoveryCode.value = '';
  browserVaultLoading.value = true;
  document.getElementById('browser_submission_key_modal').showModal();

  const result = await bidApi.getVault();
  if (result.ok) {
    browserVaultRecord.value = result.data;
    const cachedMasterKey = vaultSession.restore(browserVaultRecord.value, currentUserId.value);
    if (cachedMasterKey) {
      try {
        await completeBrowserKeySetup(cachedMasterKey);
      } catch (error) {
        vaultSession.clear();
        browserSetupError.value = error.message;
      }
    }
  } else if (result.status !== 404) {
    browserSetupError.value = result.error;
  }
  browserVaultLoading.value = false;
};

const closeBrowserSetup = () => {
  if (browserSetupBusy.value) return;
  document.getElementById('browser_submission_key_modal').close();
  browserPassphrase.value = '';
  browserPassphraseConfirmation.value = '';
  browserRecoveryInput.value = '';
};

const completeBrowserKeySetup = async (masterKey) => {
  try {
    await setSubmissionKeyOnBrowser(browserSetupKey.value, masterKey);
    await fetchAll();
    browserSetupComplete.value = true;
    browserSetupError.value = '';
    toast.success({
      title: 'Submission key ready in browser',
      message: 'The encrypted signing key is now available through your Bid Vault.',
      position: 'topRight',
      layout: 2,
    });
  } finally {
    masterKey?.fill(0);
  }
};

const createVaultAndSetBrowserKey = async () => {
  if (browserPassphrase.value.length < 12 || browserPassphrase.value !== browserPassphraseConfirmation.value) return;
  browserSetupBusy.value = true;
  browserSetupError.value = '';
  try {
    const created = await bidCrypto.createVault(browserPassphrase.value);
    const saved = await bidApi.saveVault(created.record);
    if (!saved.ok) throw new Error(saved.error);
    browserVaultRecord.value = saved.data;
    browserRecoveryCode.value = created.recoveryCode;
    vaultSession.remember(browserVaultRecord.value, created.masterKey, currentUserId.value);
    await completeBrowserKeySetup(created.masterKey);
  } catch (error) {
    browserSetupError.value = error.message;
    toast.error({
      title: 'Could not set up browser key',
      message: error.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    browserPassphrase.value = '';
    browserPassphraseConfirmation.value = '';
    browserSetupBusy.value = false;
  }
};

const unlockVaultAndSetBrowserKey = async () => {
  browserSetupBusy.value = true;
  browserSetupError.value = '';
  try {
    const masterKey = await bidCrypto.unlockVault(browserVaultRecord.value, browserPassphrase.value);
    vaultSession.remember(browserVaultRecord.value, masterKey, currentUserId.value);
    await completeBrowserKeySetup(masterKey);
  } catch (error) {
    browserSetupError.value = error.message;
    toast.error({
      title: 'Could not set up browser key',
      message: error.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    browserPassphrase.value = '';
    browserSetupBusy.value = false;
  }
};

const recoverVaultAndSetBrowserKey = async () => {
  browserSetupBusy.value = true;
  browserSetupError.value = '';
  try {
    const masterKey = await bidCrypto.unlockVaultWithRecovery(browserVaultRecord.value, browserRecoveryInput.value);
    vaultSession.remember(browserVaultRecord.value, masterKey, currentUserId.value);
    await completeBrowserKeySetup(masterKey);
  } catch (error) {
    browserSetupError.value = error.message;
    toast.error({
      title: 'Could not recover Bid Vault',
      message: error.message,
      position: 'topRight',
      layout: 2,
    });
  } finally {
    browserRecoveryInput.value = '';
    browserSetupBusy.value = false;
  }
};

const downloadBrowserRecoveryCode = () => {
  if (!browserRecoveryCode.value) return;
  const blob = new Blob(
    [`EGP Bid Vault recovery code\n\n${browserRecoveryCode.value}\n`],
    { type: 'text/plain' },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'egp-bid-vault-recovery.txt';
  link.click();
  URL.revokeObjectURL(url);
};

const openApply = () => {
  applyForm.quantity = 1;
  applyForm.notes = '';
  applyError.value = '';
  document.getElementById('apply_submission_key_modal').showModal();
};
const closeApply = () => document.getElementById('apply_submission_key_modal').close();

const confirmApply = async () => {
  applyError.value = '';
  if (!applyForm.quantity || applyForm.quantity < 1) return;
  busy.value = true;
  const { ok, data, error } = await helper.apply({ quantity: applyForm.quantity, notes: applyForm.notes || null });
  busy.value = false;
  if (!ok) {
    applyError.value = error;
    return;
  }
  closeApply();
  await fetchAll();
  // Route the user straight to the invoice so they can pay.
  const invoiceUuid = data?.data?.invoice_uuid;
  if (invoiceUuid) navigateTo(`/invoice/submission-key/${invoiceUuid}`);
};

const openAssign = async (k) => {
  activeKey.value = k;
  assignForm.user_id = null;
  assignForm.notes = '';
  assignError.value = '';
  const { ok, data } = await helper.eligibleUsers();
  eligibleUsers.value = ok ? (data?.data ?? []) : [];
  document.getElementById('assign_submission_key_modal').showModal();
};
const closeAssign = () => document.getElementById('assign_submission_key_modal').close();

const confirmAssign = async () => {
  assignError.value = '';
  if (!activeKey.value || !assignForm.user_id) return;
  busy.value = true;
  const { ok, error } = await helper.assign(activeKey.value.uuid, { user_id: assignForm.user_id, notes: assignForm.notes || null });
  busy.value = false;
  if (!ok) {
    assignError.value = error;
    return;
  }
  closeAssign();
  await fetchAll();
};

const openRevoke = (k) => {
  activeKey.value = k;
  revokeForm.reason = '';
  revokeError.value = '';
  document.getElementById('revoke_submission_key_modal').showModal();
};
const closeRevoke = () => document.getElementById('revoke_submission_key_modal').close();

const confirmRevoke = async () => {
  revokeError.value = '';
  if ((revokeForm.reason ?? '').trim().length < 10) {
    revokeError.value = 'Reason must be at least 10 characters.';
    return;
  }
  busy.value = true;
  const { ok, error } = await helper.revoke(activeKey.value.uuid, { reason: revokeForm.reason });
  busy.value = false;
  if (!ok) {
    revokeError.value = error;
    return;
  }
  closeRevoke();
  await fetchAll();
};

const openInvoice = (invoice) => {
  if (!invoice?.uuid) return;
  navigateTo(`/invoice/submission-key/${invoice.uuid}`);
};

const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');
const formatAmount = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const statusLabel = (s) => ({
  PENDING_PAYMENT: 'Awaiting payment',
  UNASSIGNED: 'Unassigned',
  PENDING_GENERATION: 'Ready to generate',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
}[s] || s);

const statusBadge = (s) => ({
  PENDING_PAYMENT: 'badge-warning',
  UNASSIGNED: 'badge-warning',
  PENDING_GENERATION: 'badge-info',
  ACTIVE: 'badge-success',
  EXPIRED: 'badge-ghost',
  REVOKED: 'badge-error',
}[s] || 'badge-ghost');

const invoiceStatusBadge = (s) => ({
  PAID: 'badge-success',
  AWAITING: 'badge-info',
  PENDING: 'badge-warning',
}[s] || 'badge-ghost');
</script>
