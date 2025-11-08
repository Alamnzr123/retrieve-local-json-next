import { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { motion } from 'framer-motion'
import { Result } from '../types'

export default function Home() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const firstResultRef = useRef<HTMLLIElement | null>(null)
  
  const doSearch = useCallback(async function (q?: string) {
    setMessage(null)
    setResults(null)
    const actual = (typeof q === 'string' ? q : query).trim()
    if (!actual) {
      setMessage('Please enter a query')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: actual }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        // Server returns { error: { message, code } } for validation errors
        const serverMessage = body?.error?.message ?? body?.message ?? body?.error ?? 'Search failed'
        setMessage(typeof serverMessage === 'string' ? serverMessage : String(serverMessage))
        setLoading(false)
        return
      }
      const data = await res.json()
      setResults(data.results)
      if (!data.results || data.results.length === 0) setMessage(data.message || 'No matches')
      else setMessage(data.summary || null)
    } catch (err) {
      void err
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    if (results && results.length > 0) {
      setTimeout(() => firstResultRef.current?.focus(), 50)
    }
  }, [results])

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-6xl">
        <Head>
          <title>FAQ Search</title>
        </Head>
        <Header />

        <main className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <section className="md:col-span-2 rounded-lg bg-white p-6 shadow" role="search" aria-label="FAQ search">
            <h1 className="text-2xl font-semibold mb-4">FAQ Search</h1>

            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="q" className="sr-only">Search faqs</label>
              <input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void doSearch()}
                className="flex-1 rounded border px-3 py-2"
                placeholder="Search faqs..."
                aria-label="Search faqs"
              />
              <motion.button
                onClick={() => void doSearch()}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                disabled={loading || query.trim().length === 0}
                className="mt-2 sm:mt-0 rounded bg-black px-4 py-2 text-white disabled:opacity-60"
                aria-pressed={loading}
              >
                {loading ? 'Searching…' : 'Search'}
              </motion.button>
            </div>

            <div className="mt-4">
              {loading && <div className="text-sm text-zinc-600">Loading results…</div>}
              {!loading && message && (
                <div className="text-sm text-zinc-700" aria-live="polite">
                  {message}
                </div>
              )}

              {!loading && results && results.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {results.map((r, i) => (
                    <li
                      key={r.id}
                      className="border rounded p-3"
                      tabIndex={0}
                      ref={i === 0 ? firstResultRef : undefined}
                    >
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-zinc-600 mt-1">{r.snippet}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-medium">Summary</h2>
            <div className="mt-2 text-sm text-zinc-700">
              {results && results.length > 0 ? (
                <p>{message}</p>
              ) : (
                <p className="text-zinc-500">No summary yet — search to see a combined summary of top matches.</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium">Sources</h3>
              <div className="mt-2">
                {results && results.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {results.map((r) => (
                      <li key={r.id} className="text-xs bg-zinc-100 px-2 py-1 rounded">ID: {r.id}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-zinc-500">No sources</div>
                )}
              </div>
            </div>
          </aside>
        </main>

        <Footer />
      </div>
    </div>
  )
}
