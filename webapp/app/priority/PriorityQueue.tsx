'use client'

import { useEffect, useState } from 'react'

export default function PriorityPage() {
  const [orders, setOrders] = useState([])

  const load = () => {
    fetch('/api/priority')
      .then(res => res.json())
      .then(setOrders)
  }

  useEffect(load, [])

  const runScoring = async () => {
    await fetch('/api/run-scoring', { method: 'POST' })
    load()
  }

  return (
    <div>
      <h1>Late Delivery Priority Queue</h1>

      <button onClick={runScoring}>Run Scoring</button>

      <ul>
        {orders.map((o: any) => (
          <li key={o.order_id}>
            Order {o.order_id} — Score: {o.score}
          </li>
        ))}
      </ul>
    </div>
  )
}