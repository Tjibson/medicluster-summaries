export function extractPublicationTypes(articleData: any): string[] {
  try {
    const pubTypes = articleData.MedlineCitation?.Article?.PublicationTypeList?.PublicationType
    if (!pubTypes) return []

    const types = Array.isArray(pubTypes) ? pubTypes : [pubTypes]
    return types.map((type: any) => type._text || type).filter(Boolean)
  } catch (error) {
    console.error('Error extracting publication types:', error)
    return []
  }
}