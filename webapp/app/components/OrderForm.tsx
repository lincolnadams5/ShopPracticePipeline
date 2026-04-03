'use client'

import { useState } from 'react'
import { submitOrder } from '../lib/actions'
import type { ProductRow } from '../lib/db'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const PAYMENT_METHODS = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay']

type Quantities = Record<number, number>

export default function OrderForm({
  customerId,
  products,
  onClose,
}: {
  customerId: number
  products: ProductRow[]
  onClose: () => void
}) {
  const [quantities, setQuantities] = useState<Quantities>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const setQty = (productId: number, qty: number) =>
    setQuantities(q => ({ ...q, [productId]: Math.max(0, qty) }))

  const lineItems = products
    .filter(p => (quantities[p.product_id] ?? 0) > 0)
    .map(p => ({ ...p, qty: quantities[p.product_id] }))

  const subtotal = lineItems.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const shipping = lineItems.length > 0 ? 8.99 : 0
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  async function handleSubmit(formData: FormData) {
    if (lineItems.length === 0) { setError('Add at least one item.'); return }
    setError('')
    setPending(true)
    // Encode items into FormData before handing off to server action
    for (const item of lineItems) {
      formData.set(`item_${item.product_id}`, `${item.qty}|${item.price}`)
    }
    try {
      await submitOrder(formData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setPending(false)
    }
  }

  const byCategory = products.reduce<Record<string, ProductRow[]>>((acc, p) => {
    const cat = p.category ?? 'Other'
    ;(acc[cat] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="border border-zinc-200 rounded-xl p-6 bg-white mt-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-zinc-800">New Order</h3>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
      </div>

      <form action={handleSubmit}>
        <input type="hidden" name="customer_id" value={customerId} />

        {/* Products */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Items</p>
          <div className="space-y-4">
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs text-zinc-400 mb-1.5">{cat}</p>
                <div className="space-y-1">
                  {items.map(p => (
                    <div key={p.product_id} className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-zinc-700 truncate">{p.product_name}</span>
                        <span className="text-xs text-zinc-400 ml-2">${Number(p.price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQty(p.product_id, (quantities[p.product_id] ?? 0) - 1)}
                          className="w-6 h-6 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-sm leading-none flex items-center justify-center">−</button>
                        <span className="w-6 text-center text-sm tabular-nums">{quantities[p.product_id] ?? 0}</span>
                        <button type="button" onClick={() => setQty(p.product_id, (quantities[p.product_id] ?? 0) + 1)}
                          className="w-6 h-6 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-sm leading-none flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Shipping State</label>
            <select name="shipping_state" required className="w-full text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300">
              <option value="">Select...</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Payment</label>
            <select name="payment_method" required className="w-full text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300">
              <option value="">Select...</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Billing ZIP</label>
            <input name="billing_zip" type="text" placeholder="12345" maxLength={10}
              className="w-full text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Shipping ZIP</label>
            <input name="shipping_zip" type="text" placeholder="12345" maxLength={10}
              className="w-full text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Promo Code (optional)</label>
            <input name="promo_code" type="text" placeholder="SAVE10"
              className="w-full text-sm border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300" />
          </div>
        </div>

        {/* Order Summary */}
        {lineItems.length > 0 && (
          <div className="border-t border-zinc-100 pt-4 mb-4 text-sm space-y-1">
            <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-zinc-800 pt-1 border-t border-zinc-100"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        )}

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <button type="submit" disabled={pending || lineItems.length === 0}
          className="w-full py-2 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {pending ? 'Placing order...' : 'Place Order'}
        </button>
      </form>
    </div>
  )
}
