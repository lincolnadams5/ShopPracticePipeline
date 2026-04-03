'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CustomerRow } from '../lib/db'

const TIER_COLORS: Record<string, string> = {
  Gold: 'bg-yellow-100 text-yellow-700',
  Silver: 'bg-zinc-100 text-zinc-600',
  Bronze: 'bg-orange-100 text-orange-700',
  Platinum: 'bg-blue-100 text-blue-700',
}

export default function CustomerList({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = customers.filter(c => {
    const q = query.toLowerCase()
    return (
      !q ||
      (c.full_name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      String(c.customer_id).includes(q)
    )
  })

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name, email, or city..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-300"
      />

      {filtered.length === 0 ? (
        <p className="text-zinc-400 text-sm">No customers match your search.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(c => (
            <li key={c.customer_id}>
              <Link
                href={`/customer/${c.customer_id}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-zinc-800 group-hover:text-zinc-900">
                    {c.full_name ?? `Customer #${c.customer_id}`}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {c.email ?? '--'} &middot; {c.city ?? '--'}, {c.state ?? '--'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.loyalty_tier && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TIER_COLORS[c.loyalty_tier] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {c.loyalty_tier}
                    </span>
                  )}
                  <span className="text-zinc-300 group-hover:text-zinc-500 text-lg">›</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
