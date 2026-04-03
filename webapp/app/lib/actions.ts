'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createOrder } from './db'

export async function submitOrder(formData: FormData) {
  const customerId = Number(formData.get('customer_id'))
  const shippingState = String(formData.get('shipping_state') ?? '')
  const shippingZip = String(formData.get('shipping_zip') ?? '')
  const billingZip = String(formData.get('billing_zip') ?? '')
  const paymentMethod = String(formData.get('payment_method') ?? '')
  const promoCode = String(formData.get('promo_code') ?? '')

  // Parse items encoded as item_<productId>=<quantity>|<unitPrice>
  const items: { productId: number; quantity: number; unitPrice: number }[] = []
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith('item_')) continue
    const productId = Number(key.replace('item_', ''))
    const [qty, price] = String(val).split('|')
    const quantity = Number(qty)
    if (quantity <= 0) continue
    items.push({ productId, quantity, unitPrice: Number(price) })
  }

  if (items.length === 0) throw new Error('No items selected')

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const shippingFee = 8.99
  const taxAmount = subtotal * 0.08
  const total = subtotal + shippingFee + taxAmount

  await createOrder({
    customerId, shippingState, shippingZip, billingZip,
    paymentMethod, promoCode, subtotal, shippingFee, taxAmount, total, items,
  })

  revalidatePath(`/customer/${customerId}`)
  redirect(`/customer/${customerId}`)
}

export async function runScoring(): Promise<{ ok: boolean; message: string }> {
  const token = process.env.GH_PAT
  const repo = process.env.GH_REPO // e.g. "lincolnadams5/ShopPracticePipeline"

  if (!token || !repo) {
    return { ok: false, message: 'GH_PAT or GH_REPO env vars are not set.' }
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/score.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return { ok: false, message: `GitHub API error ${res.status}: ${text.slice(0, 200)}` }
  }

  return {
    ok: true,
    message: 'Scoring job triggered on GitHub Actions. Refresh the priority queue in ~1–2 minutes.',
  }
}
