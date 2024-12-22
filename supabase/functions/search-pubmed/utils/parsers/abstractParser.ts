export function extractStructuredAbstract(articleXml: string): string {
  // First, try to get the complete Abstract section
  const abstractSection = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/)?.[1] || ''
  
  if (!abstractSection) {
    return 'No abstract available'
  }

  // Try to find all AbstractText elements with their sections
  const abstractParts: string[] = []
  const abstractTextRegex = /<AbstractText(?:\s+Label="([^"]*)")?\s*(?:NlmCategory="([^"]*)")?\s*>([\s\S]*?)<\/AbstractText>/g
  
  let match
  let hasStructuredSections = false
  
  while ((match = abstractTextRegex.exec(abstractSection)) !== null) {
    const [_, label, category, content] = match
    if (label || category) {
      hasStructuredSections = true
      const sectionTitle = label || category || ''
      abstractParts.push(`${sectionTitle}: ${content.trim()}`)
    } else {
      abstractParts.push(content.trim())
    }
  }

  // If no structured sections were found, try simple extraction
  if (!hasStructuredSections) {
    const simpleAbstract = articleXml.match(/<AbstractText>([\s\S]*?)<\/AbstractText>/)?.[1]
    if (simpleAbstract) {
      return simpleAbstract.trim()
    }
  }

  // Join all parts with proper spacing and formatting
  return abstractParts.join('\n\n')
}