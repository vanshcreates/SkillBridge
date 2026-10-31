const ORDER_HISTORY_KEY = 'skillbridge-order-history'
const ARTISAN_ORDER_STATUSES = [
  'Awaiting response',
  'Processing',
  'Ready to ship',
  'Shipped',
  'Completed',
  'Rejected',
]
const ARTISAN_ORDER_TRANSITIONS = {
  'Awaiting response': ['Processing', 'Rejected'],
  Processing: ['Ready to ship'],
  'Ready to ship': ['Shipped'],
  Shipped: ['Completed'],
  Completed: [],
  Rejected: [],
}

function getOwnerId(user) {
  return user?.id ?? user?.email?.trim().toLowerCase() ?? 'guest'
}

function readOrderHistory() {
  const storedOrders = window.localStorage.getItem(ORDER_HISTORY_KEY)
  if (!storedOrders) return []

  try {
    const orders = JSON.parse(storedOrders)
    if (!Array.isArray(orders)) {
      throw new Error('Saved order history has an invalid format.')
    }
    return orders
  } catch (error) {
    console.error('Saved order history in browser storage is invalid.', error)
    throw new Error('Order history could not be read. Clear the app storage and try again.')
  }
}

export function getOrderHistory(user) {
  const ownerId = getOwnerId(user)
  const email = user?.email?.trim().toLowerCase()
  return readOrderHistory()
    .filter(
      (order) =>
        order.ownerId === ownerId ||
        (email && order.customerEmail === email),
    )
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((order) => {
      const artisanStatuses = [
        ...new Set(Object.values(order.artisanStatuses ?? {})),
      ]

      return {
        id: order.id,
        createdAt: order.createdAt,
        deadline: order.deadline,
        specifications: order.specifications ?? '',
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        status:
          artisanStatuses.length === 1
            ? artisanStatuses[0]
            : artisanStatuses.length > 1
              ? 'Multiple artisan updates'
              : order.status,
        customerEmail: order.customer?.email?.trim().toLowerCase() ?? null,
      }
    })
}

function getOrdersForArtisan(orders, artisan) {
  const ownerId = getOwnerId(artisan)
  const artisanNames = [artisan?.name, artisan?.shopName]
    .filter(Boolean)
    .map((name) => name.trim().toLocaleLowerCase())

  return orders
    .map((order) => {
      const assignedToArtisan = order.assignedArtisanId === ownerId
      const items = (order.items ?? []).filter((item) =>
        assignedToArtisan ||
        artisanNames.includes(item.artisan?.trim().toLocaleLowerCase()),
      )
      if (!items.length) return null

      return {
        id: order.id,
        createdAt: order.createdAt,
        source: order.source ?? 'marketplace',
        items,
        subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
        status: order.artisanStatuses?.[ownerId] ?? 'Awaiting response',
        customer: order.customer ?? {},
      }
    })
    .filter(Boolean)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
}

export function getArtisanOrderHistory(artisan) {
  return getOrdersForArtisan(readOrderHistory(), artisan)
}

export function getIndustryOrderHistory(industry) {
  const ownerId = getOwnerId(industry)
  return readOrderHistory()
    .filter((order) => order.ownerId === ownerId && order.source === 'industry')
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      deadline: order.deadline,
      specifications: order.specifications ?? '',
      items: order.items,
      subtotal: order.subtotal,
      total: order.total,
      assignedArtisan: order.assignedArtisan ?? {},
      status:
        order.artisanStatuses?.[order.assignedArtisanId] ??
        'Awaiting response',
    }))
}

export function updateArtisanOrderStatus(artisan, orderId, status) {
  if (!ARTISAN_ORDER_STATUSES.includes(status)) {
    throw new Error('Choose a valid order status.')
  }

  const orders = readOrderHistory()
  const orderIndex = orders.findIndex((entry) => entry.id === orderId)
  if (orderIndex < 0) {
    throw new Error('This order could not be found. Refresh and try again.')
  }

  const [artisanOrder] = getOrdersForArtisan([orders[orderIndex]], artisan)
  if (!artisanOrder) {
    throw new Error('This order does not belong to your shop.')
  }
  if (!(ARTISAN_ORDER_TRANSITIONS[artisanOrder.status] ?? []).includes(status)) {
    throw new Error(`This order cannot move from ${artisanOrder.status} to ${status}.`)
  }

  const ownerId = getOwnerId(artisan)
  const updatedOrder = {
    ...orders[orderIndex],
    artisanStatuses: {
      ...orders[orderIndex].artisanStatuses,
      [ownerId]: status,
    },
  }
  orders[orderIndex] = updatedOrder

  try {
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders))
  } catch (error) {
    console.error('Unable to update artisan order status.', error)
    throw new Error('The order status could not be saved in this browser.')
  }

  return getOrdersForArtisan([updatedOrder], artisan)[0]
}

export function saveOrderHistoryEntry(order, user) {
  const ownerId = getOwnerId(user)
  const historyEntry = {
    id: order.id,
    ownerId,
    source: order.source ?? 'marketplace',
    assignedArtisanId: order.assignedArtisanId ?? null,
    assignedArtisan: order.assignedArtisan ?? null,
    createdAt: order.createdAt,
    deadline: order.deadline ?? null,
    specifications: order.specifications?.trim() ?? '',
    items: order.items.map(({ name, category, artisan, price, quantity }) => ({
      name,
      category,
      artisan,
      price,
      quantity,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    customer: {
      fullName: order.customer.fullName?.trim() ?? '',
      phone: order.customer.phone?.trim() ?? '',
      email: order.customer.email?.trim().toLowerCase() ?? '',
      companyName: order.customer.companyName?.trim() ?? '',
      contactName: order.customer.contactName?.trim() ?? '',
      address: order.customer.address?.trim() ?? '',
      city: order.customer.city?.trim() ?? '',
      state: order.customer.state?.trim() ?? '',
      postalCode: order.customer.postalCode?.trim() ?? '',
      note: order.customer.note?.trim() ?? '',
    },
    status: 'Awaiting artisan response',
    artisanStatuses: {},
  }

  try {
    const orders = readOrderHistory()
    window.localStorage.setItem(
      ORDER_HISTORY_KEY,
      JSON.stringify([...orders, historyEntry]),
    )
  } catch (error) {
    console.error('Unable to save order history in this browser.', error)
    if (error instanceof Error && error.message.startsWith('Order history could not be read')) {
      throw error
    }
    throw new Error('Order history could not be saved. Check browser storage settings and try again.')
  }

  return historyEntry
}
