const LISTINGS_KEY = 'skillbridge-artisan-listings'
const SHOPS_KEY = 'skillbridge-artisan-shops'

function getOwnerId(user) {
  return user?.id ?? user?.email?.trim().toLowerCase() ?? 'guest'
}

function readListings() {
  const storedListings = window.localStorage.getItem(LISTINGS_KEY)
  if (!storedListings) return []

  try {
    const listings = JSON.parse(storedListings)
    if (!Array.isArray(listings)) {
      throw new Error('Saved artisan listings have an invalid format.')
    }
    return listings
  } catch (error) {
    console.error('Saved artisan listings in browser storage are invalid.', error)
    throw new Error('Your listings could not be read. Clear the app storage and try again.')
  }
}

function readShops() {
  const storedShops = window.localStorage.getItem(SHOPS_KEY)
  if (!storedShops) return []

  try {
    const shops = JSON.parse(storedShops)
    if (!Array.isArray(shops)) {
      throw new Error('Saved artisan shops have an invalid format.')
    }
    return shops
  } catch (error) {
    console.error('Saved artisan shops in browser storage are invalid.', error)
    throw new Error('Your shop could not be read. Clear the app storage and try again.')
  }
}

export function getArtisanShop(user) {
  const ownerId = getOwnerId(user)
  return readShops().find((shop) => shop.ownerId === ownerId) ?? null
}

export function saveArtisanShop(user, shopDetails) {
  const ownerId = getOwnerId(user)
  const shops = readShops()
  const existingShop = shops.find((shop) => shop.ownerId === ownerId)
  const normalizedShop = {
    id: existingShop?.id ?? `shop-${Date.now()}`,
    ownerId,
    name: shopDetails.name.trim(),
    category: shopDetails.category.trim(),
    location: shopDetails.location.trim(),
    description: shopDetails.description.trim(),
    createdAt: existingShop?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const updatedShops = existingShop
    ? shops.map((shop) =>
        shop.ownerId === ownerId ? normalizedShop : shop,
      )
    : [...shops, normalizedShop]

  try {
    window.localStorage.setItem(SHOPS_KEY, JSON.stringify(updatedShops))
  } catch (error) {
    console.error('Unable to save artisan shop in this browser.', error)
    throw new Error('Your shop could not be saved. Check browser storage and try again.')
  }

  return normalizedShop
}

export function getArtisanListings(user) {
  const ownerId = getOwnerId(user)
  return readListings()
    .filter((listing) => listing.ownerId === ownerId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

export function getPublishedArtisanListings() {
  return readListings().filter((listing) => listing.status === 'Published')
}

export function toMarketplaceProduct(listing) {
  return {
    id: listing.id,
    name: listing.title,
    category: listing.category,
    description: listing.description,
    price: listing.price,
    artisan: listing.artisan || 'SkillBridge artisan',
    location: listing.location || 'India',
    rating: 'New',
    image: listing.image || '',
    imageAlt: `${listing.title}, handmade by ${listing.artisan || 'a SkillBridge artisan'}`,
    badge: 'New artisan listing',
    stock: listing.stock,
    listingId: listing.id,
  }
}

export function saveArtisanListing(user, listing) {
  const ownerId = getOwnerId(user)
  const normalizedListing = {
    id: `listing-${Date.now()}`,
    ownerId,
    shopId: getArtisanShop(user)?.id ?? null,
    title: listing.title.trim(),
    category: listing.category.trim(),
    description: listing.description.trim(),
    price: Number(listing.price),
    stock: Number(listing.stock),
    materialCost: Number(listing.materialCost) || 0,
    laborHours: Number(listing.laborHours) || 0,
    hourlyRate: Number(listing.hourlyRate) || 0,
    packagingCost: Number(listing.packagingCost) || 0,
    image: listing.image?.trim() ?? '',
    artisan: user.name,
    location: getArtisanShop(user)?.location || 'India',
    createdAt: new Date().toISOString(),
    status: 'Draft',
  }
  const listings = readListings()

  try {
    window.localStorage.setItem(
      LISTINGS_KEY,
      JSON.stringify([...listings, normalizedListing]),
    )
  } catch (error) {
    console.error('Unable to save artisan listing in this browser.', error)
    throw new Error('Your listing could not be saved. Check browser storage and try again.')
  }

  return normalizedListing
}

export function publishArtisanListing(user, listingId) {
  const ownerId = getOwnerId(user)
  const listings = readListings()
  const index = listings.findIndex(
    (listing) => listing.id === listingId && listing.ownerId === ownerId,
  )

  if (index < 0) {
    throw new Error('This product draft could not be found. Refresh and try again.')
  }
  if (listings[index].stock < 1) {
    throw new Error('Add at least one available item before publishing this product.')
  }

  const updatedListing = {
    ...listings[index],
    status: 'Published',
    publishedAt: new Date().toISOString(),
  }
  listings[index] = updatedListing

  try {
    window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings))
  } catch (error) {
    console.error('Unable to publish artisan listing.', error)
    throw new Error('Your product could not be published in this browser.')
  }

  return updatedListing
}
