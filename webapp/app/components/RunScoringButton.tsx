'use client'

import { useActionState, startTransition } from 'react'
import { runScoring } from '../lib/actions'

const initialState = { ok: true, message: '' }

export default function RunScoringButton() {
  const [state, action, pending] = useActionState(runScoring, initialState)

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => startTransition(action)}
        disabled={pending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? (
          <>
            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            Running...
          </>
        ) : (
          'Run Scoring'
        )}
      </button>
      {state.message && (
        <p className={`text-xs ${state.ok ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </div>
  )
}
