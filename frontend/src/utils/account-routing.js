export function getAccountHomePath(user) {
  switch (user?.accountType) {
    case 'artisan':
      return '/artisan/profile'
    case 'expert':
      return '/expert/dashboard'
    case 'industry':
      return '/industry/dashboard'
    default:
      return '/profile'
  }
}
