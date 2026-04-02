'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function OrdersPage() {
  const params = useSearchParams()
  const customer_id = params.get('customer_id')

  const [orders, setOrders] = useState([])

  useEffect(() => {
    fetch(`/api/orders?customer_id=${customer_id}`)
      .then(res => res.json())
      .then(setOrders)
  }, [customer_id])

  return (
    <div>
      <h1>Order History</h1>

      <Link href={`/orders/new?customer_id=${customer_id}`}>
        Place New Order
      </Link>

      <ul>
        {orders.map((o: any) => (
          <li key={o.id}>
            Order #{o.id} — {o.order_date}
          </li>
        ))}
      </ul>
    </div>
  )
}