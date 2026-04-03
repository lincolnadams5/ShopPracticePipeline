import fs from 'fs'
import path from 'path'
import { getOrders, getPriorityQueue } from '../lib/db'
import Header from '../components/Header'
import OrdersTable from '../components/OrdersTable'
import PriorityQueue from '../components/PriorityQueue'
import RunScoringButton from '../components/RunScoringButton'

const pipelineDir = path.join(process.cwd(), '..', 'pipeline')
const metadata = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'model_metadata.json'), 'utf-8'))
const metrics = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'metrics.json'), 'utf-8'))

export default async function AdminPage() {
  const [orders, queue] = await Promise.all([getOrders(), getPriorityQueue()])

  return (
    <main className="p-8">
      <Header />

      {/* Model Info */}
      <section className="mt-6 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Model Info</h2>
          <dl className="space-y-1 text-sm">
            {[
              ['Name', metadata.model_name],
              ['Version', metadata.model_version],
              ['Trained at', new Date(metadata.trained_at_utc).toLocaleString()],
              ['Label', metadata.label],
              ['Training rows', metadata.num_training_rows.toLocaleString()],
              ['Test rows', metadata.num_test_rows.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-mono">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 mb-1">Features</p>
            <div className="flex flex-wrap gap-1">
              {(metadata.features as string[]).map((f: string) => (
                <span key={f} className="bg-zinc-100 text-zinc-600 text-xs font-mono px-2 py-0.5 rounded">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Model Metrics</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 text-xs">
                <th className="pb-2">Metric</th>
                <th className="pb-2 text-right">Train</th>
                <th className="pb-2 text-right">Test</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="py-1.5 text-zinc-500">MAE</td>
                <td className="py-1.5 text-right font-mono">{metrics.train_mae.toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono">{metrics.test_mae.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-500">RMSE</td>
                <td className="py-1.5 text-right font-mono">{metrics.train_rmse.toFixed(2)}</td>
                <td className="py-1.5 text-right font-mono">{metrics.test_rmse.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-zinc-500">R²</td>
                <td className="py-1.5 text-right font-mono">{metrics.train_r2.toFixed(4)}</td>
                <td className="py-1.5 text-right font-mono">{metrics.test_r2.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Priority Queue */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-800">Priority Queue</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Orders ranked by predicted risk — review before fulfilling</p>
          </div>
          <RunScoringButton />
        </div>
        <PriorityQueue orders={queue} />
      </section>

      {/* Full Order History */}
      <section>
        <OrdersTable orders={orders} />
      </section>
    </main>
  )
}
