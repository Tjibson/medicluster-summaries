export function buildSearchQuery(medicineKeywords: string[], conditionKeywords: string[]): string {
  let keywordsLogic = ""
  
  if (medicineKeywords.length > 0 && conditionKeywords.length > 0) {
    keywordsLogic = `(${medicineKeywords.join(" OR ")}) AND (${conditionKeywords.join(" OR ")})`
  } else if (medicineKeywords.length > 0) {
    keywordsLogic = `(${medicineKeywords.join(" OR ")})`
  } else if (conditionKeywords.length > 0) {
    keywordsLogic = `(${conditionKeywords.join(" OR ")})`
  }

  return keywordsLogic
}