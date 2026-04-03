'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function OrdersPage() {
  const params = useSearchParams()
  const customer_id = params.get('customer_id')
  const router = useRouter()

  const orders = [
    { id: 101, date: "2025-04-01", total: 45.99 },
    { id: 102, date: "2025-04-02", total: 89.50 }
  ]

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Order History</h1>
  
        <button
          onClick={() => router.push(`/orders/new?customer_id=${customer_id}`)}
          style={styles.button}
        >
          + Place New Order
        </button>
  
        <div style={styles.list}>
          {orders.map((order) => (
            <div key={order.id}>
              <strong>Order #{order.id}</strong>
              <p>{order.date}</p>
              <p>${order.total}</p>
            </div>
          ))}
        </div>
  
        <button onClick={() => router.push('/')} style={styles.secondaryButton}>
          ← Back to Home
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