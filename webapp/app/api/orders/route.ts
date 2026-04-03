import { getDB } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customer_id = searchParams.get('customer_id')

  const db = await getDB()

  const orders = await db.all(
    'SELECT * FROM orders WHERE customer_id = ?',
    [customer_id]
  )

  return Response.json(orders)
}