import { type SearchParameters } from '../types'

export function buildSearchQuery(searchParams: SearchParameters): string {
  const queryParts = []

  // Add medicine keywords
  if (searchParams.keywords.medicine.length > 0) {
    const medicineTerms = searchParams.keywords.medicine.map(term => `"${term}"[Title/Abstract]`)
    queryParts.push(`(${medicineTerms.join(" OR ")})`)
  }

  // Add condition keywords
  if (searchParams.keywords.condition.length > 0) {
    const conditionTerms = searchParams.keywords.condition.map(term => `"${term}"[Title/Abstract]`)
    queryParts.push(`(${conditionTerms.join(" OR ")})`)
  }

  // Add journal filter
  if (searchParams.journalNames.length > 0) {
    const journalQuery = searchParams.journalNames
      .map(journal => `"${journal}"[Journal]`)
      .join(" OR ")
    queryParts.push(`(${journalQuery})`)
  }

  // Add date range
  queryParts.push(
    `("${searchParams.dateRange.start}"[Date - Publication] : "${searchParams.dateRange.end}"[Date - Publication])`
  )

  // Add article types
  if (searchParams.articleTypes.length > 0) {
    const typeQuery = searchParams.articleTypes
      .map(type => `"${type}"[Publication Type]`)
      .join(" OR ")
    queryParts.push(`(${typeQuery})`)
  }

  const finalQuery = queryParts.join(" AND ")
  console.log('Built query:', finalQuery)
  return finalQuery
}