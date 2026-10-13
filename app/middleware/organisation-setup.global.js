export default defineNuxtRouteMiddleware((to) => {
  const { user } = useSanctumAuth();

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

  if (exemptPaths.some((path) => to.path.startsWith(path))) return;
  if (!user.value) return;

  const data = user.value.data;
  if (!data) return;

  if (data.user?.must_change_password || data.user?.must_complete_profile) {
    return navigateTo('/complete-migrated-profile');
  }

  if (!data.has_organisation) {
    return navigateTo('/setup-organisation');
  }

  if (data.is_bidder && !data.profile_complete) {
    const step = data.setup_step ?? 1;
    return navigateTo(`/setup-organisation?step=${step}`);
  }
});
