import {
  clearAuthToken,
  getArtisansApi,
  loginApi,
  setAuthToken,
  signupApi,
  verifyApi,
} from '../services/auth-api'

const REGISTERED_USERS_KEY = 'skillbridge-registered-users'
const SESSION_USER_KEY = 'skillbridge-current-user'
const SAVED_ADDRESSES_KEY = 'skillbridge-saved-addresses'
const PASSWORD_ITERATIONS = 210000

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

function bytesToBase64(bytes) {
  return window.btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value) {
  return Uint8Array.from(window.atob(value), (character) =>
    character.charCodeAt(0),
  )
}

async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) {
    throw new Error('Secure password storage is unavailable in this browser.')
  }

  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  )

  return new Uint8Array(hash)
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
  try {
    const result = await loginApi({ email, password, accountType })
    if (result?.user) {
      saveSessionUser(result.user)
      if (result.token) {
        setAuthToken(result.token)
      }
      return result.user
    }
  } catch (apiError) {
    // If it's an authentication error (401, 400), throw immediately
    if (apiError.status === 400 || apiError.status === 401) {
      throw apiError
    }

    // If backend server is unreachable, attempt local browser fallback
    console.warn('Backend login unreachable, trying local fallback:', apiError.message)
    const normalizedEmail = email.trim().toLowerCase()
    const user = readRegisteredUsers().find(
      (entry) => entry.email.toLowerCase() === normalizedEmail,
    )

    if (user?.passwordSalt && user?.passwordHash) {
      const candidateHash = await hashPassword(
        password,
        base64ToBytes(user.passwordSalt),
      )
      const storedHash = base64ToBytes(user.passwordHash)
      const isValid =
        candidateHash.length === storedHash.length &&
        candidateHash.every((byte, index) => byte === storedHash[index])

      if (isValid) {
        if (accountType && (user.accountType ?? 'customer') !== accountType) {
          throw new Error(`Account is registered as ${user.accountType}, not ${accountType}.`)
        }
        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          accountType: user.accountType ?? 'customer',
          phone: user.phone,
          artCategory: user.artCategory,
          experience: user.experience,
          bio: user.bio,
          expertise: user.expertise,
          contactName: user.contactName,
          industry: user.industry,
          companyAddress: user.companyAddress,
        }
        saveSessionUser(safeUser)
        return safeUser
      }
    }

    throw apiError
  }

  return null
}

export function readSessionUser() {
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
    // If token expired or unauthorized, clear session
    if (error.status === 401) {
      clearSessionUser()
    }
    throw error
  }
  return null
}

/**
 * Register a new user with Backend API (POST /api/auth/signup)
 */
export async function saveRegisteredUser(profile) {
  try {
    const result = await signupApi(profile)
    if (result?.user) {
      saveSessionUser(result.user)
      if (result.token) {
        setAuthToken(result.token)
      }
      return result.user
    }
  } catch (apiError) {
    // If server returned a business logic error (e.g. email already exists), throw it
    if (apiError.status === 409 || apiError.status === 400) {
      throw apiError
    }

    // If backend is unreachable, handle fallback
    console.warn('Backend signup unreachable, falling back to local storage:', apiError.message)
    const users = readRegisteredUsers()
    const normalizedEmail = profile.email.trim().toLowerCase()
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === normalizedEmail,
    )

    if (existingUser?.passwordSalt && existingUser?.passwordHash) {
      throw new Error('An account with this email already exists. Log in instead.')
    }

    if (typeof profile.password !== 'string' || profile.password.length < 6) {
      throw new Error('Use a password with at least 6 characters.')
    }

    if (!window.crypto?.getRandomValues) {
      throw new Error('Secure password storage is unavailable in this browser.')
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const passwordHash = await hashPassword(profile.password, salt)
    const newUser = {
      id: existingUser?.id ?? `user-${Date.now()}`,
      name: profile.name?.trim() || existingUser?.name,
      email: normalizedEmail,
      createdAt: existingUser?.createdAt ?? new Date().toISOString(),
      accountType: profile.accountType ?? existingUser?.accountType ?? 'customer',
      phone: profile.phone?.trim() || existingUser?.phone,
      artCategory: profile.artCategory?.trim() || existingUser?.artCategory,
      experience: profile.experience?.trim() || existingUser?.experience,
      bio: profile.bio?.trim() || existingUser?.bio,
      expertise: profile.expertise?.trim() || existingUser?.expertise,
      contactName: profile.contactName?.trim() || existingUser?.contactName,
      industry: profile.industry?.trim() || existingUser?.industry,
      companyAddress:
        profile.companyAddress?.trim() || existingUser?.companyAddress,
      passwordSalt: bytesToBase64(salt),
      passwordHash: bytesToBase64(passwordHash),
    }

    window.localStorage.setItem(
      REGISTERED_USERS_KEY,
      JSON.stringify(
        existingUser
          ? users.map((user) => (user.id === existingUser.id ? newUser : user))
          : [...users, newUser],
      ),
    )

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
      accountType: newUser.accountType,
      phone: newUser.phone,
      artCategory: newUser.artCategory,
      experience: newUser.experience,
      bio: newUser.bio,
      expertise: newUser.expertise,
      contactName: newUser.contactName,
      industry: newUser.industry,
      companyAddress: newUser.companyAddress,
    }

    saveSessionUser(safeUser)
    return safeUser
  }

  throw new Error('Unable to complete registration.')
}
