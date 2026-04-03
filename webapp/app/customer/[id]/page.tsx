import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCustomer, getOrdersByCustomer, getProducts } from '../../lib/db'
import Header from '../../components/Header'
import CustomerPortal from '../../components/CustomerPortal'

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const customerId = Number(id)

  const [customer, orders, products] = await Promise.all([
    getCustomer(customerId),
    getOrdersByCustomer(customerId),
    getProducts(),
  ])

  if (!customer) notFound()

  return (
    <main className="p-8">
      <Header />

      <div className="mt-6 mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-zinc-900">{customer.full_name}</h2>
            {customer.loyalty_tier && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                {customer.loyalty_tier}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">
            {customer.email} &middot; {customer.city}, {customer.state} &middot; {customer.customer_segment}
          </p>
        </div>
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors">
          ← All Customers
        </Link>
      </div>

      <CustomerPortal
        customerId={customerId}
        orders={orders}
        products={products}
      />
    </main>
  )
}
