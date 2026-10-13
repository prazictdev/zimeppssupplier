/**
 * Client-side plugin that watches the sanctum user state and redirects to
 * /setup-organisation when:
 *   1. The user has no linked organisation, OR
 *   2. The user's company has the "Bidder" account type but the profile is incomplete.
 *
 * This is more reliable than a global middleware because the me() fetch is
 * async — user.value may not be populated yet when the middleware first runs.
 */
export default defineNuxtPlugin(() => {
  const { user } = useSanctumAuth();
  const router = useRouter();

  const exemptPaths = [
    '/setup-organisation',
    '/login',
    '/register',
    '/activate',
    '/activation-required',
    '/forgot-password',
    '/reset-password',
    '/complete-migrated-profile',
  ];

  const check = (val) => {
    if (!val) return;
    const currentPath = router.currentRoute.value.path;
    if (exemptPaths.some((p) => currentPath.startsWith(p))) return;

    const data = val.data;
    if (!data) return;

    if (data.user?.must_change_password || data.user?.must_complete_profile) {
      router.push('/complete-migrated-profile');
      return;
    }

    // No organisation at all — send to step 1
    if (!data.has_organisation) {
      router.push('/setup-organisation');
      return;
    }

    // Has a company with the Bidder account type but profile is incomplete
    if (data.is_bidder && !data.profile_complete) {
      const step = data.setup_step ?? 1;
      router.push(`/setup-organisation?step=${step}`);
    }
  };

  check(user.value);
  watch(user, check);
});
