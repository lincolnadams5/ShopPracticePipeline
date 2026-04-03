'use client'

import { useState } from 'react'
import OrdersTable from './OrdersTable'
import OrderForm from './OrderForm'
import type { OrderRow, ProductRow } from '../lib/db'

export default function CustomerPortal({
  customerId,
  orders,
  products,
}: {
  customerId: number
  orders: OrderRow[]
  products: ProductRow[]
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-800">
          Order History
          <span className="ml-2 text-sm font-normal text-zinc-400">{orders.length} orders</span>
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            + New Order
          </button>
        )}
      </div>

      {showForm && (
        <OrderForm
          customerId={customerId}
          products={products}
          onClose={() => setShowForm(false)}
        />
      )}

      {orders.length === 0 && !showForm ? (
        <p className="text-zinc-400 text-sm py-4">No orders yet.</p>
      ) : (
        <div className="mt-6">
          <OrdersTable orders={orders} />
        </div>
      )}
    </div>
  )
}
