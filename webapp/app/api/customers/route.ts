import { getDB } from '@/lib/db'

export async function GET() {
  const db = await getDB()
  const customers = await db.all('SELECT * FROM customers')
  return Response.json(customers)
}