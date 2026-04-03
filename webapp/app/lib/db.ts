import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

export type OrderRow = {
  order_id: number
  order_datetime: string | null
  shipping_state: string | null
  ip_country: string | null
  payment_method: string | null
  order_subtotal: number | null
  tax_amount: number | null
  order_total: number | null
  risk_score: number | null
  is_fraud: number | null
  predicted_risk_score: number | null
  prediction_timestamp: string | null
}

export async function getOrders(): Promise<OrderRow[]> {
  try {
    const result = await pool.query<OrderRow>(`
      SELECT
        o.order_id,
        o.order_datetime,
        o.shipping_state,
        o.ip_country,
        o.payment_method,
        o.order_subtotal,
        o.tax_amount,
        o.order_total,
        o.risk_score,
        o.is_fraud,
        p.predicted_risk_score,
        p.prediction_timestamp
      FROM orders o
      LEFT JOIN order_predictions_risk p ON o.order_id = p.order_id
      ORDER BY o.order_id DESC
    `)
    return result.rows
  } catch (err) {
    console.error('[db] getOrders failed:', err)
    return []
  }
}
