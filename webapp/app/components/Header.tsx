import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-zinc-200 pb-6 mb-2">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">IS455 — Group 5</p>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Shop Practice ML Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">Risk score predictions on live order data</p>
        </div>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            Customers
          </Link>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
