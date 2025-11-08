import { searchFaqs } from './search'

describe('searchFaqs', () => {
  test('returns Result[] with expected shape', () => {
    const out = searchFaqs('trust badges', 3)
    expect(Array.isArray(out.results)).toBe(true)
    out.results.forEach((r) => {
      // runtime shape checks
      expect(typeof r.id).toBe('string')
      expect(typeof r.title).toBe('string')
      expect(typeof r.snippet).toBe('string')
    })
  })

  test('trust badges query ranks id 1 highest', () => {
    const out = searchFaqs('trust badges', 3)
    expect(out.results.length).toBeGreaterThan(0)
    expect(out.results[0].id).toBe('1')
  })
})
