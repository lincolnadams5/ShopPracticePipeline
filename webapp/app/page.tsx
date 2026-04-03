import { getCustomers } from './lib/db'
import Header from './components/Header'
import CustomerList from './components/CustomerList'

export default async function Home() {
  const customers = await getCustomers()

  return (
    <main className="p-8">
      <Header />

      <div className="mt-8 max-w-2xl">
        <h2 className="text-lg font-semibold text-zinc-800 mb-1">Select a Customer</h2>
        <p className="text-sm text-zinc-500 mb-5">Choose a customer to view their orders or place a new one.</p>
        <CustomerList customers={customers} />
      </div>
    </main>
  )
}
