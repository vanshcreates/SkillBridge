import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context'
import { useAuthDialog } from '../hooks/useAuthDialog'

const CART_STORAGE_KEY = 'skillbridge-cart'

function readStoredValue(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.error(`Unable to load ${key} from browser storage.`, error)
    return fallback
  }
}

export const CartProvider = ({ children }) => {
  const { currentUser, openAuth } = useAuthDialog()
  const isCustomer =
    currentUser && (currentUser.accountType ?? 'customer') === 'customer'
  const [items, setItems] = useState(() => {
    if (!isCustomer) return []
    const storedItems = readStoredValue(CART_STORAGE_KEY, [])
    return Array.isArray(storedItems) ? storedItems : []
  })

  useEffect(() => {
    try {
      if (isCustomer) {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } else {
        if (items.length) setItems([])
        window.localStorage.removeItem(CART_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Unable to save the marketplace bag.', error)
    }
  }, [isCustomer, items])

  const addToCart = useCallback((product, quantity = 1) => {
    if (!isCustomer) {
      openAuth('login')
      return
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.name === product.name)
      if (existingItem) {
        return currentItems.map((item) =>
          item.name === product.name
            ? {
                ...item,
                quantity: Number.isFinite(product.stock)
                  ? Math.min(item.quantity + quantity, product.stock)
                  : item.quantity + quantity,
              }
            : item,
        )
      }
      const boundedQuantity = Number.isFinite(product.stock)
        ? Math.min(quantity, product.stock)
        : quantity
      return boundedQuantity > 0
        ? [...currentItems, { ...product, quantity: boundedQuantity }]
        : currentItems
    })
  }, [isCustomer, openAuth])

  const updateQuantity = useCallback((productName, quantity) => {
    setItems((currentItems) =>
      quantity < 1
        ? currentItems.filter((item) => item.name !== productName)
        : currentItems.map((item) =>
            item.name === productName
              ? {
                  ...item,
                  quantity: Number.isFinite(item.stock)
                    ? Math.min(quantity, item.stock)
                    : quantity,
                }
              : item,
          ),
    )
  }, [])

  const removeFromCart = useCallback((productName) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.name !== productName),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      addToCart,
      clearCart,
      items,
      removeFromCart,
      updateQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
