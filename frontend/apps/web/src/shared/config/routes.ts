export const appRoutes = {
  home: '/',
  admin: '/admin',
  adminAnalytics: '/admin/analytics',
  adminJourney: '/admin/journey',
  demo: {
    root: '/demo',
    profile: '/demo/profile',
    newListing: '/demo/new',
    transport: '/demo/new/transport',
    auto: '/demo/new/auto',
  },
} as const
