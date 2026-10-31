import { useCallback, useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  addCustomerAddressApi,
  deleteCustomerAddressApi,
  getCustomerAddressesApi,
  setDefaultAddressApi,
  updateCustomerAddressApi,
} from '../../services/marketplace-api'

const emptyAddress = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
}

const fieldClass =
  'mt-1 w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-main outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/25'

const SavedAddressForm = ({ address, onCancel, onSave, loading }) => {
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())
    try {
      await onSave(values)
    } catch (saveError) {
      setError(saveError.message)
    }
  }

  return (
    <form
      className="mt-4 rounded-xl border border-border bg-background p-4"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-text-main">
          Full name
          <input
            autoComplete="name"
            className={fieldClass}
            defaultValue={address.fullName}
            name="fullName"
            required
          />
        </label>
        <label className="text-sm font-medium text-text-main">
          Phone
          <input
            autoComplete="tel"
            className={fieldClass}
            defaultValue={address.phone}
            name="phone"
            type="tel"
          />
        </label>
        <label className="text-sm font-medium text-text-main sm:col-span-2">
          Email
          <input
            autoComplete="email"
            className={fieldClass}
            defaultValue={address.email}
            name="email"
            type="email"
          />
        </label>
        <label className="text-sm font-medium text-text-main sm:col-span-2">
          Street address
          <textarea
            autoComplete="street-address"
            className={fieldClass}
            defaultValue={address.address}
            name="address"
            required
            rows="2"
          />
        </label>
        <label className="text-sm font-medium text-text-main">
          City
          <input
            autoComplete="address-level2"
            className={fieldClass}
            defaultValue={address.city}
            name="city"
            required
          />
        </label>
        <label className="text-sm font-medium text-text-main">
          State
          <input
            autoComplete="address-level1"
            className={fieldClass}
            defaultValue={address.state}
            name="state"
            required
          />
        </label>
        <label className="text-sm font-medium text-text-main">
          PIN code
          <input
            autoComplete="postal-code"
            className={fieldClass}
            defaultValue={address.postalCode}
            inputMode="numeric"
            name="postalCode"
            pattern="[0-9]{6}"
          />
        </label>
      </div>
      {error && (
        <p className="mt-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Saving…' : 'Save address'}
        </button>
        <button
          className="rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const SavedAddressesSection = ({ user }) => {
  const [addresses, setAddresses] = useState([])
  const [error, setError] = useState('')
  const [formMode, setFormMode] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const reloadAddresses = useCallback(async () => {
    setError('')
    try {
      const data = await getCustomerAddressesApi()
      if (data?.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
      } else {
        setAddresses([])
      }
    } catch (err) {
      console.warn('Backend address fetch:', err.message)
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadAddresses()
  }, [reloadAddresses, user])

  const handleAdd = async (values) => {
    setSaving(true)
    try {
      const data = await addCustomerAddressApi(values)
      if (!data?.success) throw new Error(data?.message || 'Failed to add address')
      await reloadAddresses()
      setFormMode(null)
    } catch (err) {
      setError(err.message || 'Failed to save address to cloud.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (addressId, values) => {
    setSaving(true)
    try {
      const data = await updateCustomerAddressApi(addressId, values)
      if (!data?.success) throw new Error(data?.message || 'Failed to update address')
      await reloadAddresses()
      setFormMode(null)
    } catch (err) {
      setError(err.message || 'Failed to update address.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId) => {
    if (!window.confirm('Remove this address?')) return
    try {
      const data = await deleteCustomerAddressApi(addressId)
      if (!data?.success) throw new Error(data?.message || 'Failed to delete address')
      await reloadAddresses()
    } catch (err) {
      setError(err.message || 'Failed to remove address.')
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      const data = await setDefaultAddressApi(addressId)
      if (!data?.success) throw new Error(data?.message || 'Failed to set default')
      await reloadAddresses()
    } catch (err) {
      setError(err.message || 'Failed to update default address.')
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-secondary">For faster checkout</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-text-main">
            Saved delivery addresses
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Addresses are saved securely to your cloud profile.
          </p>
        </div>
        {!formMode && (
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => setFormMode({ type: 'add', address: emptyAddress })}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add address
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-error/30 bg-red-50 p-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      {formMode?.type === 'add' && (
        <SavedAddressForm
          address={formMode.address}
          loading={saving}
          onCancel={() => setFormMode(null)}
          onSave={handleAdd}
        />
      )}

      {loading ? (
        <p className="mt-4 text-sm text-text-muted">Loading saved addresses…</p>
      ) : addresses.length ? (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {addresses.map((address) => {
            const addrId = address.id || address._id
            return (
              <li
                className={`rounded-xl border p-4 ${
                  address.isDefault
                    ? 'border-secondary/60 bg-background'
                    : 'border-border bg-background'
                }`}
                key={addrId}
              >
                {formMode?.type === 'edit' && formMode.id === addrId ? (
                  <SavedAddressForm
                    address={address}
                    loading={saving}
                    onCancel={() => setFormMode(null)}
                    onSave={(values) => handleUpdate(addrId, values)}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-secondary" />
                        <p className="font-semibold text-text-main">{address.fullName}</p>
                      </div>
                      {address.isDefault && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-secondary">
                          <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-text-secondary">
                      <p>{address.address}</p>
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      {address.phone && <p>{address.phone}</p>}
                      {address.email && <p>{address.email}</p>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      {!address.isDefault && (
                        <button
                          className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                          onClick={() => handleSetDefault(addrId)}
                          type="button"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                        onClick={() => setFormMode({ type: 'edit', id: addrId, address })}
                        type="button"
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-error hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                        onClick={() => handleDelete(addrId)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        !formMode && (
          <p className="mt-4 text-sm leading-6 text-text-muted">
            No saved addresses found. Add a delivery address for faster checkout.
          </p>
        )
      )}
    </section>
  )
}

export default SavedAddressesSection
