'use client'

import { useState, useMemo } from 'react'
import type { OrderRow } from '../lib/db'

type SortKey = keyof OrderRow
type SortDir = 'asc' | 'desc'

function useRiskThresholds(orders: OrderRow[]) {
  return useMemo(() => {
    const scores = orders
      .map(o => o.predicted_risk_score ?? o.risk_score)
      .filter((s): s is number => s != null)
      .sort((a, b) => a - b)
    if (scores.length === 0) return { low: 0, high: 0 }
    return {
      low: scores[Math.floor(scores.length * 0.33)],
      high: scores[Math.floor(scores.length * 0.66)],
    }
  }, [orders])
}

function riskRowClass(score: number | null, low: number, high: number) {
  if (score == null) return 'hover:bg-zinc-50'
  if (score >= high) return 'bg-red-50 hover:bg-red-100'
  if (score >= low) return 'bg-yellow-50 hover:bg-yellow-100'
  return 'bg-green-50 hover:bg-green-100'
}

function RiskBadge({ score, low, high }: { score: number | null; low: number; high: number }) {
  if (score == null) return <span className="text-zinc-400">--</span>
  const label = score >= high ? 'High' : score >= low ? 'Medium' : 'Low'
  const cls =
    score >= high
      ? 'bg-red-100 text-red-700'
      : score >= low
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label} &middot; {score.toFixed(1)}
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-zinc-300 ml-1">↕</span>
  return <span className="text-zinc-600 ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('order_id')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { low, high } = useRiskThresholds(orders)

  const filtered = useMemo(() => {
    const q = filter.toLowerCase()
    return orders.filter(o =>
      !q ||
      String(o.order_id).includes(q) ||
      (o.shipping_state ?? '').toLowerCase().includes(q) ||
      (o.ip_country ?? '').toLowerCase().includes(q) ||
      (o.payment_method ?? '').toLowerCase().includes(q)
    )
  }, [orders, filter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function Th({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        className="px-4 py-2 border border-zinc-200 cursor-pointer select-none whitespace-nowrap hover:bg-zinc-200 transition-colors"
        onClick={() => handleSort(col)}
      >
        {label}<SortIcon active={sortKey === col} dir={sortDir} />
      </th>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-zinc-800">
          Order Predictions
          <span className="ml-2 text-sm font-normal text-zinc-400">{sorted.length} orders</span>
        </h2>
        <input
          type="text"
          placeholder="Filter by ID, state, country, payment..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-zinc-200 rounded-md px-3 py-1.5 w-72 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-100 text-left text-xs text-zinc-600 uppercase tracking-wide">
              <Th label="Order ID" col="order_id" />
              <Th label="Date" col="order_datetime" />
              <Th label="State" col="shipping_state" />
              <Th label="Country" col="ip_country" />
              <Th label="Payment" col="payment_method" />
              <Th label="Subtotal" col="order_subtotal" />
              <Th label="Tax" col="tax_amount" />
              <Th label="Total" col="order_total" />
              <Th label="Actual Risk" col="risk_score" />
              <Th label="Fraud" col="is_fraud" />
              <Th label="Predicted Risk" col="predicted_risk_score" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map(order => {
              const displayScore = order.predicted_risk_score ?? order.risk_score
              return (
                <tr key={order.order_id} className={riskRowClass(displayScore, low, high)}>
                  <td className="px-4 py-2 border-x border-zinc-100 font-mono text-xs">{order.order_id}</td>
                  <td className="px-4 py-2 border-x border-zinc-100 whitespace-nowrap">{order.order_datetime ?? '--'}</td>
                  <td className="px-4 py-2 border-x border-zinc-100">{order.shipping_state ?? '--'}</td>
                  <td className="px-4 py-2 border-x border-zinc-100">{order.ip_country ?? '--'}</td>
                  <td className="px-4 py-2 border-x border-zinc-100">{order.payment_method ?? '--'}</td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    {order.order_subtotal != null ? `$${Number(order.order_subtotal).toFixed(2)}` : '--'}
                  </td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    {order.tax_amount != null ? `$${Number(order.tax_amount).toFixed(2)}` : '--'}
                  </td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    {order.order_total != null ? `$${Number(order.order_total).toFixed(2)}` : '--'}
                  </td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    <RiskBadge score={order.risk_score} low={low} high={high} />
                  </td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    {order.is_fraud != null ? (order.is_fraud == 1 ? 'Yes' : 'No') : '--'}
                  </td>
                  <td className="px-4 py-2 border-x border-zinc-100">
                    <RiskBadge score={order.predicted_risk_score} low={low} high={high} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="text-center text-zinc-400 py-8 text-sm">No orders match your filter.</p>
        )}
      </div>
    </div>
  )
}
