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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Select a Customer</h1>
  
        <div style={styles.list}>
          {customers.map((c: any) => (
            <button
              key={c.id}
              onClick={() => router.push(`/orders?customer_id=${c.id}`)}
              style={styles.button}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => router.push('/priority')}
        style={{ ...styles.button, marginTop: '10px' }}
      >
        View Priority Queue
      </button>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    width: '350px',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  }
}