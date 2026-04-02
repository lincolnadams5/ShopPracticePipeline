import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), '..', 'pipeline', 'data', 'shop.db')

export type OrderRow = {
  order_id: number
  order_timestamp: string | null
  num_items: number | null
  total_value: number | null
  avg_weight: number | null
  fulfilled: number | null
  predicted_risk_score: number | null
  predicted_late_delivery: number | null
  prediction_timestamp: string | null
}

export async function getOrders(): Promise<OrderRow[]> {
  try {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database })
    const rows = await db.all<OrderRow[]>(`
      SELECT
        o.order_id,
        o.order_timestamp,
        o.num_items,
        o.total_value,
        o.avg_weight,
        o.fulfilled,
        NULL AS predicted_risk_score,
        op.predicted_late_delivery,
        op.prediction_timestamp
      FROM orders o
      LEFT JOIN order_predictions op ON o.order_id = op.order_id
      ORDER BY o.order_id DESC
    `)
    await db.close()
    return rows
  } catch {
    return []
  }
}
