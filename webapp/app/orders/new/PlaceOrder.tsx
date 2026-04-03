'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewOrderPage() {
  const params = useSearchParams()
  const customer_id = params.get('customer_id')
  const router = useRouter()

  const [selected, setSelected] = useState({})

  const products = [
    { id: 1, name: "Shirt" },
    { id: 2, name: "Shoes" },
    { id: 3, name: "Hat" }
  ]

  const handleChange = (id: number, value: number) => {
    setSelected({ ...selected, [id]: value })
  }

  const submitOrder = () => {
    console.log("Submitting order:", {
      customer_id,
      items: selected
    })

    alert("Order placed! (mock)")

    router.push(`/orders?customer_id=${customer_id}`)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Place New Order</h1>
  
        <div style={styles.list}>
          {products.map((p) => (
            <div key={p.id}>
              <span>{p.name}</span>
              <input
                type="number"
                placeholder="Qty"
                onChange={(e) => handleChange(p.id, Number(e.target.value))}
                style={{
                  marginLeft: '10px',
                  padding: '5px',
                  borderRadius: '5px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
          ))}
        </div>
  
        <button onClick={submitOrder} style={styles.button}>
          Submit Order
        </button>
  
        <button
          onClick={() => router.push(`/orders?customer_id=${customer_id}`)}
          style={styles.secondaryButton}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    width: '400px',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  },
  secondaryButton: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    cursor: 'pointer'
  }
}