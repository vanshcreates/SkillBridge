import { useCallback, useEffect, useState } from 'react'
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  deleteSavedAddress,
  getSavedAddresses,
  saveDeliveryAddress,
  setDefaultSavedAddress,
  updateSavedAddress,
} from '../../utils/user-storage'

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

const SavedAddressForm = ({ address, onCancel, onSave }) => {
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())

    try {
      onSave(values)
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
            required
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
            required
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
            required
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
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          type="submit"
        >
          Save address
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

  const reloadAddresses = useCallback(() => {
    setAddresses(getSavedAddresses(user))
    setError('')
  }, [user])

  useEffect(() => {
    try {
      reloadAddresses()
    } catch (loadError) {
      console.error('Unable to load saved profile addresses.', loadError)
      setAddresses([])
      setError(loadError.message)
    }
  }, [reloadAddresses])

  const handleMutation = (mutation) => {
    try {
      mutation()
      reloadAddresses()
      setFormMode(null)
    } catch (mutationError) {
      console.error('Unable to update saved delivery addresses.', mutationError)
      setError(mutationError.message)
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
            Choose a default address, or edit and remove saved addresses.
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
          onCancel={() => setFormMode(null)}
          onSave={(address) =>
            handleMutation(() => saveDeliveryAddress(user, address))
          }
        />
      )}

      {addresses.length ? (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <li
              className={`rounded-xl border p-4 ${
                address.isDefault
                  ? 'border-secondary/60 bg-background'
                  : 'border-border bg-background'
              }`}
              key={address.id}
            >
              {formMode?.type === 'edit' && formMode.id === address.id ? (
                <SavedAddressForm
                  address={address}
                  onCancel={() => setFormMode(null)}
                  onSave={(updatedAddress) =>
                    handleMutation(() =>
                      updateSavedAddress(user, address.id, updatedAddress),
                    )
                  }
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
                    <p>{address.phone}</p>
                    <p>{address.email}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    {!address.isDefault && (
                      <button
                        className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                        onClick={() =>
                          handleMutation(() =>
                            setDefaultSavedAddress(user, address.id),
                          )
                        }
                        type="button"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      onClick={() => setFormMode({ type: 'edit', id: address.id })}
                      type="button"
                    >
                      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-error hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                      onClick={() =>
                        handleMutation(() =>
                          deleteSavedAddress(user, address.id),
                        )
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !formMode && (
          <p className="mt-4 text-sm leading-6 text-text-muted">
            Your first order saves its delivery address here. You can also add one now.
          </p>
        )
      )}
    </section>
  )
}

export default SavedAddressesSection
