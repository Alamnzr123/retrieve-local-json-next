import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { searchFaqs } from '../../lib/search'

const SearchSchema = z.object({
  query: z.string().min(1, 'Query must not be empty').transform((s) => s.trim()),
})

function errorResponse(res: NextApiResponse, status: number, message: string, code?: string) {
  return res.status(status).json({ error: { message, code: code || String(status) } })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return errorResponse(res, 405, 'Method not allowed', 'method_not_allowed')
  }

  let parsed
  try {
    parsed = SearchSchema.parse(req.body)
  } catch (err) {
    const zerr = err as z.ZodError
    const message = zerr?.issues?.map((issue: { message: string }) => issue.message).join(', ') || 'Invalid request'
    return errorResponse(res, 400, message, 'invalid_request')
  }

  const query: string = parsed.query
  const out = searchFaqs(query, 3)
  if (!out.results || out.results.length === 0) {
    return res.status(200).json({ results: [], message: 'No matches found', summary: '', sources: [] })
  }

  return res.status(200).json(out)
}
