'use client'

import { useRouter } from 'next/navigation'

export default function CustomersPage() {
  const router = useRouter()

  const customers = [
    { id: 1, name: "Alice Johnson" },
    { id: 2, name: "Bob Smith" },
    { id: 3, name: "Charlie Brown" }
  ]

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Select a Customer</h1>
  
        <div style={styles.list}>
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/orders?customer_id=${c.id}`)}
              style={styles.secondaryButton}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
        onClick={() => router.push('/')}
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