export function buildSearchQuery(medicineKeywords: string[], conditionKeywords: string[]): string {
  let keywordsLogic = ""
  
  if (medicineKeywords.length > 0 && conditionKeywords.length > 0) {
    // For medicine terms, also search for them as MeSH terms and Supplementary Concepts
    const medicineSearch = medicineKeywords.map(term => 
      `(${term}[All Fields] OR ${term}[MeSH Terms] OR ${term}[Supplementary Concept])`
    ).join(" OR ")
    
    keywordsLogic = `(${medicineSearch}) AND (${conditionKeywords.join(" OR ")})`
  } else if (medicineKeywords.length > 0) {
    const medicineSearch = medicineKeywords.map(term => 
      `(${term}[All Fields] OR ${term}[MeSH Terms] OR ${term}[Supplementary Concept])`
    ).join(" OR ")
    keywordsLogic = `(${medicineSearch})`
  } else if (conditionKeywords.length > 0) {
    keywordsLogic = `(${conditionKeywords.join(" OR ")})`
  }

  return keywordsLogic
}