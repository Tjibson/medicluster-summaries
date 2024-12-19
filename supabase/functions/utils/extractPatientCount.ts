export function extractPatientCount(text: string): number | null {
  if (!text) return null

  const patterns = [
    /(?:included|enrolled|recruited|studied)\s+(\d+)\s+(?:patients?|participants?|subjects?)/i,
    /(?:n\s*=\s*)(\d+)(?:\s*patients?)?/i,
    /(?:sample size|cohort)\s+of\s+(\d+)/i,
    /(\d+)\s+(?:patients?|participants?|subjects?)\s+(?:were|was)\s+(?:included|enrolled|recruited)/i,
    /total\s+(?:of\s+)?(\d+)\s+(?:patients?|participants?|subjects?)/i,
    /population\s+of\s+(\d+)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1])
      if (!isNaN(count) && count > 0) {
        return count
      }
    }
  }

  return null
}