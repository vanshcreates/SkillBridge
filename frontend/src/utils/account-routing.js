export function getAccountHomePath(user) {
  if (!user) return '/'
  switch (user.accountType) {
    case 'artisan':
      return '/artisan/profile'
    case 'expert':
      return '/expert/dashboard'
    case 'industry':
      return '/industry/dashboard'
    case 'customer':
      return '/marketplace'
    default:
      return '/marketplace'
  }
}
