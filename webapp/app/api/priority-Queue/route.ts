import { getDB } from '@/lib/db'

export async function GET() {
  const db = await getDB()

  const rows = await db.all(`
    SELECT * FROM order_predictions
    ORDER BY score DESC
    LIMIT 50
  `)

  return Response.json(rows)
}