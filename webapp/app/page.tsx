import fs from 'fs'
import path from 'path'
import { getOrders } from './lib/db'
import Header from './components/Header'
import OrdersTable from './components/OrdersTable'

const pipelineDir = path.join(process.cwd(), '..', 'pipeline')
const metadata = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'model_metadata.json'), 'utf-8'))
const metrics = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'metrics.json'), 'utf-8'))

export default async function Home() {
  const orders = await getOrders()

  return (
    <main className="p-8">
      <Header />

      {/* Pipeline Info Panel */}
      <section className="mt-6 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Model Metadata */}
          <div className="rounded-lg border border-zinc-200 p-5">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Model Info</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-mono">{metadata.model_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Version</dt>
                <dd className="font-mono">{metadata.model_version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Trained at</dt>
                <dd className="font-mono">{new Date(metadata.trained_at_utc).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Label</dt>
                <dd className="font-mono">{metadata.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Training rows</dt>
                <dd className="font-mono">{metadata.num_training_rows.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Test rows</dt>
                <dd className="font-mono">{metadata.num_test_rows.toLocaleString()}</dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 mb-1">Features</p>
              <div className="flex flex-wrap gap-1">
                {metadata.features.map((f: string) => (
                  <span key={f} className="bg-zinc-100 text-zinc-600 text-xs font-mono px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics */}
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

      <OrdersTable orders={orders} />
    </main>
  )
}
