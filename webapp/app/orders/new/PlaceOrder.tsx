'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewOrderPage() {
  const params = useSearchParams()
  const customer_id = params.get('customer_id')
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState({})

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
  }, [])

  const submitOrder = async () => {
    await fetch('/api/create-order', {
      method: 'POST',
      body: JSON.stringify({
        customer_id,
        items: selected
      })
    })

    router.push(`/orders?customer_id=${customer_id}`)
  }

  return (
    <div>
      <h1>New Order</h1>

      {products.map((p: any) => (
        <div key={p.id}>
          {p.name}
          <input
            type="number"
            onChange={(e) =>
              setSelected({
                ...selected,
                [p.id]: Number(e.target.value)
              })
            }
          />
        </div>
      ))}

      <button onClick={submitOrder}>Submit Order</button>
    </div>
  )
}