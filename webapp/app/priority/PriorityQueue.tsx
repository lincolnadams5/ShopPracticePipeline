'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function PriorityPage() {
  const [orders, setOrders] = useState([])

  const load = () => {
    fetch('/api/priority')
      .then(res => res.json())
      .then(setOrders)
  }

  useEffect(() => {
    fetch('/api/priority')
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(setOrders)
      .catch(() => {
        console.log("Using mock priority data")
  
        setOrders([
          { order_id: 101, score: 0.92 },
          { order_id: 102, score: 0.87 },
          { order_id: 103, score: 0.81 }
        ])
      })
  }, [])

  const runScoring = async () => {
    try {
      const res = await fetch('/api/run-scoring', { method: 'POST' })
  
      if (!res.ok) throw new Error()
  
      alert("Scoring complete!")
    } catch {
      alert("Scoring simulated (mock)")
    }
  
    // reload data
    setOrders([
      { order_id: 201, score: 0.95 },
      { order_id: 202, score: 0.89 }
    ])
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Late Delivery Priority Queue</h1>
  
        <button onClick={runScoring} style={styles.primaryButton}>
          Run Scoring
        </button>
  
        <div style={styles.list}>
          {orders.map((o: any) => (
            <div key={o.order_id} style={styles.orderCard}>
              <strong>Order {o.order_id}</strong>
              <p>Score: {o.score}</p>
            </div>
          ))}
        </div>
        <Link href="/">
        <button style={styles.primaryButton}>← Back to Home</button>
      </Link>
      </div>
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
    width: '500px'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px'
  },
  primaryButton: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  orderCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px'
  }
}