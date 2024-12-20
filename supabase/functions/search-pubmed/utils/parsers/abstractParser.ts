export function extractAbstract(articleData: any): string {
  try {
    const abstract = articleData.MedlineCitation?.Article?.Abstract?.AbstractText
    if (!abstract) return 'No abstract available'

    if (typeof abstract === 'string') {
      return abstract
    }

    if (Array.isArray(abstract)) {
      return abstract.map(section => {
        if (typeof section === 'string') return section
        return section?._text || section?.text || ''
      }).join('\n')
    }

    if (abstract._text) {
      return abstract._text
    }

    return 'No abstract available'
  } catch (error) {
    console.error('Error extracting abstract:', error)
    return 'Error extracting abstract'
  }
}