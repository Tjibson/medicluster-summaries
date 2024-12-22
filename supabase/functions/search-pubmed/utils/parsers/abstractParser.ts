export function extractStructuredAbstract(articleXml: string): string {
  console.log('Attempting to extract abstract from article XML')
  
  try {
    // First, try to get the complete Abstract section
    const abstractSection = articleXml.match(/<Abstract>([\s\S]*?)<\/Abstract>/)?.[1]
    
    if (!abstractSection) {
      console.log('No abstract section found, checking for alternative abstract formats')
      // Try alternative abstract formats (e.g., OtherAbstract)
      const otherAbstract = articleXml.match(/<OtherAbstract[^>]*>([\s\S]*?)<\/OtherAbstract>/)?.[1]
      if (otherAbstract) {
        console.log('Found alternative abstract format')
        return cleanAbstractText(otherAbstract)
      }
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
        console.log(`Found abstract section: ${sectionTitle}`)
        abstractParts.push(`${sectionTitle}: ${cleanAbstractText(content)}`)
      } else {
        abstractParts.push(cleanAbstractText(content))
      }
    }

    // If no structured sections were found, try simple extraction
    if (!hasStructuredSections) {
      console.log('No structured sections found, attempting simple abstract extraction')
      const simpleAbstract = articleXml.match(/<AbstractText>([\s\S]*?)<\/AbstractText>/)?.[1]
      if (simpleAbstract) {
        return cleanAbstractText(simpleAbstract)
      }
    }

    // Join all parts with proper spacing and formatting
    const finalAbstract = abstractParts.join('\n\n')
    console.log(`Successfully extracted abstract with ${abstractParts.length} sections`)
    return finalAbstract

  } catch (error) {
    console.error('Error extracting abstract:', error)
    // Attempt emergency fallback extraction
    try {
      console.log('Attempting emergency fallback abstract extraction')
      const emergencyMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)?.[1]
      if (emergencyMatch) {
        return cleanAbstractText(emergencyMatch)
      }
    } catch (fallbackError) {
      console.error('Emergency fallback extraction failed:', fallbackError)
    }
    return 'Abstract extraction failed'
  }
}

function cleanAbstractText(text: string): string {
  if (!text) return ''
  
  try {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/<[^>]+>/g, '') // Remove any remaining XML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
  } catch (error) {
    console.error('Error cleaning abstract text:', error)
    return text.trim() // Return original text if cleaning fails
  }
}