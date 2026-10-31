import {
  clearAuthToken,
  getArtisansApi,
  getAuthToken,
  loginApi,
  setAuthToken,
  signupApi,
  verifyApi,
} from '../services/auth-api'

const REGISTERED_USERS_KEY = 'skillbridge-registered-users'
const SESSION_USER_KEY = 'skillbridge-current-user'
const SAVED_ADDRESSES_KEY = 'skillbridge-saved-addresses'

function getAddressOwner(user) {
  return user?.id ?? user?.email?.trim().toLowerCase() ?? 'guest'
}

function readSavedAddresses() {
  const storedAddresses = window.localStorage.getItem(SAVED_ADDRESSES_KEY)
  if (!storedAddresses) return []

  try {
    const addresses = JSON.parse(storedAddresses)
    if (!Array.isArray(addresses)) {
      throw new Error('Saved address data has an invalid format.')
    }
    return addresses
  } catch (error) {
    console.error('Saved delivery address data in browser storage is invalid.', error)
    throw new Error('Saved address data could not be read. Clear the app storage and try again.')
  }
}

function writeSavedAddresses(addresses) {
  try {
    window.localStorage.setItem(
      SAVED_ADDRESSES_KEY,
      JSON.stringify(addresses),
    )
  } catch (error) {
    console.error('Unable to save delivery addresses.', error)
    throw new Error('Your address could not be saved in this browser. Check storage settings and try again.')
  }
}

function makeAddressId(ownerId, address) {
  return `${ownerId}:${address.postalCode}:${address.address}`
}

export function getSavedAddresses(user) {
  const ownerId = getAddressOwner(user)
  const entries = readSavedAddresses()
    .filter(
      (entry) =>
        entry.ownerId === ownerId &&
        typeof entry.savedAt === 'string' &&
        entry.address,
    )
    .sort((first, second) => second.savedAt.localeCompare(first.savedAt))
  const hasExplicitDefault = entries.some((entry) => entry.isDefault)

  return entries.map((entry, index) => ({
    ...entry.address,
    id: entry.id ?? makeAddressId(ownerId, entry.address),
    isDefault: hasExplicitDefault ? Boolean(entry.isDefault) : index === 0,
  }))
}

export function getLatestSavedAddress(user) {
  const addresses = getSavedAddresses(user)
  return addresses.find((address) => address.isDefault) ?? addresses[0] ?? null
}

export function saveDeliveryAddress(user, address) {
  const ownerId = getAddressOwner(user)
  const addresses = readSavedAddresses()
  const existingOwnerEntries = addresses
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.ownerId === ownerId)
    .sort((first, second) =>
      second.entry.savedAt.localeCompare(first.entry.savedAt),
    )

  if (
    existingOwnerEntries.length &&
    !existingOwnerEntries.some(({ entry }) => entry.isDefault)
  ) {
    const mostRecentEntry = existingOwnerEntries[0]
    addresses[mostRecentEntry.index] = {
      ...mostRecentEntry.entry,
      id:
        mostRecentEntry.entry.id ??
        makeAddressId(ownerId, mostRecentEntry.entry.address),
      isDefault: true,
    }
  }

  const normalizedAddress = {
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    email: address.email.trim().toLowerCase(),
    address: address.address.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
  }
  const duplicateIndex = addresses.findIndex(
    (entry) =>
      entry.ownerId === ownerId &&
      entry.address.address.trim().toLowerCase() ===
        normalizedAddress.address.toLowerCase() &&
      entry.address.postalCode === normalizedAddress.postalCode,
  )
  const ownerAddresses = addresses.filter(
    (entry) => entry.ownerId === ownerId,
  )
  const existingEntry = duplicateIndex < 0 ? null : addresses[duplicateIndex]
  const savedEntry = {
    id: existingEntry?.id ?? makeAddressId(ownerId, normalizedAddress),
    ownerId,
    address: normalizedAddress,
    savedAt: new Date().toISOString(),
    isDefault: existingEntry?.isDefault ?? ownerAddresses.length === 0,
  }
  const updatedAddresses =
    duplicateIndex < 0
      ? [...addresses, savedEntry]
      : addresses.map((entry, index) =>
          index === duplicateIndex ? savedEntry : entry,
        )

  writeSavedAddresses(updatedAddresses)

  return normalizedAddress
}

export function updateSavedAddress(user, addressId, address) {
  const ownerId = getAddressOwner(user)
  const addresses = readSavedAddresses()
  const index = addresses.findIndex(
    (entry) =>
      entry.ownerId === ownerId &&
      (entry.id ?? makeAddressId(ownerId, entry.address)) === addressId,
  )

  if (index < 0) {
    throw new Error('This saved address could not be found. Refresh and try again.')
  }

  const normalizedAddress = {
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    email: address.email.trim().toLowerCase(),
    address: address.address.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
  }
  const isDuplicate = addresses.some(
    (entry, entryIndex) =>
      entryIndex !== index &&
      entry.ownerId === ownerId &&
      entry.address.address.trim().toLowerCase() ===
        normalizedAddress.address.toLowerCase() &&
      entry.address.postalCode === normalizedAddress.postalCode,
  )

  if (isDuplicate) {
    throw new Error('This address is already saved.')
  }

  addresses[index] = {
    ...addresses[index],
    id: addressId,
    address: normalizedAddress,
    savedAt: new Date().toISOString(),
  }
  writeSavedAddresses(addresses)
}

export function setDefaultSavedAddress(user, addressId) {
  const ownerId = getAddressOwner(user)
  const addresses = readSavedAddresses()
  const addressExists = addresses.some(
    (entry) =>
      entry.ownerId === ownerId &&
      (entry.id ?? makeAddressId(ownerId, entry.address)) === addressId,
  )

  if (!addressExists) {
    throw new Error('This saved address could not be found. Refresh and try again.')
  }

  writeSavedAddresses(
    addresses.map((entry) =>
      entry.ownerId === ownerId
        ? {
            ...entry,
            id: entry.id ?? makeAddressId(ownerId, entry.address),
            isDefault:
              (entry.id ?? makeAddressId(ownerId, entry.address)) === addressId,
          }
        : entry,
    ),
  )
}

export function deleteSavedAddress(user, addressId) {
  const ownerId = getAddressOwner(user)
  const addresses = readSavedAddresses()
  const deletedEntry = addresses.find(
    (entry) =>
      entry.ownerId === ownerId &&
      (entry.id ?? makeAddressId(ownerId, entry.address)) === addressId,
  )

  if (!deletedEntry) {
    throw new Error('This saved address could not be found. Refresh and try again.')
  }

  const remaining = addresses.filter(
    (entry) =>
      !(
        entry.ownerId === ownerId &&
        (entry.id ?? makeAddressId(ownerId, entry.address)) === addressId
      ),
  )

  if (deletedEntry.isDefault) {
    const nextDefault = remaining.find((entry) => entry.ownerId === ownerId)
    if (nextDefault) {
      nextDefault.isDefault = true
    }
  }

  writeSavedAddresses(remaining)
}

function readRegisteredUsers() {
  const storedUsers = window.localStorage.getItem(REGISTERED_USERS_KEY)
  if (!storedUsers) return []

  try {
    const users = JSON.parse(storedUsers)
    if (!Array.isArray(users)) {
      throw new Error('Saved user data has an invalid format.')
    }
    return users
  } catch (error) {
    console.error('Registered user data in browser storage is invalid.', error)
    return []
  }
}

export function getRegisteredArtisans() {
  return readRegisteredUsers()
    .filter((user) => (user.accountType ?? 'customer') === 'artisan')
    .map((user) => ({
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      artCategory: user.artCategory,
      experience: user.experience,
    }))
}

export async function fetchArtisansList() {
  try {
    const artisans = await getArtisansApi()
    if (Array.isArray(artisans) && artisans.length > 0) {
      return artisans
    }
  } catch (error) {
    console.warn('Failed to fetch artisans from backend, using local cache:', error.message)
  }
  return getRegisteredArtisans()
}

/**
 * Authenticate user with Backend API (POST /api/auth/login)
 */
export async function authenticateUser(email, password, accountType) {
  const result = await loginApi({ email, password, accountType })
  if (result?.user) {
    saveSessionUser(result.user)
    if (result.token) {
      setAuthToken(result.token)
    }
    return result.user
  }
  throw new Error(result?.message || 'Unable to authenticate. Please check your credentials.')
}

export function readSessionUser() {
  // A session user without a valid JWT token is invalid
  const token = getAuthToken()
  if (!token) {
    window.localStorage.removeItem(SESSION_USER_KEY)
    return null
  }

  const storedUser = window.localStorage.getItem(SESSION_USER_KEY)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser)
  } catch (error) {
    console.error('The current user session in browser storage is invalid.', error)
    window.localStorage.removeItem(SESSION_USER_KEY)
    return null
  }
}

export function saveSessionUser(user) {
  window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
}

export function clearSessionUser() {
  clearAuthToken()
  window.localStorage.removeItem(SESSION_USER_KEY)
}

/**
 * Verify current session with Backend API (GET /api/auth/verify)
 */
export async function verifyUserSession() {
  try {
    const result = await verifyApi()
    if (result?.success && result?.user) {
      saveSessionUser(result.user)
      return result.user
    }
  } catch (error) {
    console.warn('Session verification error:', error.message)
    clearSessionUser()
    throw error
  }
  return null
}

/**
 * Register a new user with Backend API (POST /api/auth/signup)
 */
export async function saveRegisteredUser(profile) {
  const result = await signupApi(profile)
  if (result?.user) {
    saveSessionUser(result.user)
    if (result.token) {
      setAuthToken(result.token)
    }
    return result.user
  }
  throw new Error(result?.message || 'Unable to complete registration.')
}
