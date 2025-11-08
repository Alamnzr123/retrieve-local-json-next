import fs from 'fs'
import path from 'path'
import { Faq } from '../types'

function loadFaqs(): Faq[] {
  const p = path.join(process.cwd(), 'data', 'faqs.json')
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw) as Faq[]
}

function escapeForRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function scoreItem(item: Faq, terms: string[]): number {
  const title = item.title.toLowerCase()
  const body = item.body.toLowerCase()
  let score = 0
  for (const t of terms) {
    if (!t) continue
    const term = t.toLowerCase()
    const re = new RegExp(escapeForRegex(term), 'g')
    const titleCount = (title.match(re) || []).length
    const bodyCount = (body.match(re) || []).length
    score += titleCount * 3 + bodyCount
  }
  return score
}

function makeSnippet(text: string, terms: string[], maxLen = 120): string {
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of terms) {
    if (!t) continue
    const i = lower.indexOf(t.toLowerCase())
    if (i >= 0 && (idx === -1 || i < idx)) idx = i
  }
  if (idx === -1) {
    return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
  }
  const start = Math.max(0, idx - 20)
  const snippet = text.slice(start, start + maxLen)
  return (start > 0 ? '…' : '') + snippet + (start + maxLen < text.length ? '…' : '')
}

export function searchFaqs(query: string, limit = 3) {
  const faqs = loadFaqs()
  const terms = query.split(/\s+/).filter(Boolean)
  const scored = faqs
    .map((f) => ({ item: f, score: scoreItem(f, terms) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const top = scored.slice(0, limit)
  const results = top.map((s) => ({ id: s.item.id, title: s.item.title, snippet: makeSnippet(s.item.body, terms) }))

  const combined = top
    .map((s) => {
      const body = s.item.body
      const firstSentence = body.split(/[.?!]\s/)[0]
      return firstSentence.length > 0 ? firstSentence : body.slice(0, 80)
    })
    .join(' ')

  const summary = combined.slice(0, 280)
  const sources = top.map((s) => s.item.id)

  return { results, summary, sources }
}
