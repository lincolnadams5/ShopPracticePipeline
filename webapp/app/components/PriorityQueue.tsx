import type { PriorityRow } from '../lib/db'

function RiskBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-zinc-400">--</span>
  const cls =
    score >= 70 ? 'bg-red-100 text-red-700' :
    score >= 40 ? 'bg-yellow-100 text-yellow-700' :
    'bg-green-100 text-green-700'
  const label = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label} &middot; {score.toFixed(1)}
    </span>
  )
}

export default function PriorityQueue({ orders }: { orders: PriorityRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-zinc-400 text-sm py-4">
        No scored orders yet. Run scoring to populate the queue.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-100 text-left text-xs text-zinc-600 uppercase tracking-wide">
            <th className="px-4 py-2">Order ID</th>
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">State</th>
            <th className="px-4 py-2 text-right">Total</th>
            <th className="px-4 py-2">Predicted Risk</th>
            <th className="px-4 py-2">Fraud Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map(o => {
            const score = o.predicted_risk_score
            const rowCls =
              score != null && score >= 70 ? 'bg-red-50 hover:bg-red-100' :
              score != null && score >= 40 ? 'bg-yellow-50 hover:bg-yellow-100' :
              'hover:bg-zinc-50'
            return (
              <tr key={o.order_id} className={rowCls}>
                <td className="px-4 py-2 font-mono text-xs">{o.order_id}</td>
                <td className="px-4 py-2">{o.full_name ?? '--'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{o.order_datetime ?? '--'}</td>
                <td className="px-4 py-2">{o.shipping_state ?? '--'}</td>
                <td className="px-4 py-2 text-right">
                  {o.order_total != null ? `$${Number(o.order_total).toFixed(2)}` : '--'}
                </td>
                <td className="px-4 py-2"><RiskBadge score={score} /></td>
                <td className="px-4 py-2">
                  {o.is_fraud == null ? '--' : o.is_fraud == 1 ? 'Yes' : 'No'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
