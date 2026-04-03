import { getDB } from '@/lib/db'

export async function POST(req: Request) {
  const db = await getDB()
  const { customer_id, items } = await req.json()

  const result = await db.run(
    'INSERT INTO orders (customer_id, order_date) VALUES (?, datetime("now"))',
    [customer_id]
  )

  const orderId = result.lastID

  for (const product_id in items) {
    const qty = items[product_id]
    if (qty > 0) {
      await db.run(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, product_id, qty]
      )
    }
  }

  return Response.json({ success: true })
}