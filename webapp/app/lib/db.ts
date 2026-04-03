import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

// ── Types ────────────────────────────────────────────────────────────────────

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

export type CustomerRow = {
  customer_id: number
  full_name: string | null
  email: string | null
  loyalty_tier: string | null
  customer_segment: string | null
  city: string | null
  state: string | null
  is_active: number | null
}

export type ProductRow = {
  product_id: number
  product_name: string | null
  category: string | null
  price: number | null
}

export type PriorityRow = {
  order_id: number
  order_datetime: string | null
  customer_id: number | null
  full_name: string | null
  shipping_state: string | null
  order_total: number | null
  predicted_risk_score: number | null
  is_fraud: number | null
}

// ── Orders ───────────────────────────────────────────────────────────────────

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

export async function getOrdersByCustomer(customerId: number): Promise<OrderRow[]> {
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
      WHERE o.customer_id = $1
      ORDER BY o.order_id DESC
    `, [customerId])
    return result.rows
  } catch (err) {
    console.error('[db] getOrdersByCustomer failed:', err)
    return []
  }
}

export async function getPriorityQueue(): Promise<PriorityRow[]> {
  try {
    const result = await pool.query<PriorityRow>(`
      SELECT
        o.order_id,
        o.order_datetime,
        o.customer_id,
        c.full_name,
        o.shipping_state,
        o.order_total,
        p.predicted_risk_score,
        o.is_fraud
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN order_predictions_risk p ON o.order_id = p.order_id
      ORDER BY p.predicted_risk_score DESC
      LIMIT 100
    `)
    return result.rows
  } catch (err) {
    console.error('[db] getPriorityQueue failed:', err)
    return []
  }
}

export async function createOrder(data: {
  customerId: number
  shippingState: string
  shippingZip: string
  billingZip: string
  paymentMethod: string
  promoCode: string
  subtotal: number
  shippingFee: number
  taxAmount: number
  total: number
  items: { productId: number; quantity: number; unitPrice: number }[]
}): Promise<number> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const idRes = await client.query<{ next_id: number }>(
      `SELECT COALESCE(MAX(order_id), 0) + 1 AS next_id FROM orders`
    )
    const orderId = idRes.rows[0].next_id

    await client.query(`
      INSERT INTO orders (
        order_id, customer_id, order_datetime,
        billing_zip, shipping_zip, shipping_state,
        payment_method, device_type, ip_country,
        promo_used, promo_code,
        order_subtotal, shipping_fee, tax_amount, order_total
      ) VALUES (
        $1, $2, NOW(),
        $3, $4, $5,
        $6, 'web', 'US',
        $7, $8,
        $9, $10, $11, $12
      )
    `, [
      orderId, data.customerId,
      data.billingZip, data.shippingZip, data.shippingState,
      data.paymentMethod,
      data.promoCode ? 1 : 0, data.promoCode || null,
      data.subtotal, data.shippingFee, data.taxAmount, data.total,
    ])

    for (const item of data.items) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.productId, item.quantity, item.unitPrice])
    }

    await client.query('COMMIT')
    return orderId
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[db] createOrder failed:', err)
    throw err
  } finally {
    client.release()
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function getCustomers(): Promise<CustomerRow[]> {
  try {
    const result = await pool.query<CustomerRow>(`
      SELECT customer_id, full_name, email, loyalty_tier,
             customer_segment, city, state, is_active
      FROM customers
      ORDER BY full_name ASC
    `)
    return result.rows
  } catch (err) {
    console.error('[db] getCustomers failed:', err)
    return []
  }
}

export async function getCustomer(id: number): Promise<CustomerRow | null> {
  try {
    const result = await pool.query<CustomerRow>(`
      SELECT customer_id, full_name, email, loyalty_tier,
             customer_segment, city, state, is_active
      FROM customers
      WHERE customer_id = $1
    `, [id])
    return result.rows[0] ?? null
  } catch (err) {
    console.error('[db] getCustomer failed:', err)
    return null
  }
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<ProductRow[]> {
  try {
    const result = await pool.query<ProductRow>(`
      SELECT product_id, product_name, category, price
      FROM products
      WHERE is_active = 1
      ORDER BY category, product_name
    `)
    return result.rows
  } catch (err) {
    console.error('[db] getProducts failed:', err)
    return []
  }
}
