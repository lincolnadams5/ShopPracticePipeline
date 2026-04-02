import { getOrders } from './lib/db'
import Header from './components/Header'

export default async function Home() {
  const orders = await getOrders()

  return (
    <main className="p-8">

      <Header />
      
      <h1 className="text-2xl font-semibold my-6">Order Tracker</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-zinc-100 text-left">
                <th className="px-4 py-2 border border-zinc-200">Order ID</th>
                <th className="px-4 py-2 border border-zinc-200">Timestamp</th>
                <th className="px-4 py-2 border border-zinc-200">Items</th>
                <th className="px-4 py-2 border border-zinc-200">Total Value</th>
                <th className="px-4 py-2 border border-zinc-200">Avg Weight</th>
                <th className="px-4 py-2 border border-zinc-200">Fulfilled</th>
                <th className="px-4 py-2 border border-zinc-200">Risk Score</th>
                <th className="px-4 py-2 border border-zinc-200">Late Delivery Predicted</th>
                <th className="px-4 py-2 border border-zinc-200">Prediction Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-2 border border-zinc-200">{order.order_id}</td>
                  <td className="px-4 py-2 border border-zinc-200">{order.order_timestamp ?? '--'}</td>
                  <td className="px-4 py-2 border border-zinc-200">{order.num_items ?? '--'}</td>
                  <td className="px-4 py-2 border border-zinc-200">
                    {order.total_value != null ? `$${order.total_value.toFixed(2)}` : '--'}
                  </td>
                  <td className="px-4 py-2 border border-zinc-200">{order.avg_weight ?? '--'}</td>
                  <td className="px-4 py-2 border border-zinc-200">{order.fulfilled ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 border border-zinc-200">{order.predicted_risk_score ?? '--'}</td>
                  <td className="px-4 py-2 border border-zinc-200">
                    {order.predicted_late_delivery != null
                      ? order.predicted_late_delivery ? 'Yes' : 'No'
                      : '--'}
                  </td>
                  <td className="px-4 py-2 border border-zinc-200">{order.prediction_timestamp ?? '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
