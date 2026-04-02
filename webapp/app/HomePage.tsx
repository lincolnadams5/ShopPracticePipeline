'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [customers, setCustomers] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(setCustomers)
  }, [])

  return (
    <div>
      <h1>Select Customer</h1>

      {customers.map((c: any) => (
        <button
          key={c.id}
          onClick={() => router.push(`/orders?customer_id=${c.id}`)}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}